"use client";

import { useState, useRef } from "react";
import { Play, Download, Edit2, MoreVertical, Smartphone, Music, FileText, Film, Trash2, Scissors } from "lucide-react";
import { getThumbnailUrl } from "@/lib/storage";
import { getBackendUrl } from "@/lib/api";

interface ClipGridProps {
  clips: any[];
  selectedClips: string[];
  toggleSelection: (id: string) => void;
  onOpenDetail: (id: string) => void;
  onPlayClick: (clip: any) => void;
  onDownloadClick: (clip: any) => void;
  onDeleteClick: (clip: any) => void;
}

export default function ClipGrid({ 
  clips, 
  selectedClips, 
  toggleSelection, 
  onOpenDetail,
  onPlayClick,
  onDownloadClick,
  onDeleteClick
}: ClipGridProps) {
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-red-500 text-white shadow-red-500/30";
    if (score >= 70) return "bg-orange-500 text-white shadow-orange-500/30";
    return "bg-blue-500 text-white shadow-blue-500/30";
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24 text-left">
      {clips.map(clip => {
        const isSelected = selectedClips.includes(clip.id);
        return (
          <ClipCard 
            key={clip.id}
            clip={clip}
            isSelected={isSelected}
            toggleSelection={toggleSelection}
            onOpenDetail={onOpenDetail}
            onPlayClick={onPlayClick}
            onDownloadClick={onDownloadClick}
            onDeleteClick={onDeleteClick}
            getScoreColor={getScoreColor}
            formatDuration={formatDuration}
          />
        );
      })}
    </div>
  );
}

