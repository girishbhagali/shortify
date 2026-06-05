import { Calendar as CalendarIcon, List, Plus, Link2 } from "lucide-react";

interface SchedulerTopBarProps {
  viewMode: "calendar" | "list";
  setViewMode: (mode: "calendar" | "list") => void;
  onScheduleNew: () => void;
}

export default function SchedulerTopBar({ viewMode, setViewMode, onScheduleNew }: SchedulerTopBarProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
      <h1 className="text-3xl font-ppmondwest tracking-tight text-pitch-black dark:text-canvas-white">
        Content Scheduler
      </h1>

      <div className="flex flex-wrap items-center gap-3">
        <button className="flex items-center gap-2 bg-white dark:bg-[#1A1A24] border border-cool-gray dark:border-zinc-800 hover:border-[#534AB7]/50 text-slate-gray dark:text-zinc-300 px-4 py-2 rounded-xl font-af text-sm font-bold shadow-sm transition-all">
          <Link2 className="w-4 h-4" /> Connect Accounts
        </button>
        
        <button 
          onClick={onScheduleNew}
          className="flex items-center gap-2 bg-[#534AB7] hover:bg-[#433B9E] text-white px-5 py-2 rounded-xl font-af text-sm font-bold shadow-md transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" /> Schedule New Post
        </button>

        <div className="flex items-center bg-white dark:bg-[#1A1A24] border border-cool-gray dark:border-zinc-800 rounded-xl p-1 shadow-sm ml-2">
          <button 
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold font-af transition-colors ${viewMode === "calendar" ? "bg-[#534AB7] text-white" : "text-slate-gray hover:text-pitch-black dark:hover:text-zinc-300"}`}
          >
            <CalendarIcon className="w-4 h-4" /> Calendar
          </button>
          <button 
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold font-af transition-colors ${viewMode === "list" ? "bg-[#534AB7] text-white" : "text-slate-gray hover:text-pitch-black dark:hover:text-zinc-300"}`}
          >
            <List className="w-4 h-4" /> List
          </button>
        </div>
      </div>
    </div>
  );
}
