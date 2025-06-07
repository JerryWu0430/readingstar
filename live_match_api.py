import os
import sys
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from queue import Queue
from difflib import SequenceMatcher
from datetime import datetime
import numpy as np
import openvino_genai as ov_genai
import speech_recognition as sr
import uvicorn
from time import sleep, process_time
from uvicorn import Config, Server
import json
import multiprocessing
import wave
import io
from optimum.intel.openvino import OVModelForFeatureExtraction
from transformers import AutoTokenizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import normalize
from torch import no_grad
import platform
from fastapi.middleware.cors import CORSMiddleware


# Set up OpenVINO and device
device = "CPU"
# Adjust the model path to be relative to the executable location
model_dir = os.path.join(getattr(sys, '_MEIPASS', os.path.dirname(__file__)), "whisper-tiny-en-openvino")

# Check if the model directory exists
if not os.path.exists(model_dir):
    raise FileNotFoundError(f"Model directory not found at {model_dir}")

# Check if the necessary model files exist
model_files = ["openvino_tokenizer.xml", "openvino_tokenizer.bin"]
for file in model_files:
    if not os.path.exists(os.path.join(model_dir, file)):
        raise FileNotFoundError(f"Model file {file} not found in directory {model_dir}")

try:
    ov_pipe = ov_genai.WhisperPipeline(model_dir, device=device)
except Exception as e:
    sys.exit(1)

# Audio recording setup
energy_threshold = 500
record_timeout = 2.0
phrase_timeout = 3.0
phrase_time = None
data_queue = Queue()
recorder = sr.Recognizer()
recorder.energy_threshold = energy_threshold
recorder.dynamic_energy_threshold = True

# Shared variables
prev_verse = ""  # The previous lyric phrase
current_verse = ""  # The current lyric phrase
current_match = {"text": None, "similarity": 0.0}
source = sr.Microphone(sample_rate=16000)

# model for embedding similarity
# Load model & tokenizer

# Adjust the model path to be relative to the executable location
model_lm_dir =os.path.join(getattr(sys, '_MEIPASS', os.path.dirname(__file__)), "all-MiniLM-L6-v2-openvino")

# Check if the model directory exists
if not os.path.exists(model_lm_dir):
    raise FileNotFoundError(f"Model directory not found at {model_lm_dir}")

# Check if the necessary model files exist
model_lm_files = ["openvino_model.xml", "openvino_model.bin"]
for file in model_lm_files:
    if not os.path.exists(os.path.join(model_lm_dir, file)):
        raise FileNotFoundError(f"Model file {file} not found in directory {model_lm_dir}")

try:
    ov_model = OVModelForFeatureExtraction.from_pretrained(model_lm_dir, export=False)
    tokenizer = AutoTokenizer.from_pretrained(model_lm_dir)
except Exception as e:
    sys.exit(1)


def embedding_similarity_ov(text1, text2):
    '''
    Calculate the embedding similarity between two texts using OpenVINO model
    '''
    inputs = tokenizer([text1, text2], padding=True, truncation=True, return_tensors="pt")

    with no_grad(): 
        outputs = ov_model(**inputs)

    embeddings = outputs.last_hidden_state.mean(dim=1).detach().numpy()

    embeddings = normalize(embeddings, axis=1)
    return ((cosine_similarity([embeddings[0]], [embeddings[1]])[0][0])+1)/2


def record_callback(_, audio: sr.AudioData) -> None:
   '''
   Callback function for recording audio
   '''
   data = audio.get_raw_data()
   data_queue.put(data)

'''
Input classes for FastAPI
'''
class Phrase(BaseModel):
    lyric: str

class Lyric(BaseModel):
    lyric: list

class ThresholdLevel(BaseModel):
    level: str

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def log_song(duration: float, average_similarity: float, final_score: float, time_taken):
    global device
    """Logs a song entry with timestamp, title, duration, average similarity per lyric, final similarity score, the time taken to generate the final score, and hardware specs."""
    log_entry = f"{datetime.now()}, {duration}, {average_similarity}, {final_score}, {time_taken}, {platform.processor()}, {device}, {platform.machine()}, {platform.platform()}"
    with open("song_log.log", "a") as f:
        f.write(log_entry + "\n")
        f.close()

