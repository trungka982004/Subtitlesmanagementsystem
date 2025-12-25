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

class VersionRequest(BaseModel):
    version: str

BASE_MODELS_PATH = "./versions"
# Fallback to old path if versions dir doesn't exist (though we just created it)
OLD_MODEL_PATH = "./model"

model = None
tokenizer = None
current_version = None

def get_available_versions():
    """Scan the versions directory for available model versions."""
    if not os.path.exists(BASE_MODELS_PATH):
        return []
    
    versions = []
    for entry in os.listdir(BASE_MODELS_PATH):
        full_path = os.path.join(BASE_MODELS_PATH, entry)
        if os.path.isdir(full_path):
            versions.append(entry)
    
    # Sort versions (simple string sort for now, ideally semantic versioning sort)
    versions.sort(reverse=True)
    return versions

@app.on_event("startup")
async def startup_event():
    # Try to find available versions
    versions = get_available_versions()
    if versions:
        # Load the latest version by default
        await load_model(versions[0])
    else:
        # Fallback to legacy path if no versions found
        print(f"No versions found in {BASE_MODELS_PATH}. Checking legacy path {OLD_MODEL_PATH}...")
        if os.path.exists(OLD_MODEL_PATH) and len(os.listdir(OLD_MODEL_PATH)) > 0:
            await load_model("legacy")
        else:
            print("No models found.")

async def load_model(version: str):
    global model, tokenizer, current_version
    
    if version == "legacy":
        model_path = OLD_MODEL_PATH
    else:
        model_path = os.path.join(BASE_MODELS_PATH, version)
    
    print(f"Loading model version {version} from {model_path}...")
    
    try:
        if not os.path.exists(model_path):
             raise HTTPException(status_code=404, detail=f"Model version {version} not found")

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
            
        current_version = version
        print(f"Model version {version} loaded successfully!")
        return True
    except Exception as e:
        print(f"Error loading model: {e}")
        # Don't crash the server, just report error
        return False

@app.post("/translate")
async def translate(request: TranslationRequest):
    global model, tokenizer
    if not model or not tokenizer:
        raise HTTPException(status_code=503, detail="Model not loaded. Please select a version in settings.")

    try:
        text = request.text
        device = model.device
        
        inputs = tokenizer(text, return_tensors="pt", padding=True).to(device)
        
        with torch.no_grad():
            outputs = model.generate(**inputs, max_length=512)
        
        translated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        return {"translated_text": translated_text}
    except Exception as e:
        print(f"Translation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/versions")
async def get_versions():
    """Return list of available versions and the currently loaded one."""
    versions = get_available_versions()
    # If using legacy and it's not in versions list, add a marker? 
    # But we want to encourage using the new structure.
    return {
        "available_versions": versions,
        "current_version": current_version
    }

@app.post("/set_version")
async def set_version(request: VersionRequest):
    """Switch the active model version."""
    success = await load_model(request.version)
    if success:
        return {"status": "ok", "current_version": current_version}
    else:
        raise HTTPException(status_code=500, detail=f"Failed to load version {request.version}")

@app.get("/health")
async def health():
    return {
        "status": "ok", 
        "model_loaded": model is not None,
        "current_version": current_version,
        "device": str(model.device) if model else "none"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
