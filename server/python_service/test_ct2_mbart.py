import ctranslate2
from transformers import AutoTokenizer

# Load CT2 model
model_path = "./models/mbart_ct2"
print(f"Loading CTranslate2 model from {model_path}...")

translator = ctranslate2.Translator(model_path, device="cpu")
tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)

# Test text
test_text = "你好，世界！"

print(f"\nTest input: {test_text}")
print("=" * 60)

# Tokenize
input_ids = tokenizer.encode(test_text)
source_tokens = tokenizer.convert_ids_to_tokens(input_ids)

print(f"Source tokens: {source_tokens}")
print(f"Vietnamese token: vi_VN")
print(f"Vietnamese token ID: {tokenizer.convert_tokens_to_ids('vi_VN')}")

# Test different approaches
print("\n1. With target_prefix=['vi_VN']:")
try:
    results = translator.translate_batch(
        [source_tokens],
        target_prefix=[["vi_VN"]],
        beam_size=5,
        max_decoding_length=100,
        repetition_penalty=1.5,
        no_repeat_ngram_size=3
    )
    output_tokens = results[0].hypotheses[0]
    translation = tokenizer.decode(tokenizer.convert_tokens_to_ids(output_tokens), skip_special_tokens=True)
    print(f"Output: {translation}")
    print(f"Output tokens (first 20): {output_tokens[:20]}")
except Exception as e:
    print(f"Error: {e}")

print("\n2. Without target_prefix:")
try:
    results = translator.translate_batch(
        [source_tokens],
        beam_size=5,
        max_decoding_length=100,
        repetition_penalty=1.5,
        no_repeat_ngram_size=3
    )
    output_tokens = results[0].hypotheses[0]
    translation = tokenizer.decode(tokenizer.convert_tokens_to_ids(output_tokens), skip_special_tokens=True)
    print(f"Output: {translation}")
    print(f"Output tokens (first 20): {output_tokens[:20]}")
except Exception as e:
    print(f"Error: {e}")

print("\n3. With target_prefix as token ID:")
try:
    # Try using the actual token instead of string
    vi_token = tokenizer.convert_ids_to_tokens([250024])[0]
    print(f"Actual Vietnamese token from ID: {vi_token}")
    
    results = translator.translate_batch(
        [source_tokens],
        target_prefix=[[vi_token]],
        beam_size=5,
        max_decoding_length=100,
        repetition_penalty=1.5,
        no_repeat_ngram_size=3
    )
    output_tokens = results[0].hypotheses[0]
    translation = tokenizer.decode(tokenizer.convert_tokens_to_ids(output_tokens), skip_special_tokens=True)
    print(f"Output: {translation}")
    print(f"Output tokens (first 20): {output_tokens[:20]}")
except Exception as e:
    print(f"Error: {e}")
