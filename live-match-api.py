from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from datetime import datetime, timedelta
from queue import Queue
from time import sleep
from difflib import SequenceMatcher
import threading
from contextlib import asynccontextmanager
import numpy as np
import openvino_genai as ov_genai
import speech_recognition as sr
from notebook_utils import device_widget


# Set up OpenVINO and device
device = device_widget(default="CPU", exclude=["NPU"])
model_path = "whisper-tiny-en-openvino"
ov_pipe = ov_genai.WhisperPipeline(str(model_path), device=device.value)

# Audio recording setup
energy_threshold = 1000
record_timeout = 2.0
phrase_timeout = 3.0
recorder = sr.Recognizer()
recorder.energy_threshold = energy_threshold
recorder.dynamic_energy_threshold = False

# Shared variables
current_verse = ""  # The current lyric phrase
data_queue = Queue()
current_match = {"text": None, "similarity": 0.0}
phrase_time = None

# Input model for POST request
class Phrase(BaseModel):
    lyric: str

# Audio recording callback
def record_callback(_, audio: sr.AudioData) -> None:
    data = audio.get_raw_data()
    data_queue.put(data)

# Find closest match
def find_closest_match(transcription, lyric):
    similarity = SequenceMatcher(None, transcription, lyric).ratio()
    return lyric, similarity


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting up microphone and background listening...")
    yield
    # Shutdown
    if stop_listening:
        stop_listening(wait_for_stop=False)
        print("Background listening stopped.")

app = FastAPI(lifespan=lifespan)

# Background transcription loop
stop_listening = None

def transcription_loop():
    global current_match, phrase_time, stop_listening

    print("Microphone open and transcription loop started.")
    with sr.Microphone(sample_rate=16000) as source:
        recorder.adjust_for_ambient_noise(source)

        # Start background listening
        stop_listening = recorder.listen_in_background(
            source, record_callback, phrase_time_limit=record_timeout
        )

        try:
            while True:
                now = datetime.utcnow()

                if not data_queue.empty():
                    if phrase_time and now - phrase_time > timedelta(seconds=phrase_timeout):
                        phrase_time = None

                    phrase_time = now
                    # Collect audio data
                    audio_data = b''.join(data_queue.queue)
                    data_queue.queue.clear()

                    # Convert to numpy array
                    audio_np = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0

                    # Process with OpenVINO pipeline
                    genai_result = ov_pipe.generate(audio_np)

                    recognized_text = str(genai_result).strip()
                    match, similarity = find_closest_match(recognized_text, current_verse)

                    current_match = {"text": match, "similarity": similarity}
                    print(f"\nRecognized: {recognized_text}")
                    print(f"Best Match: {match} (Similarity: {similarity:.2f})")

                else:
                    sleep(0.25)

        except Exception as e:
            print(f"Error in transcription loop: {e}")
        finally:
            stop_listening()


# FastAPI endpoint to update the current lyric
@app.post("/update_lyric")
def update_lyric(phrase: Phrase):
    """
    Update the current lyric phrase.
    """
    global current_verse
    current_verse = phrase.lyric
    print(current_verse)
    return JSONResponse(
        content={"message": f"Updated current lyric to: '{current_verse}'"}, status_code=200
    )

# FastAPI endpoint to get the current match result
@app.get("/match")
def get_match():
    """
    Get the current transcription match.
    """
    print(current_match["text"], current_match["similarity"])
    if current_match["similarity"] > 0.5:
        return JSONResponse(content="yes")
    return JSONResponse(content="no")


# Run FastAPI
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
