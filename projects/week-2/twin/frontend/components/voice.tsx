"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bot, RefreshCcw, MessageCircle, Mic, MicOff, AlertCircle, Quote } from 'lucide-react';
import Link from 'next/link';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function VoiceAssistant() {
    const [status, setStatus] = useState<string>('Disconnected');
    const [error, setError] = useState<string | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const dcRef = useRef<RTCDataChannel | null>(null);
    const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
    const [streamingAiText, setStreamingAiText] = useState("");
    const isLive = status === 'Live';
    const isConnecting = status === 'Connecting...';
    const [transcriptEnabled, setTranscriptEnabled] = useState(false);
    // --- SCROLLING REFS ---
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        return () => stopSession();
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth' // Smooth sliding effect
            });
        }
    }, [streamingAiText, messages]);

    const stopSession = () => {
        if (pcRef.current) {
            // Correct way to stop the mic tracks from the PeerConnection
            pcRef.current.getSenders().forEach(sender => {
                if (sender.track) sender.track.stop();
            });

            pcRef.current.close();
            pcRef.current = null;
        }
        if (dcRef.current) {
            dcRef.current.close();
            dcRef.current = null;
        }
        setStreamingAiText("");
        setMessages([]);
        setStatus('Disconnected');
    };

    const startSession = async () => {
        try {
            setStatus('Connecting...');
            setError(null);

            const response = await fetch('http://localhost:8000/session');
            const data = await response.json();

            if (!data.client_secret?.value) throw new Error("Backend error: No secret received");

            const pc = new RTCPeerConnection();
            pcRef.current = pc;

            const audioEl = document.createElement("audio");
            audioEl.autoplay = true;
            pc.ontrack = (e) => (audioEl.srcObject = e.streams[0]);

            const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
            ms.getTracks().forEach(track => pc.addTrack(track, ms));

            // --- DATA CHANNEL (The Fix for Stability) ---
            const dc = pc.createDataChannel("oai-events");
            dcRef.current = dc;

            dc.onopen = () => {
                console.log("Data channel connected");
                // Optional: Send an initial setup event if needed
            };

            dc.onmessage = (e) => {
                const event = JSON.parse(e.data);

                // USER MESSAGE: When the user finishes speaking, push to array
                if (event.type === 'conversation.item.input_audio_transcription.completed') {
                    setMessages(prev => [...prev, { role: 'user', text: event.transcript }]);
                }

                // AI DELTA: Update the temporary streaming state
                if (event.type === 'response.audio_transcript.delta') {
                    setStreamingAiText(prev => prev + event.delta);
                }

                // AI DONE: Push the completed AI response to the array and clear the stream
                if (event.type === 'response.audio_transcript.done') {
                    setMessages(prev => [...prev, { role: 'assistant', text: event.transcript }]);
                    setStreamingAiText("");
                }

                if (event.type === "error") setError(event.error.message);
            };

            // Handle connection state changes for debugging
            pc.onconnectionstatechange = () => {
                console.log("Connection State:", pc.connectionState);
                if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                    stopSession();
                    setError("Connection lost. Please try again.");
                }
            };

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            const sdpResponse = await fetch(`https://api.openai.com/v1/realtime?model=gpt-realtime`, {
                method: "POST",
                body: offer.sdp,
                headers: {
                    Authorization: `Bearer ${data.client_secret.value}`,
                    "Content-Type": "application/sdp",
                },
            });

            await pc.setRemoteDescription({ type: "answer", sdp: await sdpResponse.text() });
            setStatus('Live');

        } catch (err: any) {
            setError(err.message);
            setStatus('Error');
        }
    };

    // Toggle function for the Mic icon
    const handleMicClick = () => {
        if (isLive) {
            stopSession();
        } else if (!isConnecting) {
            startSession();
        }
    };

    return (
        <div className="flex flex-col h-full v-full bg-gray-40 shadow-lg">

            {/* --- Header --- */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-4 flex justify-between items-center shadow-md">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${isLive ? 'bg-green-500 animate-pulse' : 'bg-slate-700'}`}>
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        Digital Twin
                    </h2>
                    <div className="flex items-center p-2 gap-4 mt-1">
                        <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{status}</p>
                    </div>
                </div>

                <Link href="/">
                    <button className="p-2.5 bg-slate-700/50 hover:bg-slate-700 rounded-full transition-all border border-slate-600 cursor-pointer">
                        <MessageCircle className="w-5 h-5 text-slate-200" />
                    </button>
                </Link>
            </div>

            {/* --- Main Visualizer/Mic Section --- */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 gap-12 relative overflow-hidden">

                {/* Background Decorative Rings (Visible when Live) */}
                {isLive && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="absolute w-64 h-64 bg-blue-500/10 rounded-full animate-ping" />
                        <div className="absolute w-48 h-48 bg-blue-600/5 rounded-full animate-[pulse_3s_infinite]" />
                    </div>
                )}

                {/* Transcript Enable Button */}
                <button
                    onClick={() => {
                        transcriptEnabled ? setTranscriptEnabled(false) : setTranscriptEnabled(true);
                    }}
                    className={`absolute top-2 p-2 rounded-full transition-all border cursor-pointer
                        ${transcriptEnabled ? 'right-80 bg-blue-600 border-blue-500 shadow-lg' : 'right-4 bg-slate-800 border-slate-700 hover:bg-slate-700 shadow-md'}
                    `}
                >
                    <Quote className="w-5 h-5 text-white" />
                </button>

                {/* Central Interactive Mic */}
                <button
                    onClick={handleMicClick}
                    disabled={isConnecting}
                    className={`group relative flex items-center justify-center p-12 rounded-full transition-all duration-500 
                        ${isLive
                            ? 'bg-blue-600 shadow-[0_0_50px_rgba(37,99,235,0.6)] scale-110'
                            : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 shadow-xl active:scale-90'
                        } ${isConnecting ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                >
                    {isConnecting ? (
                        <RefreshCcw className="w-16 h-16 text-blue-400 animate-spin" />
                    ) : isLive ? (
                        <Mic className="w-14 h-14 text-white transition-transform group-hover:scale-110" />
                    ) : (
                        <MicOff className="w-14 h-14 text-slate-500 transition-transform group-hover:scale-110" />
                    )}
                </button>

                {/* Instruction Labels */}
                <div className="text-center z-10 transition-all duration-700">
                    <h3 className={`text-2xl font-bold mb-2 transition-colors ${isLive ? 'text-blue-400' : 'text-slate-400'}`}>
                        {isLive ? "I'm Listening..." : "Tap to Speak"}
                    </h3>
                    <p className="text-slate-500 text-sm max-w-[200px] leading-relaxed mx-auto">
                        {isLive
                            ? "Go ahead, I'm ready to chat with you in real-time."
                            : "Establish a secure voice connection with your digital twin."}
                    </p>

                </div>

                {transcriptEnabled && (
                    <>
                        {/* Gradient Fades for Smooth Appearance */}
                        <div className="relative top-3 left-0 right-0 h-12 bg-linear-to-b from-slate-950 to-transparent z-10 pointer-events-none" />

                        <div className="flex-1 overflow-y-auto scrollbar-hide absolute right-2 top-3" ref={scrollRef}>
                            <div className="flex flex-col space-y-6"> {/* This space-y-6 creates the break lines */}

                                {messages.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                                    >
                                        {/* User Label/Style */}
                                        {msg.role === 'user' ? (
                                            <div className="text-slate-500 text-xs mb-1 mr-2 uppercase tracking-widest font-bold">You</div>
                                        ) : (
                                            <div className="text-blue-500 text-xs mb-1 ml-2 uppercase tracking-widest font-bold">AI</div>
                                        )}

                                        {/* Message Bubble */}
                                        <div className={`max-w-72 p-4 rounded-2xl leading-relaxed ${msg.role === 'user'
                                            ? 'bg-white/5 border border-white/10 text-slate-300 rounded-tr-none'
                                            : 'bg-blue-600/10 border border-blue-500/20 text-blue-500 rounded-tl-none'
                                            }`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}

                                {/* --- Active Streaming AI Message --- */}
                                {streamingAiText && (
                                    <div className="flex flex-col items-start animate-in fade-in slide-in-from-bottom-2 relative right-0">
                                        <div className="text-blue-500 text-xs mb-1 ml-2 uppercase tracking-widest font-bold font-mono">
                                            Typing...
                                        </div>
                                        <div className="max-w-72 p-4 rounded-2xl bg-blue-600/20 border border-blue-400/30 text-blue-500 rounded-tl-none">
                                            {streamingAiText}
                                        </div>
                                    </div>
                                )}
                                { !streamingAiText && messages.length == 0 && (
                                    <div className="relative top-3 ml-10 mr-10">
                                        <p className="text-slate-500 italic">Please connect to transcript</p>
                                    </div>
                                )}

                                {/* Bottom Spacer for Auto-scroll */}
                                <div className="h-4" />
                            </div>
                        </div>
                    </>
                )}

                {/* Simple Error Overlay */}
                {error && (
                    <div className="absolute bottom-10 flex items-center gap-2 p-4 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-medium line-clamp-1">{error}</span>
                    </div>
                )}
            </div>

            {/* --- Minimalist Info Footer --- */}
            <div className="p-2 text-center">
                <p className="text-[10px] text-slate-600 uppercase tracking-[0.3em] font-black">
                    Powered by GPT Realtime
                </p>
            </div>
        </div>
    );
}