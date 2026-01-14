# Custom NLP Model Integration

This project now integrates a custom NLP model (Chinese -> Vietnamese) using a Python FastAPI service.

## Prerequisites
- Python 3.8+ installed.
- Dependencies installed: `pip install -r server/python_service/requirements.txt`
- Model files placed in `server/python_service/model` or `server/python_service/versions`.

## How to Start
You must start the Python backend for the translation features to work.

### Method 1: Batch Script (Windows)
Double-click `start_nlp.bat` in the project root.

### Method 2: Manual
Run the following command in a terminal:
```bash
cd server/python_service
python -m uvicorn main:app --port 8000
```

## Usage in App
1. Open the application.
2. Go to **Settings > System**.
3. Check the "Custom NLP Service" status. It should be green (Status: ok, Model Loaded: Yes).
4. Open a subtitle file.
5. In the editor, click the **NLP** button (Purple Sparkles icon) to translate using your custom model.
6. You can compare the results with Google Translate (LibreTranslate).
