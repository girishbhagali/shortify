"use client";

import { useState, useRef } from "react";
import { Play, Download, Edit2, MoreVertical, Smartphone, FileText, Music, Film, Trash2, Scissors } from "lucide-react";
import { getThumbnailUrl } from "@/lib/storage";
import { getBackendUrl } from "@/lib/api";

interface ClipListProps {
  clips: any[];
  selectedClips: string[];
  toggleSelection: (id: string) => void;
  onOpenDetail: (id: string) => void;
  onPlayClick: (clip: any) => void;
  onDownloadClick: (clip: any) => void;
  onDeleteClick: (clip: any) => void;
}

export default function ClipList({ 
  clips, 
  selectedClips, 
  toggleSelection, 
  onOpenDetail,
  onPlayClick,
  onDownloadClick,
  onDeleteClick
}: ClipListProps) {
  
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
    <div className="w-full overflow-x-auto pb-24 text-left">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="border-b border-cool-gray dark:border-zinc-800 text-[10px] font-bold text-slate-gray dark:text-zinc-500 uppercase tracking-wider font-af">
            <th className="p-4 w-12">
              <input type="checkbox" className="w-4 h-4 accent-[#534AB7]" />
            </th>
            <th className="p-4">Clip</th>
            <th className="p-4">Duration</th>
            <th className="p-4">Score</th>
            <th className="p-4">Platforms</th>
            <th className="p-4">Created</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {clips.map(clip => {
            const isSelected = selectedClips.includes(clip.id);
            return (
              <ClipRow 
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
        </tbody>
      </table>
    </div>
  );
}

// Separate Row component to manage hover preview states in list view
function ClipRow({
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
        videoRef.current.play().catch(e => console.log("Play failed: ", e));
      }
    }, 150);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <tr 
      className={`border-b border-cool-gray dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-[#1A1A24] transition-colors ${
        isSelected ? "bg-[#534AB7]/5 dark:bg-[#534AB7]/10" : ""
      }`}
    >
      <td className="p-4">
        <input 
          type="checkbox" 
          checked={isSelected}
          onChange={() => toggleSelection(clip.id)}
          className="w-4 h-4 accent-[#534AB7] cursor-pointer" 
        />
      </td>
      
      {/* Thumbnail + Info Cell */}
      <td className="p-4 cursor-pointer" onClick={() => statusStr === "ready" && onPlayClick(clip)}>
        <div className="flex items-center gap-4">
          
          {/* Square aspect thumbnail container with hover preview */}
          <div 
            className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-950 shrink-0 flex items-center justify-center border border-cool-gray dark:border-zinc-800"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
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
                <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {/* Thumbnail/Fallback */}
            {thumbUrl ? (
              <img 
                src={thumbUrl} 
                alt={titleText} 
                className={`w-full h-full object-cover transition-all duration-300 ${
                  isHovering && hoverUrl ? "opacity-0" : "opacity-80"
                }`} 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                <Film className={`w-5 h-5 text-zinc-600 ${statusStr === "processing" ? "animate-pulse" : ""}`} />
              </div>
            )}

            {/* Processing Spinner Overlay */}
            {statusStr === "processing" && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-[#00C2FF] border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {/* Play Button Icon */}
            {statusStr === "ready" && (
              <div className="absolute inset-0 flex items-center justify-center z-10 group-hover:bg-black/20 transition-all">
                <Play className="w-4 h-4 text-white opacity-80 drop-shadow-md" />
              </div>
            )}
          </div>
          
          <div className="min-w-0">
            <h3 className="font-bold text-pitch-black dark:text-canvas-white text-sm hover:text-[#534AB7] truncate max-w-[300px]">
              {titleText}
            </h3>
            <p className="text-xs text-slate-gray dark:text-zinc-500 font-af truncate max-w-[250px]">
              From: {sourceTitle}
            </p>
            {statusStr === "processing" && (
              <span className="text-[9px] text-[#00C2FF] font-black uppercase tracking-wider mt-0.5 inline-block">AI Transcribing & Rendering...</span>
            )}
          </div>
        </div>
      </td>

      <td className="p-4 text-sm font-af text-pitch-black dark:text-zinc-300">
        {statusStr === "ready" ? formatDuration(durationSec) : "—"}
      </td>

      <td className="p-4">
        {statusStr === "ready" ? (
          <div className={`inline-flex px-2 py-1 rounded-md text-xs font-black font-af items-center gap-1 shadow-sm ${getScoreColor(scoreVal)}`}>
            🔥 {scoreVal}
          </div>
        ) : (
          <span className="text-xs text-slate-gray">—</span>
        )}
      </td>

      <td className="p-4">
        <div className="flex items-center gap-2 text-slate-gray dark:text-zinc-500">
          <Smartphone className="w-4 h-4" />
          {clip.has_captions && <FileText className="w-4 h-4" />}
          {clip.has_music && <Music className="w-4 h-4" />}
        </div>
      </td>

      <td className="p-4 text-xs font-af text-slate-gray dark:text-zinc-500 font-bold">
        {clip.created_at ? new Date(clip.created_at).toLocaleDateString([], {month: 'short', day: 'numeric'}) : "Just now"}
      </td>

      <td className="p-4 text-right">
        <div className="flex items-center justify-end gap-1">
          {statusStr === "ready" && (
            <>
              <button 
                onClick={() => onDownloadClick(clip)}
                title="Download MP4"
                className="p-1.5 hover:bg-white dark:hover:bg-zinc-800 rounded-lg text-slate-gray dark:text-zinc-400 transition-colors shadow-sm border border-transparent hover:border-cool-gray dark:hover:border-zinc-700 cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  const videoUrl = getBackendUrl(`/api/clips/${clip.id}/stream`);
                  window.location.href = `/editor?videoUrl=${encodeURIComponent(videoUrl)}`;
                }}
                title="Open in Video Editor"
                className="p-1.5 hover:bg-white dark:hover:bg-zinc-800 rounded-lg text-slate-gray dark:text-zinc-400 transition-colors shadow-sm border border-transparent hover:border-cool-gray dark:hover:border-zinc-700 cursor-pointer"
              >
                <Scissors className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onOpenDetail(clip.id)}
                title="Edit Transcript & AI Meta"
                className="p-1.5 hover:bg-white dark:hover:bg-zinc-800 rounded-lg text-slate-gray dark:text-zinc-400 transition-colors shadow-sm border border-transparent hover:border-cool-gray dark:hover:border-zinc-700 cursor-pointer"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </>
          )}
          <button 
            onClick={() => onDeleteClick(clip)}
            title="Delete Forever"
            className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-lg text-slate-gray dark:text-zinc-400 transition-colors shadow-sm border border-transparent cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
