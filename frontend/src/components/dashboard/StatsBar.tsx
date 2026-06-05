"use client";

import { motion } from "framer-motion";
import { Play, Scissors, Download, Flame, Video, TrendingUp } from "lucide-react";
import { UseDashboardType } from "../../hooks/useDashboard";

interface StatsBarProps {
  hook: UseDashboardType;
}

export default function StatsBar({ hook }: StatsBarProps) {
  const { stats } = hook;

  const statItems = [
    {
      label: "Videos Processed",
      value: stats.videosProcessed,
      icon: Video,
      color: "from-blue-500/10 to-indigo-500/10 text-blue-500",
      accent: "#3b82f6",
      trend: "+12%"
    },
    {
      label: "Clips Generated",
      value: stats.clipsGenerated,
      icon: Scissors,
      color: "from-purple-500/10 to-pink-500/10 text-[#534AB7]",
      accent: "#534AB7",
      trend: "+15%"
    },
    {
      label: "Total Downloads",
      value: stats.totalDownloads,
      icon: Download,
      color: "from-emerald-500/10 to-teal-500/10 text-emerald-500",
      accent: "#10b981",
      trend: "+8%"
    },
    {
      label: "Avg Viral Score",
      value: stats.avgViralScore,
      icon: Flame,
      color: "from-amber-500/10 to-orange-500/10 text-amber-500",
      accent: "#f59e0b",
      suffix: "/100",
      trend: "+5%"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 120 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full"
    >
      {statItems.map((item, idx) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={idx}
            variants={itemVariants}
            className="bg-canvas-white dark:bg-[#1A1A24] border border-cool-gray dark:border-zinc-800 rounded-xl p-4 shadow-subtle-2 flex items-center justify-between relative overflow-hidden group hover:border-[#534AB7]/30 transition-all hover:shadow-subtle-3"
          >
            {/* Background Gradient Vector */}
            <div className={`absolute -right-4 -bottom-4 w-12 h-12 rounded-full bg-gradient-to-br ${item.color} blur-lg group-hover:scale-125 transition-transform`} />

            <div className="space-y-1.5 z-10 text-left">
              <span className="text-[10px] font-bold text-slate-gray dark:text-zinc-500 uppercase tracking-wider block font-af">
                {item.label}
              </span>
              <div className="flex flex-col">
                <div className="flex items-baseline">
                  <span className="text-xl md:text-2xl font-normal tracking-tight text-pitch-black dark:text-canvas-white font-ppmondwest">
                    {item.value}
                  </span>
                  {item.suffix && (
                    <span className="text-[10px] font-bold text-slate-gray pl-0.5">{item.suffix}</span>
                  )}
                </div>
                
                <div className="flex items-center gap-1 mt-0.5">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 font-af">
                    {item.trend} <span className="text-slate-gray dark:text-zinc-500">vs last week</span>
                  </span>
                </div>
              </div>
            </div>

            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center shrink-0 z-10 shadow-sm border border-[#534AB7]/5`}>
              <Icon className="w-4.5 h-4.5" />
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
