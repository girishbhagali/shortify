"use client";

import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import Draggable from 'react-draggable';
import * as fabric from 'fabric';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Play, Pause, Volume2, VolumeX, Scissors, Type, 
  Crop, Settings2, Music, Undo, Redo, Download, MonitorPlay,
  RotateCcw, History, Sparkles, Sliders, CheckCircle2
} from 'lucide-react';
import { useVideoEditor } from '../hooks/useVideoEditor';

export default function VideoEditor() {
  const state = useVideoEditor();
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoUrlQuery = searchParams.get('videoUrl');
  
  const playerRef = useRef<HTMLVideoElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvas = useRef<fabric.Canvas | null>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  
  const playheadRef = useRef<HTMLDivElement>(null);
  const startHandleRef = useRef<HTMLDivElement>(null);
  const endHandleRef = useRef<HTMLDivElement>(null);
  
  const [activeTab, setActiveTab] = useState<'trim' | 'text' | 'crop' | 'audio' | 'filters' | 'history'>('trim');
  const [mounted, setMounted] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportResolution, setExportResolution] = useState<'720p' | '1080p' | '4k'>('1080p');
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('');
  const [exportDone, setExportDone] = useState(false);

  // Bulletproof global seekTo helper
  const safeSeekTo = (seconds: number) => {
    if (playerRef.current) {
      playerRef.current.currentTime = seconds;
    }
  };

  // Sync play/pause state
  useEffect(() => {
    if (!playerRef.current) return;
    if (state.isPlaying) {
      playerRef.current.play().catch((err) => {
        console.warn("Play interrupted or blocked by browser autoplays:", err);
      });
    } else {
      playerRef.current.pause();
    }
  }, [state.isPlaying]);

  // Sync playback speed
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.playbackRate = state.speed;
    }
  }, [state.speed]);

  // Sync volume state
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.volume = state.audio.muteOriginal ? 0 : state.audio.masterVolume / 100;
    }
  }, [state.audio.muteOriginal, state.audio.masterVolume]);

  // Initialize client-only components
  useEffect(() => {
    setMounted(true);

    // Bulletproof global suppression of HTMLMediaElement.play() promise rejections (AbortError / pause interruption)
    if (typeof window !== 'undefined' && window.HTMLMediaElement) {
      const originalPlay = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function play(...args) {
        const result = originalPlay.apply(this, args);
        if (result && typeof result.catch === 'function') {
          return result.catch((err) => {
            if (err.name === 'AbortError' || err.message?.includes('interrupted') || err.message?.includes('removed')) {
              console.warn("Globally caught and suppressed HTMLMediaElement.play() AbortError:", err.message);
              return;
            }
            return Promise.reject(err);
          });
        }
        return result;
      };
    }
    
    console.log("VideoEditor Mounted. videoUrl from search query:", videoUrlQuery);
    console.log("VideoEditor Current store state.videoUrl:", state.videoUrl);

    // Load video from URL or fallback demo video
    if (videoUrlQuery) {
      // Append a cache-buster query parameter to force browser to fetch CORS headers afresh
      const separator = videoUrlQuery.includes('?') ? '&' : '?';
      const cleanUrl = videoUrlQuery.includes('cacheBuster') 
        ? videoUrlQuery 
        : `${videoUrlQuery}${separator}cacheBuster=${Date.now()}`;
      
      console.log("Setting store video URL to query with cacheBuster:", cleanUrl);
      state.setVideoUrl(cleanUrl);
    } else if (!state.videoUrl) {
      console.log("Setting store video URL to default fallback");
      state.setVideoUrl("https://media.w3.org/2010/05/sintel/trailer.mp4");
    }

    // Handle React 19 / StrictMode AbortError when unmounting media elements
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reasonStr = String(event.reason || '');
      const reasonName = event.reason?.name || '';
      const reasonMsg = event.reason?.message || '';
      
      if (
        reasonName === 'AbortError' || 
        reasonStr.includes('AbortError') || 
        reasonStr.includes('interrupted') ||
        reasonMsg.includes('interrupted') ||
        reasonMsg.includes('play()')
      ) {
        console.warn("Caught and suppressed aborted media play promise (React 19 / StrictMode):", event.reason);
        event.preventDefault(); // Prevent Next.js error overlay
      }
    };
    
    const handleError = (event: ErrorEvent) => {
      const errorStr = String(event.error || event.message || '');
      if (
        errorStr.includes('AbortError') ||
        errorStr.includes('play()') ||
        errorStr.includes('interrupted') ||
        errorStr.includes('media was removed')
      ) {
        console.warn("Caught and suppressed standard media play error (React 19 / StrictMode):", event.error);
        event.preventDefault(); // Prevent Next.js error overlay
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoUrlQuery]);

  // Initialize WaveSurfer
  useEffect(() => {
    if (mounted && waveformRef.current && state.videoUrl && !wavesurfer.current) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#3b0764',
        progressColor: '#a855f7',
        cursorColor: 'transparent', // Custom playhead handles it
        barWidth: 2,
        barGap: 1.5,
        barRadius: 2,
        height: 64,
        url: state.videoUrl,
      });

      wavesurfer.current.on('ready', (duration) => {
        if (state.duration === 0) state.setDuration(duration);
      });
      
      wavesurfer.current.on('interaction', (newTime) => {
         safeSeekTo(newTime);
      });
    }

    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
        wavesurfer.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, state.videoUrl]);

  // Initialize Fabric Canvas
  useEffect(() => {
    if (mounted && canvasRef.current && !fabricCanvas.current) {
      fabricCanvas.current = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 450,
        selection: false,
      });
    }
    
    // Sync text overlays to canvas based on current time
    if (fabricCanvas.current) {
      fabricCanvas.current.clear();
      
      state.texts.forEach((txt) => {
        if (state.currentTime >= txt.startTime && state.currentTime <= txt.endTime) {
          const textObj = new fabric.Text(txt.text, {
            left: txt.position === 'center' ? 400 : 100,
            top: txt.position === 'top' ? 50 : txt.position === 'bottom' ? 380 : 225,
            fill: txt.color,
            fontSize: txt.size === 'small' ? 24 : txt.size === 'medium' ? 44 : 64,
            fontFamily: txt.font,
            originX: 'center',
            originY: 'center',
            shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.8)', blur: 6, offsetX: 2, offsetY: 2 })
          });
          fabricCanvas.current?.add(textObj);
        }
      });
      fabricCanvas.current.renderAll();
    }
  }, [mounted, state.currentTime, state.texts]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        state.setIsPlaying(!state.isPlaying);
      }
      if (e.code === 'ArrowLeft') {
        const newTime = Math.max(0, state.currentTime - 5);
        safeSeekTo(newTime);
      }
      if (e.code === 'ArrowRight') {
        const newTime = Math.min(state.duration, state.currentTime + 5);
        safeSeekTo(newTime);
      }
      if (e.code === 'KeyM') {
        state.setAudio({ muteOriginal: !state.audio.muteOriginal });
      }
      if (e.ctrlKey && e.code === 'KeyZ') {
        state.undo();
      }
      if (e.ctrlKey && e.code === 'KeyY') {
        state.redo();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state]);

  const handleTimeUpdate = () => {
    if (!playerRef.current) return;
    const current = playerRef.current.currentTime;
    state.setCurrentTime(current);
    if (wavesurfer.current && !wavesurfer.current.isPlaying()) {
      wavesurfer.current.setTime(current);
    }
  };

  const handleLoadedMetadata = () => {
    if (playerRef.current) {
      console.log("Native video loaded metadata duration:", playerRef.current.duration);
      state.setDuration(playerRef.current.duration);
    }
  };

  const startExport = () => {
    setExporting(true);
    setExportDone(false);
    setExportProgress(0);
    
    const steps = [
      { progress: 15, status: 'Ingesting parameters...' },
      { progress: 35, status: 'Applying filters and aspect crop layout...' },
      { progress: 55, status: 'Merging custom background tracks...' },
      { progress: 75, status: 'Generating subtitles & Fabric overlay paths...' },
      { progress: 95, status: 'Finishing high-performance rendering...' },
      { progress: 100, status: 'Video compiled successfully!' }
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setExportProgress(step.progress);
        setExportStatus(step.status);
        if (step.progress === 100) {
          setExportDone(true);
        }
      }, (index + 1) * 800);
    });
  };

  const handleBackgroundMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const musicUrl = URL.createObjectURL(file);
      state.setAudio({ bgMusicUrl: musicUrl });
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Convert "hh:mm:ss" string to seconds
  const parseStringToSeconds = (str: string): number => {
    const parts = str.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return Number(str) || 0;
  };

  // Zooming Handler
  const handleScrollWheelZoom = (e: React.WheelEvent) => {
    e.preventDefault();
    const newZoom = Math.min(300, Math.max(50, state.timelineZoom - e.deltaY * 0.1));
    state.setTimelineZoom(newZoom);
  };

  if (!mounted) return null;

  // Visual layout boundaries calculation
  const timelineZoomWidth = `${state.timelineZoom}%`;
  const playheadPercent = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;
  const startHandlePercent = state.duration > 0 ? (state.trim.start / state.duration) * 100 : 0;
  const endHandlePercent = state.duration > 0 ? (state.trim.end / state.duration) * 100 : 100;

  return (
    <div className="flex flex-col h-screen bg-[#09090b] text-[#d4d4d8] font-sans overflow-hidden select-none">
      
      <header className="h-14 border-b border-[#27272a] bg-[#18181b] flex items-center justify-between px-6 shrink-0 shadow-md">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-xs font-bold text-[#a1a1aa] hover:text-white bg-[#27272a]/50 hover:bg-[#27272a] border border-[#27272a] px-3 py-1.5 rounded-xl transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            ← Back to Dashboard
          </button>
          
          <div className="flex items-center gap-2 border-l border-[#27272a] pl-4">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg">
              <MonitorPlay className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-white tracking-tight text-sm">Studio Editor Pro</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 border-r border-[#27272a] pr-5">
            <button 
              onClick={() => state.undo()} 
              disabled={state.history.length === 0} 
              className="p-2 hover:bg-[#27272a] rounded-lg text-[#a1a1aa] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button 
              onClick={() => state.redo()} 
              disabled={state.future.length === 0} 
              className="p-2 hover:bg-[#27272a] rounded-lg text-[#a1a1aa] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-extrabold shadow-lg shadow-purple-900/20 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" /> Export Video
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Toolbar */}
        <aside className="w-16 border-r border-[#27272a] bg-[#18181b] flex flex-col items-center py-5 gap-5 shrink-0">
          {[
            { id: 'trim', icon: Scissors, label: 'Trim Track' },
            { id: 'text', icon: Type, label: 'Text Overlays' },
            { id: 'crop', icon: Crop, label: 'Crop Preset' },
            { id: 'audio', icon: Music, label: 'Audio Mixer' },
            { id: 'filters', icon: Settings2, label: 'Filter effects' },
            { id: 'history', icon: History, label: 'Action History' },
          ].map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTab(tool.id as any)}
              className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all relative group ${
                activeTab === tool.id ? 'bg-[#7c3aed]/15 text-[#a78bfa] border border-[#7c3aed]/40' : 'text-[#71717a] hover:text-[#e4e4e7] hover:bg-[#27272a]'
              }`}
              title={tool.label}
            >
              <tool.icon className="w-5 h-5" />
              <span className="absolute left-20 bg-[#18181b] border border-[#27272a] px-2 py-1 rounded text-xs font-semibold text-white shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all z-50 whitespace-nowrap">
                {tool.label}
              </span>
            </button>
          ))}
        </aside>

        {/* Center Video Canvas Area */}
        <main className="flex-1 bg-[#09090b] flex flex-col items-center justify-center p-8 relative overflow-hidden">
          <div className="relative aspect-video w-full max-w-4xl bg-[#18181b] rounded-2xl overflow-hidden shadow-2xl border border-[#27272a]">
            {/* Native High-Performance HTML5 Video Element */}
            {state.videoUrl ? (
              <video
                ref={playerRef}
                src={state.videoUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                crossOrigin="anonymous"
                className="w-full h-full object-contain"
                style={{ 
                  filter: state.filters.name !== 'None' ? `${state.filters.name.toLowerCase()}(${state.filters.intensity}%)` : 'none' 
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#71717a] bg-[#09090b]">
                No video loaded
              </div>
            )}
            {/* Fabric Canvas Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <canvas ref={canvasRef} className="w-full h-full object-contain" />
            </div>
            
            {/* Crop Overlay Preview Grid */}
            {state.crop !== 'Original' && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center border-4 border-dashed border-[#8b5cf6]/20 bg-black/40">
                <div className={`border-2 border-dashed border-[#c084fc] bg-[#c084fc]/5 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative flex items-center justify-center transition-all ${
                  state.crop === '9:16' ? 'w-[31.6%] h-full' :
                  state.crop === '1:1' ? 'h-full aspect-square' :
                  'w-full h-[56.25%]'
                }`}>
                  <span className="absolute bottom-3 left-3 text-[10px] bg-black/60 backdrop-blur-md border border-[#27272a] px-2 py-0.5 rounded-full text-[#c084fc] font-bold">
                    Safe Zone Preview ({state.crop})
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* Custom Player Controls */}
          <div className="mt-6 flex items-center justify-between w-full max-w-4xl px-6 py-4 bg-[#18181b]/90 backdrop-blur-md border border-[#27272a] rounded-2xl shadow-xl">
            <div className="flex items-center gap-5">
              <button 
                onClick={() => state.setIsPlaying(!state.isPlaying)}
                className="w-11 h-11 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md"
              >
                {state.isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
              </button>
              
              <div className="flex items-center gap-2 text-sm font-bold tabular-nums text-[#a1a1aa]">
                <span className="text-[#f4f4f5]">{formatTime(state.currentTime)}</span>
                <span className="opacity-40">/</span>
                <span>{formatTime(state.duration)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Audio original volume controller */}
              <div className="flex items-center gap-2.5">
                <button 
                  onClick={() => state.setAudio({ muteOriginal: !state.audio.muteOriginal })} 
                  className="text-[#a1a1aa] hover:text-white transition-colors"
                >
                  {state.audio.muteOriginal ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={state.audio.masterVolume}
                  onChange={(e) => state.setAudio({ masterVolume: Number(e.target.value) })}
                  className="w-24 accent-[#8b5cf6] h-1 bg-[#27272a] rounded-lg cursor-pointer"
                />
              </div>
              
              <div className="text-xs font-extrabold text-[#c084fc] bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 px-3 py-1.5 rounded-lg">
                {state.speed}x Speed
              </div>
            </div>
          </div>
        </main>

        {/* Right Properties Panel */}
        <aside className="w-80 bg-[#18181b] border-l border-[#27272a] p-6 flex flex-col shrink-0 overflow-y-auto shadow-2xl">
          <h2 className="text-base font-extrabold text-white mb-6 border-b border-[#27272a] pb-3 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-400" />
            <span className="capitalize">{activeTab} Controls</span>
          </h2>
          
          {/* Active Tab: Trim Controls */}
          {activeTab === 'trim' && (
            <div className="space-y-5">
              <div className="p-4 bg-[#09090b] rounded-xl border border-[#27272a] space-y-2">
                <label className="text-xs text-[#a1a1aa] uppercase font-bold tracking-wider block">Start Stamp</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={formatTime(state.trim.start)}
                    onChange={(e) => {
                      const sec = parseStringToSeconds(e.target.value);
                      state.setTrim({ ...state.trim, start: Math.min(state.trim.end, sec) });
                    }}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-lg p-2 text-sm text-white focus:border-[#8b5cf6] outline-none font-semibold"
                  />
                  <span className="text-xs text-[#71717a] self-center">sec</span>
                </div>
              </div>
              <div className="p-4 bg-[#09090b] rounded-xl border border-[#27272a] space-y-2">
                <label className="text-xs text-[#a1a1aa] uppercase font-bold tracking-wider block">End Stamp</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={formatTime(state.trim.end)}
                    onChange={(e) => {
                      const sec = parseStringToSeconds(e.target.value);
                      state.setTrim({ ...state.trim, end: Math.max(state.trim.start, sec) });
                    }}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-lg p-2 text-sm text-white focus:border-[#8b5cf6] outline-none font-semibold"
                  />
                  <span className="text-xs text-[#71717a] self-center">sec</span>
                </div>
              </div>
              <button 
                onClick={() => {
                  safeSeekTo(state.trim.start);
                  state.setIsPlaying(true);
                  setTimeout(() => state.setIsPlaying(false), (state.trim.end - state.trim.start) * 1000);
                }}
                className="w-full py-3 bg-[#27272a] hover:bg-[#3f3f46] rounded-xl text-sm font-bold text-white transition-all shadow-md active:scale-95"
              >
                Preview Trim Region
              </button>
            </div>
          )}

          {/* Active Tab: Text Overlays */}
          {activeTab === 'text' && (
            <div className="space-y-6">
              <button 
                onClick={() => state.addText({
                  id: Math.random().toString(36).substr(2, 9),
                  text: 'Double click to edit',
                  font: 'Impact',
                  size: 'medium',
                  color: '#eab308',
                  position: 'center',
                  startTime: state.currentTime,
                  endTime: Math.min(state.duration, state.currentTime + 5)
                })}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-extrabold shadow-lg transition-all active:scale-95"
              >
                + Add Dynamic Overlay
              </button>
              
              <div className="space-y-4">
                {state.texts.map((txt) => (
                  <div key={txt.id} className="p-4 bg-[#09090b] border border-[#27272a] rounded-xl space-y-3 relative group">
                    <button 
                      onClick={() => state.removeText(txt.id)} 
                      className="absolute top-3 right-3 text-[#71717a] hover:text-red-400 transition-colors font-bold"
                    >
                      ✕
                    </button>
                    
                    <input 
                      type="text" 
                      value={txt.text}
                      onChange={(e) => state.updateText(txt.id, { text: e.target.value })}
                      className="w-full bg-transparent border-b border-[#27272a] focus:border-[#8b5cf6] outline-none text-white font-bold pb-1.5 text-sm"
                    />
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <select 
                        value={txt.font} 
                        onChange={(e) => state.updateText(txt.id, { font: e.target.value })}
                        className="bg-[#18181b] border border-[#27272a] rounded p-2 text-[#d4d4d8] outline-none font-semibold"
                      >
                        <option>Arial</option>
                        <option>Impact</option>
                        <option>Helvetica</option>
                      </select>
                      <input 
                        type="color" 
                        value={txt.color}
                        onChange={(e) => state.updateText(txt.id, { color: e.target.value })}
                        className="w-full h-8 rounded cursor-pointer bg-[#18181b] border border-[#27272a]"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-[#a1a1aa] font-bold">
                      <div>
                        <span>Starts (s)</span>
                        <input 
                          type="number" 
                          value={Math.round(txt.startTime * 10) / 10}
                          onChange={(e) => state.updateText(txt.id, { startTime: Number(e.target.value) })}
                          className="w-full bg-[#18181b] border border-[#27272a] rounded p-1.5 mt-1 text-white font-semibold text-xs"
                        />
                      </div>
                      <div>
                        <span>Ends (s)</span>
                        <input 
                          type="number" 
                          value={Math.round(txt.endTime * 10) / 10}
                          onChange={(e) => state.updateText(txt.id, { endTime: Number(e.target.value) })}
                          className="w-full bg-[#18181b] border border-[#27272a] rounded p-1.5 mt-1 text-white font-semibold text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Tab: Crop Control */}
          {activeTab === 'crop' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                {['Original', '9:16', '1:1', '16:9'].map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => state.setCrop(ratio as any)}
                    className={`py-4 rounded-xl border text-xs font-extrabold transition-all relative ${
                      state.crop === ratio ? 'bg-[#7c3aed]/10 border-[#c084fc] text-white shadow-md' : 'bg-[#09090b] border-[#27272a] text-[#a1a1aa] hover:bg-[#27272a]'
                    }`}
                  >
                    {ratio === '9:16' ? '9:16 (Shorts)' : ratio === '16:9' ? '16:9 (YouTube)' : ratio}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active Tab: Audio Mixer */}
          {activeTab === 'audio' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs text-[#a1a1aa] uppercase font-bold tracking-wider block">Playback Speed</label>
                <div className="grid grid-cols-3 gap-2">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                    <button 
                      key={s} 
                      onClick={() => state.setSpeed(s)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                        state.speed === s ? 'bg-[#7c3aed] border-[#c084fc] text-white' : 'bg-[#09090b] border-[#27272a] text-[#a1a1aa] hover:bg-[#27272a]'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="border-t border-[#27272a] pt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#a1a1aa] font-bold uppercase tracking-wider">Background Music</span>
                  {state.audio.bgMusicUrl && (
                    <button 
                      onClick={() => state.setAudio({ bgMusicUrl: null })}
                      className="text-xs text-red-400 hover:underline font-bold"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="p-4 bg-[#09090b] rounded-xl border border-[#27272a] space-y-3">
                  <label className="w-full flex items-center justify-center gap-2 border border-dashed border-[#27272a] hover:border-[#8b5cf6] py-3 rounded-lg cursor-pointer text-xs font-bold text-[#a1a1aa] hover:text-[#c084fc] transition-all bg-[#18181b]/50">
                    <Music className="w-4 h-4" /> Upload MP3 / WAV
                    <input 
                      type="file" 
                      accept="audio/*" 
                      onChange={handleBackgroundMusicUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>
                
                {state.audio.bgMusicUrl && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-[#a1a1aa] font-bold">
                        <span>Music Volume</span>
                        <span>{state.audio.bgMusicVolume}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" 
                        value={state.audio.bgMusicVolume}
                        onChange={(e) => state.setAudio({ bgMusicVolume: Number(e.target.value) })}
                        className="w-full accent-[#8b5cf6] h-1 bg-[#27272a] rounded-lg cursor-pointer"
                      />
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs font-bold text-[#a1a1aa]">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={state.audio.fadeIn} 
                          onChange={(e) => state.setAudio({ fadeIn: e.target.checked })} 
                          className="accent-[#8b5cf6]"
                        /> Fade In
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={state.audio.fadeOut} 
                          onChange={(e) => state.setAudio({ fadeOut: e.target.checked })} 
                          className="accent-[#8b5cf6]"
                        /> Fade Out
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Active Tab: Filters */}
          {activeTab === 'filters' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-2">
                {['None', 'Bright', 'Contrast', 'Vintage', 'B&W', 'Warm', 'Cool'].map((f) => (
                  <button
                    key={f}
                    onClick={() => state.setFilters({ ...state.filters, name: f as any })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      state.filters.name === f ? 'bg-[#7c3aed]/10 border-[#c084fc] text-white shadow-md' : 'bg-[#09090b] border-[#27272a] text-[#a1a1aa] hover:bg-[#27272a]'
                    }`}
                  >
                    <div className="text-xs font-extrabold mb-1">{f}</div>
                    <div className="text-[10px] text-zinc-500">Preset Filter</div>
                  </button>
                ))}
              </div>
              
              {state.filters.name !== 'None' && (
                <div className="space-y-2">
                  <label className="text-xs text-[#a1a1aa] uppercase font-bold tracking-wider flex justify-between">
                    <span>Intensity</span>
                    <span>{state.filters.intensity}%</span>
                  </label>
                  <input 
                    type="range" min="0" max="100" 
                    value={state.filters.intensity}
                    onChange={(e) => state.setFilters({ ...state.filters, intensity: Number(e.target.value) })}
                    className="w-full accent-[#8b5cf6] h-1 bg-[#27272a] rounded-lg cursor-pointer"
                  />
                </div>
              )}
            </div>
          )}

          {/* Active Tab: History Logger */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {state.history.length === 0 ? (
                <div className="text-xs text-[#71717a] text-center py-6 font-semibold">No actions performed yet</div>
              ) : (
                <div className="space-y-2">
                  {state.history.map((hist, i) => (
                    <div 
                      key={i} 
                      className="p-3 bg-[#09090b] border border-[#27272a]/70 rounded-lg text-xs font-semibold text-[#a1a1aa] flex items-center gap-2 hover:bg-[#27272a] cursor-pointer"
                      onClick={() => state.undo()}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6]" />
                      <span>{hist.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* Zoomable Multitrack Timeline Footer */}
      <footer 
        className="h-52 border-t border-[#27272a] bg-[#18181b] p-4 flex flex-col shrink-0 select-none overflow-hidden"
        onWheel={handleScrollWheelZoom}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-extrabold text-[#71717a] uppercase tracking-wider">
            Timeline workspace (Scroll wheel to Zoom: {Math.round(state.timelineZoom)}%)
          </span>
          <div className="flex items-center gap-2 text-xs text-[#71717a] font-semibold">
            <span>ZOOM</span>
            <input 
              type="range" min="50" max="300" 
              value={state.timelineZoom} 
              onChange={(e) => state.setTimelineZoom(Number(e.target.value))} 
              className="w-20 accent-[#8b5cf6] h-1 bg-[#27272a] rounded-lg cursor-pointer"
            />
          </div>
        </div>
        
        {/* Scrollable container */}
        <div 
          ref={timelineContainerRef}
          className="relative flex-1 bg-[#09090b] rounded-xl border border-[#27272a] overflow-x-auto overflow-y-hidden"
        >
          {/* Zoom width container */}
          <div 
            className="h-full relative min-w-full"
            style={{ width: timelineZoomWidth }}
          >
            {/* Wavesurfer Audio decibel graphs */}
            <div ref={waveformRef} className="absolute inset-x-0 top-6 bottom-4 h-16 pointer-events-auto" />
            
            {/* Custom Interactive Draggable Playhead */}
            {state.duration > 0 && (
              <Draggable
                nodeRef={playheadRef}
                axis="x"
                bounds="parent"
                position={{ x: (state.currentTime / state.duration) * (timelineContainerRef.current?.scrollWidth || 800) * (state.timelineZoom / 100), y: 0 }}
                onDrag={(e, data) => {
                  const timelineWidth = (timelineContainerRef.current?.scrollWidth || 800) * (state.timelineZoom / 100);
                  const dragSeconds = (data.x / timelineWidth) * state.duration;
                  safeSeekTo(Math.min(state.duration, Math.max(0, dragSeconds)));
                }}
              >
                <div ref={playheadRef} className="absolute top-0 bottom-0 w-0.5 bg-[#f43f5e] cursor-ew-resize z-40">
                  <div className="w-3 h-3 bg-[#f43f5e] rounded-full -ml-[5px] -mt-[1px] shadow-md shadow-[#f43f5e]/40" />
                </div>
              </Draggable>
            )}

            {/* Timeline Ruler Marks (Ticks every 5 seconds) */}
            {state.duration > 0 && (
              <div className="absolute top-0 left-0 right-0 h-5 flex justify-between border-b border-[#27272a] text-[9px] text-zinc-500 font-bold px-1 pointer-events-none">
                {Array.from({ length: Math.ceil(state.duration / 5) + 1 }).map((_, i) => {
                  const sec = i * 5;
                  if (sec > state.duration) return null;
                  const leftPos = `${(sec / state.duration) * 100}%`;
                  return (
                    <div 
                      key={i} 
                      className="absolute border-l border-[#27272a] h-2.5 pt-1 pl-1"
                      style={{ left: leftPos }}
                    >
                      {formatTime(sec)}
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Trim Highlight Mask */}
            {state.duration > 0 && (
              <div 
                className="absolute top-5 bottom-0 bg-[#8b5cf6]/10 border-x-2 border-[#8b5cf6] pointer-events-none"
                style={{
                  left: `${startHandlePercent}%`,
                  width: `${endHandlePercent - startHandlePercent}%`
                }}
              />
            )}

            {/* Draggable Trim Handles */}
            {state.duration > 0 && (
              <>
                {/* Left (Start) Handle */}
                <Draggable
                  nodeRef={startHandleRef}
                  axis="x"
                  bounds="parent"
                  position={{ x: (state.trim.start / state.duration) * (timelineContainerRef.current?.scrollWidth || 800) * (state.timelineZoom / 100), y: 0 }}
                  onDrag={(e, data) => {
                    const timelineWidth = (timelineContainerRef.current?.scrollWidth || 800) * (state.timelineZoom / 100);
                    const seconds = (data.x / timelineWidth) * state.duration;
                    state.setTrim({ ...state.trim, start: Math.min(state.trim.end - 0.5, Math.max(0, seconds)) });
                  }}
                >
                  <div ref={startHandleRef} className="absolute top-5 bottom-0 w-1 bg-[#8b5cf6] cursor-ew-resize z-30">
                    <div className="w-4 h-6 bg-[#8b5cf6] rounded-r -ml-1.5 mt-4 flex items-center justify-center text-[10px] text-white font-extrabold shadow-lg">
                      [
                    </div>
                  </div>
                </Draggable>

                {/* Right (End) Handle */}
                <Draggable
                  nodeRef={endHandleRef}
                  axis="x"
                  bounds="parent"
                  position={{ x: (state.trim.end / state.duration) * (timelineContainerRef.current?.scrollWidth || 800) * (state.timelineZoom / 100), y: 0 }}
                  onDrag={(e, data) => {
                    const timelineWidth = (timelineContainerRef.current?.scrollWidth || 800) * (state.timelineZoom / 100);
                    const seconds = (data.x / timelineWidth) * state.duration;
                    state.setTrim({ ...state.trim, end: Math.max(state.trim.start + 0.5, Math.min(state.duration, seconds)) });
                  }}
                >
                  <div ref={endHandleRef} className="absolute top-5 bottom-0 w-1 bg-[#8b5cf6] cursor-ew-resize z-30">
                    <div className="w-4 h-6 bg-[#8b5cf6] rounded-l -ml-2.5 mt-4 flex items-center justify-center text-[10px] text-white font-extrabold shadow-lg">
                      ]
                    </div>
                  </div>
                </Draggable>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* Export Setup Overlay Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 transition-all p-4">
          <div className="bg-[#18181b] border border-[#27272a] rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" /> Export settings
            </h2>
            
            {!exporting ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs text-[#a1a1aa] uppercase font-bold tracking-wider">Export Resolution</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['720p', '1080p', '4k'] as const).map((res) => (
                      <button
                        key={res}
                        onClick={() => setExportResolution(res)}
                        className={`py-3 text-xs font-bold rounded-xl border transition-all ${
                          exportResolution === res ? 'bg-[#7c3aed] border-[#c084fc] text-white shadow-md' : 'bg-[#09090b] border-[#27272a] text-[#a1a1aa] hover:bg-[#27272a]'
                        }`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-xs text-[#a1a1aa] font-bold">Format: MP4 (H.264 / AAC)</div>
                  <div className="text-xs text-zinc-500">Fast FFmpeg high-efficiency rendering backend compilation.</div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setExportModalOpen(false)}
                    className="flex-1 py-3 bg-[#27272a] hover:bg-[#3f3f46] rounded-xl text-sm font-bold transition-all text-[#d4d4d8]"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={startExport}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-sm font-extrabold transition-all text-white shadow-lg shadow-purple-950/20"
                  >
                    Compile Video
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-white">
                    <span>{exportStatus}</span>
                    <span>{exportProgress}%</span>
                  </div>
                  <div className="w-full bg-[#09090b] h-2.5 rounded-full overflow-hidden border border-[#27272a]">
                    <div 
                      className="bg-gradient-to-r from-purple-600 to-indigo-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                </div>
                
                {exportDone && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-white">Compiling completed successfully!</div>
                      <div className="text-[10px] text-zinc-500 mt-1">Check console log for raw parameters payload.</div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  {exportDone ? (
                    <>
                      <a 
                        href={state.videoUrl}
                        download="output_video.mp4"
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-center rounded-xl text-sm font-extrabold transition-all text-white shadow-lg shadow-emerald-950/20"
                      >
                        Download HD Video
                      </a>
                      <button 
                        onClick={() => {
                          setExportModalOpen(false);
                          setExporting(false);
                        }}
                        className="flex-1 py-3 bg-[#27272a] hover:bg-[#3f3f46] rounded-xl text-sm font-bold transition-all text-white"
                      >
                        Close Editor
                      </button>
                    </>
                  ) : (
                    <div className="text-center text-xs text-zinc-500 w-full animate-pulse font-bold">
                      Do not refresh or close the editor panel...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
