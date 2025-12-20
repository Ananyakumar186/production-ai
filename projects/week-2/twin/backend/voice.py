import requests
from dotenv import load_dotenv
import os
from fastapi import FastAPI,HTTPException
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

@app.get('/session')
def get_session():
    try:
        url = "https://api.openai.com/v1/realtime/sessions"
        
        payload = {
            "model": "gpt-realtime",
            "modalities": ["audio", "text"],
            "voice": "ash",  # Options: 'ash', 'echo', or 'onyx' for male-sounding voices
            "max_response_output_tokens": 4096, 
            "turn_detection": {
            "type": "server_vad",
            "threshold": 0.5,
            "prefix_padding_ms": 300,
            "silence_duration_ms": 1000  # Increased to 1s to prevent early cutoff
    },
            "instructions": "You are a friendly assistant."
        }
        
        headers = {
            'Authorization': 'Bearer ' + os.getenv('OPENAI_API_KEY'),
            'Content-Type': 'application/json'
        }

        response = requests.post(url, json=payload, headers=headers)
        return response.json()

    except Exception as e:
        # Proper error reporting
        raise HTTPException(status_code=500, detail=str(e))
    

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)