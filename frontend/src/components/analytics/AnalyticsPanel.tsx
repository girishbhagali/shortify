"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  ChevronDown,
  Download,
  FileText,
  TrendingUp,
  Film,
  Clock,
  Star,
  Award,
  Video,
  Play,
  Share2,
  Flame
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceDot,
  Label
} from "recharts";
import { UseDashboardType } from "../../hooks/useDashboard";

// Mock fallbacks (only used if DB is completely empty)
const fallbackViralScoreData = [
  { date: "May 1", avgScore: 0, bestScore: 0, clipName: "No Data" }
];
const fallbackClipsGeneratedData = [
  { date: "May 1", free: 0, pro: 0 }
];
const fallbackPlatformData = [
  { name: "None", value: 1, color: "#3f3f46" }
];
const fallbackTopClips: any[] = [];
const fallbackFeatureUsageData = [
  { feature: "Auto Captions", percentage: 0 },
  { feature: "Viral Hooks", percentage: 0 },
  { feature: "Background Music", percentage: 0 }
];
const fallbackProcessingTimeData = [
  { time: "12 AM", mins: 0 }
];

// --- Custom Tooltips ---
const ViralTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#18181b] border border-zinc-800 p-3 rounded-xl shadow-xl text-xs font-af text-white">
        <p className="font-bold mb-1 text-zinc-300">{label}</p>
        <p className="text-[#534AB7] font-bold">Avg Score: {data.avgScore}</p>
        <p className="text-[#00C2FF] font-bold">Best Score: {data.bestScore}</p>
        <div className="mt-2 pt-2 border-t border-zinc-800 text-zinc-400">
          <p>Top Clip: <span className="text-white">{data.clipName}</span></p>
        </div>
      </div>
    );
  }
  return null;
};

interface AnalyticsPanelProps {
  hook: UseDashboardType;
}

