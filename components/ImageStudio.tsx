
import React, { useState, useRef, useEffect } from 'react';
import { GeminiAgentService } from '../services/gemini';
import { 
  Upload, Wand2, Download, Image as ImageIcon, Loader2, Sparkles, RefreshCcw, 
  Video, Film, MousePointer2, Settings2, Info, Lock, Play, Pause, Volume2, 
  VolumeX, Maximize, RotateCcw 
} from 'lucide-react';

type StudioMode = 'EDIT' | 'GENERATE' | 'VIDEO';

interface CustomVideoPlayerProps {
  src: string;
}

const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({ src }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<number | null>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(current);
      setProgress((current / total) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = (parseFloat(e.target.value) / 100) * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setProgress(parseFloat(e.target.value));
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      videoRef.current.muted = newMuted;
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFullscreen = () => {
    if (videoRef.current?.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  return (
    <div 
      className="relative group w-full h-full flex items-center justify-center overflow-hidden rounded-2xl"
      onMouseMove={resetControlsTimeout}
    >
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        className="max-w-full max-h-full shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-1000 cursor-pointer"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={togglePlay}
      />

      {/* Play/Pause Overlay */}
      {!isPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] cursor-pointer"
          onClick={togglePlay}
        >
          <div className="p-6 rounded-full bg-indigo-600/90 text-white shadow-2xl scale-110 animate-in zoom-in-50 duration-300">
            <Play size={40} fill="currentColor" />
          </div>
        </div>
      )}

      {/* Controls Bar */}
      <div className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex flex-col gap-4">
          {/* Seek Bar */}
          <div className="relative w-full h-1 group/seek">
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={progress}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full bg-gray-600 rounded-full appearance-none cursor-pointer accent-indigo-500"
              style={{
                background: `linear-gradient(to right, #6366f1 ${progress}%, #4b5563 ${progress}%)`
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={togglePlay} className="text-white hover:text-indigo-400 transition-colors">
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
              </button>
              
              <div className="flex items-center gap-2 group/vol">
                <button onClick={toggleMute} className="text-white hover:text-indigo-400 transition-colors">
                  {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={isMuted ? 0 : volume * 100}
                  onChange={(e) => handleVolumeChange({ ...e, target: { ...e.target, value: (parseFloat(e.target.value) / 100).toString() } } as any)}
                  className="w-0 group-hover/vol:w-20 transition-all duration-300 overflow-hidden h-1 bg-gray-600 rounded-full appearance-none cursor-pointer accent-white"
                />
              </div>

              <div className="text-[10px] font-mono text-gray-300">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={handleFullscreen} className="text-white hover:text-indigo-400 transition-colors">
                <Maximize size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid #6366f1;
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
        }
        input[type='range']::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid #6366f1;
        }
      `}</style>
    </div>
  );
};

export default function ImageStudio() {
  const [mode, setMode] = useState<StudioMode>('GENERATE');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoStatus, setVideoStatus] = useState('');
  const [aspectRatio, setAspectRatio] = useState<any>("1:1");
  const [resolution, setResolution] = useState<any>("720p");
  const [hasVeoKey, setHasVeoKey] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const agentRef = useRef<GeminiAgentService | null>(null);

  useEffect(() => {
    agentRef.current = new GeminiAgentService();
    checkVeoKey();
  }, []);

  const checkVeoKey = async () => {
    if ((window as any).aistudio?.hasSelectedApiKey) {
      const has = await (window as any).aistudio.hasSelectedApiKey();
      setHasVeoKey(has);
    } else {
      setHasVeoKey(true); // Assume true if not in AI Studio environment
    }
  };

  const openVeoKeyDialog = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      setHasVeoKey(true);
    }
  };

  const videoMessages = [
    "Spinning up cinematic neural cores...",
    "Teaching the model to perceive movement...",
    "Synthesizing temporal consistency...",
    "Interpolating frames in hyperspace...",
    "Applying kinetic textures...",
    "Finalizing cinematic output...",
    "Polishing the motion vectors...",
    "Almost there, defying physics takes time..."
  ];

  useEffect(() => {
    let msgIndex = 0;
    let interval: any;
    if (isProcessing && mode === 'VIDEO') {
      setVideoStatus(videoMessages[0]);
      interval = setInterval(() => {
        msgIndex = (msgIndex + 1) % videoMessages.length;
        setVideoStatus(videoMessages[msgIndex]);
      }, 8000);
    } else {
      setVideoStatus('');
    }
    return () => clearInterval(interval);
  }, [isProcessing, mode]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSourceImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAction = async () => {
    if (!prompt) return;
    if (mode === 'EDIT' && !sourceImage) return;

    setIsProcessing(true);
    setOutputUrl(null);
    const agent = agentRef.current!;

    try {
      if (mode === 'GENERATE') {
        const result = await agent.generateImage(prompt, aspectRatio);
        if (result) setOutputUrl(result);
      } else if (mode === 'EDIT') {
        const base64 = sourceImage!.split(',')[1];
        const mimeType = sourceImage!.split(';')[0].split(':')[1];
        const result = await agent.editImage(base64, prompt, mimeType);
        if (result) setOutputUrl(result);
      } else if (mode === 'VIDEO') {
        const result = await agent.generateVideo(prompt, { resolution, aspectRatio });
        if (result) setOutputUrl(result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const isVideo = mode === 'VIDEO';

  return (
    <div className="flex-1 flex flex-col p-8 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg">
              <Sparkles size={20} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Aether Media Lab</h2>
          </div>
          <p className="text-gray-400 text-sm">Autonomous Generative Synthesis Suite</p>
        </div>

        <div className="flex bg-gray-900/60 p-1 rounded-xl border border-gray-800">
          {[
            { id: 'GENERATE', label: 'Generate', icon: <Sparkles size={14} /> },
            { id: 'EDIT', label: 'Edit', icon: <Wand2 size={14} /> },
            { id: 'VIDEO', label: 'Video', icon: <Video size={14} /> }
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => { setMode(m.id as StudioMode); setOutputUrl(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === m.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'}`}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-8 overflow-hidden">
        {/* Left: Settings */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 space-y-6">
            
            {mode === 'VIDEO' && !hasVeoKey && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                  <Lock size={14} /> Veo Access Required
                </div>
                <p className="text-[10px] text-amber-200/70 leading-relaxed">
                  Video generation requires a paid API key with billing enabled.
                </p>
                <button 
                  onClick={openVeoKeyDialog}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-black uppercase rounded-lg transition-colors"
                >
                  Configure Billing Key
                </button>
              </div>
            )}

            {mode === 'EDIT' && (
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-4">Base Asset</label>
                {!sourceImage ? (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-video border-2 border-dashed border-gray-800 rounded-xl flex flex-col items-center justify-center gap-3 text-gray-500 hover:border-indigo-500/50 hover:text-indigo-400 transition-all group"
                  >
                    <Upload size={32} className="group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-tighter">Source Identity Required</span>
                  </button>
                ) : (
                  <div className="relative group rounded-xl overflow-hidden border border-gray-800">
                    <img src={sourceImage} className="w-full aspect-video object-cover brightness-75 group-hover:brightness-100 transition-all" alt="Source" />
                    <button 
                      onClick={() => setSourceImage(null)}
                      className="absolute top-2 right-2 p-2 bg-black/60 rounded-lg hover:bg-red-500 transition-colors"
                    >
                      <RefreshCcw size={16} />
                    </button>
                  </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              </div>
            )}

            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-4">Synthesis Prompt</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={mode === 'VIDEO' ? "Describe a cinematic sequence..." : "Describe the visual target..."}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-sm focus:outline-none focus:border-indigo-500/50 min-h-[120px] resize-none font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Aspect Ratio</label>
                <select 
                  value={aspectRatio} 
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-xs font-bold text-gray-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="1:1">1:1 Square</option>
                  <option value="16:9">16:9 Cinema</option>
                  <option value="9:16">9:16 Mobile</option>
                  {mode !== 'VIDEO' && <option value="4:3">4:3 Classic</option>}
                  {mode !== 'VIDEO' && <option value="3:4">3:4 Portrait</option>}
                </select>
              </div>
              {mode === 'VIDEO' && (
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Resolution</label>
                  <select 
                    value={resolution} 
                    onChange={(e) => setResolution(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-xs font-bold text-gray-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="720p">720p HD</option>
                    <option value="1080p">1080p Full HD</option>
                  </select>
                </div>
              )}
            </div>

            <button 
              onClick={handleAction}
              disabled={isProcessing || !prompt || (mode === 'EDIT' && !sourceImage) || (mode === 'VIDEO' && !hasVeoKey)}
              className={`w-full py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg ${isProcessing ? 'bg-gray-800 text-gray-500 cursor-wait' : isVideo ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'}`}
            >
              {isProcessing ? <Loader2 className="animate-spin" size={20} /> : isVideo ? <Film size={20} /> : <Wand2 size={20} />}
              {isProcessing ? 'Synthesizing...' : isVideo ? 'Generate Film' : mode === 'EDIT' ? 'Execute Edit' : 'Generate Asset'}
            </button>
            
            {mode === 'VIDEO' && (
              <div className="flex items-start gap-2 text-[9px] text-gray-600 font-medium bg-gray-950/40 p-3 rounded-lg border border-gray-800/50">
                <Info size={14} className="shrink-0 text-gray-500" />
                <p>Veo generation typically requires 1-3 minutes of compute time. Please do not close the Aether Core window.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Stage */}
        <div className="col-span-12 lg:col-span-8 bg-gray-900/20 border border-gray-800 rounded-3xl relative overflow-hidden flex flex-col">
          <div className="absolute top-6 left-6 z-10 flex gap-2">
             <div className="px-4 py-1.5 bg-black/60 backdrop-blur-xl rounded-full border border-gray-800 flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isProcessing ? 'bg-indigo-500 animate-ping' : outputUrl ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                <span className="text-[9px] font-black font-mono text-gray-300 tracking-[0.2em] uppercase">Stage_Output</span>
             </div>
             {isProcessing && mode === 'VIDEO' && (
               <div className="px-4 py-1.5 bg-indigo-500/10 backdrop-blur-xl rounded-full border border-indigo-500/20 flex items-center gap-2 animate-pulse">
                 <span className="text-[9px] font-black font-mono text-indigo-400 tracking-wider">{videoStatus}</span>
               </div>
             )}
          </div>

          <div className="flex-1 flex items-center justify-center p-12 bg-[#02040a]/20">
            {isProcessing ? (
              <div className="flex flex-col items-center gap-6 text-indigo-400/50 animate-pulse">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full" />
                  {mode === 'VIDEO' ? <Film size={80} className="relative" /> : <ImageIcon size={80} className="relative" />}
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs font-black uppercase tracking-[0.4em]">NEURAL_RENDER_IN_PROGRESS</span>
                  <div className="flex gap-1 mt-3">
                    <div className="w-8 h-1 bg-indigo-500/20 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 animate-[loading_2s_infinite]" style={{width: '30%'}} />
                    </div>
                  </div>
                </div>
              </div>
            ) : outputUrl ? (
              <div className="relative group max-w-full max-h-full flex items-center justify-center">
                {mode === 'VIDEO' ? (
                  <CustomVideoPlayer src={outputUrl} />
                ) : (
                  <img 
                    src={outputUrl} 
                    className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-1000" 
                    alt="Synthesis Output" 
                  />
                )}
                <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-gray-800 text-center max-w-sm">
                <div className="p-8 rounded-full bg-gray-900/40 border border-gray-800/50">
                  <Settings2 size={48} className="opacity-10" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-700">Waiting for Data Pipeline</p>
                  <p className="text-[10px] font-medium text-gray-600 leading-relaxed italic">Configure parameters on the control panel to initialize generative synthesis.</p>
                </div>
              </div>
            )}
          </div>

          {outputUrl && (
            <div className="p-6 bg-gray-950/60 backdrop-blur-md border-t border-gray-800/50 flex justify-between items-center">
               <div className="flex items-center gap-4">
                 <div className="flex flex-col">
                   <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Synthesis Engine</span>
                   <span className="text-[11px] font-bold text-indigo-400">{mode === 'VIDEO' ? 'Veo 3.1 Fast' : 'Gemini 2.5 Image'}</span>
                 </div>
                 <div className="w-px h-8 bg-gray-800" />
                 <div className="flex flex-col">
                   <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Dimensions</span>
                   <span className="text-[11px] font-bold text-gray-400">{aspectRatio} {mode === 'VIDEO' && `(${resolution})`}</span>
                 </div>
               </div>
               
               <div className="flex gap-3">
                 <button 
                  onClick={() => { setOutputUrl(null); setPrompt(''); }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-400 rounded-xl text-xs font-black uppercase transition-all border border-gray-800"
                 >
                   <RefreshCcw size={14} /> Reset
                 </button>
                 <a 
                  href={outputUrl} 
                  download={mode === 'VIDEO' ? 'aether-gen-video.mp4' : 'aether-gen-image.png'}
                  className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase transition-all shadow-lg shadow-indigo-500/20"
                 >
                   <Download size={14} /> Download Final
                 </a>
               </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}
