
import React from 'react';
import { AgentStatus, AppView } from '../types';
import { LayoutDashboard, History, Settings, Layers, HelpCircle, ShieldCheck, Radio, Sparkles, Award } from 'lucide-react';

interface SidebarProps {
  status: AgentStatus;
  memoriesCount: number;
  currentView: AppView;
  onSetView: (view: AppView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ status, memoriesCount, currentView, onSetView }) => {
  const navItems = [
    { id: 'DASHBOARD' as AppView, icon: <LayoutDashboard size={18} />, label: 'Neural Desktop' },
    { id: 'BADGE_LAB' as AppView, icon: <Award size={18} />, label: 'Badge Lab' },
    { id: 'IMAGE_STUDIO' as AppView, icon: <Sparkles size={18} />, label: 'Media Lab' },
    { id: 'MEMORIES' as AppView, icon: <Layers size={18} />, label: 'Archive', badge: memoriesCount },
    { id: 'SAFETY' as AppView, icon: <ShieldCheck size={18} />, label: 'Protocols' },
  ];

  return (
     <aside className="w-64 h-full bg-[#05060a] border-r border-gray-800 flex flex-col z-50 overflow-hidden">
      <div className="p-8 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00c0fa] to-[#2b56f5] flex items-center justify-center font-black text-white text-xl shadow-lg shadow-[#00c0fa]/20 bevel-dark-blue-light">
          K
        </div>
        <div className="flex flex-col">
          <span className="font-black text-sm tracking-widest text-white uppercase">Knirv Server</span>
          <span className="text-[10px] text-gray-600 font-mono tracking-tighter">COGNITIVE_ENGINE</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 mt-4">
        <div className="px-4 mb-4">
          <span className="text-[9px] font-black text-gray-700 uppercase tracking-[0.2em]">Environment</span>
        </div>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSetView(item.id)}
            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 group ${
              currentView === item.id
              ? 'bg-indigo-500/10 text-white border border-indigo-500/20 shadow-[inset_0_0_12px_rgba(99,102,241,0.05)]' 
              : 'text-gray-500 hover:bg-gray-900/50 hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`transition-transform group-hover:scale-110 duration-300 ${currentView === item.id ? 'text-indigo-400' : ''}`}>
                {item.icon}
              </span>
              <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
            </div>
            {item.badge !== undefined && (
              <span className="px-1.5 py-0.5 rounded-lg bg-gray-900 text-[10px] text-gray-500 border border-gray-800">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

       <div className="p-6 mt-auto">
        <div className="bevel-dark-blue rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Autonomous Core</p>
          </div>
          <div className="space-y-2">
             <div className="flex justify-between text-[8px] font-mono text-gray-600 uppercase">
               <span>Cognition</span>
               <span>92%</span>
             </div>
             <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 w-[92%] rounded-full" />
             </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
