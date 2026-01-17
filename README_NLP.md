# Custom NLP Model Integration

This project integrates custom NLP models for high-performance translation using a Python FastAPI service optimized with **CTranslate2**.

## Optimization & Stability
The system now uses **CTranslate2**, which provides:
- **Reduced Memory Usage**: Prevents system crashes and OOM errors.
- **Faster Inference**: Significant speed boost for batch translations.
- **Quantization Support**: Runs efficiently on both CPU and GPU.

## Prerequisites
- Python 3.8+ installed.
- Install optimized dependencies:
  ```bash
  pip install -r server/python_service/requirements.txt
  ```

## Model Setup & Conversion
Models should be placed in `server/python_service/models/`. 

### Initial Conversion (Required for Speed)
Before starting, you should convert your HuggingFace models to the optimized CTranslate2 format using the provided script:
```bash
cd server/python_service
# Example for 'mbart' model
python convert.py --model_id mbart
```
This will create a `mbart_ct2` folder. The server will automatically detect and use this optimized version.

## How to Start
The Python backend must be running for translation features to work.

### Method 1: Batch Script (Windows)
Double-click `start_nlp.bat` in the project root.

### Method 2: Manual
```bash
cd server/python_service
python main.py
```

## Usage in App
1. Open the application.
2. Go to **Settings > System**.
3. Check the "Custom NLP Service" status. It should be green and show `backend: ctranslate2`.
4. Open a subtitle file and use the **NLP** button to translate.
