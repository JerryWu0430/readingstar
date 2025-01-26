from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from datetime import datetime, timedelta
from queue import Queue
from difflib import SequenceMatcher
import numpy as np
import openvino_genai as ov_genai
import speech_recognition as sr
from notebook_utils import device_widget
import uvicorn
from time import sleep

# Set up OpenVINO and device
device = device_widget(default="CPU", exclude=["NPU"])
model_path = "whisper-tiny-en-openvino"
ov_pipe = ov_genai.WhisperPipeline(str(model_path), device=device.value)

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
global current_verse
global prev_verse
global prev_prev_verse
prev_verse = ""  # The previous lyric phrase
current_verse = ""  # The current lyric phrase
prev_prev_verse = ""  # The lyric phrase before the previous one
data_queue = Queue()
current_match = {"text": None, "similarity": 0.0}
source = sr.Microphone(sample_rate=16000)

def record_callback(_, audio: sr.AudioData) -> None:
   data = audio.get_raw_data()
   data_queue.put(data)

# Input model for POST request
class Phrase(BaseModel):
    lyric: str

app = FastAPI()

# Helper function to find the closest match
def find_similarity(transcription, lyric):
    similarity = SequenceMatcher(None, transcription, lyric).ratio()
    return similarity

global similarity
similarity = 0.0
global recognized_text
recognized_text = ""
# Transcription process
@app.post("/transcribe")
def process_audio():
    """
    Record audio, process it, and compare it to the current lyric.
    """
    with source:
        recorder.adjust_for_ambient_noise(source)
    stop_call = recorder.listen_in_background(source, record_callback, phrase_time_limit=record_timeout)

    global phrase_time
    global phrase_timeout
    global recognized_text
    try:
        while True:
            now = datetime.utcnow()
            if not data_queue.empty():
                if phrase_time and now - phrase_time > timedelta(seconds=phrase_timeout):
                    phrase_complete = True
                phrase_time = now
                audio_data = b''.join(data_queue.queue)
                data_queue.queue.clear()
                audio_np = np.frombuffer(audio_data, np.int16).astype(np.float32) / 32768.0
                genai_result = ov_pipe.generate(audio_np)
                recognized_text = str(genai_result).strip()
                print(f"Recognized: {recognized_text}")
            else:
                sleep(0.25)

    except Exception as e:
        print(f"Error during transcription: {e}")

# FastAPI endpoint to update the current lyric and process audio
@app.post("/update_lyric")
def update_lyric(phrase: Phrase):
    """
    Update the current lyric phrase and run the transcription process.
    """
    global current_verse, prev_verse, prev_prev_verse
    prev_prev_verse = prev_verse
    prev_verse = current_verse
    current_verse = phrase.lyric
    print(f"Updated current lyric to: '{current_verse}'")

    return JSONResponse(
        content={"message": f"Updated current lyric to: '{current_verse}' and processed audio."}, 
        status_code=200
    )

# FastAPI endpoint to get the current match result
@app.get("/match")
def get_match():
    """
    Get the current transcription match.
    """
    global current_verse, prev_verse, prev_prev_verse
    global recognized_text
    similarity = SequenceMatcher(None, recognized_text, prev_prev_verse).ratio()
    similarty_curr = SequenceMatcher(None, recognized_text, prev_verse).ratio()
    print(f"Last verse: {prev_prev_verse}", f"Recognized text: {recognized_text}", f"Similarity: {similarity}")
    if (similarity > 0.5 or similarty_curr > 0.5) and recognized_text != "":
        return JSONResponse(content={"match": "yes", "similarity": current_match["similarity"]})
    return JSONResponse(content={"match": "no", "similarity": current_match["similarity"]})


# Run FastAPI
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
