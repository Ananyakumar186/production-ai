
from urllib.parse import quote
import requests
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from openai import OpenAI
import os
from dotenv import load_dotenv
from typing import Optional, List, Dict
import uuid
from context import promptChat, promptSpeech

# Load environment variables
load_dotenv()

app = FastAPI()

# Configure CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)
# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))



# Request/Response models
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    history: List[Dict]

class ChatResponse(BaseModel):
    response: str
    session_id: str
    history: List[Dict]

class Message(BaseModel):
    role: str
    content: str
    timestamp: str

class SpeechMessage(BaseModel):
    role: str
    content: str


class SpeechRequest(BaseModel):
    messages: List[SpeechMessage]
    voice: Optional[str] = "alloy"

   
@app.get("/")
async def root():
    return {
        "message": "AI Digital Twin",
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Generate session ID if not provided
        session_id = request.session_id or str(uuid.uuid4())
        # Build messages with system prompt and history
        messages = [
            {"role": "system", "content": promptChat()}
        ]
        
        # Add conversation history if provided
        if hasattr(request, 'history') and request.history:
            messages.extend([{"role": msg["role"], "content": msg["content"]} for msg in request.history])
        
        # Add current user message
        messages.append({"role": "user", "content": request.message})

        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            max_tokens=2000,
            temperature=0.7,
            top_p=0.9,
        )
        
        assistant_message = response.choices[0].message.content
        
        # Build updated history
        updated_history = messages[1:] + [{"role": "assistant", "content": assistant_message}]
        
        return ChatResponse(
            response=assistant_message,
            session_id=session_id,
            history=updated_history
        )
        
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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
            "instructions": promptSpeech()
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