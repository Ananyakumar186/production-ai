import requests
from dotenv import load_dotenv
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI()

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

@app.route('/session', methods=['GET'])
def get_session():
    try:
        url = "https://api.openai.com/v1/realtime/sessions"
        
        payload = {
            "model": "gpt-4o-realtime-preview-2024-12-17",
            "modalities": ["audio", "text"],
            "instructions": "You are a friendly assistant."
        }
        
        headers = {
            'Authorization': 'Bearer ' + os.getenv('OPENAI_API_KEY'),
            'Content-Type': 'application/json'
        }

        response = requests.post(url, json=payload, headers=headers)
        return response.json()

    except Exception as e:
        return e
    

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)