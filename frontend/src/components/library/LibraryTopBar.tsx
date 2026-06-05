import { Search, LayoutGrid, List, CheckSquare } from "lucide-react";

interface LibraryTopBarProps {
  totalClips: number;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sortOption: string;
  setSortOption: (opt: string) => void;
  toggleSelectAll: () => void;
  allSelected: boolean;
}

export default function LibraryTopBar({
  totalClips, viewMode, setViewMode, searchQuery, setSearchQuery, sortOption, setSortOption, toggleSelectAll, allSelected
}: LibraryTopBarProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full border-b border-cool-gray dark:border-zinc-800 pb-4">
      <div className="flex flex-col">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-ppmondwest tracking-tight text-pitch-black dark:text-canvas-white">
            My Clips
          </h1>
          <span className="bg-[#534AB7]/10 text-[#534AB7] dark:bg-[#534AB7]/20 dark:text-[#a855f7] px-2.5 py-0.5 rounded-full text-xs font-bold font-af">
            {totalClips} clips
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        {/* Search */}
        <div className="relative flex-1 md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-gray" />
          <input 
            type="text" 
            placeholder="Search by title, transcript..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-[#1A1A24] border border-cool-gray dark:border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-sm font-af focus:outline-none focus:border-[#534AB7] text-pitch-black dark:text-zinc-200 shadow-sm transition-all"
          />
        </div>

        {/* Sort Dropdown */}
        <select 
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="bg-white dark:bg-[#1A1A24] border border-cool-gray dark:border-zinc-800 rounded-xl py-2 px-3 text-sm font-af text-pitch-black dark:text-zinc-300 focus:outline-none focus:border-[#534AB7] cursor-pointer shadow-sm"
        >
          <option>Newest</option>
          <option>Highest Score</option>
          <option>Longest</option>
          <option>Shortest</option>
        </select>

        {/* View Toggles */}
        <div className="flex items-center bg-white dark:bg-[#1A1A24] border border-cool-gray dark:border-zinc-800 rounded-xl p-1 shadow-sm">
          <button 
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-[#534AB7] text-white" : "text-slate-gray hover:text-pitch-black dark:hover:text-zinc-300"}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-[#534AB7] text-white" : "text-slate-gray hover:text-pitch-black dark:hover:text-zinc-300"}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Bulk Select Button */}
        <button 
          onClick={toggleSelectAll}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold font-af border transition-all ${
            allSelected 
              ? "bg-[#534AB7]/10 border-[#534AB7] text-[#534AB7]" 
              : "bg-white dark:bg-[#1A1A24] border-cool-gray dark:border-zinc-800 text-slate-gray hover:border-[#534AB7]/30"
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          Select Multiple
        </button>
      </div>
    </div>
  );
}
