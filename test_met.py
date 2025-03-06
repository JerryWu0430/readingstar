from optimum.intel.openvino import OVModelForFeatureExtraction
from transformers import AutoTokenizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import normalize
import torch

# Load model & tokenizer
model_id = "sentence-transformers/all-MiniLM-L6-v2"
ov_model = OVModelForFeatureExtraction.from_pretrained(model_id, export=True)
tokenizer = AutoTokenizer.from_pretrained(model_id)

def embedding_similarity_ov(text1, text2):
    inputs = tokenizer([text1, text2], padding=True, truncation=True, return_tensors="pt")

    with torch.no_grad(): 
        outputs = ov_model(**inputs)

    embeddings = outputs.last_hidden_state.mean(dim=1).detach().numpy()

    embeddings = normalize(embeddings, axis=1)
    return cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]

# Example usage
recognized_wav = "..."
lyric = "Humpty Dumpty sat on a wall."
similarity = embedding_similarity_ov(recognized_wav, lyric)

print("Embedding-based similarity:", similarity)
