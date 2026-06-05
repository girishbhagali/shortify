import { FolderOpen, ArrowRight } from "lucide-react";
import { UseDashboardType } from "../../hooks/useDashboard";

export default function EmptyLibraryState({ hook }: { hook: UseDashboardType }) {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4 animate-in fade-in duration-500">
      <div className="w-24 h-24 bg-[#534AB7]/10 rounded-full flex items-center justify-center mb-6">
        <FolderOpen className="w-10 h-10 text-[#534AB7]" />
      </div>
      <h2 className="text-2xl font-ppmondwest tracking-tight text-pitch-black dark:text-canvas-white mb-2">
        No clips yet!
      </h2>
      <p className="text-sm text-slate-gray dark:text-zinc-400 font-af max-w-sm mb-8">
        Paste a YouTube URL or upload a video to generate your first set of viral shorts.
      </p>
      <button 
        onClick={() => hook.setActiveTab("create")}
        className="flex items-center gap-2 bg-[#534AB7] hover:bg-[#433B9E] text-white px-6 py-3 rounded-xl font-af text-sm font-bold shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        Create First Clip <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