similarity = 0.0
recognized_text = ""
stop_call = None
stop_flag = True
similarity_over_song = []

# Transcription process
@app.post("/transcribe")
def process_audio():
    """
    Record audio, process it, and compare it to the current lyric.
    """
    global stop_call, source
    with source:
        recorder.adjust_for_ambient_noise(source)
    stop_call = recorder.listen_in_background(source, record_callback, phrase_time_limit=record_timeout)

    global phrase_time
    global phrase_timeout
    global recognized_text
    global stop_flag
    stop_flag = False
    global recorded_audio
    recorded_audio = io.BytesIO() 
    try:
        while not stop_flag:
            now = datetime.utcnow()
            if not data_queue.empty():
                #Collect chunk of audio data and append to queue
                phrase_time = now
                audio_data = b''.join(data_queue.queue)
                audio_chunk = data_queue.get()
                # Write audio chunk to recorded audio file
                recorded_audio.write(audio_chunk)
                data_queue.queue.clear()
                # Convert audio data to numpy array and run the openvino whisper pipeline
                audio_np = np.frombuffer(audio_data, np.int16).astype(np.float32) / 32768.0
                genai_result = ov_pipe.generate(audio_np)
                # Generate recognized text transcription
                recognized_text = str(genai_result).strip()
            else:
                sleep(0.1)
        save_audio_to_file(recorded_audio.getvalue())
    except Exception as e:
        print(f"Error during transcription: {e}")


@app.get("/close_microphone")
def close_microphone():
    '''
    Close the microphone
    '''
    global stop_call, stop_flag
    if stop_call is None:
        return JSONResponse(content={"message": "Microphone already closed."}, status_code=200)
    stop_flag = True
    stop_call()
    return JSONResponse(content={"message": "Microphone closed."}, status_code=200)


