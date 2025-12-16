# main.py - Enhanced version with streaming support
from fastapi import FastAPI, File, UploadFile, HTTPException, Form, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
import os
from io import BytesIO
from typing import Optional, List
import tempfile
from pydantic import BaseModel
import json
from dotenv import load_dotenv
import aiofiles
from urllib.parse import quote
import asyncio

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    voice: Optional[str] = "alloy"


# @app.post("/speech-to-speech")
# async def speech_to_speech_with_history(
#     audio: UploadFile = File(...),
#     conversation_history: Optional[str] = Form(None),
#     voice: str = Form("alloy")
# ):
#     """
#     Speech-to-speech with conversation history support
#     """
#     try:
#         audio_data = await audio.read()
        
#         # Create temp file path
#         temp_audio_path = os.path.join(tempfile.gettempdir(), f"temp_audio_{os.urandom(8).hex()}.webm")
        
#         # Write audio data asynchronously
#         async with aiofiles.open(temp_audio_path, "wb") as temp_audio:
#             await temp_audio.write(audio_data)
        
#         try:
#             # Transcribe audio
#             async with aiofiles.open(temp_audio_path, "rb") as audio_file:
#                 audio_content = await audio_file.read()
#                 transcription = client.audio.transcriptions.create(
#                     model="whisper-1",
#                     file=("audio.webm", audio_content, "audio/webm")
#                 )
            
#             user_message = transcription.text
            
#             # Build messages array
#             messages = [
#                 {
#                     "role": "system",
#                     "content": prompt()
#                 }
#             ]
            
#             # Add conversation history if provided
#             if conversation_history:
#                 history = json.loads(conversation_history)
#                 messages.extend(history)
            
#             messages.append({
#                 "role": "user",
#                 "content": user_message
#             })
            
#             # Get GPT response
#             completion = client.chat.completions.create(
#                 model="gpt-4o-mini",
#                 messages=messages
#             )
            
#             bot_response = completion.choices[0].message.content or "I apologize, I could not generate a response."
            
#             # Convert to speech
#             speech_response = client.audio.speech.create(
#                 model="tts-1",
#                 voice=voice,
#                 input=bot_response
#             )
            
#             audio_buffer = BytesIO()
#             for chunk in speech_response.iter_bytes():
#                 audio_buffer.write(chunk)
#             audio_buffer.seek(0)
            
#             return StreamingResponse(
#                 audio_buffer,
#                 media_type="audio/mpeg",
#                 headers={
#                     "X-Transcription": quote(user_message),
#                     "X-Response-Text": quote(bot_response),
#                     "Content-Disposition": "inline; filename=response.mp3",
#                     "Access-Control-Expose-Headers": "X-Transcription, X-Response-Text"
#                 }
#             )
            
#         finally:
#             os.unlink(temp_audio_path)
            
#     except Exception as e:
#         print(f"Error: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
async def root():
    return {"message": "Speech-to-Speech API is running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)