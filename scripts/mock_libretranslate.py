
from flask import Flask, request, jsonify
from flask_cors import CORS
from deep_translator import GoogleTranslator
import time

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/translate', methods=['POST'])
def translate():
    data = request.json
    
    # LibreTranslate API format
    q = data.get('q', '')
    source = data.get('source', 'auto')
    target = data.get('target', 'en')
    
    # Handle API key if present (ignore for mock)
    # api_key = data.get('api_key')

    if not q:
        return jsonify({'error': 'No text to translate'}), 400

    try:
        # deep-translator expects ISO codes. LibreTranslate sends them too.
        # Handle 'vi' -> 'vi'
        
        translator = GoogleTranslator(source=source, target=target)
        result = translator.translate(q)
        
        return jsonify({
            'translatedText': result
        })
    except Exception as e:
        print(f"Translation error: {e}")
        # Fallback
        return jsonify({
            'translatedText': f"[Fallback] {q}"
        }), 200

@app.route('/languages', methods=['GET'])
def languages():
    # Mock list of supported languages
    return jsonify([
        {"code": "en", "name": "English"},
        {"code": "vi", "name": "Vietnamese"},
        {"code": "zh", "name": "Chinese"},
        # Add more as needed
    ])

if __name__ == '__main__':
    print("Starting Portable LibreTranslate-Compatible Server on port 5000...")
    print("This server uses deep-translator (Google Backend) to mimic LibreTranslate API.")
    app.run(port=5000)
