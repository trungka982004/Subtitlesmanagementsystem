import ctranslate2
from transformers import AutoTokenizer

model_path = "./models/mbart_ct2"
translator = ctranslate2.Translator(model_path, device="cpu")
tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)

test_text = "你好"
input_ids = tokenizer.encode(test_text)
source_tokens = tokenizer.convert_ids_to_tokens(input_ids)

print("Test 1: Basic translation")
results = translator.translate_batch([source_tokens])
output = tokenizer.decode(tokenizer.convert_tokens_to_ids(results[0].hypotheses[0]), skip_special_tokens=True)
print(f"Output: {output}")

print("\nTest 2: With vi_VN prefix")
results = translator.translate_batch([source_tokens], target_prefix=[["vi_VN"]])
output = tokenizer.decode(tokenizer.convert_tokens_to_ids(results[0].hypotheses[0]), skip_special_tokens=True)
print(f"Output: {output}")

print("\nTest 3: With beam_size=5")
results = translator.translate_batch([source_tokens], target_prefix=[["vi_VN"]], beam_size=5)
output = tokenizer.decode(tokenizer.convert_tokens_to_ids(results[0].hypotheses[0]), skip_special_tokens=True)
print(f"Output: {output}")

print("\nTest 4: Check if no_repeat_ngram_size causes issues")
try:
    results = translator.translate_batch([source_tokens], target_prefix=[["vi_VN"]], beam_size=5, no_repeat_ngram_size=3)
    output = tokenizer.decode(tokenizer.convert_tokens_to_ids(results[0].hypotheses[0]), skip_special_tokens=True)
    print(f"Output: {output}")
except Exception as e:
    print(f"Error with no_repeat_ngram_size: {e}")

print("\nDone")
