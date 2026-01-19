from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, MBartForConditionalGeneration
import torch

# Load model and tokenizer
model_path = "./models/mbart/final_model"
print(f"Loading model from {model_path}...")

tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)
model = MBartForConditionalGeneration.from_pretrained(model_path, local_files_only=True)

# Test a longer text that might show repetition
test_text = "Ông cũng gần gũi với gia đình của trưởng Zhuyin, do đó trưởng này rất thường xuyên nhắc"

print(f"\nTest input: {test_text}")
print("=" * 60)

# Set languages
tokenizer.src_lang = "zh_CN"

# Tokenize
inputs = tokenizer(test_text, return_tensors="pt", padding=True)

# Get Vietnamese token ID
vi_token_id = tokenizer.convert_tokens_to_ids("vi_VN")
print(f"Vietnamese token ID: {vi_token_id}")

# Generate with different strategies
print("\n1. With forced_bos_token_id:")
with torch.no_grad():
    outputs = model.generate(
        **inputs,
        forced_bos_token_id=vi_token_id,
        max_length=200,
        min_length=10,
        num_beams=5,
        early_stopping=True,
        no_repeat_ngram_size=3,  # Prevent repetition
        repetition_penalty=1.5
    )
translation = tokenizer.decode(outputs[0], skip_special_tokens=True)
print(f"Output: {translation}")

print("\n2. Without forced_bos_token_id:")
with torch.no_grad():
    outputs = model.generate(
        **inputs,
        max_length=200,
        min_length=10,
        num_beams=5,
        early_stopping=True,
        no_repeat_ngram_size=3,
        repetition_penalty=1.5
    )
translation = tokenizer.decode(outputs[0], skip_special_tokens=True)
print(f"Output: {translation}")

# Check model config
print("\n3. Model configuration:")
print(f"Model type: {model.config.model_type}")
print(f"Decoder start token id: {model.config.decoder_start_token_id}")
print(f"Forced BOS token id: {model.config.forced_bos_token_id if hasattr(model.config, 'forced_bos_token_id') else 'Not set'}")
print(f"EOS token id: {model.config.eos_token_id}")
print(f"PAD token id: {model.config.pad_token_id}")