export default function AnalyticsPanel({ hook }: AnalyticsPanelProps) {
  const [dateRange, setDateRange] = useState("Last 7 days");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dateOptions = ["Last 24 hours", "Last 7 days", "Last 30 days", "All Time"];

  // Fallback to empty states while loading
  const isLoading = hook.isFetchingAnalytics || !hook.analyticsData;
  const data = hook.analyticsData || {};
  
  const overview = data.overview || { total_clips: 0, avg_viral_score: 0, total_downloads: 0, clips_scheduled: 0, processing_time_saved: 0 };
  const viralScoreData = data.viralScoreData && data.viralScoreData.length ? data.viralScoreData : fallbackViralScoreData;
  const clipsGeneratedData = data.clipsGeneratedData && data.clipsGeneratedData.length ? data.clipsGeneratedData : fallbackClipsGeneratedData;
  const platformData = data.platformData && data.platformData.length ? data.platformData : fallbackPlatformData;
  const topClips = data.topClips || fallbackTopClips;
  const featureUsageData = data.featureUsageData || fallbackFeatureUsageData;
  const processingTimeData = data.processingTimeData || fallbackProcessingTimeData;

  const handleExportCSV = () => {
    const headers = "Rank,Title,Viral Score,Platform,Downloads\n";
    const rows = topClips.map((clip: any) => `${clip.rank},"${clip.title}",${clip.score},${clip.platform},${clip.downloads}`).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `shortify_analytics_${dateRange.replace(/ /g, '_').toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4 animate-in fade-in duration-500">
        <div className="w-8 h-8 border-4 border-[#534AB7] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-af text-zinc-500">Loading your analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* Header & Date Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#534AB7] dark:text-[#00C2FF] text-xs font-bold uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Performance Insights</span>
          </div>
          <h1 className="text-3xl font-ppmondwest tracking-tight text-pitch-black dark:text-canvas-white">
            Analytics Dashboard
          </h1>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full md:w-[180px] flex items-center justify-between bg-white dark:bg-[#1A1A24] border border-cool-gray dark:border-zinc-800 px-4 py-2.5 rounded-xl text-sm font-af text-pitch-black dark:text-canvas-white font-medium hover:border-[#534AB7] transition-colors"
            >
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-gray" />
                {dateRange}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-gray transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isDropdownOpen && (
              <div className="absolute top-full mt-2 w-full bg-white dark:bg-[#1A1A24] border border-cool-gray dark:border-zinc-800 rounded-xl shadow-lg z-50 overflow-hidden">
                {dateOptions.map(option => (
                  <button 
                    key={option}
                    onClick={() => { setDateRange(option); setIsDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm font-af text-pitch-black dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleExportCSV}
              className="flex items-center justify-center w-10 h-10 bg-white dark:bg-[#1A1A24] border border-cool-gray dark:border-zinc-800 rounded-xl hover:border-[#534AB7] hover:text-[#534AB7] transition-colors tooltip-trigger" 
              title="Export CSV"
            >
              <Download className="w-4 h-4" />
            </button>
            <button 
              onClick={handleExportPDF}
              className="hidden md:flex items-center gap-2 bg-[#534AB7] hover:bg-[#433B9E] text-white px-4 py-2.5 rounded-xl text-sm font-bold font-af transition-transform hover:scale-105 active:scale-95 shadow-lg"
            >
              <FileText className="w-4 h-4" />
              Download PDF Report
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stats Row (5 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { title: "Total Clips Generated", value: overview.total_clips.toString(), trend: "Current total", icon: Film, color: "text-purple-500", bg: "bg-purple-500/10" },
          { title: "Avg Viral Score", value: overview.avg_viral_score.toString(), trend: "All time avg", icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10" },
          { title: "Total Downloads", value: overview.total_downloads.toString(), trend: "Estimated", icon: Download, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { title: "Clips Scheduled", value: overview.clips_scheduled.toString(), trend: "Pending posts", icon: Calendar, color: "text-blue-500", bg: "bg-blue-500/10" },
          { title: "Processing Time Saved", value: `~${overview.processing_time_saved}h`, trend: "Compute hours", icon: Clock, color: "text-pink-500", bg: "bg-pink-500/10" },
        ].map((stat, idx) => (
          <div key={idx} className="bg-canvas-white dark:bg-[#1A1A24] border border-cool-gray dark:border-zinc-800 p-4 rounded-[20px] shadow-subtle-2 hover:border-[#534AB7]/30 transition-colors group">
            <div className="flex justify-between items-start mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-gray dark:text-zinc-500 font-af font-medium mb-1">{stat.title}</p>
              <h3 className="text-2xl font-bold text-pitch-black dark:text-canvas-white font-af tracking-tight">{stat.value}</h3>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1.5">{stat.trend}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Viral Score Chart (Full Width) */}
      <div className="bg-canvas-white dark:bg-[#1A1A24] border border-cool-gray dark:border-zinc-800 rounded-[24px] p-6 shadow-subtle-2">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-pitch-black dark:text-canvas-white font-af text-lg">Viral Score Trajectory</h2>
          <div className="flex gap-4 text-xs font-af">
            <div className="flex items-center gap-1.5 text-zinc-500"><span className="w-3 h-3 rounded-full bg-[#534AB7]"></span> Average Score</div>
            <div className="flex items-center gap-1.5 text-zinc-500"><span className="w-3 h-3 rounded-full bg-[#00C2FF]"></span> Best Score</div>
          </div>
        </div>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={viralScoreData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.2} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#71717a' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#71717a' }} domain={[0, 100]} />
              <Tooltip content={<ViralTooltip />} cursor={{ stroke: '#534AB7', strokeWidth: 1, strokeDasharray: '5 5' }} />
              <Line type="monotone" dataKey="avgScore" stroke="#534AB7" strokeWidth={3} dot={{ r: 4, fill: '#1A1A24', stroke: '#534AB7', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="bestScore" stroke="#00C2FF" strokeWidth={3} dot={{ r: 4, fill: '#1A1A24', stroke: '#00C2FF', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              {/* Annotation for MrBeast Spike */}
              <ReferenceDot x="May 5" y={95} r={8} fill="#00C2FF" stroke="#fff" strokeWidth={2}>
                <Label value="MrBeast Spike 🚀" position="top" fill="#00C2FF" fontSize={12} fontWeight="bold" offset={10} />
              </ReferenceDot>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Middle Grid: Bar Charts & Donut */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Clips Generated Stacked Bar */}
        <div className="lg:col-span-2 bg-canvas-white dark:bg-[#1A1A24] border border-cool-gray dark:border-zinc-800 rounded-[24px] p-6 shadow-subtle-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-pitch-black dark:text-canvas-white font-af">Clips Generated</h2>
            <div className="flex gap-3 text-xs font-af">
              <div className="flex items-center gap-1.5 text-zinc-500"><span className="w-3 h-3 rounded-sm bg-[#534AB7]"></span> Pro</div>
              <div className="flex items-center gap-1.5 text-zinc-500"><span className="w-3 h-3 rounded-sm bg-[#00C2FF]/40"></span> Free</div>
            </div>
          </div>
          <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clipsGeneratedData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.2} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#71717a' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#71717a' }} />
                <Tooltip 
                  cursor={{ fill: '#3f3f46', opacity: 0.1 }}
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                />
                <Bar dataKey="pro" stackId="a" fill="#534AB7" radius={[0, 0, 4, 4]} />
                <Bar dataKey="free" stackId="a" fill="#00C2FF" fillOpacity={0.6} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Breakdown Donut */}
        <div className="bg-canvas-white dark:bg-[#1A1A24] border border-cool-gray dark:border-zinc-800 rounded-[24px] p-6 shadow-subtle-2 flex flex-col">
          <h2 className="font-bold text-pitch-black dark:text-canvas-white font-af mb-2">Platform Breakdown</h2>
          <div className="flex-1 w-full relative min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {platformData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-pitch-black dark:text-white font-af leading-none">{overview.total_clips}</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mt-1">Clips</span>
            </div>
          </div>
          {/* Custom Legend */}
          <div className="flex justify-center gap-4 mt-2">
            {platformData.map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }}></span>
                <span className="text-xs font-bold text-zinc-400 font-af">{p.name}</span>
                <span className="text-xs text-white ml-0.5">{p.value}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Grid: Feature Usage, Processing Area Chart, Top Clips Table */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left Col (Charts) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Feature Usage Horizontal Bar */}
          <div className="bg-canvas-white dark:bg-[#1A1A24] border border-cool-gray dark:border-zinc-800 rounded-[24px] p-6 shadow-subtle-2">
            <h2 className="font-bold text-pitch-black dark:text-canvas-white font-af mb-6">AI Feature Usage</h2>
            <div className="space-y-4">
              {featureUsageData.map((item: any, idx: number) => (
                <div key={idx} className="relative">
                  <div className="flex justify-between text-xs font-af mb-1.5">
                    <span className="text-pitch-black dark:text-zinc-300 font-medium">{item.feature}</span>
                    <span className="font-bold text-[#534AB7] dark:text-[#00C2FF]">{item.percentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-cool-gray dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      transition={{ duration: 1, delay: idx * 0.1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-[#534AB7] to-[#00C2FF] rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Processing Time Area Chart */}
          <div className="bg-canvas-white dark:bg-[#1A1A24] border border-cool-gray dark:border-zinc-800 rounded-[24px] p-6 shadow-subtle-2">
            <h2 className="font-bold text-pitch-black dark:text-canvas-white font-af mb-1">Server Processing Load</h2>
            <p className="text-[10px] text-zinc-500 font-af mb-4">Average processing time per minute of video</p>
            <div className="w-full h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={processingTimeData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.2} />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a' }} dy={5} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                    formatter={(val: any) => [`${val} mins`, 'Processing Time']}
                  />
                  <Area type="monotone" dataKey="mins" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorTime)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right Col: Top Performing Clips Table */}
        <div className="lg:col-span-7 bg-canvas-white dark:bg-[#1A1A24] border border-cool-gray dark:border-zinc-800 rounded-[24px] shadow-subtle-2 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-cool-gray dark:border-zinc-800 flex justify-between items-center bg-white/50 dark:bg-[#1A1A24]/50">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h2 className="font-bold text-pitch-black dark:text-canvas-white font-af text-lg">Top Performing Clips</h2>
            </div>
            <button className="text-xs text-[#534AB7] dark:text-[#00C2FF] font-bold hover:underline">View Library</button>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/30 text-[10px] uppercase tracking-wider text-slate-gray dark:text-zinc-500 font-bold border-b border-cool-gray dark:border-zinc-800">
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Clip</th>
                  <th className="px-6 py-4 text-center">Viral Score</th>
                  <th className="px-6 py-4">Platform</th>
                  <th className="px-6 py-4 text-right">Downloads</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cool-gray dark:divide-zinc-800">
                {topClips.map((clip: any, idx: number) => (
                  <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-amber-500/20 text-amber-500' : idx === 1 ? 'bg-slate-300/20 text-slate-300' : idx === 2 ? 'bg-orange-700/20 text-orange-400' : 'text-zinc-500'}`}>
                        #{clip.rank}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-16 rounded-lg overflow-hidden bg-zinc-800 shrink-0 relative group-hover:shadow-md transition-shadow">
                          <img src={clip.thumb} alt={clip.title} className="w-full h-full object-cover opacity-80" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity cursor-pointer">
                            <Play className="w-4 h-4 text-white fill-white" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-pitch-black dark:text-zinc-200 line-clamp-2 max-w-[150px] md:max-w-[200px]">{clip.title}</p>
                          <p className="text-[10px] text-zinc-500 mt-1">{clip.created}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${clip.score >= 90 ? 'bg-emerald-500/10 text-emerald-500' : clip.score >= 80 ? 'bg-[#534AB7]/10 text-[#534AB7]' : 'bg-orange-500/10 text-orange-500'}`}>
                        <Flame className="w-3 h-3" />
                        {clip.score}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {clip.platform === "TikTok" && <div className="w-5 h-5 rounded bg-black flex items-center justify-center"><svg viewBox="0 0 24 24" className="w-3 h-3 fill-white"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg></div>}
                        {clip.platform === "Reels" && <div className="w-5 h-5 rounded bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 flex items-center justify-center"><Video className="w-3 h-3 text-white" /></div>}
                        {clip.platform === "Shorts" && <div className="w-5 h-5 rounded bg-red-600 flex items-center justify-center"><Play className="w-3 h-3 text-white fill-white" /></div>}
                        <span className="text-xs text-zinc-400 font-medium">{clip.platform}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-pitch-black dark:text-zinc-300">{clip.downloads}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
    </div>
  );
}
