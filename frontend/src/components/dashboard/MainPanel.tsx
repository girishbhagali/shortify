"use client";

import { motion } from "framer-motion";
import { 
  Link as LinkIcon, UploadCloud, Video, Smartphone, Monitor, Square, 
  Tv, Clock, Hash, SmartphoneNfc, Plus, Minus, CheckCircle2, User, Play
} from "lucide-react";
import { UseDashboardType } from "../../hooks/useDashboard";

interface MainPanelProps {
  hook: UseDashboardType;
}

export default function MainPanel({ hook }: MainPanelProps) {
  const {
    inputMode,
    setInputMode,
    url,
    setUrl,
    file,
    setFile,
    ytInfo,
    isFetchingInfo,
    infoError,
    handleFetchInfo,
    aspectRatio,
    setAspectRatio,
    duration,
    handleDurationSliderChange,
    durationPreset,
    handleDurationPresetChange,
    numClips,
    incrementClips,
    decrementClips,
    targetPlatform,
    setTargetPlatform
  } = hook;

  // Platform Definitions
  const platforms = [
    { id: "tiktok", label: "TikTok", icon: SmartphoneNfc },
    { id: "reels", label: "Instagram", icon: Smartphone },
    { id: "shorts", label: "Shorts", icon: Play },
    { id: "all", label: "All Formats", icon: LayersIcon }
  ];

  function LayersIcon(props: any) {
    return (
      <svg {...props} className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    );
  }

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getEstimatedTime = () => {
    const min = Math.ceil((numClips * 25) / 60);
    return `~${min} min for ${numClips} clips`;
  };

  return (
    <div className="bg-canvas-white dark:bg-[#1A1A24] border border-cool-gray dark:border-zinc-800 rounded-[24px] p-6 shadow-subtle-2 space-y-6 text-left">
      
      {/* Top Tabs Row */}
      <div className="flex p-1 bg-ash-gray dark:bg-zinc-800 border border-cool-gray dark:border-zinc-700 rounded-xl w-fit">
        <button 
          onClick={() => setInputMode("url")}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold font-af transition-all ${
            inputMode === "url" 
              ? "bg-canvas-white dark:bg-[#1A1A24] text-dark-charcoal dark:text-canvas-white shadow-sm border border-cool-gray dark:border-zinc-800" 
              : "text-charcoal dark:text-zinc-400 hover:text-dark-charcoal dark:hover:text-canvas-white"
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5 text-[#534AB7]" /> Paste URL
        </button>
        <button 
          onClick={() => setInputMode("upload")}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold font-af transition-all ${
            inputMode === "upload" 
              ? "bg-canvas-white dark:bg-[#1A1A24] text-dark-charcoal dark:text-canvas-white shadow-sm border border-cool-gray dark:border-zinc-800" 
              : "text-charcoal dark:text-zinc-400 hover:text-dark-charcoal dark:hover:text-canvas-white"
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5 text-[#534AB7]" /> Upload Video
        </button>
        <button 
          onClick={() => setInputMode("library")}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold font-af transition-all ${
            inputMode === "library" 
              ? "bg-canvas-white dark:bg-[#1A1A24] text-dark-charcoal dark:text-canvas-white shadow-sm border border-cool-gray dark:border-zinc-800" 
              : "text-charcoal dark:text-zinc-400 hover:text-dark-charcoal dark:hover:text-canvas-white"
          }`}
        >
          <Video className="w-3.5 h-3.5 text-[#534AB7]" /> From Library
        </button>
      </div>

      {/* Input Area */}
      <div className="space-y-4">
        {inputMode === "url" && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="relative group flex-1">
                <div className="absolute inset-0 bg-[#534AB7]/5 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center bg-ash-gray dark:bg-zinc-800/50 border border-steel-gray dark:border-zinc-700 rounded-xl p-1.5 transition-all group-hover:border-[#534AB7]">
                  <div className="pl-3 pr-2 text-slate-gray">
                    <LinkIcon className="w-4 h-4 text-slate-gray" />
                  </div>
                  <input 
                    type="url" 
                    placeholder="Paste YouTube URL here..." 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1 bg-transparent border-none text-dark-charcoal dark:text-canvas-white text-sm focus:ring-0 py-2.5 px-1 outline-none w-full placeholder:text-slate-gray dark:placeholder:text-zinc-500 font-af"
                  />
                  {ytInfo && (
                    <div className="mr-3 flex items-center gap-1 text-[10px] font-bold text-[#0F6E56] bg-green-500/10 px-2 py-0.5 rounded-full shadow-sm border border-green-500/25">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Valid URL</span>
                    </div>
                  )}
                </div>
              </div>
              <button 
                onClick={handleFetchInfo}
                disabled={isFetchingInfo || !url}
                className="px-6 py-2.5 bg-[#534AB7] hover:bg-[#433A97] text-canvas-white rounded-xl text-xs font-bold font-af transition-all disabled:opacity-50 active:scale-[0.98] cursor-pointer"
              >
                {isFetchingInfo ? "Analyzing..." : "Analyze"}
              </button>
            </div>

            {infoError && (
              <div className="text-red-500 text-xs font-medium pl-1">{infoError}</div>
            )}

            {ytInfo && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl border border-cool-gray dark:border-zinc-800 bg-ash-gray dark:bg-zinc-800/40 flex flex-col sm:flex-row items-center gap-4 relative overflow-hidden"
              >
                <img src={ytInfo.thumbnail} alt="Thumbnail" className="w-32 h-18 object-cover rounded-lg shadow-sm border border-steel-gray dark:border-zinc-700" />
                <div className="flex flex-col text-left space-y-1">
                  <h4 className="font-bold text-sm text-dark-charcoal dark:text-canvas-white line-clamp-1">{ytInfo.title}</h4>
                  <div className="flex items-center flex-wrap gap-4 text-xs text-medium-gray dark:text-zinc-400 font-af font-medium">
                    <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-gray"/> {ytInfo.uploader}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-gray"/> Duration: {formatDuration(ytInfo.duration)}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {inputMode === "upload" && (
          <div className="border border-dashed border-steel-gray dark:border-zinc-700 hover:border-[#534AB7] rounded-xl p-8 transition-all bg-ash-gray/30 dark:bg-zinc-800/10 cursor-pointer text-center">
            <UploadCloud className="w-8 h-8 text-slate-gray dark:text-zinc-500 mx-auto mb-3" />
            <h3 className="text-sm font-bold font-af mb-0.5 text-dark-charcoal dark:text-canvas-white">{file ? file.name : "Click or drag video to upload"}</h3>
            <p className="text-xs text-medium-gray dark:text-zinc-500">MP4, MOV, WebM up to 500MB</p>
          </div>
        )}

        {inputMode === "library" && (
          <div className="p-6 text-center text-xs text-medium-gray dark:text-zinc-500 font-af">
            Select files from your previously archived folders and uploads in the clips studio.
          </div>
        )}
      </div>

      <div className="h-[1px] w-full bg-cool-gray dark:bg-zinc-800"></div>

      {/* Smart Settings Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Card 1 - Aspect Ratio */}
        <div className="p-4 bg-ash-gray dark:bg-[#1A1A24]/40 border border-cool-gray dark:border-zinc-800 rounded-xl space-y-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-[#534AB7]" />
            <h3 className="font-bold text-xs text-charcoal dark:text-zinc-300 uppercase tracking-wider font-af">Aspect Ratio</h3>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: "9:16", icon: Smartphone, label: "Phone" },
              { id: "16:9", icon: Monitor, label: "Screen" },
              { id: "1:1", icon: Square, label: "Square" },
              { id: "4:5", icon: Tv, label: "Portrait" }
            ].map((r) => {
              const Icon = r.icon;
              const isSelected = aspectRatio === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setAspectRatio(r.id as any)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border text-[10px] font-bold font-af transition-all cursor-pointer ${
                    isSelected 
                      ? "bg-[#534AB7]/10 border-[#534AB7] text-[#534AB7] dark:text-canvas-white shadow-sm" 
                      : "bg-canvas-white dark:bg-zinc-800 border-steel-gray dark:border-zinc-700 text-charcoal dark:text-zinc-400 hover:bg-ash-gray dark:hover:bg-zinc-700"
                  }`}
                >
                  <Icon className="w-4 h-4 mb-1 shrink-0" />
                  <span>{r.id}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card 2 - Platform pills (Auto Aspect triggers) */}
        <div className="p-4 bg-ash-gray dark:bg-[#1A1A24]/40 border border-cool-gray dark:border-zinc-800 rounded-xl space-y-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5">
            <SmartphoneNfc className="w-3.5 h-3.5 text-[#534AB7]" />
            <h3 className="font-bold text-xs text-charcoal dark:text-zinc-300 uppercase tracking-wider font-af">Target Platform</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {platforms.map((p) => {
              const Icon = p.icon;
              const isSelected = targetPlatform === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setTargetPlatform(p.id as any)}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-bold font-af transition-all cursor-pointer ${
                    isSelected 
                      ? "bg-[#534AB7] border-[#534AB7] text-canvas-white shadow-sm" 
                      : "bg-canvas-white dark:bg-zinc-800 border-steel-gray dark:border-zinc-700 text-charcoal dark:text-zinc-400 hover:bg-ash-gray dark:hover:bg-zinc-700"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card 3 - Stepper Quantity */}
        <div className="p-4 bg-ash-gray dark:bg-[#1A1A24]/40 border border-cool-gray dark:border-zinc-800 rounded-xl space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-[#534AB7]" />
              <h3 className="font-bold text-xs text-charcoal dark:text-zinc-300 uppercase tracking-wider font-af">Quantity</h3>
            </div>
            <span className="text-[10px] text-medium-gray dark:text-zinc-400 font-bold font-af">{getEstimatedTime()}</span>
          </div>
          <div className="flex items-center justify-between bg-canvas-white dark:bg-zinc-800 border border-steel-gray dark:border-zinc-700 rounded-xl p-2 h-11">
            <button 
              onClick={decrementClips} 
              className="p-1.5 hover:bg-ash-gray dark:hover:bg-zinc-700 rounded-lg text-slate-gray cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-dark-charcoal dark:text-canvas-white font-af">{numClips} Clips</span>
            <button 
              onClick={incrementClips} 
              className="p-1.5 hover:bg-ash-gray dark:hover:bg-zinc-700 rounded-lg text-slate-gray cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card 4 - Custom Duration Slider */}
        <div className="p-4 bg-ash-gray dark:bg-[#1A1A24]/40 border border-cool-gray dark:border-zinc-800 rounded-xl space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#534AB7]" />
              <h3 className="font-bold text-xs text-charcoal dark:text-zinc-300 uppercase tracking-wider font-af">Clip Duration</h3>
            </div>
            <span className="text-[10px] text-[#534AB7] dark:text-[#00C2FF] font-bold font-af">Recommended: 30-45s for TikTok</span>
          </div>
          
          <div className="space-y-2">
            {/* Slider */}
            <div className="flex items-center justify-between gap-4">
              <input 
                type="range" 
                min="15" 
                max="90" 
                value={duration} 
                onChange={(e) => handleDurationSliderChange(Number(e.target.value))}
                className="w-full accent-[#534AB7] bg-cool-gray dark:bg-zinc-700 h-1.5 rounded-lg cursor-pointer"
              />
              <span className="text-xs font-bold font-af text-dark-charcoal dark:text-canvas-white tabular-nums w-8">{duration}s</span>
            </div>
            
            {/* Presets */}
            <div className="flex gap-1.5">
              {["15s", "30s", "45s", "60s", "custom"].map((p) => {
                const isSelected = durationPreset === p;
                return (
                  <button
                    key={p}
                    onClick={() => handleDurationPresetChange(p as any)}
                    className={`flex-1 py-1.5 rounded-lg border text-[9px] font-bold font-af uppercase tracking-wider transition-all cursor-pointer ${
                      isSelected 
                        ? "bg-[#534AB7] border-[#534AB7] text-canvas-white" 
                        : "bg-canvas-white dark:bg-zinc-800 border-steel-gray dark:border-zinc-700 text-charcoal dark:text-zinc-400 hover:bg-ash-gray dark:hover:bg-zinc-700"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
