from openvino.runtime import Core
from optimum.intel.openvino import OVModelForFeatureExtraction
from transformers import AutoTokenizer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# Load OpenVINO model & tokenizer
model_id = "sentence-transformers/all-MiniLM-L6-v2"
ov_model = OVModelForFeatureExtraction.from_pretrained(model_id, export=True)
tokenizer = AutoTokenizer.from_pretrained(model_id)

def embedding_similarity_ov(text1, text2):
    # Tokenize input
    inputs = tokenizer([text1, text2], padding=True, truncation=True, return_tensors="pt")

    # Generate embeddings using OpenVINO
    with ov_model.device:  # Ensure inference runs on OpenVINO
        embeddings = ov_model(**inputs).last_hidden_state[:, 0, :].detach().numpy()

    # Compute cosine similarity
    return cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]

recognized_wav = "I'm T-dump, T sat on a wall. T-dump T-hat grade fall All the Kings were designed to hold men couldn't put Humpty together again T-dump T-sat on a wall a T-dump T-hat a grade fall all the Kings were seasoned all the Kings men couldn't put Humpty together again I'm T-dump T-sallow now well I'm T-dump T-dump T-dump T-dump They're grateful. All the kings hoars sent all the kings men together again."
lyric = "Humpty Dumpty sat on a wall Humpty Dumpty had a great fall All the kings' horses and all the kings' men Couldn't put Humpty together again Humpty Dumpty sat on a wall Humpty Dumpty had a great fall All the kings' horses and all the kings' men Couldn't put Humpty together again Humpty Dumpty sat on a wall Humpty Dumpty had a great fall All the kings' horses and all the kings' men Couldn't put Humpty together again"

similarity = embedding_similarity_ov(lyric, recognized_wav)
print("similarity:", similarity)