// Separate ClipCard Component to manage hover video preview states
function ClipCard({
  clip,
  isSelected,
  toggleSelection,
  onOpenDetail,
  onPlayClick,
  onDownloadClick,
  onDeleteClick,
  getScoreColor,
  formatDuration
}: {
  clip: any;
  isSelected: boolean;
  toggleSelection: (id: string) => void;
  onOpenDetail: (id: string) => void;
  onPlayClick: (clip: any) => void;
  onDownloadClick: (clip: any) => void;
  onDeleteClick: (clip: any) => void;
  getScoreColor: (score: number) => string;
  formatDuration: (sec: number) => string;
}) {
  const [hoverUrl, setHoverUrl] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Robust getters
  const thumbUrl = clip.status === "ready"
    ? getThumbnailUrl(clip.id) 
    : null;

  const durationSec = clip.duration_seconds !== undefined 
    ? clip.duration_seconds 
    : (clip.duration || 0);

  const scoreVal = clip.viral_score !== undefined 
    ? clip.viral_score 
    : (clip.score || 0);

  const titleText = clip.title || "Untitled Clip";
  const sourceTitle = clip.source_title || clip.source || "Unknown Video";
  const statusStr = clip.status || "ready";

  const handleMouseEnter = () => {
    if (statusStr !== "ready") return;
    setIsHovering(true);
    
    if (!hoverUrl && clip.id) {
      const url = getBackendUrl(`/api/clips/${clip.id}/stream`);
      setHoverUrl(url);
    }
    
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().catch(() => {/* AbortError from quick hover — ignore */});
      }
    }, 150);
  };

  const isExpired = statusStr === "expired";

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div 
      className={`group relative bg-white dark:bg-[#1A1A24] border rounded-[20px] overflow-hidden transition-all duration-300 hover:shadow-lg ${
        isSelected ? "border-[#534AB7] ring-2 ring-[#534AB7]/50" : "border-cool-gray dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Thumbnail / Video Preview Area */}
      <div 
        className="relative aspect-[9/16] md:aspect-video w-full bg-zinc-950 overflow-hidden cursor-pointer flex items-center justify-center"
        onClick={() => statusStr === "ready" && onPlayClick(clip)}
      >
        {/* Real video preview on hover */}
        {statusStr === "ready" && hoverUrl && (
          <video
            ref={videoRef}
            src={hoverUrl}
            muted
            loop
            playsInline
            className={`w-full h-full object-cover transition-opacity duration-300 absolute inset-0 z-10 ${
              isHovering ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />
        )}

        {/* Loading Spinner for video fetch */}
        {isLoadingPreview && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Show thumbnail / fallback when not hovering */}
        {thumbUrl ? (
          <img 
            src={thumbUrl} 
            alt={titleText}
            crossOrigin="anonymous"
            className={`w-full h-full object-cover transition-all duration-550 ${
              isHovering && hoverUrl ? "opacity-0" : "opacity-80 group-hover:opacity-100 group-hover:scale-105"
            }`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 border border-cool-gray dark:border-zinc-850">
            <Film className="w-8 h-8 text-zinc-600 dark:text-zinc-500 mb-2 animate-pulse" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              {statusStr === "processing" ? "Processing Clip..." : "No Preview"}
            </span>
          </div>
        )}
        
        {/* Play Overlay */}
        {statusStr === "ready" && (
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 z-10">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 hover:scale-110 transition-transform">
              <Play className="w-5 h-5 text-white ml-1 fill-current" />
            </div>
          </div>
        )}

        {/* Expired overlay */}
        {isExpired && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20 gap-2">
            <span className="text-3xl">⏰</span>
            <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest">Expired after 24h</span>
          </div>
        )}

        {/* Status indicator bar for Processing */}
        {statusStr === "processing" && (
          <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl flex items-center gap-2 border border-white/10 shadow-lg">
            <div className="w-3.5 h-3.5 border-2 border-[#00C2FF] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[10px] font-bold text-white uppercase tracking-wider font-af">AI Cutting & Transcribing...</span>
          </div>
        )}

        {/* Top Badges */}
        {statusStr === "ready" && (
          <>
            <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
              <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-white text-xs font-bold font-af flex items-center gap-1">
                <Play className="w-3 h-3 fill-current" /> {formatDuration(durationSec)}
              </div>
            </div>

            <div className="absolute top-3 right-3 z-20">
              <div className={`px-2.5 py-1 rounded-md text-xs font-black font-af flex items-center gap-1 shadow-md ${getScoreColor(scoreVal)}`}>
                🔥 {scoreVal}
              </div>
            </div>
          </>
        )}

        {/* Selection Checkbox */}
        <div 
          className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity z-20" 
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <input 
            type="checkbox" 
            checked={isSelected}
            onChange={() => toggleSelection(clip.id)}
            className="w-5 h-5 accent-[#534AB7] cursor-pointer rounded-lg border border-white/20"
          />
        </div>
      </div>

      {/* Info Body */}
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 
              className="font-bold text-pitch-black dark:text-canvas-white text-sm line-clamp-1 cursor-pointer hover:text-[#534AB7]" 
              onClick={() => onOpenDetail(clip.id)}
            >
              {titleText}
            </h3>
            <p className="text-xs text-slate-gray dark:text-zinc-500 font-af mt-0.5 line-clamp-1">
              From: {sourceTitle}
            </p>
          </div>
        </div>

        {/* Icons Row */}
        <div className="flex items-center gap-2 text-slate-gray dark:text-zinc-500">
          <Smartphone className="w-3.5 h-3.5" />
          {clip.has_captions && <FileText className="w-3.5 h-3.5" />}
          {clip.has_music && <Music className="w-3.5 h-3.5" />}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-cool-gray dark:border-zinc-800">
          <span className="text-[10px] text-slate-gray dark:text-zinc-500 font-bold uppercase tracking-wider font-af">
            {clip.created_at ? new Date(clip.created_at).toLocaleDateString([], {month: 'short', day: 'numeric'}) : "Just now"}
          </span>

          <div className="flex items-center gap-1">
            {statusStr === "ready" && (
              <>
                <button 
                  onClick={() => onDownloadClick(clip)}
                  title="Download MP4"
                  className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-slate-gray dark:text-zinc-400 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => {
                    const videoUrl = getBackendUrl(`/api/clips/${clip.id}/stream`);
                    window.location.href = `/editor?videoUrl=${encodeURIComponent(videoUrl)}`;
                  }}
                  title="Open in Video Editor"
                  className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-slate-gray dark:text-zinc-400 transition-colors cursor-pointer"
                >
                  <Scissors className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onOpenDetail(clip.id)}
                  title="Edit Transcript & AI Meta"
                  className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-slate-gray dark:text-zinc-400 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button 
              onClick={() => onDeleteClick(clip)}
              title="Delete Forever"
              className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-lg text-slate-gray dark:text-zinc-400 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
