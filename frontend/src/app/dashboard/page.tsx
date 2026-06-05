"use client";

import { useDashboard } from "../../hooks/useDashboard";
import Sidebar from "../../components/dashboard/Sidebar";
import StatsBar from "../../components/dashboard/StatsBar";
import MainPanel from "../../components/dashboard/MainPanel";
import AIEditsPanel from "../../components/dashboard/AIEditsPanel";
import ExportPanel from "../../components/dashboard/ExportPanel";
import GenerateButton from "../../components/dashboard/GenerateButton";
import RecentClips from "../../components/dashboard/RecentClips";
import DashboardHomePanel from "../../components/dashboard/DashboardHomePanel";
import LibraryPanel from "../../components/library/LibraryPanel";
import SchedulerPanel from "../../components/scheduler/SchedulerPanel";
import { LayoutDashboard } from "lucide-react";

import dynamic from "next/dynamic";

function DashboardPageImpl() {
  const hook = useDashboard();
  const { sidebarCollapsed, activeTab } = hook;

  return (
    <div className="min-h-screen bg-[#F8F8FC] dark:bg-[#0F0F13] text-dark-charcoal dark:text-zinc-200 transition-colors duration-300 font-af">
      
      {/* Sidebar Navigation */}
      <Sidebar hook={hook} />

      {/* Main Workspace Scroll Wrapper */}
      <div 
        className={`transition-all duration-300 min-h-screen flex flex-col justify-between ${
          sidebarCollapsed ? "pl-16" : "pl-0 md:pl-64"
        }`}
      >
        
        {/* Workspace content container */}
        <main className={`p-4 md:p-8 mx-auto w-full space-y-6 ${activeTab === 'library' || activeTab === 'scheduler' ? 'max-w-[1400px]' : 'max-w-6xl'}`}>
          
          {/* Top Title Banner & Stats Bar (hidden on Library/Scheduler tab since it has its own) */}
          {activeTab !== "library" && activeTab !== "scheduler" && (
            <>
              <div className="flex flex-col text-left space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#534AB7] dark:text-[#00C2FF] uppercase tracking-widest font-af">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>ShortifyAI Studio Suite</span>
                </div>
                <h1 className="font-ppmondwest text-4xl text-pitch-black dark:text-canvas-white font-normal tracking-[-0.0200em]">
                  {activeTab === "create" ? "Create Viral Shorts" : "Studio Hub"}
                </h1>
                <p className="text-xs text-medium-gray dark:text-zinc-500 font-af">
                  Convert long videos into viral, high-retention social media clips automatically.
                </p>
              </div>

              <StatsBar hook={hook} />
            </>
          )}

          {/* Main Panel Content grids depending on route tab */}
          {activeTab === "dashboard" ? (
            <DashboardHomePanel hook={hook} />
          ) : activeTab === "library" ? (
            <LibraryPanel hook={hook} />
          ) : activeTab === "scheduler" ? (
            <SchedulerPanel hook={hook} />
          ) : activeTab === "create" ? (
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column (URL Input settings + generate submit CTA) */}
              <div className="lg:col-span-8 space-y-6">
                <MainPanel hook={hook} />
                <GenerateButton hook={hook} />
              </div>

              {/* Right Column (AI Edits Toggles & Branding resolutions) */}
              <div className="lg:col-span-4 space-y-6">
                <AIEditsPanel hook={hook} />
                <ExportPanel hook={hook} />
              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-xs text-medium-gray dark:text-zinc-500 font-af bg-canvas-white dark:bg-[#1A1A24] border border-cool-gray dark:border-zinc-800 rounded-[24px] shadow-sm">
              The requested &quot;{activeTab}&quot; routeway panel is currently in beta. Switch to the &quot;Dashboard&quot; or &quot;Create Clips&quot; tab!
            </div>
          )}

          {/* Horizontal scrollable clips strip */}
          {activeTab === "create" && <RecentClips hook={hook} />}

        </main>

        {/* Studio Footer */}
        <footer className="py-6 border-t border-cool-gray dark:border-zinc-800 bg-canvas-white dark:bg-[#1A1A24] text-center font-af text-[10px] text-slate-gray dark:text-zinc-500 w-full shrink-0">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>ShortifyAI Studio Pro Workspace</span>
            <div className="flex gap-4">
              <a href="#" className="hover:underline">Studio API</a>
              <a href="#" className="hover:underline">Integrations</a>
              <a href="#" className="hover:underline">Security</a>
            </div>
            <span>© {new Date().getFullYear()} ShortifyAI. All rights reserved.</span>
          </div>
        </footer>

      </div>
    </div>
  );
}

const DashboardPage = dynamic(() => Promise.resolve(DashboardPageImpl), {
  ssr: false,
});

export default DashboardPage;
