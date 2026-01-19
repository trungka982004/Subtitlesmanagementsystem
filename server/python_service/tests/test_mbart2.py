from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

# Load model and tokenizer
model_path = "./models/mbart/final_model"
print(f"Loading model from {model_path}...")

tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)
# Set source and target languages
tokenizer.src_lang = "zh_CN"
model = AutoModelForSeq2SeqLM.from_pretrained(model_path, local_files_only=True)

# Test texts
test_texts = [
    "不要放手",
    "好的",
    "等等",
    "你好，世界！"
]

print("\nTesting with different generation strategies:")
print("=" * 60)

for text in test_texts:
    # Tokenize with source language
    tokenizer.src_lang = "zh_CN"
    inputs = tokenizer(text, return_tensors="pt", padding=True)
    
    # Get Vietnamese token ID
    vi_token_id = tokenizer.convert_tokens_to_ids("vi_VN")
    
    print(f"\nInput: {text}")
    
    # Strategy 1: forced_bos_token_id with higher beam
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            forced_bos_token_id=vi_token_id,
            max_length=512,
            num_beams=10,
            early_stopping=True,
            no_repeat_ngram_size=3,
            length_penalty=1.5
        )
    translation1 = tokenizer.decode(outputs[0], skip_special_tokens=True)
    print(f"  Strategy 1 (beam=10, length_penalty=1.5): {translation1}")
    
    # Strategy 2: Sample with temperature
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            forced_bos_token_id=vi_token_id,
            max_length=512,
            do_sample=True,
            top_k=50,
            top_p=0.95,
            temperature=0.7,
            num_return_sequences=1
        )
    translation2 = tokenizer.decode(outputs[0], skip_special_tokens=True)
    print(f"  Strategy 2 (sampling, temp=0.7): {translation2}")
