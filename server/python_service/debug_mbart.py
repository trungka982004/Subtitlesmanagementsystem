import os
import ctranslate2
from transformers import AutoTokenizer
import torch

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "mbart_ct2")

print(f"Testing mBART CTranslate2 from: {MODEL_PATH}")

try:
    if torch.cuda.is_available():
        print("CUDA is available. Attempting to use device='cuda'.")
        device = "cuda"
    else:
        print("CUDA is NOT available. Using device='cpu'.")
        device = "cpu"

    # Load Tokenizer
    print("Loading tokenizer from CT2 path...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH, local_files_only=True)
    tokenizer.src_lang = "zh_CN"
    print(f"Tokenizer loaded. src_lang: {tokenizer.src_lang}")

    # Load Translator
    print(f"Loading Translator on {device}...")
    translator = ctranslate2.Translator(MODEL_PATH, device=device)
    print("Translator loaded.")

    # Test Translation
    text = "嘉昌六年冬"
    print(f"Translating: '{text}'")
    
    input_ids = tokenizer.encode(text)
    source_tokens = tokenizer.convert_ids_to_tokens(input_ids)
    print(f"Tokens: {source_tokens}")
    
    target_prefix = [["vi_VN"]]
    print(f"Target Prefix: {target_prefix}")

    results = translator.translate_batch(
        [source_tokens],
        target_prefix=target_prefix
    )

    print("Translation result object obtained.")
    
    output_tokens = results[0].hypotheses[0]
    print(f"Output tokens: {output_tokens}")
    
    decoded = tokenizer.decode(tokenizer.convert_tokens_to_ids(output_tokens), skip_special_tokens=True)
    print(f"Decoded: {decoded}")

except Exception as e:
    print(f"\nCRITICAL ERROR: {e}")
    import traceback
    traceback.print_exc()
