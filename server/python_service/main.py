from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch
import ctranslate2
from fastapi.middleware.cors import CORSMiddleware
import os
import glob
import time
import psutil
from typing import Optional
import asyncio
from collections import deque

app = FastAPI()

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TranslationRequest(BaseModel):
    text: str
    model_id: str = None  # Optional, if None uses current loaded model

class BatchTranslationRequest(BaseModel):
    texts: list[str]
    model_id: str = None

class VersionRequest(BaseModel):
    version: str

# models are now in specific folder
# Base path relative to this script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_MODELS_PATH = os.path.join(SCRIPT_DIR, "models")

# CPU Optimization Settings
CPU_THREADS = os.cpu_count() or 4  # Use all available CPU cores
INTER_THREADS = max(1, CPU_THREADS // 2)  # Threads for inter-op parallelism
INTRA_THREADS = max(1, CPU_THREADS // 2)  # Threads for intra-op parallelism

# Global state
model = None # HF Model
translator = None # CTranslate2 Translator
tokenizer = None
current_model_id = None
is_ct2_model = False

# Performance monitoring
request_times = deque(maxlen=100)  # Track last 100 request times

def contains_english(text):
    """
    Simple heuristic to detect if text contains significant English content.
    Returns True if more than 30% of alphabetic characters are ASCII (likely English).
    """
    if not text:
        return False
    
    alpha_chars = [c for c in text if c.isalpha()]
    if not alpha_chars:
        return False
    
    ascii_alpha = [c for c in alpha_chars if ord(c) < 128]
    ratio = len(ascii_alpha) / len(alpha_chars)
    
    return ratio > 0.3  # More than 30% ASCII letters suggests English content

def get_available_models():
    """Scan the models directory for available models."""
    global BASE_MODELS_PATH
    
    # Just in case, check if we are in a weird env, but SCRIPT_DIR should be correct.
    if not os.path.exists(BASE_MODELS_PATH):
        print(f"Warning: Models path {BASE_MODELS_PATH} does not exist.")
        return []
    
    models = []
    print(f"Scanning models in {BASE_MODELS_PATH}...")
    for entry in os.listdir(BASE_MODELS_PATH):
        full_path = os.path.join(BASE_MODELS_PATH, entry)
        if os.path.isdir(full_path):
            # Hide the internal _ct2 folders from the frontend list to avoid duplicates
            # Also hide backup folders
            if not entry.endswith("_ct2") and "ct2_backup" not in entry:
                models.append(entry)
    
    return sorted(models)

@app.on_event("startup")
async def startup_event():
    # Configure PyTorch for CPU optimization (must be done before any model loading)
    torch.set_num_threads(CPU_THREADS)
    if hasattr(torch, 'set_num_interop_threads'):
        try:
            torch.set_num_interop_threads(INTER_THREADS)
        except RuntimeError as e:
            print(f"Warning: Could not set interop threads: {e}")
    
    # Try to find available models
    models = get_available_models()
    if models:
        # Load the first one by default (e.g. mbart or opus)
        # Prioritize 'mbart' if exists as default
        default_model = "mbart" if "mbart" in models else models[0]
        await load_model(default_model)
    else:
        print(f"No models found in {BASE_MODELS_PATH}")

async def load_model(model_id: str):
    global model, translator, tokenizer, current_model_id, is_ct2_model
    
    # Don't reload if already loaded and same type
    if current_model_id == model_id:
        # Check if we are currently optimized? 
        # Actually simplest to just return if ID matches.
        if (translator is not None or model is not None):
            return True

    print(f"Loading model process for: {model_id}...")
    
    # paths
    original_model_path = os.path.join(BASE_MODELS_PATH, model_id)
    ct2_model_path = os.path.join(BASE_MODELS_PATH, f"{model_id}_ct2")
    
    # Check if optimized version exists
    # IMPORTANT: Disable CT2 for mBART due to repetition issues in conversion
    use_ct2 = False
    model_path_to_load = original_model_path
    
    if os.path.exists(ct2_model_path) and "mbart" not in model_id.lower():
        print(f"Found optimized CTranslate2 model at {ct2_model_path}")
        use_ct2 = True
        model_path_to_load = ct2_model_path
    elif "mbart" in model_id.lower():
        print(f"Using original HuggingFace model for mBART (CT2 version has repetition issues)")
        use_ct2 = False
        model_path_to_load = original_model_path
    elif not os.path.exists(original_model_path):
        # Path resolution fallback
        if os.path.exists(os.path.join("../../../models", model_id)):
             original_model_path = os.path.join("../../../models", model_id)
             ct2_model_path = os.path.join("../../../models", f"{model_id}_ct2")
             if os.path.exists(ct2_model_path) and "mbart" not in model_id.lower():
                 use_ct2 = True
                 model_path_to_load = ct2_model_path
             else:
                 model_path_to_load = original_model_path
        else:
             print(f"Model path failed: {original_model_path}")
             raise HTTPException(status_code=404, detail=f"Model {model_id} not found")

    # Check for nested final_model in original path if NOT using CT2 or if CT2 failed
    # Actually, even for CT2, we assume it's flat. For original, we check.
    if not use_ct2:
        nested_path = os.path.join(model_path_to_load, "final_model")
        if os.path.exists(nested_path) and os.path.isdir(nested_path):
             print(f"Adjusting path to nested 'final_model': {nested_path}")
             model_path_to_load = nested_path

    try:
        # Unload previous
        model = None
        translator = None
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            
        # Load Tokenizer
        # We try to load tokenizer from the directory we are loading the model from
        # If CT2, we hopefully copied tokenizer files there. If not, fallback to original?
        
        try:
             # Try fast tokenizer first
             tokenizer = AutoTokenizer.from_pretrained(model_path_to_load, local_files_only=True)
        except Exception as e:
             print(f"Warning: Could not load fast tokenizer from {model_path_to_load}: {e}")
             try:
                 # Try slow tokenizer or fallback to original path
                 print(f"Attempting to load tokenizer from original path {original_model_path}...")
                 tokenizer = AutoTokenizer.from_pretrained(original_model_path, local_files_only=True)
             except Exception as e2:
                 print(f"Critical: Failed to load tokenizer: {e2}")
                 raise e2

        if use_ct2:
            print(f"Loading CTranslate2 engine from {model_path_to_load}...")
            device = "cuda" if torch.cuda.is_available() else "cpu"
            
            # CPU-optimized CTranslate2 configuration
            if device == "cpu":
                print(f"Configuring CTranslate2 for CPU with {INTER_THREADS} inter_threads, {INTRA_THREADS} intra_threads")
                translator = ctranslate2.Translator(
                    model_path_to_load, 
                    device=device,
                    inter_threads=INTER_THREADS,
                    intra_threads=INTRA_THREADS,
                    compute_type="auto"  # Let CTranslate2 choose optimal compute type
                )
            else:
                translator = ctranslate2.Translator(model_path_to_load, device=device)
            
            is_ct2_model = True
            
            # Special handling for mBART: It needs to know the target language code
            if "mbart" in model_id.lower():
                # Ensure compatibility with mBART tokenizer which might be multilingual
                if tokenizer.pad_token is None:
                    tokenizer.pad_token = tokenizer.eos_token
                # Set source and target languages
                if not hasattr(tokenizer, 'src_lang') or not tokenizer.src_lang:
                     print("Setting default src_lang to zh_CN for mBART")
                     tokenizer.src_lang = "zh_CN"
                # Force target language to Vietnamese
                tokenizer.tgt_lang = "vi_VN"
                print(f"mBART config: src_lang={tokenizer.src_lang}, tgt_lang={tokenizer.tgt_lang}")
                
            print("CTranslate2 model loaded successfully!")
        else:
            print(f"Loading standard Transformers model from {model_path_to_load}...")
            model = AutoModelForSeq2SeqLM.from_pretrained(model_path_to_load, local_files_only=True)
            if torch.cuda.is_available():
                model = model.to("cuda")
            is_ct2_model = False
            print("Transformers model loaded successfully!")

        current_model_id = model_id
        return True
    except Exception as e:
        print(f"Error loading model: {e}")
        import traceback
        traceback.print_exc()
        return False

@app.post("/translate_batch")
async def translate_batch(request: BatchTranslationRequest):
    global model, translator, tokenizer, current_model_id, is_ct2_model
    
    target_model = request.model_id
    
    if target_model and target_model != current_model_id:
        print(f"Switching to {target_model}...")
        success = await load_model(target_model)
        if not success:
             raise HTTPException(status_code=500, detail=f"Failed to load requested model: {target_model}")

    if (not model and not translator) or not tokenizer:
        raise HTTPException(status_code=503, detail="Model not loaded.")

    try:
        start_time = time.time()
        texts = request.texts
        
        if is_ct2_model:
            # CTranslate2 Path with optimizations
            
            # Special handling for mBART to force Vietnamese target
            target_prefix = None
            beam_size = 1
            max_decoding_length = 512
            
            if "mbart" in current_model_id.lower():
                # Ensure target language is set
                if not hasattr(tokenizer, 'tgt_lang') or not tokenizer.tgt_lang:
                    tokenizer.tgt_lang = "vi_VN"
                if not hasattr(tokenizer, 'src_lang') or not tokenizer.src_lang:
                    tokenizer.src_lang = "zh_CN"
                
                # CRITICAL: For mBART with CTranslate2, we need to use the language token
                # The target_prefix should contain the actual language token, not just the string
                # We need to ensure the tokenizer properly encodes this
                try:
                    # Set the target language in tokenizer
                    tokenizer.tgt_lang = "vi_VN"
                    # Get the language token - for mBART this is typically at the end of vocab
                    # The token should be in the format "vi_VN"
                    lang_token = "vi_VN"
                    
                    # Verify the token exists
                    test_id = tokenizer.convert_tokens_to_ids(lang_token)
                    if test_id != tokenizer.unk_token_id:
                        target_prefix = [[lang_token]] * len(texts)
                        print(f"Using target_prefix with token: {lang_token} (ID: {test_id})")
                    else:
                        print(f"Warning: Language token {lang_token} not found in vocabulary")
                        target_prefix = [[lang_token]] * len(texts)
                except Exception as e:
                    print(f"Error setting target prefix: {e}")
                    target_prefix = [["vi_VN"]] * len(texts)
                
                # Use beam search for better quality and language adherence
                beam_size = 5  # Higher beam size for better quality
                print(f"mBART translation: src_lang={tokenizer.src_lang}, tgt_lang={tokenizer.tgt_lang}, beam_size={beam_size}")
            
            print(f"Batch translating {len(texts)} items with CTranslate2...")
            
            # Tokenize (optimized batch tokenization)
            source_tokens = [tokenizer.convert_ids_to_tokens(tokenizer.encode(t)) for t in texts]
            
            # Translate with optimized settings
            # Note: Keep parameters simple - repetition_penalty can cause issues with mBART
            translate_params = {
                "source": source_tokens,
                "target_prefix": target_prefix,
                "beam_size": beam_size,
                "max_batch_size": 32,
                "batch_type": "tokens"
            }
            
            # Only add max_decoding_length if not mBART (it can cause repetition issues)
            if "mbart" not in current_model_id.lower():
                translate_params["max_decoding_length"] = max_decoding_length
            
            results = translator.translate_batch(**translate_params)
            
            # Detokenize
            translated_texts = [tokenizer.decode(tokenizer.convert_tokens_to_ids(res.hypotheses[0]), skip_special_tokens=True) for res in results]
            
            # Detect English output in mBART translations (diagnostic)
            if "mbart" in current_model_id.lower():
                english_count = sum(1 for text in translated_texts if contains_english(text))
                if english_count > 0:
                    print(f"Warning: {english_count}/{len(translated_texts)} translations contain English text")
                    print(f"Note: This is a known limitation of the current model training")
            
            # Track performance
            elapsed = time.time() - start_time
            request_times.append(elapsed)
            
            return {
                "translated_texts": translated_texts, 
                "model_used": current_model_id, 
                "backend": "ctranslate2",
                "processing_time_ms": round(elapsed * 1000, 2)
            }
            
        else:
            # Transformers Path (used for mBART to avoid CT2 repetition issues)
            device = model.device
            inputs = tokenizer(texts, return_tensors="pt", padding=True, truncation=True, max_length=512).to(device)
            
            # Special handling for mBART to force Vietnamese output
            generate_kwargs = {"max_length": 512}
            if "mbart" in current_model_id.lower():
                # Force Vietnamese output
                vi_token_id = tokenizer.convert_tokens_to_ids("vi_VN")
                generate_kwargs.update({
                    "forced_bos_token_id": vi_token_id,
                    "num_beams": 5,
                    "early_stopping": True,
                    "no_repeat_ngram_size": 3,
                    "repetition_penalty": 1.5
                })
                print(f"mBART (Transformers): Using forced_bos_token_id={vi_token_id} for Vietnamese")
            
            with torch.no_grad():
                outputs = model.generate(**inputs, **generate_kwargs)
            
            translated_texts = tokenizer.batch_decode(outputs, skip_special_tokens=True)
            return {"translated_texts": translated_texts, "model_used": current_model_id, "backend": "transformers"}
            
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        print(f"Batch Translation Error: {e}")
        import traceback
        traceback.print_exc()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.post("/translate") 
async def translate(request: TranslationRequest):
    global model, translator, tokenizer, current_model_id, is_ct2_model
    
    target_model = request.model_id
    if target_model and target_model != current_model_id:
        await load_model(target_model)

    if (not model and not translator):
        raise HTTPException(status_code=503, detail="Model not loaded.")

    try:
        text = request.text
        
        if is_ct2_model:
            target_prefix = None
            beam_size = 1
            max_decoding_length = 512
            
            if "mbart" in current_model_id.lower():
                # Ensure languages are set
                if not hasattr(tokenizer, 'tgt_lang') or not tokenizer.tgt_lang:
                    tokenizer.tgt_lang = "vi_VN"
                if not hasattr(tokenizer, 'src_lang') or not tokenizer.src_lang:
                    tokenizer.src_lang = "zh_CN"
                
                target_prefix = [["vi_VN"]]
                beam_size = 5  # Use beam search for better quality

            print(f"Tokenizing text: {text[:50]}...")
            input_ids = tokenizer.encode(text)
            source_tokens = tokenizer.convert_ids_to_tokens(input_ids)
            print(f"Source tokens (first 10): {source_tokens[:10]}")
            
            # Simplified parameters for mBART to avoid repetition issues
            translate_params = {
                "source": [source_tokens],
                "target_prefix": target_prefix,
                "beam_size": beam_size
            }
            
            # Only add max_decoding_length if not mBART
            if "mbart" not in current_model_id.lower():
                translate_params["max_decoding_length"] = max_decoding_length
            
            results = translator.translate_batch(**translate_params)
            translated_text = tokenizer.decode(tokenizer.convert_tokens_to_ids(results[0].hypotheses[0]), skip_special_tokens=True)
            return {"translated_text": translated_text, "model_used": current_model_id, "backend": "ctranslate2"}
        else:
            # Transformers Path (used for mBART)
            device = model.device
            inputs = tokenizer(text, return_tensors="pt", padding=True).to(device)
            
            # Special handling for mBART
            generate_kwargs = {"max_length": 512}
            if "mbart" in current_model_id.lower():
                vi_token_id = tokenizer.convert_tokens_to_ids("vi_VN")
                generate_kwargs.update({
                    "forced_bos_token_id": vi_token_id,
                    "num_beams": 5,
                    "early_stopping": True,
                    "no_repeat_ngram_size": 3,
                    "repetition_penalty": 1.5
                })
            
            with torch.no_grad():
                outputs = model.generate(**inputs, **generate_kwargs)
            translated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
            return {"translated_text": translated_text, "model_used": current_model_id, "backend": "transformers"}
            
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        print(f"Translation Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.get("/versions")
async def get_versions():
    models = get_available_models()
    return {
        "available_versions": models,
        "current_version": current_model_id
    }

@app.post("/set_version")
async def set_version(request: VersionRequest):
    success = await load_model(request.version)
    if success:
        return {"status": "ok", "current_version": current_model_id}
    else:
        raise HTTPException(status_code=500, detail=f"Failed to load model {request.version}")

@app.get("/health")
async def health():
    # Get memory usage
    process = psutil.Process()
    memory_mb = process.memory_info().rss / (1024 ** 2)
    
    # Calculate average request time
    avg_request_time = sum(request_times) / len(request_times) if request_times else 0
    
    return {
        "status": "ok", 
        "model_loaded": (model is not None or translator is not None),
        "backend": "ctranslate2" if is_ct2_model else ("transformers" if model else "none"),
        "current_version": current_model_id,
        "cpu_threads": CPU_THREADS,
        "memory_mb": round(memory_mb, 2),
        "avg_request_time_ms": round(avg_request_time * 1000, 2) if avg_request_time else None,
        "total_requests": len(request_times)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
