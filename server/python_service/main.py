from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch
from fastapi.middleware.cors import CORSMiddleware
import os

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

MODEL_PATH = "./model"
model = None
tokenizer = None

@app.on_event("startup")
async def load_model():
    global model, tokenizer
    try:
        # Check if model directory has files
        if os.path.exists(MODEL_PATH) and len(os.listdir(MODEL_PATH)) > 0:
            print(f"Loading model from {MODEL_PATH}...")
            # Load tokenizer and model
            # local_files_only=True ensures we don't try to download if something is missing, 
            # allowing us to verify local files are used.
            tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH, local_files_only=True)
            model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_PATH, local_files_only=True)
            
            # Move to GPU if available
            if torch.cuda.is_available():
                model = model.to("cuda")
                print("Model moved to CUDA")
            else:
                print("Model running on CPU")
                
            print("Model loaded successfully!")
        else:
            print(f"Warning: Model directory {MODEL_PATH} is empty or missing. Please copy your model files there.")
    except Exception as e:
        print(f"Error loading model: {e}")

@app.post("/translate")
async def translate(request: TranslationRequest):
    global model, tokenizer
    if not model or not tokenizer:
        raise HTTPException(status_code=503, detail="Model not loaded. Please ensure model files are in server/python_service/model")

    try:
        text = request.text
        # Determine device
        device = model.device
        
        # Tokenize
        inputs = tokenizer(text, return_tensors="pt", padding=True).to(device)
        
        # Generate
        with torch.no_grad():
            outputs = model.generate(**inputs, max_length=512)
        
        # Decode
        translated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        return {"translated_text": translated_text}
    except Exception as e:
        print(f"Translation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {
        "status": "ok", 
        "model_loaded": model is not None,
        "device": str(model.device) if model else "none"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
