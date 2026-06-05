"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  X, Download, Calendar, Trash2, Edit2, Copy, Check, Play, 
  Smartphone, Share2, Award, FileText, CheckCircle2 
} from "lucide-react";
import { getThumbnailUrl } from "@/lib/storage";
import { getBackendUrl } from "@/lib/api";

interface TranscriptLine {
  time: string;
  text: string;
}

const FALLBACK_TRANSCRIPT: TranscriptLine[] = [
  { time: "0:01", text: "This is exactly why you need to optimize your video setup." },
  { time: "0:05", text: "When I first started, my clips were getting zero views." },
  { time: "0:09", text: "But then I discovered this one simple editing framework." },
  { time: "0:14", text: "And it completely changed how my retention graphs looked." },
];

function formatSecondsAsTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Supports array lines, { text, start_time, end_time } objects, and plain strings. */
function normalizeTranscript(raw: unknown): TranscriptLine[] {
  if (raw == null || raw === "") return FALLBACK_TRANSCRIPT;

  let value: unknown = raw;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return FALLBACK_TRANSCRIPT;
    try {
      value = JSON.parse(trimmed);
    } catch {
      return [{ time: "0:00", text: trimmed }];
    }
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return FALLBACK_TRANSCRIPT;
    return value.map((t, i) => {
      if (typeof t === "string") {
        return { time: formatSecondsAsTime(i * 5), text: t };
      }
      if (t && typeof t === "object") {
        const row = t as { time?: string; text?: string; start?: number; start_time?: number };
        const startSec = row.start_time ?? row.start;
        return {
          time: row.time ?? (startSec != null ? formatSecondsAsTime(startSec) : formatSecondsAsTime(i * 5)),
          text: row.text ?? String(t),
        };
      }
      return { time: formatSecondsAsTime(i * 5), text: String(t) };
    });
  }

  if (value && typeof value === "object") {
    const obj = value as { text?: string; start_time?: number; end_time?: number };
    const text = obj.text?.trim();
    if (text) {
      const time =
        obj.start_time != null ? formatSecondsAsTime(obj.start_time) : "0:00";
      return [{ time, text }];
    }
  }

  if (typeof value === "string" && value.trim()) {
    return [{ time: "0:00", text: value.trim() }];
  }

  return FALLBACK_TRANSCRIPT;
}

interface VideoPlayerModalProps {
  clip: any;
  videoUrl: string;
  onClose: () => void;
  onDelete: (clip: any) => void;
  onDownload: (clip: any) => void;
}

