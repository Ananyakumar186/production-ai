// components/SpeechToSpeechChat.tsx
'use client';

import { useState, useRef } from 'react';


export default function SpeechToSpeech() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [response, setResponse] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processSpeech(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const processSpeech = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('http://localhost:8000/speech-to-speech', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process speech');
      }

      // Get transcription and response from headers
      const transcriptionText = decodeURIComponent(
        response.headers.get('X-Transcription') || ''
      );
      const responseText = decodeURIComponent(
        response.headers.get('X-Response-Text') || ''
      );

      setTranscription(transcriptionText);
      setResponse(responseText);

      // Play audio response
      const responseAudioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(responseAudioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.error('Error processing speech:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg disabled:opacity-50"
        >
          {isRecording ? '🎙️ Stop Recording' : '🎤 Start Recording'}
        </button>
        {isProcessing && <p className="mt-2">Processing...</p>}
      </div>

      {transcription && (
        <div className="mb-4 p-4 bg-gray-100 rounded">
          <strong>You said:</strong> {transcription}
        </div>
      )}

      {response && (
        <div className="p-4 bg-blue-100 rounded">
          <strong>Response:</strong> {response}
        </div>
      )}
    </div>
  );
}