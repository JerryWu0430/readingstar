from optimum.intel.openvino import OVModelForFeatureExtraction
from transformers import AutoTokenizer

model_id = "sentence-transformers/all-MiniLM-L6-v2"
ov_model = OVModelForFeatureExtraction.from_pretrained(model_id, export=True)
tokenizer = AutoTokenizer.from_pretrained(model_id)
ov_model.save_pretrained("./all-MiniLM-L6-v2-openvino")
tokenizer.save_pretrained("./all-MiniLM-L6-v2-openvino")