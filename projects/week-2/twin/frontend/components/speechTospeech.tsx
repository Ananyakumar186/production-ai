// app/chat/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const isAutoListeningRef = useRef(true);

  // Start listening automatically on component mount
  useEffect(() => {
    startListening();
    
    return () => {
      // Cleanup on unmount
      stopListening();
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
    };
  }, []);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup audio context for voice detection
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          await processSpeech(audioBlob);
        }
        audioChunksRef.current = [];
        
        // Restart listening after processing if auto-listening is enabled
        if (isAutoListeningRef.current && !isProcessing) {
          setTimeout(() => {
            if (isAutoListeningRef.current) {
              startListening();
            }
          }, 500);
        }
      };

      mediaRecorder.start();
      setIsListening(true);
      
      // Auto-stop after detecting silence (optional)
      detectSilenceAndStop();
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Please allow microphone access to use this feature.');
    }
  };

  const detectSilenceAndStop = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let silenceStart = Date.now();
    const silenceDelay = 1500; // Stop after 1.5 seconds of silence
    const minRecordingTime = 500; // Minimum recording time
    const recordingStartTime = Date.now();

    const checkAudioLevel = () => {
      if (!analyserRef.current || !isListening) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;

      if (average < 10) { // Silence threshold
        if (Date.now() - silenceStart > silenceDelay && 
            Date.now() - recordingStartTime > minRecordingTime) {
          stopListening();
          return;
        }
      } else {
        silenceStart = Date.now();
      }

      requestAnimationFrame(checkAudioLevel);
    };

    checkAudioLevel();
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsListening(false);
  };

  const processSpeech = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('voice', 'alloy');
      
      if (conversationHistory.length > 0) {
        formData.append('conversation_history', JSON.stringify(conversationHistory));
      }

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

      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        text: transcriptionText,
        sender: 'user',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Add bot message
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);

      // Update conversation history
      setConversationHistory((prev) => [
        ...prev,
        { role: 'user', content: transcriptionText },
        { role: 'assistant', content: responseText },
      ]);

      // Play audio response
      const responseAudioBlob = await response.blob();
      await playAudio(responseAudioBlob);

    } catch (error) {
      console.error('Error processing speech:', error);
      alert('Error processing your speech. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = (audioBlob: Blob): Promise<void> => {
    return new Promise((resolve, reject) => {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      setIsSpeaking(true);

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        resolve();
      };

      audio.onerror = (error) => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        reject(error);
      };

      audio.play().catch(reject);
    });
  };

  const toggleAutoListening = () => {
    isAutoListeningRef.current = !isAutoListeningRef.current;
    
    if (isAutoListeningRef.current && !isListening && !isProcessing && !isSpeaking) {
      startListening();
    } else if (!isAutoListeningRef.current && isListening) {
      stopListening();
    }
  };

  const manualStartListening = () => {
    if (!isListening && !isProcessing && !isSpeaking) {
      startListening();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            🎙️ Voice Chat Assistant
          </h1>
          <Link href="/" className="text-blue-600 hover:underline">
            ← Home
          </Link>
        </div>

        {/* Status Indicators */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-300'
                  }`}
                ></div>
                <span className="text-sm font-medium">
                  {isListening ? 'Listening...' : 'Not Listening'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isProcessing ? 'bg-yellow-500 animate-pulse' : 'bg-gray-300'
                  }`}
                ></div>
                <span className="text-sm font-medium">
                  {isProcessing ? 'Processing...' : 'Ready'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                  }`}
                ></div>
                <span className="text-sm font-medium">
                  {isSpeaking ? 'Speaking...' : 'Silent'}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={toggleAutoListening}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isAutoListeningRef.current
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
              >
                {isAutoListeningRef.current ? '🔊 Auto-Listen ON' : '🔇 Auto-Listen OFF'}
              </button>

              {!isAutoListeningRef.current && (
                <button
                  onClick={manualStartListening}
                  disabled={isListening || isProcessing || isSpeaking}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🎤 Start Listening
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 h-[500px] overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <p className="text-lg mb-2">👋 Start speaking!</p>
                <p className="text-sm">The assistant is listening and will respond automatically</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg p-4 ${
                      message.sender === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    <p className="text-sm mb-1">{message.text}</p>
                    <span className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}