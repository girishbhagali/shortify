"use client";

import { motion } from "framer-motion";
import { 
  Play, 
  Scissors, 
  Download, 
  Flame, 
  Video, 
  Calendar,
  CheckCircle2,
  TrendingUp,
  Clock,
  ArrowRight,
  Plus
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";
import { UseDashboardType } from "../../hooks/useDashboard";
import RecentClips from "./RecentClips"; // Will reuse this for top performing clips visually

interface DashboardHomePanelProps {
  hook: UseDashboardType;
}

export default function DashboardHomePanel({ hook }: DashboardHomePanelProps) {
  const { setActiveTab } = hook;
  
  const currentHour = new Date().getHours();
  let greeting = "Good evening";
  if (currentHour < 12) greeting = "Good morning";
  else if (currentHour < 18) greeting = "Good afternoon";

  // Mock data for the Activity Feed
  const activities = [
    { id: 1, action: "Generated 5 clips from MrBeast video", time: "2h ago", icon: Scissors, color: "text-[#534AB7]", bg: "bg-[#534AB7]/10" },
    { id: 2, action: "Downloaded clip_3.mp4", time: "5h ago", icon: Download, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { id: 3, action: "Scheduled post to TikTok", time: "Yesterday", icon: Calendar, color: "text-blue-500", bg: "bg-blue-500/10" },
    { id: 4, action: "Viral score peaked at 92/100", time: "Yesterday", icon: Flame, color: "text-amber-500", bg: "bg-amber-500/10" },
    { id: 5, action: "Processed 45min podcast", time: "2 days ago", icon: Video, color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  // Mock data for Viral Score Chart
  const chartData = [
    { name: "Clip 1", score: 65 },
    { name: "Clip 2", score: 78 },
    { name: "Clip 3", score: 85 },
    { name: "Clip 4", score: 72 },
    { name: "Clip 5", score: 92 },
    { name: "Clip 6", score: 88 },
    { name: "Clip 7", score: 95 },
  ];

  // Quick Actions
  const quickActions = [
    {
      title: "Convert YouTube Video",
      description: "Paste a link to generate clips instantly",
      icon: Play,
      color: "from-blue-500 to-indigo-600",
      tab: "create" as const
    },
    {
      title: "Edit Existing Clip",
      description: "Open the Studio Editor to fine-tune",
      icon: Scissors,
      color: "from-purple-500 to-pink-600",
      tab: "editor" as const
    },
    {
      title: "Schedule Posts",
      description: "Plan your viral content calendar",
      icon: Calendar,
      color: "from-emerald-500 to-teal-600",
      tab: "scheduler" as const
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-ppmondwest tracking-tight text-pitch-black dark:text-canvas-white">
            {greeting}, Girish 👋
          </h1>
          <p className="text-sm text-slate-gray dark:text-zinc-400 font-af mt-1">
            You have <span className="text-[#534AB7] font-bold">3 clips</span> ready to download and publish today.
          </p>
        </div>
        <button 
          onClick={() => setActiveTab("create")}
          className="flex items-center gap-2 bg-[#534AB7] hover:bg-[#433B9E] text-white px-5 py-2.5 rounded-xl font-af text-sm font-bold shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Create New Clip
        </button>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickActions.map((action, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(action.tab)}
            className="text-left group relative overflow-hidden bg-canvas-white dark:bg-[#1A1A24] border border-cool-gray dark:border-zinc-800 rounded-2xl p-6 transition-all hover:shadow-subtle-3 hover:border-[#534AB7]/30 flex flex-col items-start gap-4"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
              <action.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-pitch-black dark:text-canvas-white font-af text-lg group-hover:text-[#534AB7] transition-colors">
                {action.title}
              </h3>
              <p className="text-xs text-slate-gray dark:text-zinc-500 font-af mt-1">
                {action.description}
              </p>
            </div>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
              <ArrowRight className="w-5 h-5 text-[#534AB7]" />
            </div>
          </button>
        ))}
      </div>

      {/* Main Grid: Activity Feed + Chart */}
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Left: Recent Activity Feed (60%) */}
        <div className="lg:col-span-7 bg-canvas-white dark:bg-[#1A1A24] border border-cool-gray dark:border-zinc-800 rounded-[24px] p-6 shadow-subtle-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-pitch-black dark:text-canvas-white font-af">Recent Activity</h2>
            <button className="text-xs text-[#534AB7] hover:underline font-bold font-af">View All</button>
          </div>
          
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-200 dark:before:via-zinc-800 before:to-transparent">
            {activities.map((item, idx) => (
              <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white dark:border-[#1A1A24] bg-white dark:bg-[#1A1A24] text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  <div className={`w-8 h-8 rounded-full ${item.bg} flex items-center justify-center`}>
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                </div>
                
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-cool-gray dark:border-zinc-800 bg-white dark:bg-[#18181b] shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-pitch-black dark:text-zinc-200 text-sm font-af">{item.action}</span>
                  </div>
                  <time className="text-xs text-slate-gray dark:text-zinc-500 font-af flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {item.time}
                  </time>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Viral Score Chart (40%) */}
        <div className="lg:col-span-5 bg-canvas-white dark:bg-[#1A1A24] border border-cool-gray dark:border-zinc-800 rounded-[24px] p-6 shadow-subtle-2 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-pitch-black dark:text-canvas-white font-af">Viral Score Trends</h2>
            <div className="flex items-center gap-2 text-xs font-bold font-af bg-[#534AB7]/10 text-[#534AB7] px-2 py-1 rounded-lg">
              <TrendingUp className="w-3 h-3" />
              +15% Overall
            </div>
          </div>
          
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#534AB7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#534AB7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.2} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#71717a' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#71717a' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#18181b', 
                    border: '1px solid #27272a',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontFamily: 'inherit',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#a855f7', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#534AB7" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                  activeDot={{ r: 6, fill: "#534AB7", stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Plan Usage Bar */}
      <div className="bg-canvas-white dark:bg-[#1A1A24] border border-cool-gray dark:border-zinc-800 rounded-[24px] p-6 shadow-subtle-2 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 w-full md:w-2/3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#534AB7] to-[#a855f7] flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-end mb-2">
              <h3 className="font-bold text-pitch-black dark:text-canvas-white font-af">Free Plan Usage</h3>
              <span className="text-xs font-bold text-slate-gray dark:text-zinc-400">8 / 10 Clips Used</span>
            </div>
            <div className="h-2 w-full bg-cool-gray dark:bg-zinc-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "80%" }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-[#534AB7] to-[#a855f7] rounded-full"
              />
            </div>
          </div>
        </div>
        <button className="whitespace-nowrap bg-gradient-to-r from-[#534AB7] to-[#a855f7] hover:from-[#433B9E] hover:to-[#9333ea] text-white px-6 py-3 rounded-xl font-af text-sm font-bold shadow-lg transition-transform hover:scale-105 active:scale-95 w-full md:w-auto">
          Upgrade to PRO
        </button>
      </div>

    </div>
  );
}
