"use client";

import { motion } from "framer-motion";
import { 
  Flame, Clock, Smartphone, Monitor, Square, 
  Download, Edit2, ChevronRight, Film, Loader2, CheckCircle2
} from "lucide-react";
import { UseDashboardType } from "../../hooks/useDashboard";
import { getThumbnailUrl } from "@/lib/storage";

interface RecentClipsProps {
  hook: UseDashboardType;
}

function clipTranscriptText(transcript: unknown): string {
  if (!transcript) return "Generating transcript...";
  if (typeof transcript === "string") {
    try {
      const parsed = JSON.parse(transcript);
      if (parsed && typeof parsed === "object" && "text" in parsed) {
        return String((parsed as { text: string }).text);
      }
    } catch {
      /* plain string transcript */
    }
    return transcript;
  }
  return String(transcript);
}

export default function RecentClips({ hook }: RecentClipsProps) {
  const { clips, setActiveTab } = hook;

  if (!clips || clips.length === 0) return null;

  return (
    <section className="space-y-4 text-left pt-6" id="recent-clips-section">
      <div className="flex items-center justify-between">
        <h3 className="font-ppmondwest text-2xl text-pitch-black dark:text-canvas-white font-normal tracking-[-0.0200em]">Recent Clips</h3>
        <button 
          onClick={() => setActiveTab("library")}
          className="flex items-center gap-1 text-xs font-bold text-[#534AB7] dark:text-[#00C2FF] hover:underline font-af cursor-pointer"
        >
          <span>View All in Library</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Horizontal Scroll Area */}
      <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-cool-gray">
        {clips.map((clip: any, idx: number) => {
          const isProcessing = clip.status === "processing";
          const isFailed = clip.status === "failed";
          const thumbUrl = clip.status === "ready"
            ? getThumbnailUrl(clip.id)
            : null;
          const clipDuration = clip.duration || (clip.end_time && clip.start_time ? Math.round(clip.end_time - clip.start_time) : 0);

          return (
            <motion.div
              key={clip.id || clip.clip_number || idx}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="flex-shrink-0 w-72 bg-off-white dark:bg-[#1A1A24] border border-steel-gray dark:border-zinc-800 rounded-[20px] overflow-hidden shadow-subtle-2 hover:shadow-subtle-3 transition-shadow"
            >
              {/* Thumbnail Preview Area */}
              <div className="relative aspect-[9/16] bg-zinc-950 group flex items-center justify-center">
                
                {isFailed ? (
                  <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
                    <p className="text-[11px] font-bold text-red-400 uppercase tracking-wider font-af">Processing failed</p>
                    <p className="text-[10px] text-zinc-500 font-af">Try generating again or check the backend terminal.</p>
                  </div>
                ) : isProcessing ? (
                  /* Processing State */
                  <div className="flex flex-col items-center justify-center gap-4 p-6">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-[3px] border-[#534AB7]/20 border-t-[#534AB7] animate-spin"></div>
                      <Film className="w-6 h-6 text-[#534AB7] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-[11px] font-bold text-white uppercase tracking-wider font-af">AI Processing</p>
                      <p className="text-[10px] text-zinc-500 font-af">Cutting, resizing & adding effects...</p>
                    </div>
                    <div className="w-32 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#534AB7] to-[#00C2FF] rounded-full animate-pulse" style={{ width: "60%" }}></div>
                    </div>
                  </div>
                ) : thumbUrl ? (
                  <img
                    src={thumbUrl}
                    alt="Clip thumbnail"
                    className="w-full h-full object-cover"
                  />
                ) : clip.video_url ? (
                  <video 
                    src={clip.video_url} 
                    className="w-full h-full object-cover"
                    controls
                  ></video>
                ) : (
                  /* Ready but no direct URL - go to Library */
                  <div 
                    className="flex flex-col items-center justify-center gap-3 p-6 cursor-pointer group/ready"
                    onClick={() => setActiveTab("library")}
                  >
                    <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center group-hover/ready:scale-110 transition-transform">
                      <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-[11px] font-bold text-white uppercase tracking-wider font-af">Clip Ready!</p>
                      <p className="text-[10px] text-zinc-400 font-af">Click to view in Library →</p>
                    </div>
                  </div>
                )}
                
                {/* Duration Badge */}
                <div className="absolute top-3 right-3 bg-night-sky/80 border border-rich-black px-2 py-0.5 rounded-full text-[9px] font-bold text-canvas-white flex items-center gap-1 font-af">
                  <Clock className="w-2.5 h-2.5 text-[#00C2FF]" />
                  {clipDuration > 0 ? `${clipDuration}s` : "—"}
                </div>

                {/* Viral Score Badge */}
                <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 text-canvas-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-0.5 font-af">
                  <Flame className="w-2.5 h-2.5 fill-current" />
                  <span>🔥 {clip.score || 0}</span>
                </div>

                {/* Platform indicators */}
                <div className="absolute bottom-3 left-3 flex gap-1 bg-black/40 px-2 py-1 rounded-lg backdrop-blur-sm border border-canvas-white/10">
                  <Smartphone className="w-3 h-3 text-canvas-white" />
                  <Monitor className="w-3 h-3 text-canvas-white/60" />
                  <Square className="w-3 h-3 text-canvas-white/60" />
                </div>
              </div>

              {/* Metadata Action Box */}
              <div className="p-4 space-y-3.5 bg-canvas-white dark:bg-[#1A1A24] border-t border-cool-gray dark:border-zinc-800">
                <p className="text-[11px] text-charcoal dark:text-zinc-300 font-af italic line-clamp-2 leading-relaxed h-8 text-left">
                  &quot;{clipTranscriptText(clip.transcript)}&quot;
                </p>
                
                <div className="flex gap-2">
                  {isProcessing ? (
                    <button 
                      disabled
                      className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-700 py-2 rounded-lg font-bold flex items-center justify-center gap-1 text-[10px] font-af cursor-not-allowed"
                    >
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Processing...</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setActiveTab("library")}
                        className="flex-1 bg-ash-gray dark:bg-zinc-800 text-dark-charcoal dark:text-canvas-white border border-steel-gray dark:border-zinc-700 hover:bg-cool-gray py-2 rounded-lg font-bold flex items-center justify-center gap-1 text-[10px] font-af transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3 text-[#534AB7]" />
                        <span>View in Library</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
