
import React from 'react';
import { Memory } from '../types';
// Fixed: Added Database to the imports from lucide-react
import { Bookmark, Lightbulb, Info, Key, Trash2, Database, Lock } from 'lucide-react';

interface MemoryGridProps {
  memories: Memory[];
  onDelete?: (id: string) => void;
}

const MemoryGrid: React.FC<MemoryGridProps> = ({ memories, onDelete }) => {
  const getIcon = (type: Memory['type']) => {
    switch (type) {
      case 'fact': return <Info size={14} />;
      case 'instruction': return <Key size={14} />;
      case 'observation': return <Bookmark size={14} />;
      case 'insight': return <Lightbulb size={14} />;
    }
  };

  const getColor = (type: Memory['type']) => {
    switch (type) {
      case 'fact': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'instruction': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      case 'observation': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'insight': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  if (memories.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 opacity-20">
         <Database size={48} className="mb-4" />
         <p className="text-sm font-mono tracking-tighter uppercase">Knowledge database empty</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
      {memories.map((memory, idx) => (
        <div 
          key={memory.id}
          className="group relative p-4 rounded-2xl bg-gray-900/20 border border-gray-800/60 hover:border-indigo-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5 animate-in slide-in-from-right-4 duration-500"
          style={{ animationDelay: `${idx * 100}ms` }}
        >
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-xl border ${getColor(memory.type)} shrink-0 transition-transform group-hover:scale-110 duration-300`}>
              {getIcon(memory.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                  {memory.type}
                </span>
                <span className="text-[10px] font-mono text-gray-600">
                  {new Date(memory.timestamp).toLocaleTimeString([], { hour12: false })}
                </span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed font-medium">
                {memory.content}
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500/60" 
                    style={{ width: `${memory.importance * 100}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono text-gray-600 uppercase tracking-tighter">Priority_{Math.round(memory.importance * 100)}</span>
              </div>
            </div>
          </div>
          {!memory.isLocked && onDelete && (
            <button 
              onClick={() => onDelete(memory.id)}
              className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
            >
               <Trash2 size={12} />
            </button>
          )}
          {memory.isLocked && (
            <div className="absolute top-2 right-2 p-1.5 text-indigo-500/40">
              <Lock size={12} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MemoryGrid;