def save_audio_to_file(audio_bytes):
    """ Saves recorded audio to a WAV file """
    with wave.open("recorded_audio.wav", "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(16000)
        wf.writeframes(audio_bytes)

@app.get("/final_score")
def final_score():
    '''
    Calculate the final score using the recorded wav and embedding similarity
    '''
    recognized_wav = None
    global full_lyric
    global similarity_over_song

    s = process_time()
    duration = 0.0
    try:
        with wave.open("recorded_audio.wav", "rb") as wf:
            audio_data = wf.readframes(wf.getnframes())
            audio_np = np.frombuffer(audio_data, np.int16).astype(np.float32) / 32768.0

            duration = wf.getnframes() / wf.getframerate()

            genai_result = ov_pipe.generate(audio_np)
            recognized_wav = str(genai_result).strip()
    except Exception as e:
        print(f"Error during final transcription: {e}")
    similarity= float(embedding_similarity_ov(full_lyric, recognized_wav))
    t = process_time()

    if len(similarity_over_song) > 0:
        log_song(duration, sum(similarity_over_song) / len(similarity_over_song), similarity, (t-s))
    else:
        log_song(duration, -1.0, similarity, (t-s))
    
    try:
        os.remove("recorded_audio.wav")
    except FileNotFoundError:
        print("Recorded audio file not found for deletion.")
    except Exception as e:
        print(f"Error deleting recorded audio file: {e}")

    return JSONResponse(content={"final_score": similarity}, status_code=200)

def playlist_path():
    return  os.path.join(getattr(sys, '_MEIPASS', os.path.dirname(__file__)), 'playlists.json')

# FastAPI endpoint to post the playlist from playlists.json
@app.get('/playlists')
def get_playlist():
    """
    Post the playlist from playlist.json.
    """
    playlists_path = playlist_path()
    
    with open(playlists_path, 'r') as f:
        allPlaylists = f.read()
    return JSONResponse(content=json.loads(allPlaylists), status_code=200)

# FastAPI endpoint for updating playlist JSON
@app.post('/update_playlist')
def update_playlist(playlist: dict):
    """
    Update a playlist from the app interface.
    """
    with open(playlist_path(), 'r') as f:
        allPlaylists = f.read()
    
    allPlaylists = json.loads(allPlaylists)
    action = playlist.pop('action', None)

    # check if this is a delete request
    if action == "remove":
        with open(playlist_path(), 'w') as f:
            for pl in allPlaylists["playlists"]:
                if pl['name'] == playlist['name']:
                    song = playlist.pop('song', None)
                    if song:
                        for s in pl['songs']:
                            if s["name"] == song:
                                pl['songs'].remove(s)
                                break
                    else:
                        allPlaylists["playlists"].remove(pl)
                    break
    
    # check if this is an add request
    elif action == "create":
        if playlist['name'] not in [pl['name'] for pl in allPlaylists["playlists"]]:
            allPlaylists["playlists"].append(playlist)

    # update the playlist
    elif action == "update":
        for pl in allPlaylists["playlists"]:
            if pl['name'] == playlist['name']:
                pl['songs'] = playlist['songs']
                break

    with open(playlist_path(), 'w') as f:
        f.write(json.dumps(allPlaylists, indent=4))
        f.close()
    
    return JSONResponse(content={"message": f"{action} completed."}, status_code=200)

# FastAPI endpoint to update the current lyric and process audio
@app.post("/update_lyric")
def update_lyric(phrase: Phrase):
    """
    Update the current lyric phrase and run the transcription process.
    """
    global current_verse, prev_verse
    prev_verse = current_verse
    current_verse = phrase.lyric

    return JSONResponse(
        content={"message": f"Updated current lyric to: '{current_verse}' and processed audio."}, 
        status_code=200
    )

full_lyric = ""
lyric_array = []
@app.post("/full_lyric")
def full_lyric(request: Lyric):
    '''
    Get the full lyric from the app
    '''
    global full_lyric
    global lyric_array
    global similarity_over_song
    similarity_over_song = []
    lyric_array = request.lyric
    full_lyric = " ".join([entry["lyric"] for entry in lyric_array])
    return JSONResponse(content={"message": "Received full lyric."}, status_code=200)

threshold = 0.3
@app.post("/change_threshold")
def change_threshold(request: ThresholdLevel):
    """
    Change the global threshold for the similarity check.
    """
    level = request.level
    global threshold
    if level == "Easy":
        threshold = 0.2
    elif level == "Medium":
        threshold = 0.35
    elif level == "Hard":
        threshold = 0.5
    return JSONResponse(content={"message": f"Threshold changed to {threshold}"}, status_code=200)


# FastAPI endpoint to get the current match result
@app.get("/match")
def get_match():
    """
    Get the current transcription match.
    """
    global current_verse, prev_verse
    global recognized_text
    global threshold
    global similarity_over_song

    # remove brackets from the current verse
    current_verse = current_verse.strip()
    try:
        if '[' in current_verse:
            # remove the text between brackets
            current_verse = current_verse[:current_verse.find("[")] + current_verse[current_verse.find("]")+1:]
        if '(' in current_verse:
            # get the text between brackets
            current_verse = current_verse[:current_verse.find("(")] + current_verse[current_verse.find(")")+1:]
        if '\n' in current_verse:
            current_verse = current_verse.replace('\n', ' ')
    except:
        pass

    if current_verse == "":
        similarity = 0.0
        return JSONResponse(content={"match": "no", "similarity": 0.0})
    
    similarty_prev = SequenceMatcher(None, recognized_text, prev_verse).ratio()
    similarity_curr = SequenceMatcher(None, recognized_text, current_verse).ratio()
    similarities = [
        (similarty_prev, prev_verse),
        (similarity_curr, current_verse)
    ]
    similarity, similarity_verse = max(similarities, key=lambda x: x[0])    
    similarity_over_song.append(similarity)
    
    if (similarity > threshold) and recognized_text != "":
        return JSONResponse(content={"match": "yes", "similarity": similarity})
    return JSONResponse(content={"match": "no", "similarity": similarity})

# Run FastAPI
if __name__ == "__main__":
    config = Config(app="live_match_api:app", host="0.0.0.0", port=8000, reload=False, workers=1, loop="asyncio", http="h11")
    server = Server(config)
    server.run()