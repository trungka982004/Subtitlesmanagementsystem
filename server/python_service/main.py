from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch
import ctranslate2
from fastapi.middleware.cors import CORSMiddleware
import os
import glob
import time

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

# Global state
model = None # HF Model
translator = None # CTranslate2 Translator
tokenizer = None
current_model_id = None
is_ct2_model = False

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
            if not entry.endswith("_ct2"):
                models.append(entry)
    
    return sorted(models)

@app.on_event("startup")
async def startup_event():
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
    use_ct2 = False
    model_path_to_load = original_model_path
    
    if os.path.exists(ct2_model_path):
        print(f"Found optimized CTranslate2 model at {ct2_model_path}")
        use_ct2 = True
        model_path_to_load = ct2_model_path
    elif not os.path.exists(original_model_path):
        # Path resolution fallback
        if os.path.exists(os.path.join("../../../models", model_id)):
             original_model_path = os.path.join("../../../models", model_id)
             ct2_model_path = os.path.join("../../../models", f"{model_id}_ct2")
             if os.path.exists(ct2_model_path):
                 use_ct2 = True
                 model_path_to_load = ct2_model_path
             else:
                 model_path_to_load = original_model_path
        else:
             print(f"Model path failed: {original_model_path}")
             raise HTTPException(status_code=404, detail=f"Model {model_id} not found")

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
            translator = ctranslate2.Translator(model_path_to_load, device=device)
            is_ct2_model = True
            
            # Special handling for mBART: It needs to know the target language code
            if "mbart" in model_id.lower():
                # Ensure compatibility with mBART tokenizer which might be multilingual
                if tokenizer.pad_token is None:
                    tokenizer.pad_token = tokenizer.eos_token
                
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
        texts = request.texts
        
        if is_ct2_model:
            # CTranslate2 Path
            
            # Special handling for mBART to force Vietnamese target
            target_prefix = None
            if "mbart" in current_model_id.lower():
                # mBART-50 uses specific language codes. 'vi_VN' for Vietnamese.
                # When using CTranslate2 with mBART, we typically need to provide the target token
                # or ensure the tokenizer adds it?
                # Actually, for CT2 + mBART, we usually force the target prefix in the translate call.
                # However, the tokenizer usually handles the source language.
                # Let's try forcing the target token.
                # Common tokens: vi_VN, en_XX, zh_CN
                # For translation TO Vietnamese, we likely need to pass target_prefix=[['vi_VN']] or similar
                
                # We need to find the correct token ID or string for 'vi_VN'
                target_prefix = [["vi_VN"]] 
            
            # Tokenize
            # tokenizer.tokenize returns list of strings if passed a single string, 
            # but for batch we need to iterate or use batch_encode_plus?
            # CT2 expects list of list of tokens (strings)
            
            # For mBART, the source language usually needs to be set in tokenizer too
            # tokenizer.src_lang = "zh_CN" (assuming Chinese source)
           
            source_tokens = [tokenizer.convert_ids_to_tokens(tokenizer.encode(t)) for t in texts]
            
            # Translate
            results = translator.translate_batch(
                source_tokens,
                target_prefix=target_prefix
            )
            
            # Detokenize
            translated_texts = [tokenizer.decode(tokenizer.convert_tokens_to_ids(res.hypotheses[0]), skip_special_tokens=True) for res in results]
            
            return {"translated_texts": translated_texts, "model_used": current_model_id, "backend": "ctranslate2"}
            
        else:
            # Transformers Path
            device = model.device
            inputs = tokenizer(texts, return_tensors="pt", padding=True, truncation=True, max_length=512).to(device)
            
            with torch.no_grad():
                outputs = model.generate(**inputs, max_length=512)
            
            translated_texts = tokenizer.batch_decode(outputs, skip_special_tokens=True)
            return {"translated_texts": translated_texts, "model_used": current_model_id, "backend": "transformers"}
            
    except Exception as e:
        print(f"Batch Translation Error: {e}")
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        raise HTTPException(status_code=500, detail=str(e))

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
            if "mbart" in current_model_id.lower():
                target_prefix = [["vi_VN"]]

            source_tokens = tokenizer.convert_ids_to_tokens(tokenizer.encode(text))
            results = translator.translate_batch(
                [source_tokens],
                target_prefix=target_prefix
            )
            translated_text = tokenizer.decode(tokenizer.convert_tokens_to_ids(results[0].hypotheses[0]), skip_special_tokens=True)
            return {"translated_text": translated_text, "model_used": current_model_id, "backend": "ctranslate2"}
        else:
            device = model.device
            inputs = tokenizer(text, return_tensors="pt", padding=True).to(device)
            with torch.no_grad():
                outputs = model.generate(**inputs, max_length=512)
            translated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
            return {"translated_text": translated_text, "model_used": current_model_id, "backend": "transformers"}
            
    except Exception as e:
        print(f"Translation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
    return {
        "status": "ok", 
        "model_loaded": (model is not None or translator is not None),
        "backend": "ctranslate2" if is_ct2_model else ("transformers" if model else "none"),
        "current_version": current_model_id
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
