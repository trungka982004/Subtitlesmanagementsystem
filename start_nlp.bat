@echo off
echo Starting Custom NLP Service...
cd server/python_service
uvicorn main:app --reload --port 8000
pause
