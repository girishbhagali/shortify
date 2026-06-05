import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  X, Play, Download, Edit2, Calendar, Copy, Hash, Text, Sparkles, 
  Trash2, RotateCw, RefreshCcw, AlignLeft, Scissors
} from "lucide-react";
import { LibraryClip } from "./mockData";
import { UseDashboardType } from "../../hooks/useDashboard";
import { getBackendUrl } from "@/lib/api";

interface ClipDetailPanelProps {
  clip: LibraryClip | null;
  onClose: () => void;
  hook: UseDashboardType;
}

export default function ClipDetailPanel({ clip, onClose, hook }: ClipDetailPanelProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"transcript" | "ai" | "captions" | "trim">("transcript");

  // Mock transcript data
  const transcript = [
    { time: "0:01", text: "This is exactly why you need to optimize your setup." },
    { time: "0:05", text: "When I first started, everything was a mess." },
    { time: "0:09", text: "Cables everywhere, terrible lighting." },
    { time: "0:14", text: "But then I discovered this one simple trick." },
    { time: "0:19", text: "And it completely changed how my videos look." },
    { time: "0:25", text: "Hit the link in my bio to see the full gear list!" }
  ];

  // Mock AI Suggestions
  const aiTitles = [
    "You NEED to try this setup trick 🤯",
    "The secret to perfect video lighting 💡",
    "Stop making this rookie studio mistake 🛑",
    "My 2026 desk setup transformation 🚀",
    "How I fixed my terrible video quality 📸"
  ];
  
  const hashtags = ["#SetupTour", "#TechTok", "#ContentCreator", "#DeskSetup", "#VideoTips", "#LightingHack", "#StudioMakeover"];

  if (!clip) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 h-screen w-full md:w-[450px] bg-white dark:bg-[#121217] border-l border-cool-gray dark:border-zinc-800 shadow-2xl z-50 flex flex-col font-af"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cool-gray dark:border-zinc-800 shrink-0 bg-white dark:bg-[#1A1A24]">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-lg font-bold text-pitch-black dark:text-zinc-200 truncate">{clip.title}</h2>
            <p className="text-xs text-slate-gray dark:text-zinc-500 truncate">From: {clip.source}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-gray dark:text-zinc-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Video Preview Area */}
          <div className="relative aspect-[9/16] w-full max-h-[40vh] bg-black flex items-center justify-center shrink-0">
            {clip.thumbnail ? (
              <img src={clip.thumbnail} alt={clip.title} className="h-full object-cover opacity-60" />
            ) : (
              <div className="text-white/40 text-xs font-bold text-center">NO PREVIEW</div>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <button className="w-14 h-14 rounded-full bg-[#534AB7]/80 backdrop-blur-md flex items-center justify-center border border-white/20 hover:scale-110 transition-transform">
                <Play className="w-6 h-6 text-white ml-1" />
              </button>
            </div>
            
            {/* Custom Mini Controls overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
              <button className="p-1.5 rounded-md bg-black/50 text-white backdrop-blur text-[10px] font-bold">
                Loop: ON
              </button>
              <div className="flex-1 h-1.5 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-[#534AB7] rounded-full"></div>
              </div>
              <span className="text-white text-[10px] font-bold drop-shadow-md">0:12 / 0:{clip.duration}</span>
            </div>
          </div>

          {/* Action Strip */}
          <div className="flex items-center justify-between p-4 border-b border-cool-gray dark:border-zinc-800 bg-zinc-50 dark:bg-[#1A1A24]">
            <button className="flex flex-col items-center gap-1 group">
              <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-cool-gray dark:border-zinc-700 group-hover:border-[#534AB7] transition-colors shadow-sm">
                <Download className="w-4 h-4 text-[#534AB7]" />
              </div>
              <span className="text-[10px] font-bold text-slate-gray dark:text-zinc-400">Save</span>
            </button>
            <button 
              onClick={() => {
                const url = getBackendUrl(`/api/clips/${clip.id}/stream`);
                router.push(`/editor?videoUrl=${encodeURIComponent(url)}`);
              }}
              className="flex flex-col items-center gap-1 group"
            >
              <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-cool-gray dark:border-zinc-700 group-hover:border-[#534AB7] transition-colors shadow-sm">
                <Edit2 className="w-4 h-4 text-[#534AB7]" />
              </div>
              <span className="text-[10px] font-bold text-slate-gray dark:text-zinc-400">Edit</span>
            </button>
            <button className="flex flex-col items-center gap-1 group">
              <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-cool-gray dark:border-zinc-700 group-hover:border-[#534AB7] transition-colors shadow-sm">
                <Calendar className="w-4 h-4 text-[#534AB7]" />
              </div>
              <span className="text-[10px] font-bold text-slate-gray dark:text-zinc-400">Post</span>
            </button>
            <button className="flex flex-col items-center gap-1 group">
              <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-cool-gray dark:border-zinc-700 group-hover:border-[#534AB7] transition-colors shadow-sm">
                <Copy className="w-4 h-4 text-[#534AB7]" />
              </div>
              <span className="text-[10px] font-bold text-slate-gray dark:text-zinc-400">Dupe</span>
            </button>
            <button 
              onClick={() => {
                hook.deleteLibraryClips([clip.id]);
                onClose();
              }}
              className="flex flex-col items-center gap-1 group"
            >
              <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-cool-gray dark:border-zinc-700 group-hover:border-red-500 transition-colors shadow-sm">
                <Trash2 className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-[10px] font-bold text-slate-gray dark:text-zinc-400">Delete</span>
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex w-full border-b border-cool-gray dark:border-zinc-800 overflow-x-auto scrollbar-hide shrink-0">
            {[
              { id: "transcript", label: "Transcript", icon: AlignLeft },
              { id: "ai", label: "AI Tools", icon: Sparkles },
              { id: "trim", label: "Quick Trim", icon: Scissors },
              { id: "captions", label: "Captions", icon: Text }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === t.id 
                    ? "border-[#534AB7] text-[#534AB7]" 
                    : "border-transparent text-slate-gray dark:text-zinc-500 hover:text-pitch-black dark:hover:text-zinc-300"
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4 space-y-6">
            
            {activeTab === "transcript" && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm dark:text-zinc-200">Interactive Transcript</h3>
                  <button className="text-xs text-[#534AB7] font-bold hover:underline">Copy All Text</button>
                </div>
                <div className="space-y-2">
                  {transcript.map((line, i) => (
                    <div key={i} className="group flex gap-3 p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors border border-transparent hover:border-cool-gray dark:hover:border-zinc-800">
                      <span className="text-xs font-bold text-[#534AB7] bg-[#534AB7]/10 px-1.5 py-0.5 rounded h-fit shrink-0 mt-0.5">
                        {line.time}
                      </span>
                      <p className="text-sm text-pitch-black dark:text-zinc-300 leading-relaxed">
                        {line.text}
                      </p>
                      <button className="opacity-0 group-hover:opacity-100 p-1.5 bg-white dark:bg-[#1A1A24] border border-cool-gray dark:border-zinc-700 rounded-lg shrink-0 ml-auto self-start text-[10px] font-bold text-slate-gray shadow-sm transition-opacity">
                        Start clip here
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "ai" && (
              <div className="space-y-6 animate-in fade-in">
                <div>
                  <h3 className="font-bold text-sm dark:text-zinc-200 mb-3 flex items-center gap-2">
                    <Text className="w-4 h-4 text-[#534AB7]" /> Generated Titles
                  </h3>
                  <div className="space-y-2">
                    {aiTitles.map((title, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-xl border border-cool-gray dark:border-zinc-800 hover:border-[#534AB7]/50 cursor-pointer group bg-zinc-50 dark:bg-zinc-900/50">
                        <span className="text-sm dark:text-zinc-300">{title}</span>
                        <Copy className="w-3.5 h-3.5 text-slate-gray opacity-0 group-hover:opacity-100" />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm dark:text-zinc-200 mb-3 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-[#534AB7]" /> Smart Hashtags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {hashtags.map(tag => (
                      <span key={tag} className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs text-slate-gray dark:text-zinc-400 hover:bg-[#534AB7] hover:text-white cursor-pointer transition-colors">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#534AB7]/5 border border-[#534AB7]/20">
                  <h4 className="font-bold text-xs text-[#534AB7] uppercase tracking-wider mb-1">Recommendation</h4>
                  <p className="text-sm dark:text-zinc-300">
                    Post on <span className="font-bold text-[#534AB7]">TikTok</span> on <span className="font-bold">Tuesday at 7:00 PM</span> for maximum reach based on your audience.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "trim" && (
              <div className="space-y-4 animate-in fade-in">
                <p className="text-sm text-slate-gray dark:text-zinc-400">Quickly adjust the start and end points without opening the full editor.</p>
                
                <div className="mt-8 relative h-16 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-cool-gray dark:border-zinc-700">
                  {/* Timeline representation */}
                  <div className="absolute inset-0 overflow-hidden rounded-xl opacity-20">
                    {/* Mock waveform lines */}
                    <div className="flex h-full items-end gap-1 px-2 pt-4">
                      {Array.from({length: 40}).map((_, i) => (
                        <div key={i} className="w-1.5 bg-pitch-black dark:bg-white rounded-t-sm" style={{ height: `${Math.max(10, Math.random() * 100)}%` }}></div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Selection Highlight */}
                  <div className="absolute top-0 bottom-0 left-[10%] right-[30%] bg-[#534AB7]/20 border-y-2 border-[#534AB7]"></div>
                  
                  {/* Handles */}
                  <div className="absolute top-0 bottom-0 left-[10%] w-4 -ml-2 bg-[#534AB7] rounded flex items-center justify-center cursor-ew-resize shadow-md">
                    <div className="w-0.5 h-6 bg-white/50 rounded-full"></div>
                  </div>
                  <div className="absolute top-0 bottom-0 right-[30%] w-4 -mr-2 bg-[#534AB7] rounded flex items-center justify-center cursor-ew-resize shadow-md">
                    <div className="w-0.5 h-6 bg-white/50 rounded-full"></div>
                  </div>
                </div>
                
                <div className="flex justify-between text-xs font-bold text-slate-gray mt-2">
                  <span>Start: 0:02</span>
                  <span>End: 0:22</span>
                </div>

                <button className="w-full mt-4 py-2.5 bg-pitch-black dark:bg-white text-white dark:text-pitch-black rounded-xl text-sm font-bold shadow-md hover:scale-[1.02] transition-transform">
                  Apply Trim
                </button>
              </div>
            )}

            {activeTab === "captions" && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-gray dark:text-zinc-400">Click any caption text to edit directly.</p>
                  <button className="text-xs font-bold text-[#534AB7] hover:underline flex items-center gap-1">
                    <RefreshCcw className="w-3 h-3" /> Auto-Sync
                  </button>
                </div>

                <div className="space-y-3">
                  {transcript.map((line, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <span className="text-xs font-bold text-[#534AB7] bg-[#534AB7]/10 px-1.5 py-0.5 rounded shrink-0 mt-1.5">
                        {line.time}
                      </span>
                      <input 
                        type="text" 
                        defaultValue={line.text}
                        className="flex-1 bg-white dark:bg-zinc-800/50 border border-cool-gray dark:border-zinc-700 rounded-lg px-3 py-1.5 text-sm font-af text-pitch-black dark:text-zinc-200 focus:outline-none focus:border-[#534AB7] focus:ring-1 focus:ring-[#534AB7]/50 transition-all"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