export default function VideoPlayerModal({ 
  clip, 
  videoUrl, 
  onClose, 
  onDelete, 
  onDownload 
}: VideoPlayerModalProps) {
  const router = useRouter();
  const [isCopiedTitle, setIsCopiedTitle] = useState<number | null>(null);
  const [isCopiedHash, setIsCopiedHash] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(clip.title);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleEditClick = () => {
    router.push(`/editor?videoUrl=${encodeURIComponent(videoUrl)}`);
  };

  const posterUrl = clip.id ? getThumbnailUrl(clip.id) : undefined;

  useEffect(() => {
    setVideoError(null);
    setVideoReady(false);
  }, [videoUrl]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !videoUrl) return;
    el.load();
    const playAttempt = el.play();
    if (playAttempt) {
      playAttempt.catch(() => {
        /* Autoplay blocked until user presses play — controls still work */
      });
    }
  }, [videoUrl]);

  // Fallbacks for AI Metadata
  const mockAiTitles: string[] = clip.ai_titles && clip.ai_titles.length > 0 
    ? clip.ai_titles 
    : [
        "You NEED to try this viral trick 🤯",
        "The secret to perfect high-retention video 💡",
        "Stop making this common studio mistake 🛑",
        "How I fixed my terrible video quality 🚀"
      ];

  const mockHashtags: string[] = clip.ai_hashtags && clip.ai_hashtags.length > 0
    ? clip.ai_hashtags
    : ["#ContentCreator", "#ShortsCreator", "#VideoTips", "#EditingTricks", "#ViralVideo", "#TechTok"];

  const formattedTranscript = normalizeTranscript(clip.transcript);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "from-red-500 to-rose-600 text-white shadow-red-500/25";
    if (score >= 70) return "from-orange-500 to-amber-600 text-white shadow-orange-500/25";
    return "from-[#534AB7] to-[#7C73EB] text-white shadow-[#534AB7]/25";
  };

  const handleCopyTitle = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setIsCopiedTitle(index);
    setTimeout(() => setIsCopiedTitle(null), 2000);
  };

  const handleCopyHash = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopiedHash(text);
    setTimeout(() => setIsCopiedHash(null), 2000);
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return "Unknown Size";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 font-af">
      <div className="relative bg-white dark:bg-[#121217] w-full max-w-5xl rounded-[32px] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] border border-cool-gray dark:border-zinc-800 animate-in fade-in zoom-in duration-300">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-50 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-slate-gray dark:text-zinc-400"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT PANEL — Phone Frame Video Player */}
        <div className="w-full md:w-[40%] bg-zinc-950 dark:bg-[#09090C] p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-cool-gray dark:border-zinc-850">
          
          <div className="relative w-[280px] aspect-[9/16] rounded-[36px] overflow-hidden bg-black border-[10px] border-zinc-800 dark:border-zinc-900 shadow-2xl shadow-black/50 flex items-center justify-center">
            
            {/* Phone notch/island */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-zinc-900 rounded-full z-30"></div>
            
            {videoError ? (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 p-4 text-center bg-zinc-900">
                <p className="text-xs font-bold text-red-400">Video failed to load</p>
                <p className="text-[10px] text-zinc-500">{videoError}</p>
              </div>
            ) : !videoReady && videoUrl ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-900">
                <div className="w-8 h-8 border-2 border-[#534AB7]/30 border-t-[#534AB7] rounded-full animate-spin" />
              </div>
            ) : null}

            {videoUrl ? (
              <video
                ref={videoRef}
                key={videoUrl}
                src={videoUrl}
                poster={posterUrl}
                controls
                autoPlay
                muted
                playsInline
                loop
                preload="auto"
                crossOrigin="anonymous"
                className="w-full h-full object-cover relative z-0"
                onLoadedData={() => setVideoReady(true)}
                onError={async (e) => {
                  const mediaError = e.currentTarget.error;
                  console.error("Video player error code:", mediaError?.code, "message:", mediaError?.message);
                  
                  // Try to fetch the stream URL directly to get a proper error message
                  let errorMsg = "Could not load video. Try again or re-open from Library.";
                  try {
                    const resp = await fetch(videoUrl, { method: "HEAD" });
                    if (resp.status === 202) {
                      errorMsg = "Clip is still processing. Please wait and try again.";
                    } else if (resp.status === 410) {
                      errorMsg = "Video file expired and was cleaned up. Please regenerate the clip.";
                    } else if (resp.status === 422) {
                      errorMsg = "Clip processing failed. Please try regenerating.";
                    } else if (resp.status === 404) {
                      errorMsg = "Video file not found. It may have been deleted.";
                    } else if (!resp.ok) {
                      const body = await resp.text().catch(() => "");
                      try {
                        const json = JSON.parse(body);
                        errorMsg = json.detail || errorMsg;
                      } catch { /* ignore parse errors */ }
                    }
                  } catch {
                    // Network error — use the media error info
                    if (mediaError) {
                      if (mediaError.code === 1) errorMsg = "Playback aborted by user.";
                      else if (mediaError.code === 2) errorMsg = "Network error while downloading video.";
                      else if (mediaError.code === 3) errorMsg = "Video decoding failed (corrupt file or unsupported codec).";
                      else if (mediaError.code === 4) errorMsg = "Format not supported or video file not found.";
                    }
                  }
                  setVideoError(errorMsg);
                }}
              >
                {/* Load SRT captions if available */}
                <track
                  kind="subtitles"
                  src={getBackendUrl(`/api/clips/${clip.id}/captions`)}
                  srcLang="en"
                  label="English"
                  default
                  onError={() => console.warn("Captions failed to load for clip", clip.id)}
                />
              </video>
            ) : (
              <p className="text-xs text-zinc-500 p-4 text-center">No video URL</p>
            )}
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
            <Smartphone className="w-3.5 h-3.5 text-[#00C2FF]" />
            <span>9:16 Mobile Aspect Preview</span>
          </div>
        </div>

        {/* RIGHT PANEL — Video Metadata & AI Suggestions */}
        <div className="w-full md:w-[60%] flex flex-col max-h-[90vh] bg-white dark:bg-[#121217]">
          
          {/* Panel Header */}
          <div className="p-6 border-b border-cool-gray dark:border-zinc-800 text-left space-y-3">
            
            {/* Platform & Viral Score */}
            <div className="flex items-center gap-2">
              <span className="bg-[#534AB7]/10 text-[#534AB7] dark:bg-[#534AB7]/20 dark:text-[#8076E5] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border border-[#534AB7]/20">
                {clip.aspect_ratio || "9:16"} Shorts
              </span>
              
              <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-gradient-to-r shadow-sm ${getScoreColor(clip.viral_score)}`}>
                <Award className="w-3 h-3 text-white" />
                <span>Viral Score: {clip.viral_score}</span>
              </div>
            </div>

            {/* Title (Editable) */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2 w-full">
                    <input 
                      type="text" 
                      value={editedTitle} 
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="text-xl font-bold bg-zinc-50 dark:bg-zinc-900 border border-[#534AB7] rounded-lg px-3 py-1.5 focus:outline-none w-full text-pitch-black dark:text-white"
                      autoFocus
                    />
                    <button 
                      onClick={() => setIsEditingTitle(false)}
                      className="p-2 bg-[#534AB7] text-white rounded-lg hover:scale-105 transition-transform"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <h2 className="text-xl font-ppmondwest md:text-2xl text-pitch-black dark:text-canvas-white font-normal truncate flex items-center gap-2 group">
                    {editedTitle}
                    <button 
                      onClick={() => setIsEditingTitle(true)}
                      className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-slate-gray opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </h2>
                )}
                <p className="text-xs text-slate-gray mt-1">Source: <span className="font-bold">{clip.source_title || "Uploaded Video"}</span></p>
              </div>
            </div>
          </div>

          {/* Panel Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
            
            {/* Metadata Stats */}
            <div className="grid grid-cols-3 gap-4 bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-2xl border border-cool-gray dark:border-zinc-850">
              <div>
                <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-gray dark:text-zinc-500">Duration</h4>
                <p className="text-sm font-bold text-pitch-black dark:text-zinc-200 mt-0.5">
                  {Math.floor((clip.duration_seconds || 0) / 60)}:
                  {String((clip.duration_seconds || 0) % 60).padStart(2, '0')}
                </p>
              </div>
              <div>
                <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-gray dark:text-zinc-500">File Size</h4>
                <p className="text-sm font-bold text-pitch-black dark:text-zinc-200 mt-0.5">{formatBytes(clip.file_size_bytes)}</p>
              </div>
              <div>
                <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-gray dark:text-zinc-500">FPS / Resolution</h4>
                <p className="text-sm font-bold text-pitch-black dark:text-zinc-200 mt-0.5">{clip.fps || 30}fps • {clip.resolution || "1080x1920"}</p>
              </div>
            </div>

            {/* Clickable Transcripts / Captions */}
            <div className="space-y-2">
              <h3 className="font-bold text-sm text-pitch-black dark:text-zinc-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#534AB7]" />
                <span>Interactive Transcript</span>
              </h3>
              <div className="max-h-[160px] overflow-y-auto border border-cool-gray dark:border-zinc-850 rounded-2xl p-4 space-y-2.5 bg-zinc-50/50 dark:bg-[#1A1A24]/30 scrollbar-thin">
                {formattedTranscript.map((t, i) => (
                  <div key={i} className="flex gap-2.5 hover:bg-[#534AB7]/5 dark:hover:bg-[#534AB7]/10 p-1.5 rounded-lg transition-colors cursor-pointer group">
                    <span className="text-xs font-bold text-[#534AB7] bg-[#534AB7]/10 px-1.5 py-0.5 rounded h-fit self-start shrink-0">
                      {t.time}
                    </span>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-af flex-1">{t.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Generated Titles */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-pitch-black dark:text-zinc-200 flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-[#534AB7]" />
                <span>AI Suggested Titles</span>
              </h3>
              <div className="space-y-2">
                {mockAiTitles.map((titleText, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-2.5 border border-cool-gray dark:border-zinc-850 hover:border-[#534AB7]/50 rounded-xl bg-zinc-50/20 hover:bg-[#534AB7]/5 transition-all group"
                  >
                    <span className="text-xs text-zinc-800 dark:text-zinc-350 pr-4">{titleText}</span>
                    <button 
                      onClick={() => handleCopyTitle(titleText, idx)}
                      className="p-1.5 bg-white dark:bg-zinc-800 border border-cool-gray dark:border-zinc-700 rounded-lg shadow-sm hover:scale-[1.05] active:scale-[0.95] transition-all cursor-pointer"
                    >
                      {isCopiedTitle === idx ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-gray dark:text-zinc-400" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Smart Hashtags */}
            <div className="space-y-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-gray dark:text-zinc-500">Viral Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {mockHashtags.map((tag) => (
                  <button 
                    key={tag}
                    onClick={() => handleCopyHash(tag)}
                    className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-850 text-slate-gray dark:text-zinc-400 hover:bg-[#534AB7] hover:text-white transition-colors"
                  >
                    <span>{tag}</span>
                    {isCopiedHash === tag ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3 opacity-30 group-hover:opacity-100" />
                    )}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Bottom Action Footer Strip */}
          <div className="p-4 border-t border-cool-gray dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-[#1A1A24] shrink-0">
            <button 
              onClick={() => onDelete(clip)}
              className="flex items-center gap-1.5 px-4 py-2 hover:bg-red-500/10 text-red-500 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Clip</span>
            </button>

            <div className="flex items-center gap-2">
              <button 
                onClick={handleEditClick}
                className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-zinc-800 border border-cool-gray dark:border-zinc-700 hover:border-[#534AB7] text-charcoal dark:text-zinc-300 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <Edit2 className="w-4 h-4 text-[#534AB7]" />
                <span>Edit Clip</span>
              </button>

              <button 
                onClick={() => onDownload(clip)}
                className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-zinc-800 border border-cool-gray dark:border-zinc-700 hover:border-[#534AB7] text-charcoal dark:text-zinc-300 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#534AB7]" />
                <span>Download</span>
              </button>
              
              <button 
                className="flex items-center gap-1.5 px-4 py-2 bg-[#534AB7] hover:bg-[#433A97] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Schedule Clip</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
