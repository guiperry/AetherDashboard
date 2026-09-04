
import React, { useEffect, useRef } from 'react';
import { Thought } from '../types';
import { CheckCircle, AlertCircle, Search, Compass, Loader2, Zap } from 'lucide-react';

interface ThoughtProcessProps {
  thoughts: Thought[];
}

const ThoughtProcess: React.FC<ThoughtProcessProps> = ({ thoughts }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [thoughts]);

  const getTypeIcon = (type: Thought['type']) => {
    switch (type) {
      case 'plan': return <Compass size={14} className="text-blue-400" />;
      case 'observation': return <Search size={14} className="text-amber-400" />;
      case 'conclusion': return <CheckCircle size={14} className="text-emerald-400" />;
      case 'error': return <AlertCircle size={14} className="text-rose-400" />;
    }
  };

  const getTypeStyles = (type: Thought['type']) => {
    switch (type) {
      case 'plan': return 'border-blue-500/20 bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.05)]';
      case 'observation': return 'border-amber-500/20 bg-amber-500/5 shadow-[0_0_15px_rgba(245,158,11,0.05)]';
      case 'conclusion': return 'border-emerald-500/20 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.05)]';
      case 'error': return 'border-rose-500/20 bg-rose-500/5 shadow-[0_0_15px_rgba(244,63,94,0.05)]';
    }
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-sm custom-scrollbar scroll-smooth"
    >
      {thoughts.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-gray-700 space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full" />
            <Loader2 className="animate-spin text-indigo-500 relative" size={32} />
          </div>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] opacity-40">Aether Standby</p>
            <p className="text-[10px] opacity-30 mt-1">Awaiting Heuristic Trigger</p>
          </div>
        </div>
      )}
      
       {thoughts.map((thought, idx) => (
        <div 
          key={thought.id}
          className={`group relative p-4 rounded-2xl bevel-dark-blue-light transition-all animate-in fade-in slide-in-from-top-4 duration-500 ${getTypeStyles(thought.type)}`}
          style={{ animationDelay: `${idx * 50}ms` }}
        >
          <div className="flex items-start gap-4">
            <div className="mt-1 p-1.5 rounded-lg bg-gray-950/50 border border-white/5">
              {getTypeIcon(thought.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-black tracking-widest text-white/40">
                    Phase::{thought.type}
                  </span>
                  {idx === 0 && <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />}
                </div>
                <span className="text-[10px] font-mono opacity-30">
                  {/* Fixed: fractionalSecondDigits is an ES2020 feature, using type assertion to satisfy TypeScript */}
                  {new Date(thought.timestamp).toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 3 } as any)}
                </span>
              </div>
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap font-medium">
                {thought.content}
              </p>
            </div>
          </div>
          
          {/* Subtle line decoration */}
          <div className="absolute left-[-1.5rem] top-1/2 w-4 h-px bg-gray-800 hidden lg:block" />
        </div>
      ))}
    </div>
  );
};

export default ThoughtProcess;
