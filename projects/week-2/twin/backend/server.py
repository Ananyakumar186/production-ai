import asyncio
from io import BytesIO
import tempfile
from urllib.parse import quote
import aiofiles
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from openai import OpenAI
import os
from dotenv import load_dotenv
from typing import Optional, List, Dict
import json
import uuid
from datetime import datetime
from context import prompt
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
            {"role": "system", "content": prompt()}
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

@app.post("/speech-to-speech")
async def speech_to_speech_with_history(
    audio: UploadFile = File(...),
    conversation_history: Optional[str] = Form(None),
    voice: str = Form("alloy")
):
    """
    Speech-to-speech with conversation history support
    """
    try:
        audio_data = await audio.read()
        
        # Create temp file path
        temp_audio_path = os.path.join(tempfile.gettempdir(), f"temp_audio_{os.urandom(8).hex()}.webm")
        
        # Write audio data asynchronously
        async with aiofiles.open(temp_audio_path, "wb") as temp_audio:
            await temp_audio.write(audio_data)
        
        try:
            # Transcribe audio
            async with aiofiles.open(temp_audio_path, "rb") as audio_file:
                audio_content = await audio_file.read()
                transcription = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=("audio.webm", audio_content, "audio/webm")
                )
            
            user_message = transcription.text
            
            # Build messages array
            messages = [
                {
                    "role": "system",
                    "content": prompt()
                }
            ]
            
            # Add conversation history if provided
            if conversation_history:
                history = json.loads(conversation_history)
                messages.extend(history)
            
            messages.append({
                "role": "user",
                "content": user_message
            })
            
            # Get GPT response
            completion = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages
            )
            
            bot_response = completion.choices[0].message.content or "I apologize, I could not generate a response."
            
            # Convert to speech
            speech_response = client.audio.speech.create(
                model="tts-1",
                voice=voice,
                input=bot_response
            )
            
            audio_buffer = BytesIO()
            for chunk in speech_response.iter_bytes():
                audio_buffer.write(chunk)
            audio_buffer.seek(0)
            
            return StreamingResponse(
                audio_buffer,
                media_type="audio/mpeg",
                headers={
                    "X-Transcription": quote(user_message),
                    "X-Response-Text": quote(bot_response),
                    "Content-Disposition": "inline; filename=response.mp3",
                    "Access-Control-Expose-Headers": "X-Transcription, X-Response-Text"
                }
            )
            
        finally:
            os.unlink(temp_audio_path)
            
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))




if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)