
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { Mic, MicOff, Video, VideoOff, X, MessageSquare, Terminal as TerminalIcon, Save, Download, CheckCircle2 } from 'lucide-react';

interface LiveTerminalProps {
  onClose: () => void;
}

export default function LiveTerminal({ onClose }: LiveTerminalProps) {
  const [isActive, setIsActive] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [transcriptions, setTranscriptions] = useState<{role: 'user' | 'agent', text: string, timestamp: number}[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<any>(null);
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Base64 helpers
  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const startSession = async () => {
    try {
      // Fixed: Initialize GoogleGenAI with process.env.API_KEY directly as per guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      audioContextInRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: isVideoOn });
      if (videoRef.current && isVideoOn) videoRef.current.srcObject = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = audioContextInRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextInRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              if (!isMicOn) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              sessionPromise.then(s => s.sendRealtimeInput({ 
                media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } 
              }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextInRef.current!.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.outputTranscription) {
               setTranscriptions(prev => {
                 const last = prev[prev.length - 1];
                 if (last?.role === 'agent') return [...prev.slice(0, -1), { role: 'agent', text: last.text + msg.serverContent!.outputTranscription!.text, timestamp: Date.now() }];
                 return [...prev, { role: 'agent', text: msg.serverContent!.outputTranscription!.text, timestamp: Date.now() }];
               });
               setIsSaved(false);
            }
            if (msg.serverContent?.inputTranscription) {
               setTranscriptions(prev => {
                 const last = prev[prev.length - 1];
                 if (last?.role === 'user') return [...prev.slice(0, -1), { role: 'user', text: last.text + msg.serverContent!.inputTranscription!.text, timestamp: Date.now() }];
                 return [...prev, { role: 'user', text: msg.serverContent!.inputTranscription!.text, timestamp: Date.now() }];
               });
               setIsSaved(false);
            }

            const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              const ctx = audioContextOutRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: 'You are Aether, an autonomous conversational agent. Keep responses short and snappy for real-time talk.'
        }
      });

      sessionRef.current = await sessionPromise;
      setIsActive(true);
      
      // Video Frame Loop
      if (isVideoOn) {
        const interval = setInterval(() => {
          if (!videoRef.current || !canvasRef.current || !isActive) return;
          const ctx = canvasRef.current.getContext('2d');
          canvasRef.current.width = 320;
          canvasRef.current.height = 240;
          ctx?.drawImage(videoRef.current, 0, 0, 320, 240);
          canvasRef.current.toBlob(async (blob) => {
            if (blob) {
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                sessionRef.current?.sendRealtimeInput({ media: { data: base64, mimeType: 'image/jpeg' } });
              };
              reader.readAsDataURL(blob);
            }
          }, 'image/jpeg', 0.6);
        }, 1000);
        return () => clearInterval(interval);
      }

    } catch (e) {
      console.error("Live connection failed", e);
    }
  };

  const stopSession = () => {
    sessionRef.current?.close();
    audioContextInRef.current?.close();
    audioContextOutRef.current?.close();
    setIsActive(false);
  };

  const handleSaveLocal = () => {
    if (transcriptions.length === 0) return;
    const existingLogs = JSON.parse(localStorage.getItem('aether_live_logs') || '[]');
    const newEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      data: transcriptions
    };
    localStorage.setItem('aether_live_logs', JSON.stringify([newEntry, ...existingLogs]));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleDownload = () => {
    if (transcriptions.length === 0) return;
    const textContent = transcriptions.map(t => `[${new Date(t.timestamp).toLocaleTimeString()}] ${t.role.toUpperCase()}: ${t.text}`).join('\n\n');
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aether-session-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    return () => stopSession();
  }, []);

  return (
    <div className="absolute inset-0 bg-gray-950 z-50 flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
      <div className="absolute top-6 right-8 flex gap-3">
        {transcriptions.length > 0 && (
          <>
            <button 
              onClick={handleSaveLocal}
              title="Archive Session Locally"
              className={`p-3 border rounded-full transition-all flex items-center gap-2 ${isSaved ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'}`}
            >
              {isSaved ? <CheckCircle2 size={20} /> : <Save size={20} />}
              {isSaved && <span className="text-xs font-bold pr-1">Archived</span>}
            </button>
            <button 
              onClick={handleDownload}
              title="Download Transcript"
              className="p-3 bg-gray-900 border border-gray-800 rounded-full hover:bg-gray-800 transition-colors text-gray-400"
            >
              <Download size={20} />
            </button>
          </>
        )}
        <button onClick={onClose} className="p-3 bg-gray-900 border border-gray-800 rounded-full hover:bg-gray-800 transition-colors">
          <X size={24} className="text-gray-400" />
        </button>
      </div>

      <div className="w-full max-w-4xl flex flex-col items-center gap-12">
        <div className="relative">
          {/* Animated Brain/Orb */}
          <div className={`w-48 h-48 rounded-full bg-indigo-500/20 flex items-center justify-center relative transition-all duration-1000 ${isActive ? 'scale-110 shadow-[0_0_80px_rgba(99,102,241,0.3)]' : 'scale-100'}`}>
             <div className={`w-32 h-32 rounded-full border-2 border-indigo-400/30 flex items-center justify-center ${isActive ? 'animate-ping' : ''}`} />
             <div className="absolute inset-0 flex items-center justify-center">
                <TerminalIcon size={48} className={`transition-colors duration-500 ${isActive ? 'text-indigo-400' : 'text-gray-600'}`} />
             </div>
             {/* Wave Visualizers */}
             {isActive && [1, 2, 3].map(i => (
                <div key={i} className="absolute inset-0 border border-indigo-500/10 rounded-full animate-ping" style={{ animationDelay: `${i * 0.5}s` }} />
             ))}
          </div>
          
          {isVideoOn && (
            <div className="absolute -bottom-12 -right-12 w-48 h-36 bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-2xl">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale" />
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}
        </div>

        <div className="w-full max-w-2xl bg-gray-900/50 border border-gray-800 rounded-3xl p-6 h-64 flex flex-col shadow-inner">
           <div className="flex items-center gap-2 mb-4 opacity-50 text-[10px] font-bold uppercase tracking-widest border-b border-gray-800 pb-2">
             <MessageSquare size={12} /> Live Transcript
           </div>
           <div className="flex-1 overflow-y-auto space-y-4 font-mono text-sm scroll-smooth pr-2 custom-scrollbar">
             {transcriptions.length === 0 && <p className="text-center text-gray-700 mt-8 italic">Silence...</p>}
             {transcriptions.map((t, i) => (
               <div key={i} className={`flex flex-col ${t.role === 'user' ? 'items-end' : 'items-start'}`}>
                 <span className={`text-[10px] mb-1 opacity-40 uppercase`}>{t.role}</span>
                 <p className={`max-w-[80%] px-4 py-2 rounded-2xl ${t.role === 'user' ? 'bg-indigo-500/10 text-indigo-200 border border-indigo-500/20' : 'bg-gray-800 text-gray-300 border border-gray-700'}`}>
                   {t.text}
                 </p>
               </div>
             ))}
           </div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsMicOn(!isMicOn)}
            className={`p-5 rounded-full border transition-all ${isMicOn ? 'bg-gray-900 border-gray-800 text-indigo-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
          >
            {isMicOn ? <Mic size={28} /> : <MicOff size={28} />}
          </button>

          <button 
            onClick={isActive ? stopSession : startSession}
            className={`px-12 py-5 rounded-full font-bold tracking-tight transition-all text-lg shadow-xl ${isActive ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/30'}`}
          >
            {isActive ? 'Disconnect' : 'Initialize Voice Core'}
          </button>

          <button 
            onClick={() => setIsVideoOn(!isVideoOn)}
            className={`p-5 rounded-full border transition-all ${isVideoOn ? 'bg-gray-900 border-gray-800 text-emerald-400' : 'bg-gray-900 border-gray-800 text-gray-600'}`}
          >
            {isVideoOn ? <Video size={28} /> : <VideoOff size={28} />}
          </button>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/5 rounded-full border border-indigo-500/10">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-700'}`} />
          <span className="text-[10px] font-mono font-bold text-indigo-400/60 tracking-wider">
            {isActive ? 'CHANNEL_OPEN // GEMINI_2.5_NATIVE' : 'CHANNEL_CLOSED // STANDBY'}
          </span>
        </div>
      </div>
    </div>
  );
}
