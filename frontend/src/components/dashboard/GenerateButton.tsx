"use client";

import { motion } from "framer-motion";
import { Sparkles, Check, AlertCircle, X } from "lucide-react";
import { UseDashboardType } from "../../hooks/useDashboard";

interface GenerateButtonProps {
  hook: UseDashboardType;
}

export default function GenerateButton({ hook }: GenerateButtonProps) {
  const {
    isGenerating,
    generateProgress,
    generateError,
    clips,
    numClips,
    handleGenerate,
    cancelGeneration
  } = hook;

  // Estimates duration (25 seconds per clip)
  const getEstimatedMinutes = () => {
    const totalSeconds = numClips * 25;
    const min = Math.ceil(totalSeconds / 60);
    return `~${min} minute${min > 1 ? "s" : ""}`;
  };

  // Get current active rendering clip index based on progress
  const getCurrentClipNumber = () => {
    const stepPercent = 100 / numClips;
    const currentIdx = Math.min(numClips, Math.floor(generateProgress / stepPercent) + 1);
    return `Generating clip ${currentIdx} of ${numClips}...`;
  };

  return (
    <div className="w-full space-y-4">
      
      {/* Generate Progress / Action State */}
      {isGenerating ? (
        <div className="space-y-3.5 bg-canvas-white dark:bg-[#1A1A24] border border-cool-gray dark:border-zinc-800 rounded-xl p-4 shadow-sm text-left">
          <div className="flex justify-between items-center text-xs font-bold font-af">
            <div className="flex items-center gap-2 text-dark-charcoal dark:text-canvas-white">
              <div className="w-3.5 h-3.5 border-2 border-[#534AB7]/30 border-t-[#534AB7] rounded-full animate-spin"></div>
              <span>{getCurrentClipNumber()}</span>
            </div>
            <span className="text-[#534AB7] dark:text-[#00C2FF] tabular-nums">{Math.round(generateProgress)}%</span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full bg-ash-gray dark:bg-zinc-800 border border-cool-gray dark:border-zinc-700 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#534AB7] to-[#00C2FF] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${generateProgress}%` }}
              transition={{ ease: "linear" }}
            />
          </div>

          <div className="flex items-center justify-between gap-4 pt-1">
            <span className="text-[10px] text-slate-gray font-af">Hold tight! Our serverless models are active.</span>
            <button
              onClick={cancelGeneration}
              className="flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors uppercase cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      ) : clips && clips.length > 0 ? (
        <button
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-canvas-white font-af font-bold py-4 rounded-xl text-[15px] flex items-center justify-center gap-2 shadow-md shadow-emerald-500/10 cursor-pointer active:scale-[0.99] transition-all"
          onClick={() => {
            // Scroll down or show clips
            const el = document.getElementById("recent-clips-section");
            el?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <Check className="w-5 h-5 text-canvas-white" strokeWidth={2.5} />
          <span>Done! View Your Clips →</span>
        </button>
      ) : (
        <button
          onClick={handleGenerate}
          className="w-full bg-gradient-to-r from-[#534AB7] via-[#8076E5] to-[#00C2FF] hover:opacity-95 text-canvas-white font-af font-bold py-4.5 rounded-xl text-[15px] flex items-center justify-center gap-2.5 shadow-md shadow-[#534AB7]/20 active:scale-[0.99] transition-all cursor-pointer"
        >
          <Sparkles className="w-4.5 h-4.5 text-canvas-white" />
          <span>⚡ Generate [{numClips}] Viral Shorts</span>
        </button>
      )}

      {/* Credits & Timing Details (Only shown in idle state) */}
      {!isGenerating && !clips && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 bg-ash-gray dark:bg-zinc-800/20 border border-cool-gray dark:border-zinc-800 rounded-xl text-[11px] font-af text-slate-gray dark:text-zinc-400 gap-3 text-left">
          <div>
            <span>Estimated time: </span>
            <span className="font-bold text-dark-charcoal dark:text-canvas-white">{getEstimatedMinutes()}</span>
          </div>

          {/* Credits Bar */}
          <div className="flex items-center gap-3">
            <span>Credits: <strong className="text-[#534AB7] dark:text-[#00C2FF]">8/10 remaining</strong></span>
            <div className="w-20 h-1.5 bg-cool-gray dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className="w-[80%] h-full bg-[#534AB7] rounded-full" />
            </div>
          </div>
        </div>
      )}

      {/* Error alert banner */}
      {generateError && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2 text-left">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{generateError}</span>
        </div>
      )}

    </div>
  );
}
