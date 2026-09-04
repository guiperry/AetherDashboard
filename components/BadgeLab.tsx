import React, { useState, useRef, useEffect } from 'react';
import { GeminiAgentService } from '../services/gemini';
import { 
  Upload, Wand2, Download, Image as ImageIcon, Loader2, Sparkles, RefreshCcw, 
  Settings2, Info, Shield, Star, Award, Crown 
} from 'lucide-react';

export default function BadgeLab() {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [selectedOntology, setSelectedOntology] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const agentRef = useRef<GeminiAgentService | null>(null);

  const values = [
    "Guidelines",
    "Customs",
    "Etiquette",
    "Mission Statement",
    "Stated Values",
    "Goals & Objectives",
    "Insights"
  ];

  const ontology = [
    "Trade Secrets",
    "Business Logic",
    "User Data",
    "Rules",
    "Regulations",
    "Procedures",
    "Policies",
    "FAQs",
    "Customer Service Bullets"
  ];

  useEffect(() => {
    agentRef.current = new GeminiAgentService();
  }, []);

  const toggleValue = (value: string) => {
    setSelectedValues(prev => 
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const toggleOntology = (item: string) => {
    setSelectedOntology(prev => 
      prev.includes(item) ? prev.filter(v => v !== item) : [...prev, item]
    );
  };

  const handleGenerateBadge = async () => {
    if (!prompt) return;

    setIsProcessing(true);
    setOutputUrl(null);
    const agent = agentRef.current!;

    try {
      const badgePrompt = `Create a professional NFT badge design with the following specifications:
      
      Core Message: ${prompt}
      
      Badge Values (Include at least 3 elements visually):
      ${selectedValues.length > 0 ? selectedValues.join(', ') : 'General excellence and achievement'}
      
      Ontology Elements (Visual symbolism for):
      ${selectedOntology.length > 0 ? selectedOntology.join(', ') : 'Professionalism and trust'}
      
      Design Requirements:
      - Clean, modern aesthetic
      - Professional color palette (avoid overly bright or clashing colors)
      - Clear visual hierarchy
      - Symbolic representations of the selected values and ontology
      - High resolution suitable for NFT minting
      - Square aspect ratio (1:1)
      - Include subtle blockchain/NFT design elements
      - Professional typography
      
      The badge should convey credibility, authority, and achievement.`;

      const result = await agent.generateImage(badgePrompt, "1:1");
      if (result) setOutputUrl(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-8 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg">
              <Award size={20} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Badge Lab</h2>
          </div>
          <p className="text-gray-400 text-sm">Professional NFT Badge Designer</p>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-8 overflow-hidden">
        {/* Left: Controls */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bevel-dark-blue rounded-2xl p-6 space-y-6">
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-4">
                Badge Purpose
              </label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what this badge represents... (e.g., 'Certified Blockchain Professional', 'Excellent Customer Service Award')"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-sm focus:outline-none focus:border-amber-500/50 min-h-[120px] resize-none font-medium"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-4">
                Values to Emphasize <span className="text-amber-400">(Select 3-5 for best results)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {values.map((value) => (
                  <button
                    key={value}
                    onClick={() => toggleValue(value)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                      selectedValues.includes(value)
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                        : 'bg-gray-950 border-gray-800 text-gray-500 hover:bg-gray-800 hover:text-gray-300'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-4">
                Ontology Elements <span className="text-amber-400">(Select relevant symbolism)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ontology.map((item) => (
                  <button
                    key={item}
                    onClick={() => toggleOntology(item)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                      selectedOntology.includes(item)
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                        : 'bg-gray-950 border-gray-800 text-gray-500 hover:bg-gray-800 hover:text-gray-300'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleGenerateBadge}
              disabled={isProcessing || !prompt}
              className={`w-full py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg ${
                isProcessing 
                  ? 'bg-gray-800 text-gray-500 cursor-wait' 
                  : 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20'
              }`}
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Wand2 size={20} />
              )}
              {isProcessing ? 'Designing Badge...' : 'Generate Badge'}
            </button>

            <div className="flex items-start gap-2 text-[9px] text-gray-600 font-medium bg-gray-950/40 p-3 rounded-lg border border-gray-800/50">
              <Info size={14} className="shrink-0 text-gray-500" />
              <p>
                Badge generation creates professional designs suitable for NFT minting. 
                Selected values and ontology elements will be visually incorporated 
                through symbolic design elements.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Stage */}
        <div className="col-span-12 lg:col-span-8 bevel-dark-blue relative overflow-hidden flex flex-col">
          <div className="absolute top-6 left-6 z-10 flex gap-2">
            <div className="px-4 py-1.5 bg-black/60 backdrop-blur-xl rounded-full border border-gray-800 flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${
                isProcessing ? 'bg-amber-500 animate-ping' : outputUrl ? 'bg-emerald-500' : 'bg-gray-600'
              }`} />
              <span className="text-[9px] font-black font-mono text-gray-300 tracking-[0.2em] uppercase">
                Badge_Design
              </span>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-12 bg-[#02040a]/20">
            {isProcessing ? (
              <div className="flex flex-col items-center gap-6 text-amber-400/50 animate-pulse">
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-500/10 blur-3xl rounded-full" />
                  <Award size={80} className="relative" />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs font-black uppercase tracking-[0.4em]">Designing_Badge</span>
                  <div className="flex gap-1 mt-3">
                    <div className="w-8 h-1 bg-amber-500/20 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 animate-[loading_2s_infinite]" style={{width: '30%'}} />
                    </div>
                  </div>
                </div>
              </div>
            ) : outputUrl ? (
              <div className="relative group max-w-full max-h-full flex items-center justify-center">
                <img 
                  src={outputUrl} 
                  className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-1000" 
                  alt="Badge Design" 
                />
                <div className="absolute inset-0 bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-gray-800 text-center max-w-sm">
                <div className="p-8 rounded-full bg-gray-900/40 border border-gray-800/50">
                  <Settings2 size={48} className="opacity-10" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-700">
                    Badge Design Studio
                  </p>
                  <p className="text-[10px] font-medium text-gray-600 leading-relaxed italic">
                    Configure your badge specifications and click "Generate Badge" to create a professional 
                    NFT badge design.
                  </p>
                </div>
              </div>
            )}
          </div>

          {outputUrl && (
            <div className="p-6 bg-gray-950/60 backdrop-blur-md border-t border-gray-800/50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                    Badge Elements
                  </span>
                  <span className="text-[11px] font-bold text-amber-400">
                    {selectedValues.length} Values • {selectedOntology.length} Ontology Items
                  </span>
                </div>
                <div className="w-px h-8 bg-gray-800" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                    Dimensions
                  </span>
                  <span className="text-[11px] font-bold text-gray-400">1:1 Square (NFT Ready)</span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => { setOutputUrl(null); setPrompt(''); setSelectedValues([]); setSelectedOntology([]); }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-400 rounded-xl text-xs font-black uppercase transition-all border border-gray-800"
                >
                  <RefreshCcw size={14} /> Reset
                </button>
                <a 
                  href={outputUrl} 
                  download="badge-design.png"
                  className="flex items-center gap-2 px-8 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black uppercase transition-all shadow-lg shadow-amber-500/20"
                >
                  <Download size={14} /> Download Badge
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
