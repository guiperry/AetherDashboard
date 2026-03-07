
import React, { useState, useEffect, useRef } from 'react';
import { AgentStatus } from '../types';
import { Send, Zap, ChevronRight, Mic, MicOff, Loader2 } from 'lucide-react';

interface AgentControlProps {
  onRun: (goal: string) => void;
  status: AgentStatus;
}

const AgentControl: React.FC<AgentControlProps> = ({ onRun, status }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Speech Recognition if available
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setInput(prev => (prev + ' ' + finalTranscript).trim());
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Failed to start recognition", e);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
    if (input.trim() && status === AgentStatus.IDLE) {
      onRun(input);
      setInput('');
    }
  };

  const isBusy = status !== AgentStatus.IDLE;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${isListening ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,1)] animate-pulse' : 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,1)]'}`} />
          Mission Parameters
        </h3>
        <div className="text-[10px] font-mono text-gray-600 flex items-center gap-2 italic">
          {isListening ? 'VOICE_LINK_ACTIVE' : 'READY_FOR_SYNTHESIS'} <ChevronRight size={10} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative group">
        <div className={`absolute -inset-1 bg-gradient-to-r ${isListening ? 'from-rose-500/20 to-orange-500/20' : 'from-indigo-500/20 to-purple-500/20'} rounded-2xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none`} />
        
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isBusy ? "KIMI_REASONING_IN_PROGRESS..." : isListening ? "Listening to dictation..." : "Define autonomous objective..."}
          disabled={isBusy}
          className={`w-full bg-gray-950/80 backdrop-blur-sm border rounded-2xl py-5 pl-14 pr-16 text-sm font-medium focus:outline-none transition-all placeholder:text-gray-700 placeholder:font-mono text-gray-200 ${isListening ? 'border-rose-500/40 ring-1 ring-rose-500/10' : 'border-gray-800 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/10'}`}
        />

        {/* Voice Dictation Button */}
        <button
          type="button"
          onClick={toggleListening}
          disabled={isBusy}
          className={`absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300 ${
            isListening 
            ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20 animate-pulse' 
            : 'bg-gray-900/50 text-gray-500 hover:text-indigo-400 border border-gray-800/50'
          } ${isBusy ? 'opacity-20 cursor-not-allowed' : ''}`}
          title={isListening ? "Stop Dictation" : "Start Voice Dictation"}
        >
          {isListening ? <Mic size={18} /> : <Mic size={18} />}
        </button>

        <button
          type="submit"
          disabled={isBusy || !input.trim()}
          className={`absolute right-2.5 top-2.5 bottom-2.5 w-12 flex items-center justify-center rounded-xl transition-all duration-300 ${
            isBusy 
            ? 'bg-gray-900 text-gray-700 cursor-not-allowed border border-gray-800' 
            : input.trim() 
              ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 hover:bg-indigo-500 hover:scale-105 active:scale-95 border border-indigo-400/20' 
              : 'bg-gray-900/50 text-gray-700 border border-gray-800/50'
          }`}
        >
          {isBusy ? (
            <div className="flex gap-1 items-center">
              <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" />
            </div>
          ) : (
            <Send size={20} className={input.trim() ? 'animate-in fade-in zoom-in duration-300' : ''} />
          )}
        </button>
      </form>
      
      <div className="mt-4 flex flex-wrap gap-2">
        {['Market Intel', 'Deep Research', 'Code Synthesis', 'Logic Audit'].map((tag) => (
          <button
            key={tag}
            disabled={isBusy}
            onClick={() => setInput(prev => `${prev} ${tag}`.trim())}
            className="text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-indigo-300 transition-all border border-gray-800/50 hover:border-indigo-500/30 px-3 py-1.5 rounded-lg bg-gray-900/30 hover:bg-indigo-500/5 active:scale-95"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AgentControl;
