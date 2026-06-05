import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { ScheduledPost } from "./mockData";

export default function CalendarView({ posts, onOpenScheduleModal }: { posts: ScheduledPost[], onOpenScheduleModal: (date: Date) => void }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "instagram": return "bg-pink-500";
      case "tiktok": return "bg-zinc-800 dark:bg-zinc-200";
      case "youtube": return "bg-red-500";
      case "twitter": return "bg-blue-500";
      default: return "bg-purple-500";
    }
  };

  // Generate calendar cells
  const cells = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    cells.push(<div key={`empty-${i}`} className="min-h-[100px] p-2 border-r border-b border-cool-gray/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/20"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const isToday = date.toDateString() === today.toDateString();
    
    // Find posts for this day
    const dayPosts = posts.filter(p => p.date.toDateString() === date.toDateString());

    cells.push(
      <div 
        key={`day-${day}`} 
        className={`relative min-h-[100px] p-2 border-r border-b border-cool-gray/50 dark:border-zinc-800/50 group hover:bg-zinc-50 dark:hover:bg-[#1A1A24] transition-colors ${isToday ? 'bg-[#534AB7]/5 dark:bg-[#534AB7]/10' : ''}`}
      >
        <div className="flex justify-between items-start">
          <span className={`text-xs font-bold font-af w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-[#534AB7] text-white' : 'text-slate-gray dark:text-zinc-400'}`}>
            {day}
          </span>
          <button 
            onClick={() => onOpenScheduleModal(date)}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#534AB7]/20 rounded text-[#534AB7] transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        
        <div className="mt-2 flex flex-col gap-1.5">
          {dayPosts.map(post => (
            <div 
              key={post.id} 
              className="flex items-center gap-1.5 px-1.5 py-1 bg-white dark:bg-zinc-800 border border-cool-gray dark:border-zinc-700 rounded cursor-pointer hover:border-[#534AB7]/50 shadow-sm transition-all"
              title={post.title}
            >
              <div className={`w-2 h-2 rounded-full shrink-0 ${getPlatformColor(post.platform)}`} />
              <span className="text-[10px] font-bold text-pitch-black dark:text-zinc-300 truncate font-af">
                {post.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold font-af text-pitch-black dark:text-canvas-white">
          {monthNames[currentMonth]} {currentYear}
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 border border-cool-gray dark:border-zinc-700 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <ChevronLeft className="w-4 h-4 text-slate-gray dark:text-zinc-400" />
          </button>
          <button onClick={nextMonth} className="p-2 border border-cool-gray dark:border-zinc-700 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <ChevronRight className="w-4 h-4 text-slate-gray dark:text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="border-l border-t border-cool-gray/50 dark:border-zinc-800/50 rounded-xl overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-7 bg-zinc-50 dark:bg-[#121217]">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="p-3 text-center text-[10px] font-bold text-slate-gray dark:text-zinc-500 uppercase tracking-wider border-r border-b border-cool-gray/50 dark:border-zinc-800/50">
              {day}
            </div>
          ))}
        </div>
        {/* Calendar Cells */}
        <div className="grid grid-cols-7 bg-white dark:bg-[#1A1A24]">
          {cells}
        </div>
      </div>
    </div>
  );
}
