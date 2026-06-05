"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { UseDashboardType } from "../../hooks/useDashboard";
import LibraryTopBar from "./LibraryTopBar";
import LibraryFilterChips from "./LibraryFilterChips";
import BulkActionBar from "./BulkActionBar";
import ClipGrid from "./ClipGrid";
import ClipList from "./ClipList";
import ClipDetailPanel from "./ClipDetailPanel";
import EmptyLibraryState from "./EmptyLibraryState";
import VideoPlayerModal from "./VideoPlayerModal";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";

import { getBackendUrl } from "@/lib/api";
import { Film, RefreshCw } from "lucide-react";

interface LibraryPanelProps {
  hook: UseDashboardType;
}

export default function LibraryPanel({ hook }: LibraryPanelProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedClips, setSelectedClips] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All Clips");
  const [sortOption, setSortOption] = useState("Newest");
  const [detailClipId, setDetailClipId] = useState<string | null>(null);

  // Supabase states
  const [clips, setClips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Video Player Modal states
  const [activePlayClip, setActivePlayClip] = useState<any | null>(null);
  const [activePlayUrl, setActivePlayUrl] = useState<string>("");
  const [isPlayingLoading, setIsPlayingLoading] = useState(false);

  const loadGenerationRef = useRef(0);
  const cleanupDoneRef = useRef(false);

  const loadClips = useCallback(async (options?: { silent?: boolean }) => {
    const generation = ++loadGenerationRef.current;
    if (!options?.silent) setLoading(true);

    try {
      const { user } = await getCurrentUser();
      if (generation !== loadGenerationRef.current) return;

      setUser(user);

      if (!user) {
        setClips([]);
        return;
      }

      // On first load of a new browser session, clean up old clips
      // so the library starts fresh after every page refresh
      const sessionKey = "shortify_session_cleaned";
      if (!cleanupDoneRef.current && !sessionStorage.getItem(sessionKey)) {
        cleanupDoneRef.current = true;
        sessionStorage.setItem(sessionKey, "1");
        try {
          await fetch(getBackendUrl("/api/clips/cleanup"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id }),
          });
        } catch (err) {
          console.warn("[Library] Cleanup call failed:", err);
        }
      }

      const { data, error } = await supabase
        .from("clips")
        .select("*")
        .neq("status", "deleted")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (generation !== loadGenerationRef.current) return;

      if (!error && data) {
        setClips(data);
      } else if (error) {
        console.error("[Library] Failed to load clips:", error.message);
      }
    } catch (err) {
      if (generation === loadGenerationRef.current) {
        console.error("[Library] Error loading clips:", err);
      }
    } finally {
      if (generation === loadGenerationRef.current && !options?.silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadClips();
  }, [loadClips]);

  // Polling fallback: re-fetch every 5s while any clip is still "processing"
  // This ensures updates appear even if Supabase Realtime isn't enabled on the clips table
  useEffect(() => {
    const hasProcessing = clips.some(c => c.status === "processing");
    if (!hasProcessing || loading) return;

    const interval = setInterval(() => {
      loadClips({ silent: true });
    }, 5000);

    return () => clearInterval(interval);
  }, [clips, loading, loadClips]);

  // 2. Setup Real-time Postgres Channels for Insert/Update
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("library-clips-changes")
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "clips",
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        // If clip marked deleted, filter it out, else update
        if (payload.new.status === "deleted") {
          setClips(prev => prev.filter(c => c.id !== payload.new.id));
        } else {
          setClips(prev => prev.map(c => 
            c.id === payload.new.id ? payload.new : c
          ));
        }
      })
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "clips",
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        // Push newly processing clips at the very top of dashboard
        setClips(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Derive active clip for the sidebar panel
  const detailClip = clips.find(c => c.id === detailClipId) || null;

  // Filter & Sort Logic
  const filteredClips = clips.filter((clip) => {
    const titleText = clip.title || "";
    const sourceText = clip.source_title || "";
    
    // Basic search matching
    if (searchQuery && !titleText.toLowerCase().includes(searchQuery.toLowerCase()) && !sourceText.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Filter chips
    const hasCaptions = clip.has_captions || false;
    const platforms = clip.platforms || [];
    
    if (activeFilter === "Ready" && clip.status !== "ready") return false;
    if (activeFilter === "Processing" && clip.status !== "processing") return false;
    if (activeFilter === "TikTok" && !platforms.includes("tiktok")) return false;
    if (activeFilter === "Reels" && !platforms.includes("reels")) return false;
    return true;
  }).sort((a, b) => {
    const scoreA = a.viral_score || 0;
    const scoreB = b.viral_score || 0;
    const durA = a.duration_seconds || 0;
    const durB = b.duration_seconds || 0;
    
    if (sortOption === "Highest Score") return scoreB - scoreA;
    if (sortOption === "Longest") return durB - durA;
    if (sortOption === "Shortest") return durA - durB;
    
    // Default Newest
    const dateA = new Date(a.created_at || 0).getTime();
    const dateB = new Date(b.created_at || 0).getTime();
    return dateB - dateA;
  });

  const toggleSelection = (id: string) => {
    setSelectedClips(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedClips.length === filteredClips.length) {
      setSelectedClips([]);
    } else {
      setSelectedClips(filteredClips.map(c => c.id));
    }
  };

  const clearSelection = () => setSelectedClips([]);

  // ACTION 1: Play Real Video using backend stream proxy
  const handlePlayClick = async (clip: any) => {
    // Don't try to play clips that aren't ready
    if (clip.status === "processing") {
      alert("This clip is still processing. Please wait until it's ready.");
      return;
    }
    if (clip.status === "failed") {
      alert("This clip failed to process. Please try regenerating it.");
      return;
    }

    setIsPlayingLoading(true);
    try {
      const url = getBackendUrl(`/api/clips/${clip.id}/stream`);
      setActivePlayUrl(url);
      setActivePlayClip(clip);
      
      // Update last viewed timestamp in DB asynchronously
      await supabase.from("clips")
        .update({ last_viewed_at: new Date().toISOString() })
        .eq("id", clip.id);
    } catch (err) {
      console.error("Failed to load video proxy URL:", err);
      alert("Error playing video. Please try again.");
    } finally {
      setIsPlayingLoading(false);
    }
  };

  // ACTION 2: Download Real Video using backend stream proxy URL
  const handleDownloadClick = async (clip: any) => {
    try {
      const url = getBackendUrl(`/api/clips/${clip.id}/stream`);
      // Force download via trigger anchor click
      const a = document.createElement("a");
      a.href = url;
      a.download = `${clip.title || "shortify_clip"}.mp4`;
      a.target = "_blank"; // safe fallback
      a.click();
    } catch (err) {
      console.error("Download failed:", err);
      alert("Could not retrieve download link. Please try again.");
    }
  };

  // ACTION 3: Delete clip permanently from database and buckets
  const handleDeleteClick = async (clip: any) => {
    if (!confirm(`Delete clip "${clip.title}" forever?`)) return;
    
    try {
      // Mark as deleted in DB — backend cron handles local file cleanup
      await supabase.from("clips")
        .update({ status: "deleted" })
        .eq("id", clip.id);
        
      // 3. Instant UI feedback
      setClips(prev => prev.filter(c => c.id !== clip.id));
      if (detailClipId === clip.id) setDetailClipId(null);
      if (activePlayClip?.id === clip.id) setActivePlayClip(null);
    } catch (err) {
      console.error("Failed to delete clip:", err);
      alert("Error deleting clip. Please try again.");
    }
  };

  // Action for bulk delete
  const handleBulkDelete = async () => {
    if (!confirm(`Permanently delete all ${selectedClips.length} selected clips?`)) return;
    
    try {
      const targets = clips.filter(c => selectedClips.includes(c.id));
      await Promise.all(targets.map(async (clip) => {
        await supabase.from("clips").update({ status: "deleted" }).eq("id", clip.id);
      }));
      setClips(prev => prev.filter(c => !selectedClips.includes(c.id)));
      clearSelection();
    } catch (err) {
      console.error("Bulk delete failed:", err);
      alert("Error processing delete. Some clips might not have been fully deleted.");
    }
  };

  return (
    <div className="relative w-full min-h-[80vh] flex overflow-hidden animate-in fade-in duration-500 font-af">
      
      {/* Loading Overlay spinner */}
      {isPlayingLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
          <RefreshCw className="w-10 h-10 text-[#00C2FF] animate-spin mb-4" />
          <p className="text-white text-sm font-bold uppercase tracking-wider">Generating Secure Signed URL...</p>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-500 ${detailClipId ? "pr-[450px]" : ""}`}>
        
        <LibraryTopBar 
          totalClips={clips.length}
          viewMode={viewMode}
          setViewMode={setViewMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortOption={sortOption}
          setSortOption={setSortOption}
          toggleSelectAll={toggleSelectAll}
          allSelected={filteredClips.length > 0 && selectedClips.length === filteredClips.length}
        />

        <LibraryFilterChips 
          activeFilter={activeFilter} 
          setActiveFilter={setActiveFilter} 
        />

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[40vh] space-y-3">
            <RefreshCw className="w-8 h-8 text-[#534AB7] animate-spin" />
            <p className="text-xs text-slate-gray dark:text-zinc-500 font-bold uppercase tracking-widest">Fetching Clip Collections...</p>
          </div>
        ) : (
          <div className="mt-6 flex-1 relative">
            {filteredClips.length === 0 ? (
              <EmptyLibraryState hook={hook} />
            ) : viewMode === "grid" ? (
              <ClipGrid 
                clips={filteredClips} 
                selectedClips={selectedClips} 
                toggleSelection={toggleSelection}
                onOpenDetail={setDetailClipId}
                onPlayClick={handlePlayClick}
                onDownloadClick={handleDownloadClick}
                onDeleteClick={handleDeleteClick}
              />
            ) : (
              <ClipList 
                clips={filteredClips} 
                selectedClips={selectedClips} 
                toggleSelection={toggleSelection}
                onOpenDetail={setDetailClipId}
                onPlayClick={handlePlayClick}
                onDownloadClick={handleDownloadClick}
                onDeleteClick={handleDeleteClick}
              />
            )}
          </div>
        )}

        {/* Floating Bulk Action Bar */}
        <BulkActionBar 
          selectedCount={selectedClips.length} 
          onCancel={clearSelection} 
          onDelete={handleBulkDelete}
        />
      </div>

      {/* Slide-in Detail Panel */}
      <ClipDetailPanel 
        clip={detailClip} 
        onClose={() => setDetailClipId(null)} 
        hook={hook}
      />

      {/* 9:16 Video Player Modal overlay */}
      {activePlayClip && (
        <VideoPlayerModal 
          clip={activePlayClip}
          videoUrl={activePlayUrl}
          onClose={() => setActivePlayClip(null)}
          onDownload={handleDownloadClick}
          onDelete={handleDeleteClick}
        />
      )}
    </div>
  );
}
