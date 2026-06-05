import { Download, Calendar, Trash2, X } from "lucide-react";

interface BulkActionBarProps {
  selectedCount: number;
  onCancel: () => void;
  onDelete: () => void;
}

export default function BulkActionBar({ selectedCount, onCancel, onDelete }: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
      <div className="bg-[#18181b] border border-[#27272a] shadow-2xl rounded-2xl p-2 flex items-center gap-4">
        
        <div className="px-4 py-2 bg-[#534AB7]/20 rounded-xl">
          <span className="text-[#a855f7] font-bold font-af text-sm">{selectedCount} clips selected</span>
        </div>

        <div className="flex items-center gap-2 border-l border-[#27272a] pl-4">
          <button className="flex items-center gap-2 px-4 py-2 hover:bg-[#27272a] rounded-xl text-zinc-300 text-sm font-bold font-af transition-colors">
            <Download className="w-4 h-4" /> Download ZIP
          </button>
          <button className="flex items-center gap-2 px-4 py-2 hover:bg-[#27272a] rounded-xl text-zinc-300 text-sm font-bold font-af transition-colors">
            <Calendar className="w-4 h-4" /> Schedule All
          </button>
          <button 
            onClick={onDelete}
            className="flex items-center gap-2 px-4 py-2 hover:bg-red-500/20 hover:text-red-400 rounded-xl text-zinc-400 text-sm font-bold font-af transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>

        <div className="border-l border-[#27272a] pl-2 ml-2">
          <button 
            onClick={onCancel}
            className="p-2 hover:bg-[#27272a] rounded-xl text-zinc-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
}
