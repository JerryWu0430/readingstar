import logging
import nncf
import numpy as np
import openvino_genai as ov_genai
import speech_recognition as sr

from pathlib import Path
from cmd_helper import optimum_cli
from datetime import datetime, timedelta
from queue import Queue
from time import sleep
from difflib import SequenceMatcher
from transformers.utils import logging
from notebook_utils import device_widget

# Set logging level
nncf.set_log_level(logging.ERROR)

# Define model ID and path
model_id = "openai/whisper-tiny.en"
model_path = Path(model_id.split("/")[1])

# Convert the model using OpenVINO tools
optimum_cli(model_id, model_path)
print(f"✅ {model_id} model converted and can be found in {model_path}")

# Select device
device = device_widget(default="CPU", exclude=["NPU"])

# Initialize OpenVINO pipeline
ov_pipe = ov_genai.WhisperPipeline(str(model_path), device=device.value)

# Known lyrics and matching function remain the same
lyrics = {
   "Verse 1": [
       "Twinkle, twinkle, little star",
       "How I wonder what you are",
       "Up above the world so high",
       "Like a diamond in the sky",
   ]
}

def find_closest_match(transcription, lyrics):
   best_match = ""
   highest_similarity = 0
   for line in lyrics:
       similarity = SequenceMatcher(None, transcription, line).ratio()
       if similarity > highest_similarity:
           highest_similarity = similarity
           best_match = line
   return best_match, highest_similarity

# Audio recording setup
energy_threshold = 1000
record_timeout = 2.0
phrase_timeout = 4.0
phrase_time = None
data_queue = Queue()
recorder = sr.Recognizer()
recorder.energy_threshold = energy_threshold
recorder.dynamic_energy_threshold = False

source = sr.Microphone(sample_rate=16000)

def record_callback(_, audio: sr.AudioData) -> None:
   data = audio.get_raw_data()
   data_queue.put(data)

# Main processing loop
with source:
   recorder.adjust_for_ambient_noise(source)

stop_call = recorder.listen_in_background(source, record_callback, phrase_time_limit=record_timeout)
print("Model loaded and microphone initialized.\n")

try:
   current_verse = "Verse 1"
   while True:
       now = datetime.utcnow()
       if not data_queue.empty():
           if phrase_time and now - phrase_time > timedelta(seconds=phrase_timeout):
               phrase_complete = True
           phrase_time = now

           # Get audio data
           audio_data = b''.join(data_queue.queue)
           data_queue.queue.clear()

           # Convert to numpy array
           audio_np = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0

           # Process with OpenVINO pipeline
           genai_result = ov_pipe.generate(audio_np)

           recognized_text = str(genai_result).strip()
           # Match with lyrics
           match, similarity = find_closest_match(recognized_text, lyrics[current_verse])

           print(f"\nRecognized: {recognized_text}")
           print(f"Best Match: {match} (Similarity: {similarity:.2f})")
       else:
           sleep(0.25)


except KeyboardInterrupt:
   print("\nTranscription stopped by user.")
   stop_call()