"use client";

import { motion } from "framer-motion";
import { 
  Flame, Clock, Smartphone, Monitor, Square, Tv, 
  Download, Edit2, Play, ChevronRight 
} from "lucide-react";
import Link from "next/link";
import { UseDashboardType } from "../../hooks/useDashboard";

interface RecentClipsProps {
  hook: UseDashboardType;
}

export default function RecentClips({ hook }: RecentClipsProps) {
  const { clips } = hook;

  if (!clips || clips.length === 0) return null;

  return (
    <section className="space-y-4 text-left pt-6" id="recent-clips-section">
      <div className="flex items-center justify-between">
        <h3 className="font-ppmondwest text-2xl text-pitch-black dark:text-canvas-white font-normal tracking-[-0.0200em]">Recent Clips</h3>
        <button className="flex items-center gap-1 text-xs font-bold text-[#534AB7] dark:text-[#00C2FF] hover:underline font-af cursor-pointer">
          <span>View All</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Horizontal Scroll Area */}
      <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-cool-gray">
        {clips.map((clip, idx) => (
          <motion.div
            key={clip.clip_number}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="flex-shrink-0 w-72 bg-off-white dark:bg-[#1A1A24] border border-steel-gray dark:border-zinc-800 rounded-[20px] overflow-hidden shadow-subtle-2 hover:shadow-subtle-3 transition-shadow"
          >
            {/* Thumbnail Preview Area */}
            <div className="relative aspect-[9/16] bg-pitch-black group">
              <video 
                src={clip.video_url} 
                className="w-full h-full object-cover"
                controls
              ></video>
              
              {/* Duration Badge */}
              <div className="absolute top-3 right-3 bg-night-sky/80 border border-rich-black px-2 py-0.5 rounded-full text-[9px] font-bold text-canvas-white flex items-center gap-1 font-af">
                <Clock className="w-2.5 h-2.5 text-[#00C2FF]" />
                {Math.round(clip.duration)}s
              </div>

              {/* Viral Score Badge */}
              <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 text-canvas-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-0.5 font-af">
                <Flame className="w-2.5 h-2.5 fill-current" />
                <span>🔥 {clip.score}</span>
              </div>

              {/* Platform indicators Overlay */}
              <div className="absolute bottom-3 left-3 flex gap-1 bg-black/40 px-2 py-1 rounded-lg backdrop-blur-sm border border-canvas-white/10">
                <Smartphone className="w-3 h-3 text-canvas-white" />
                <Monitor className="w-3 h-3 text-canvas-white/60" />
                <Square className="w-3 h-3 text-canvas-white/60" />
              </div>
            </div>

            {/* Metadata Action Box */}
            <div className="p-4 space-y-3.5 bg-canvas-white dark:bg-[#1A1A24] border-t border-cool-gray dark:border-zinc-800">
              <p className="text-[11px] text-charcoal dark:text-zinc-300 font-af italic line-clamp-2 leading-relaxed h-8 text-left">
                &quot;{clip.transcript}&quot;
              </p>
              
              <div className="flex gap-2">
                <Link
                  href={`/editor?videoUrl=${encodeURIComponent(clip.video_url)}`}
                  className="flex-1 bg-ash-gray dark:bg-zinc-800 text-dark-charcoal dark:text-canvas-white border border-steel-gray dark:border-zinc-700 hover:bg-cool-gray py-2 rounded-lg font-bold flex items-center justify-center gap-1 text-[10px] font-af transition-colors"
                >
                  <Edit2 className="w-3 h-3 text-[#534AB7]" />
                  <span>Edit</span>
                </Link>
                <a 
                  href={clip.video_url} 
                  download={`shortify_clip_${clip.clip_number}.mp4`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-night-sky hover:bg-rich-black text-canvas-white py-2 rounded-lg font-bold flex items-center justify-center gap-1 text-[10px] font-af transition-colors shadow-sm"
                >
                  <Download className="w-3 h-3 text-canvas-white" />
                  <span>Get HD</span>
                </a>
              </div>
            </div>

          </motion.div>
        ))}
      </div>
    </section>
  );
}
