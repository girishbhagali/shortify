interface LibraryFilterChipsProps {
  activeFilter: string;
  setActiveFilter: (f: string) => void;
}

export default function LibraryFilterChips({ activeFilter, setActiveFilter }: LibraryFilterChipsProps) {
  const chips = [
    "All Clips", "Ready", "Processing", "Downloaded", "Scheduled", "TikTok", "Reels", "Shorts"
  ];

  return (
    <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
      {chips.map(chip => {
        const isActive = activeFilter === chip;
        return (
          <button
            key={chip}
            onClick={() => setActiveFilter(chip)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold font-af transition-all border ${
              isActive 
                ? "bg-[#534AB7] text-white border-[#534AB7] shadow-md shadow-[#534AB7]/20" 
                : "bg-white dark:bg-[#1A1A24] text-slate-gray dark:text-zinc-400 border-cool-gray dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
            }`}
          >
            {chip === "All Clips" ? "All Clips \u00D7" : 
             chip === "Ready" ? "Ready \u2713" : 
             chip === "Processing" ? "Processing \u27F3" : chip}
          </button>
        );
      })}
    </div>
  );
}
