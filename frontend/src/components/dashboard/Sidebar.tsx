"use client";

import { motion } from "framer-motion";
import { 
  Home, Scissors, Video, Calendar, BarChart2, Settings, 
  Crown, Sun, Moon, LogOut, ChevronLeft, ChevronRight, Menu
} from "lucide-react";
import Link from "next/link";
import { UseDashboardType } from "../../hooks/useDashboard";

interface SidebarProps {
  hook: UseDashboardType;
}

export default function Sidebar({ hook }: SidebarProps) {
  const { 
    activeTab, 
    setActiveTab, 
    sidebarCollapsed, 
    setSidebarCollapsed, 
    darkMode, 
    toggleDarkMode 
  } = hook;

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "create", label: "Create Clips", icon: Scissors },
    { id: "library", label: "My Clips", icon: Video },
    { id: "editor", label: "Video Editor", icon: Video, isExternal: true, path: "/editor" },
    { id: "scheduler", label: "Scheduler", icon: Calendar },
    { id: "analytics", label: "Analytics", icon: BarChart2 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside 
      className={`fixed top-0 left-0 h-screen z-40 bg-canvas-white dark:bg-[#1A1A24] border-r border-cool-gray dark:border-zinc-800 transition-all duration-300 flex flex-col justify-between ${
        sidebarCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Top Brand Header */}
      <div>
        <div className="flex items-center justify-between p-4 border-b border-cool-gray dark:border-zinc-800 h-16">
          {!sidebarCollapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#534AB7] rounded-full flex items-center justify-center shadow-md">
                <svg className="w-4.5 h-4.5 text-canvas-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-af font-bold text-base text-dark-charcoal dark:text-canvas-white tracking-tight">Shortify<span className="text-[#00C2FF]">AI</span></span>
            </Link>
          )}

          {sidebarCollapsed && (
            <div className="w-8 h-8 bg-[#534AB7] rounded-full flex items-center justify-center mx-auto shadow-md">
              <svg className="w-5 h-5 text-canvas-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
            </div>
          )}

          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg hover:bg-ash-gray dark:hover:bg-zinc-800 text-slate-gray dark:text-zinc-400 cursor-pointer transition-all"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            if (item.isExternal) {
              return (
                <Link 
                  key={item.id}
                  href={item.path}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold font-af transition-all text-charcoal dark:text-zinc-300 hover:bg-ash-gray dark:hover:bg-zinc-800/50"
                  title={item.label}
                >
                  <Icon className="w-4 h-4 shrink-0 text-slate-gray dark:text-zinc-500" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold font-af transition-all cursor-pointer ${
                  isActive 
                    ? "bg-[#534AB7]/10 text-[#534AB7] dark:bg-[#534AB7]/20 dark:text-canvas-white shadow-sm border border-[#534AB7]/20" 
                    : "text-charcoal dark:text-zinc-300 hover:bg-ash-gray dark:hover:bg-zinc-800/50 border border-transparent"
                }`}
                title={item.label}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#534AB7]" : "text-slate-gray dark:text-zinc-500"}`} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section (Upgrade, Dark Mode, Avatar) */}
      <div className="p-3 border-t border-cool-gray dark:border-zinc-800 space-y-3 bg-canvas-white dark:bg-[#1A1A24] z-10">
        
        {/* Upgrade Card */}
        {!sidebarCollapsed && (
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#534AB7] to-[#8076E5] text-canvas-white text-xs font-af space-y-2.5 relative overflow-hidden group shadow-md shadow-[#534AB7]/20">
            <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-canvas-white/10 rounded-full group-hover:scale-110 transition-transform"></div>
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
              <Crown className="w-3.5 h-3.5 text-[#00C2FF] fill-[#00C2FF]" />
              <span>Go Premium</span>
            </div>
            <p className="text-[11px] leading-relaxed text-canvas-white/90">Unlock unlimited viral rendering slots & HD quality.</p>
            <button className="w-full bg-[#00C2FF] hover:bg-[#00B0E6] text-night-sky font-bold py-2 rounded-lg text-[10px] uppercase tracking-wider transition-colors shadow-sm cursor-pointer">
              Upgrade Now
            </button>
          </div>
        )}

        {sidebarCollapsed && (
          <button 
            className="w-10 h-10 rounded-xl bg-[#534AB7]/10 flex items-center justify-center text-[#534AB7] hover:bg-[#534AB7]/20 mx-auto transition-colors"
            title="Upgrade Plan"
          >
            <Crown className="w-4 h-4 fill-current text-[#00C2FF]" />
          </button>
        )}

        {/* Theme Controller */}
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-ash-gray dark:hover:bg-zinc-800/50 rounded-xl text-xs font-bold text-charcoal dark:text-zinc-300 transition-all cursor-pointer"
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          <div className="flex items-center gap-3">
            {darkMode ? <Sun className="w-4 h-4 text-[#00C2FF]" /> : <Moon className="w-4 h-4 text-slate-gray" />}
            {!sidebarCollapsed && <span>{darkMode ? "Light Theme" : "Dark Theme"}</span>}
          </div>
          {!sidebarCollapsed && (
            <div className="w-8 h-4 bg-cool-gray dark:bg-zinc-800 rounded-full relative flex items-center px-0.5">
              <div className={`w-3 h-3 bg-[#534AB7] rounded-full transition-transform ${darkMode ? "translate-x-4" : ""}`} />
            </div>
          )}
        </button>

        {/* User Card */}
        <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-ash-gray dark:hover:bg-zinc-800/50 transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#534AB7]/20 border border-[#534AB7]/30 flex items-center justify-center font-bold text-xs text-[#534AB7] dark:text-[#8076E5] uppercase shadow-sm">
              GR
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-dark-charcoal dark:text-canvas-white line-clamp-1">Girish Bhagli</span>
                <span className="text-[9px] text-slate-gray dark:text-zinc-500 uppercase tracking-widest font-bold">Pro Creator</span>
              </div>
            )}
          </div>
          
          {!sidebarCollapsed && (
            <button className="p-1 text-slate-gray hover:text-red-400 transition-colors cursor-pointer">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>
    </aside>
  );
}
