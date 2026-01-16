from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch
from fastapi.middleware.cors import CORSMiddleware
import os
import glob

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

class VersionRequest(BaseModel):
    version: str

# models are now in specific folder
BASE_MODELS_PATH = "./models"

model = None
tokenizer = None
current_model_id = None

def get_available_models():
    """Scan the models directory for available models."""
    global BASE_MODELS_PATH
    
    # Check local first
    if not os.path.exists(BASE_MODELS_PATH):
        # Fallback for dev environment or if running from different cwd
        if os.path.exists("../../models"):
             BASE_MODELS_PATH = "../../models"
        elif os.path.exists("../../../models"):
             BASE_MODELS_PATH = "../../../models"
        else:
             return []
    
    models = []
    print(f"Scanning models in {BASE_MODELS_PATH}...")
    for entry in os.listdir(BASE_MODELS_PATH):
        full_path = os.path.join(BASE_MODELS_PATH, entry)
        if os.path.isdir(full_path):
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
    global model, tokenizer, current_model_id
    
    # Don't reload if already loaded
    if current_model_id == model_id and model is not None:
        return True

    # Check paths
    model_path = os.path.join(BASE_MODELS_PATH, model_id)
    if not os.path.exists(model_path):
         # Try walking up if running from inner dir
         model_path = os.path.join("../../../models", model_id)
         if not os.path.exists(model_path):
            print(f"Model path failed: {model_path}")
            raise HTTPException(status_code=404, detail=f"Model {model_id} not found")

    # Check for nested 'final_model' directory
    nested_path = os.path.join(model_path, "final_model")
    if os.path.exists(nested_path) and os.path.isdir(nested_path):
        print(f"Index: Found nested 'final_model' directory. Using {nested_path}")
        model_path = nested_path
    
    print(f"Loading model {model_id} from {model_path}...")
    
    try:
        # Load tokenizer and model
        # local_files_only=True ensures we don't try to download if something is missing
        tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)
        model = AutoModelForSeq2SeqLM.from_pretrained(model_path, local_files_only=True)
        
        # Move to GPU if available
        if torch.cuda.is_available():
            model = model.to("cuda")
            print("Model moved to CUDA")
        else:
            print("Model running on CPU")
            
        current_model_id = model_id
        print(f"Model {model_id} loaded successfully!")
        return True
    except Exception as e:
        print(f"Error loading model: {e}")
        return False

class BatchTranslationRequest(BaseModel):
    texts: list[str]
    model_id: str = None

@app.post("/translate_batch")
async def translate_batch(request: BatchTranslationRequest):
    global model, tokenizer, current_model_id
    
    target_model = request.model_id
    
    # Auto-switch model if requested different one
    if target_model and target_model != current_model_id:
        print(f"Request for {target_model} but current is {current_model_id}. Switching...")
        success = await load_model(target_model)
        if not success:
             raise HTTPException(status_code=500, detail=f"Failed to load requested model: {target_model}")

    if not model or not tokenizer:
        raise HTTPException(status_code=503, detail="Model not loaded.")

    try:
        texts = request.texts
        device = model.device
        
        # Batch processing
        inputs = tokenizer(texts, return_tensors="pt", padding=True, truncation=True, max_length=512).to(device)
        
        with torch.no_grad():
            outputs = model.generate(**inputs, max_length=512)
        
        translated_texts = tokenizer.batch_decode(outputs, skip_special_tokens=True)
        return {"translated_texts": translated_texts, "model_used": current_model_id}
    except Exception as e:
        print(f"Batch Translation Error: {e}")
        # Clear CUDA cache on error
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/translate")
async def translate(request: TranslationRequest):
    global model, tokenizer, current_model_id
    
    target_model = request.model_id
    
    # Auto-switch model if requested different one
    if target_model and target_model != current_model_id:
        print(f"Request for {target_model} but current is {current_model_id}. Switching...")
        success = await load_model(target_model)
        if not success:
             raise HTTPException(status_code=500, detail=f"Failed to load requested model: {target_model}")

    if not model or not tokenizer:
        raise HTTPException(status_code=503, detail="Model not loaded.")

    try:
        text = request.text
        device = model.device
        
        inputs = tokenizer(text, return_tensors="pt", padding=True).to(device)
        
        with torch.no_grad():
            outputs = model.generate(**inputs, max_length=512)
        
        translated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        return {"translated_text": translated_text, "model_used": current_model_id}
    except Exception as e:
        print(f"Translation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/versions")
async def get_versions():
    """Return list of available models (renaming endpoint conceptually to models but keeping path for now)."""
    models = get_available_models()
    return {
        "available_versions": models, # Keeping key 'available_versions' for frontend compatibility for now
        "current_version": current_model_id
    }

@app.post("/set_version")
async def set_version(request: VersionRequest):
    """Switch the active model manually."""
    success = await load_model(request.version)
    if success:
        return {"status": "ok", "current_version": current_model_id}
    else:
        raise HTTPException(status_code=500, detail=f"Failed to load model {request.version}")

@app.get("/health")
async def health():
    return {
        "status": "ok", 
        "model_loaded": model is not None,
        "current_version": current_model_id,
        "device": str(model.device) if model else "none"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
