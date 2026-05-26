"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings2, Video, Lock, UploadCloud, MapPin, Sliders, 
  Download, Globe, Mail, CheckCircle2, AlertCircle 
} from "lucide-react";
import { UseDashboardType } from "../../hooks/useDashboard";

interface ExportPanelProps {
  hook: UseDashboardType;
}

export default function ExportPanel({ hook }: ExportPanelProps) {
  const { exportSettings, setExportSettings } = hook;
  const [activeSubTab, setActiveSubTab] = useState<"quality" | "branding" | "delivery">("quality");

  const updateSetting = (key: keyof typeof exportSettings, val: any) => {
    setExportSettings(prev => ({
      ...prev,
      [key]: val
    }));
  };

  return (
    <div className="bg-canvas-white dark:bg-[#1A1A24] border border-cool-gray dark:border-zinc-800 rounded-[24px] p-6 shadow-subtle-2 space-y-6 text-left">
      
      {/* Title block */}
      <div className="flex items-center gap-2 border-b border-cool-gray dark:border-zinc-800 pb-3">
        <Settings2 className="w-4 h-4 text-[#534AB7]" />
        <h3 className="font-af font-bold text-sm text-dark-charcoal dark:text-canvas-white uppercase tracking-wider">Export Settings</h3>
      </div>

      {/* Export Sub-Tabs */}
      <div className="flex border-b border-cool-gray dark:border-zinc-800 text-xs font-bold font-af text-slate-gray">
        {[
          { id: "quality", label: "Video Quality", icon: Video },
          { id: "branding", label: "Branding", icon: Lock },
          { id: "delivery", label: "Delivery", icon: Mail }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-all cursor-pointer ${
                isActive 
                  ? "border-[#534AB7] text-[#534AB7] dark:text-canvas-white" 
                  : "border-transparent hover:text-dark-charcoal dark:hover:text-canvas-white"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-Tab Contents */}
      <div className="pt-2">
        <AnimatePresence mode="wait">
          
          {/* Tab 1 - Video Quality */}
          {activeSubTab === "quality" && (
            <motion.div
              key="quality"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4 font-af text-xs"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-gray">Resolution</label>
                  <select 
                    value={exportSettings.resolution} 
                    onChange={(e) => updateSetting("resolution", e.target.value)}
                    className="w-full bg-ash-gray dark:bg-zinc-800 border border-cool-gray dark:border-zinc-700 rounded-lg p-2 font-bold text-dark-charcoal dark:text-canvas-white outline-none"
                  >
                    <option value="720p">720p (Fast Render)</option>
                    <option value="1080p">1080p HD (Recommended)</option>
                    <option value="4k">4K Ultra HD (Slow)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-gray">Frame Rate (FPS)</label>
                  <select 
                    value={exportSettings.fps} 
                    onChange={(e) => updateSetting("fps", e.target.value)}
                    className="w-full bg-ash-gray dark:bg-zinc-800 border border-cool-gray dark:border-zinc-700 rounded-lg p-2 font-bold text-dark-charcoal dark:text-canvas-white outline-none"
                  >
                    <option value="24">24 FPS (Cinematic)</option>
                    <option value="30">30 FPS (Standard)</option>
                    <option value="60">60 FPS (Super Smooth)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-gray">Format</label>
                  <select 
                    value={exportSettings.format} 
                    onChange={(e) => updateSetting("format", e.target.value)}
                    className="w-full bg-ash-gray dark:bg-zinc-800 border border-cool-gray dark:border-zinc-700 rounded-lg p-2 font-bold text-dark-charcoal dark:text-canvas-white outline-none"
                  >
                    <option value="mp4">MP4 (Best Compatibility)</option>
                    <option value="mov">MOV (Apple ProRes)</option>
                    <option value="webm">WebM (Ultra Small)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-gray">Compression</label>
                  <select 
                    value={exportSettings.compression} 
                    onChange={(e) => updateSetting("compression", e.target.value)}
                    className="w-full bg-ash-gray dark:bg-zinc-800 border border-cool-gray dark:border-zinc-700 rounded-lg p-2 font-bold text-dark-charcoal dark:text-canvas-white outline-none"
                  >
                    <option value="small">Small File Size</option>
                    <option value="balanced">Balanced Quality</option>
                    <option value="best">Best Quality Render</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab 2 - Branding & Watermark (Pro Lock styled) */}
          {activeSubTab === "branding" && (
            <motion.div
              key="branding"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4 font-af text-xs"
            >
              <div className="flex items-center justify-between border-b border-cool-gray dark:border-zinc-800 pb-3">
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-dark-charcoal dark:text-canvas-white">Remove Watermark</span>
                  <span className="text-[10px] text-slate-gray">Show branding logo in the corner.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                  <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Pro Only</span>
                  <input 
                    type="checkbox" 
                    disabled={true} 
                    checked={false} 
                    className="accent-[#534AB7] cursor-not-allowed opacity-50" 
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 opacity-50 select-none">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-gray">Logo Upload</label>
                  <div className="border border-dashed border-steel-gray dark:border-zinc-700 rounded-lg p-4 text-center bg-ash-gray cursor-not-allowed">
                    <UploadCloud className="w-6 h-6 text-slate-gray mx-auto mb-2" />
                    <span className="text-[10px] text-slate-gray font-bold">Drag Logo here</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-gray">Logo Position</label>
                    <select 
                      disabled={true} 
                      className="w-full bg-ash-gray border border-cool-gray rounded-lg p-2 font-bold text-slate-gray cursor-not-allowed"
                    >
                      <option>Bottom Right</option>
                      <option>Bottom Left</option>
                      <option>Top Right</option>
                      <option>Top Left</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-gray">
                      <span>Opacity</span>
                      <span>50%</span>
                    </div>
                    <input 
                      type="range" 
                      disabled={true} 
                      className="w-full cursor-not-allowed h-1.5" 
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab 3 - Delivery Configurations */}
          {activeSubTab === "delivery" && (
            <motion.div
              key="delivery"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3 font-af text-xs"
            >
              {[
                { id: "deliveryZip", label: "Download direct ZIP pack", icon: Download },
                { id: "deliveryGDrive", label: "Auto-upload to Google Drive", icon: Globe, isPro: true },
                { id: "deliverySocialDirect", label: "Direct publish to Instagram / TikTok", icon: Settings2, isPro: true },
                { id: "deliveryEmailTick", label: "Email me clip download links when rendered", icon: Mail }
              ].map((del) => {
                const Icon = del.icon;
                const isChecked = exportSettings[del.id as keyof typeof exportSettings];
                return (
                  <label 
                    key={del.id} 
                    className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-colors ${
                      del.isPro ? "opacity-60" : ""
                    } ${
                      isChecked 
                        ? "border-[#534AB7]/30 bg-[#534AB7]/5" 
                        : "border-steel-gray dark:border-zinc-800 bg-canvas-white dark:bg-zinc-800/10"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-[#534AB7]" />
                      <span className="text-xs font-bold text-dark-charcoal dark:text-canvas-white">{del.label}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {del.isPro && (
                        <div className="flex items-center gap-0.5 text-[8px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full uppercase border border-amber-500/20">
                          <Lock className="w-2.5 h-2.5 fill-amber-500/10" />
                          <span>Pro</span>
                        </div>
                      )}
                      <input 
                        type="checkbox" 
                        disabled={del.isPro}
                        checked={del.isPro ? false : !!isChecked}
                        onChange={(e) => updateSetting(del.id as any, e.target.checked)}
                        className="accent-[#534AB7] cursor-pointer"
                      />
                    </div>
                  </label>
                );
              })}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
