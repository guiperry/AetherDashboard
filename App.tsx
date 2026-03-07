
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AgentStatus, AgentState, Thought, Memory, Task, AppView } from './types';
import { GeminiAgentService } from './services/gemini';
import { PersistenceService } from './services/persistence';
import Sidebar from './components/Sidebar';
import ThoughtProcess from './components/ThoughtProcess';
import MemoryGrid from './components/MemoryGrid';
import AgentControl from './components/AgentControl';
import LiveTerminal from './components/LiveTerminal';
import ImageStudio from './components/ImageStudio';
import { Brain, Cpu, Database, Activity, Terminal, Shield, Maximize2, Minimize2, PanelLeftClose, PanelLeft, Eye, EyeOff, RefreshCw, Key, ShieldAlert } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AgentState>(() => {
    const saved = PersistenceService.loadState();
    const memories = PersistenceService.loadMemories();
    const thoughts = PersistenceService.loadThoughts();
    
    return {
      status: AgentStatus.IDLE,
      memories: memories.length > 0 ? memories : [
        { id: 'core-1', type: 'instruction', content: 'Utilize Kimi-class autonomous reasoning for all mission objectives.', timestamp: Date.now(), importance: 1.0, isLocked: true },
        { id: 'core-2', type: 'fact', content: 'Aether Agent Core v3.2.2 initialized with secure neural link.', timestamp: Date.now(), importance: 0.8, isLocked: true }
      ],
      thoughts: thoughts.length > 0 ? thoughts : [],
      currentTask: null,
      history: [],
      view: (saved?.view as AppView) || 'DASHBOARD'
    };
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isKeyActive, setIsKeyActive] = useState(true);

  const agentRef = useRef<GeminiAgentService | null>(null);

  useEffect(() => {
    agentRef.current = new GeminiAgentService();
    checkKeyStatus();
  }, []);

  const checkKeyStatus = async () => {
    if ((window as any).aistudio?.hasSelectedApiKey) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      setIsKeyActive(hasKey);
    }
  };

  const handleKeySelection = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      setIsKeyActive(true);
      // Re-initialize agent with the new key context
      agentRef.current = new GeminiAgentService();
    }
  };

  useEffect(() => {
    PersistenceService.saveState({ view: state.view });
    PersistenceService.saveMemories(state.memories);
    PersistenceService.saveThoughts(state.thoughts);
  }, [state.view, state.memories, state.thoughts]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable fullscreen: ${e.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const addThought = useCallback((thought: Thought) => {
    setState(prev => {
      // Prevent duplicate thoughts by content
      if (prev.thoughts.some(t => t.content === thought.content)) {
        return prev;
      }
      return {
        ...prev,
        thoughts: [thought, ...prev.thoughts].slice(0, 100)
      };
    });
  }, []);

  const handleRunTask = async (goal: string) => {
    if (!agentRef.current || !goal || state.status !== AgentStatus.IDLE) return;

    const newTask: Task = {
      id: PersistenceService.generateId(goal),
      goal,
      status: 'in_progress',
      subtasks: []
    };

    setState(prev => ({ 
      ...prev, 
      currentTask: newTask,
      status: AgentStatus.THINKING
    }));

    addThought({
      id: PersistenceService.generateId(`SYNAPSE_INIT: ${goal}`),
      timestamp: Date.now(),
      content: `SYNAPSE_INIT: Orchestrating autonomous workflow for goal: "${goal}"`,
      type: 'plan'
    });

    try {
      const result = await agentRef.current.planAndExecute(
        goal,
        state.memories,
        addThought,
        (status) => setState(prev => ({ ...prev, status }))
      );

      const newMemories = await agentRef.current.generateMemoryInsight([{
        id: 'res',
        timestamp: Date.now(),
        content: result,
        type: 'conclusion'
      }, ...state.thoughts.slice(0, 3)]);

      setState(prev => ({
        ...prev,
        status: AgentStatus.IDLE,
        memories: [...newMemories, ...prev.memories].slice(0, 200),
        currentTask: prev.currentTask ? { ...prev.currentTask, status: 'completed', results: result } : null
      }));
    } catch (err: any) {
      if (err?.message?.includes('Requested entity was not found')) {
        setIsKeyActive(false);
        addThought({
          id: 'error-key',
          timestamp: Date.now(),
          content: "NEURAL_LINK_FAILURE: Project or API Key not found. Re-authentication required.",
          type: 'error'
        });
      }
    }
  };

  const handleReset = () => {
    if (confirm("Reset Aether Agent? This will wipe all persistent local memories and logs.")) {
      PersistenceService.clearAll();
    }
  };

  const setView = (view: AppView) => setState(prev => ({ ...prev, view }));

  const deleteMemory = (id: string) => {
    setState(prev => ({
      ...prev,
      memories: prev.memories.filter(m => m.id !== id || m.isLocked)
    }));
  };

  const renderContent = () => {
    switch(state.view) {
      case 'IMAGE_STUDIO':
        return <ImageStudio />;
      case 'DASHBOARD':
        return (
          <div className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden animate-in fade-in duration-700">
            <div className={`col-span-12 ${isFocusMode ? 'lg:col-span-12' : 'lg:col-span-7'} flex flex-col gap-6 overflow-hidden transition-all duration-500`}>
              <section className="flex-1 min-h-0 bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
                <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-950/40">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
                      <Terminal size={16} />
                    </div>
                    <span className="text-sm font-bold tracking-tight text-gray-200 uppercase tracking-widest text-[10px]">Neural Stream</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-gray-600">ID: PERSISTENT_LOG</span>
                  </div>
                </div>
                <ThoughtProcess thoughts={state.thoughts} />
              </section>

              <section className="h-44 bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-3xl p-6 flex flex-col justify-center shadow-lg">
                {!isKeyActive ? (
                  <div className="flex flex-col items-center justify-center gap-4 animate-in zoom-in-95">
                    <div className="flex items-center gap-2 text-rose-400 font-black uppercase text-xs tracking-widest">
                      <ShieldAlert size={16} /> Link Offline
                    </div>
                    <button 
                      onClick={handleKeySelection}
                      className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-indigo-500/20 transition-all"
                    >
                      Initialize Secure API Link
                    </button>
                    <p className="text-[10px] text-gray-600">A valid paid-tier Google Cloud project key is required for autonomous heuristic reasoning.</p>
                  </div>
                ) : (
                  <AgentControl onRun={handleRunTask} status={state.status} />
                )}
              </section>
            </div>

            {!isFocusMode && (
              <div className="col-span-12 lg:col-span-5 flex flex-col gap-6 overflow-hidden animate-in slide-in-from-right-4 duration-500">
                <section className="flex-1 min-h-0 bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
                  <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-950/40">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
                        <Database size={16} />
                      </div>
                      <span className="text-sm font-bold tracking-tight text-gray-200 uppercase tracking-widest text-[10px]">Memory Core</span>
                    </div>
                    <button onClick={handleReset} className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-600 hover:text-red-400 transition-all" title="Wipe Local Backend">
                      <RefreshCw size={14} />
                    </button>
                  </div>
                  <MemoryGrid memories={state.memories} onDelete={deleteMemory} />
                </section>

                <section className="h-44 bg-gradient-to-br from-indigo-900/20 to-purple-900/10 border border-indigo-500/20 rounded-3xl p-6 flex flex-col justify-between relative group overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-all">
                    <Brain size={120} />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Shield size={14} className="text-indigo-400" />
                      Session Indices
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-950/40 p-4 rounded-2xl border border-gray-800/50">
                        <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest mb-1">Stored Insights</p>
                        <p className="text-xl font-mono font-bold text-indigo-400 tracking-tighter">{state.memories.length}</p>
                      </div>
                      <div className="bg-gray-950/40 p-4 rounded-2xl border border-gray-800/50">
                        <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest mb-1">Key Status</p>
                        <p className={`text-xl font-mono font-bold tracking-tighter ${isKeyActive ? 'text-emerald-400' : 'text-rose-500'}`}>
                          {isKeyActive ? 'ACTIVE' : 'OFFLINE'}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>
        );
      default:
        return <div className="flex-1 flex items-center justify-center text-gray-600 font-mono text-sm">MODULE_OFFLINE</div>;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#02040a] text-gray-100 overflow-hidden font-inter selection:bg-indigo-500/30">
      {state.view === 'LIVE_TERMINAL' && (
        <LiveTerminal onClose={() => setView('DASHBOARD')} />
      )}

      <div className={`transition-all duration-500 ease-in-out h-full overflow-hidden ${isSidebarOpen ? 'w-64' : 'w-0'}`}>
        <Sidebar 
          status={state.status} 
          memoriesCount={state.memories.length} 
          currentView={state.view}
          onSetView={setView}
        />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-gray-800/50 flex items-center justify-between px-6 bg-[#02040a]/80 backdrop-blur-xl z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-white transition-all"
              title="Toggle Sidebar"
            >
              {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
            </button>
            <div className="h-6 w-px bg-gray-800" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center text-indigo-400">
                <Cpu size={18} />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-sm font-black tracking-tighter text-white uppercase tracking-widest">Aether Core</h1>
                <p className="text-[9px] text-gray-600 font-mono">v3.2.2_AUTONOMOUS</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4 mr-4">
               <button 
                onClick={handleKeySelection}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all ${isKeyActive ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400/80 hover:bg-emerald-500/10' : 'bg-rose-500/5 border-rose-500/20 text-rose-400 hover:bg-rose-500/10'}`}
               >
                 <Key size={12} />
                 {isKeyActive ? 'Key Linked' : 'Key Required'}
               </button>
            </div>

            <div className="flex items-center gap-1 bg-gray-900/50 p-1 rounded-xl border border-gray-800">
              <button 
                onClick={() => setIsFocusMode(!isFocusMode)}
                className={`p-2 rounded-lg transition-all ${isFocusMode ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-white'}`}
                title="Focus Mode"
              >
                {isFocusMode ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
              <button 
                onClick={toggleFullscreen}
                className="p-2 rounded-lg text-gray-500 hover:text-white transition-all"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col overflow-hidden">
           {renderContent()}
        </div>

        <footer className="h-8 border-t border-gray-800/30 bg-gray-950 px-6 flex items-center justify-between text-[9px] font-mono text-gray-600">
           <div className="flex items-center gap-4">
             <span className="flex items-center gap-1.5"><div className={`w-1.5 h-1.5 rounded-full ${isKeyActive ? 'bg-emerald-500' : 'bg-rose-500'}`} /> PERSISTENCE_ACTIVE</span>
             <span>TX_BUFFER: READY</span>
             <span>STORAGE: LOCAL_FS</span>
           </div>
           <div className="flex items-center gap-4">
             <span>SECURE_ENCLAVE_READY</span>
             <span className="text-indigo-500 font-bold uppercase tracking-widest">Aether_OS_STABLE</span>
           </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
