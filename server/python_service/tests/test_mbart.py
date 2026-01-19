from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

# Load model and tokenizer
model_path = "./models/mbart/final_model"
print(f"Loading model from {model_path}...")

tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True, src_lang="zh_CN", tgt_lang="vi_VN")
model = AutoModelForSeq2SeqLM.from_pretrained(model_path, local_files_only=True)

# Test texts
test_texts = [
    "不要放手",
    "好的",
    "等等",
    "你好，世界！"
]

print("\nTesting original HuggingFace model:")
print("=" * 60)

for text in test_texts:
    # Tokenize
    inputs = tokenizer(text, return_tensors="pt", padding=True)
    
    # Generate with forced_bos_token_id
    vi_token_id = tokenizer.convert_tokens_to_ids("vi_VN")
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            forced_bos_token_id=vi_token_id,
            max_length=512,
            num_beams=5,
            early_stopping=True
        )
    
    translation = tokenizer.decode(outputs[0], skip_special_tokens=True)
    print(f"Input:  {text}")
    print(f"Output: {translation}")
    print()
