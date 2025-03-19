import unittest
import json
import os
import tempfile
import wave
import numpy as np
from unittest.mock import patch, MagicMock, mock_open
from unittest import mock
from fastapi.testclient import TestClient
from io import BytesIO
from datetime import datetime

# Import the FastAPI app
import sys
sys.path.append('.')  
from live_match_api import app, embedding_similarity_ov, save_audio_to_file, log_song

class TestLiveMatchAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        # Create a mock audio file for testing
        self.create_mock_audio()
        # Set up mock playlists.json for testing
        self.mock_playlists = {
            "playlists": [
                {
                    "name": "Test Playlist",
                    "songs": [
                        {
                            "name": "Test Song",
                            "artist": "Test Artist",
                            "lyrics": [
                                {"time": 0, "lyric": "Test lyric one"},
                                {"time": 5, "lyric": "Test lyric two"}
                            ]
                        }
                    ]
                }
            ]
        }
        
    def tearDown(self):
        # Clean up any test files
        if os.path.exists("recorded_audio.wav"):
            os.remove("recorded_audio.wav")
    
    def create_mock_audio(self):
        """Create a mock audio file for testing"""
        # Parameters for the audio file
        sample_rate = 16000
        duration = 2  # 2 seconds
        # Generate a simple audio signal (sine wave)
        t = np.linspace(0, duration, int(sample_rate * duration), False)
        audio_data = np.sin(2 * np.pi * 440 * t)
        audio_data = (audio_data * 32767).astype(np.int16)
        
        # Save the audio file
        with wave.open("recorded_audio.wav", "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(sample_rate)
            wf.writeframes(audio_data.tobytes())
    
    @patch("wave.open")
    @patch("live_match_api.ov_pipe")
    def test_final_score(self, mock_ov_pipe, mock_wave_open):
        """Test the final_score endpoint"""
        # Mock the wave file reading
        mock_wf = MagicMock()
        mock_wf.getnframes.return_value = 1000
        mock_wf.readframes.return_value = b'\x00' * 2000
        mock_wave_open.return_value.__enter__.return_value = mock_wf
        
        # Mock the model's transcription
        mock_ov_pipe.generate.return_value = "test transcription"
        
        # Mock the embedding similarity
        with patch("live_match_api.embedding_similarity_ov", return_value=0.85):
            app.state.full_lyric = "test lyric"
            
            response = self.client.get("/final_score")
            self.assertEqual(response.status_code, 200)
            self.assertIn("final_score", response.json())
            self.assertAlmostEqual(response.json()["final_score"], 0.85)

    @patch("live_match_api.recorder.listen_in_background")
    @patch("live_match_api.ov_pipe")
    @patch("live_match_api.data_queue")
    def test_process_audio(self, mock_data_queue, mock_ov_pipe, mock_listen):
        # Mock the recorder.listen_in_background
        mock_listen.return_value = MagicMock()
        
        # Simulate the queue having an audio chunk
        mock_data_queue.empty.return_value = False
        mock_data_queue.get.return_value = b"fake_audio_data"
        mock_data_queue.queue = [b"fake_audio_data"]
        
        # Mock OpenVINO pipeline response
        mock_ov_pipe.generate.return_value = "Test transcription output"
        
        # Call the endpoint
        response = self.client.post("/transcribe")
        
        # Assertions
        assert response.status_code == 200

    @patch("wave.open")
    def test_save_audio_to_file(self, mock_wave_open):
        # Mock wave file handle
        mock_wave_file = MagicMock()
        mock_wave_open.return_value.__enter__.return_value = mock_wave_file
        
        # Fake audio bytes
        fake_audio_bytes = b"\x00\x01\x02\x03"
        
        # Call function
        save_audio_to_file(fake_audio_bytes)
        
        # Ensure wave.open is called with the correct filename and mode
        mock_wave_open.assert_called_once_with("recorded_audio.wav", "wb")
        
        # Check that correct methods were called on the wave file
        mock_wave_file.setnchannels.assert_called_once_with(1)
        mock_wave_file.setsampwidth.assert_called_once_with(2)
        mock_wave_file.setframerate.assert_called_once_with(16000)
        mock_wave_file.writeframes.assert_called_once_with(fake_audio_bytes)

    
    @patch("os.path.join")
    @patch("builtins.open", new_callable=mock_open, read_data=json.dumps({"playlists": []}))
    def test_get_playlist(self, mock_file, mock_join):
        """Test the get_playlist endpoint"""
        mock_join.return_value = "playlists.json"
        
        response = self.client.get("/playlists")
        self.assertEqual(response.status_code, 200)
        self.assertIn("playlists", response.json())
    
    def test_update_playlist_create(self):
        """Simple test for creating a playlist"""
        # Mock the initial playlists.json content as a string
        initial_json = '{"playlists": []}'
        
        # Mock the file operations
        with patch("builtins.open", mock_open(read_data=initial_json)) as mock_file:
            mock_file.return_value.write.side_effect = lambda x: len(x)

            # Test creating a new playlist
            new_playlist = {
                "action": "create",
                "name": "Simple Test Playlist",
                "songs": []
            }

            response = self.client.post("/update_playlist", json=new_playlist)
            
            # Assertions
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["message"], "create completed.")
            
            # Verify that write was called
            mock_file.return_value.write.assert_called_once()
            written_content = mock_file.return_value.write.call_args[0][0]
            self.assertIn("Simple Test Playlist", written_content)

    def test_update_playlist_update(self):
        """Simple test for updating a playlist"""
        initial_json = '{"playlists": [{"name": "Simple Test Playlist", "songs": []}]}'
        
        with patch("builtins.open", mock_open(read_data=initial_json)) as mock_file:
            mock_file.return_value.write.side_effect = lambda x: len(x)

            updated_playlist = {
                "action": "update",
                "name": "Simple Test Playlist",
                "songs": [{"name": "New Song", "artist": "New Artist"}]
            }

            response = self.client.post("/update_playlist", json=updated_playlist)
            
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["message"], "update completed.")
            written_content = mock_file.return_value.write.call_args[0][0]
            self.assertIn("New Song", written_content)

    def test_update_playlist_remove(self):
        """Test for removing a song and a playlist"""
        # Mock the initial playlists.json content with a playlist and a song
        initial_json = '{"playlists": [{"name": "Simple Test Playlist", "songs": [{"name": "Test Song"}]}]}'
        
        with patch("builtins.open", mock_open(read_data=initial_json)) as mock_file:
            mock_file.return_value.write.side_effect = lambda x: len(x)

            # Test 1: Remove a song from the playlist
            remove_song_request = {
                "action": "remove",
                "name": "Simple Test Playlist",
                "song": "Test Song"
            }

            response = self.client.post("/update_playlist", json=remove_song_request)
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["message"], "remove completed.")
            
            # Verify that the written content no longer includes the song
            written_content = mock_file.return_value.write.call_args[0][0]
            self.assertNotIn("Test Song", written_content)
            self.assertIn("Simple Test Playlist", written_content)  # Playlist still exists

    def test_update_lyric(self):
        """Test the update_lyric endpoint"""
        new_lyric = {"lyric": "Test new lyric"}
        
        response = self.client.post("/update_lyric", json=new_lyric)
        self.assertEqual(response.status_code, 200)
        self.assertIn("message", response.json())
        self.assertIn("Test new lyric", response.json()["message"])
    
    def test_full_lyric(self):
        """Test the full_lyric endpoint"""
        lyrics = {"lyric": [{"lyric": "Test lyric one"}, {"lyric": "Test lyric two"}]}
        
        response = self.client.post("/full_lyric", json=lyrics)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["message"], "Received full lyric.")
    
    def test_change_threshold(self):
        """Test the change_threshold endpoint"""
        # Test each difficulty level
        for level, expected in [("Easy", 0.2), ("Medium", 0.35), ("Hard", 0.5)]:
            response = self.client.post("/change_threshold", json={"level": level})
            self.assertEqual(response.status_code, 200)
            self.assertIn(str(expected), response.json()["message"])
    
    @patch("live_match_api.SequenceMatcher")
    @patch("live_match_api.current_verse", "Test current verse")  
    @patch("live_match_api.prev_verse", "Test previous verse")
    @patch("live_match_api.recognized_text", "Test current verse")
    @patch("live_match_api.threshold", 0.7)
    @patch("live_match_api.current_match", {"similarity": 0.8})
    def test_get_match(self, mock_matcher):
        """Test the match endpoint"""
        # Set up mock values for SequenceMatcher
        mock_ratio = MagicMock()
        mock_ratio.ratio.return_value = 0.8  
        mock_matcher.return_value = mock_ratio

        # Make the GET request
        response = self.client.get("/match")
        
        # Debug print response
        print(f"Response: {response.json()}")

        # Assertions
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["match"], "yes")
        self.assertEqual(response.json()["similarity"], 0.8)

    @patch("live_match_api.SequenceMatcher")
    @patch("live_match_api.current_verse", "Test current verse")  
    @patch("live_match_api.prev_verse", "Test previous verse")
    @patch("live_match_api.recognized_text", "Test current verse")
    @patch("live_match_api.threshold", 0.7)
    @patch("live_match_api.current_match", {"similarity": 0.6})
    def test_get_match_fail(self, mock_matcher):
        """Test the match endpoint"""
        # Set up mock values for SequenceMatcher
        mock_ratio = MagicMock()
        mock_ratio.ratio.return_value = 0.6 
        mock_matcher.return_value = mock_ratio

        # Make the GET request
        response = self.client.get("/match")
        
        # Debug print response
        print(f"Response: {response.json()}")

        # Assertions
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["match"], "no")
        self.assertEqual(response.json()["similarity"], 0.6)

    @patch("live_match_api.stop_call")
    @patch("live_match_api.stop_flag")
    def test_close_microphone(self, mock_flag, mock_stop_call):
        """Test the close_microphone endpoint"""
        # Test when microphone is open
        mock_flag = False
        mock_stop_call = MagicMock()
        
        response = self.client.get("/close_microphone")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["message"], "Microphone closed.")
        
        # Test when microphone is already closed
        mock_stop_call = None
        
        response = self.client.get("/close_microphone")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["message"], "Microphone closed.")

    @patch("live_match_api.tokenizer")
    @patch("live_match_api.ov_model")
    @patch("torch.no_grad")
    @patch("live_match_api.normalize")
    @patch("live_match_api.cosine_similarity")
    def test_embedding_similarity_ov(self, mock_cosine, mock_normalize, mock_no_grad, mock_model, mock_tokenizer):
        """Test the embedding_similarity_ov function"""
        # Set up mocks
        mock_tokenizer.return_value = {"input_ids": MagicMock(), "attention_mask": MagicMock()}
        mock_outputs = MagicMock()
        mock_outputs.last_hidden_state.mean.return_value.detach.return_value.numpy.return_value = np.array([[0.1, 0.2], [0.3, 0.4]])
        mock_model.return_value = mock_outputs
        mock_normalize.return_value = np.array([[0.1, 0.2], [0.3, 0.4]])
        mock_cosine.return_value = np.array([[0.8]])
        
        # Call the function
        result = embedding_similarity_ov("Text 1", "Text 2")
        
        # Check the result
        self.assertAlmostEqual(result, 0.9)  # (0.8 + 1) / 2 = 0.9
        mock_tokenizer.assert_called_once()
        mock_model.assert_called_once()
        mock_normalize.assert_called_once()
        mock_cosine.assert_called_once()

if __name__ == "__main__":
    unittest.main()