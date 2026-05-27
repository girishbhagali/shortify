import { useState, useEffect } from "react";
import { AIFeatures, ExportSettings, ClipData, YtInfo, DashboardStats } from "../types/dashboard";
import { apiPost, apiPostForm } from "../lib/api";

const DEFAULT_AI_FEATURES: AIFeatures = {
  autoCaptions: true,
  captionsStyle: "viral-yellow",
  emojiAnimations: true,
  emojiFrequency: "medium",
  autoZoom: false,
  zoomIntensity: "medium",
  viralHooks: true,
  hooksStyle: "bold-statement",
  faceTracking: true,
  faceSensitivity: "medium",
  silenceRemoval: true,
  silenceThreshold: "0.5s",
  backgroundMusic: false,
  bgMusicTrack: "Lofi Beats",
  bgMusicVolume: 40,
  bgMusicFade: true,
  introOutro: false,
  introLogo: null,
  introColor: "#534AB7",
  introDuration: 3,
  autoTranslate: false,
  translateLanguage: "Hindi"
};

const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  resolution: "1080p",
  fps: "60",
  format: "mp4",
  compression: "balanced",
  watermark: false,
  watermarkLogo: null,
  watermarkPosition: "bottom-right",
  watermarkOpacity: 50,
  deliveryZip: true,
  deliveryGDrive: false,
  deliverySocialDirect: false,
  deliveryEmailTick: true
};

const DEFAULT_STATS: DashboardStats = {
  videosProcessed: 24,
  clipsGenerated: 147,
  totalDownloads: 89,
  avgViralScore: 74
};

export const useDashboard = () => {
  // Navigation & Shell State
  const [activeTab, setActiveTab] = useState<"dashboard" | "create" | "library" | "editor" | "scheduler" | "analytics" | "settings">("create");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Input & Preview State
  const [inputMode, setInputMode] = useState<"url" | "upload" | "library">("url");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [ytInfo, setYtInfo] = useState<YtInfo | null>(null);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [infoError, setInfoError] = useState("");

  // Smart Settings State
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9" | "1:1" | "4:5">("9:16");
  const [duration, setDuration] = useState<number>(30); // 15 to 90 seconds slider
  const [durationPreset, setDurationPreset] = useState<"15s" | "30s" | "45s" | "60s" | "custom">("30s");
  const [numClips, setNumClips] = useState<number>(5); // stepper
  const [targetPlatform, setTargetPlatform] = useState<"tiktok" | "reels" | "shorts" | "all">("all");

  // Advanced Configurations State
  const [aiFeatures, setAiFeatures] = useState<AIFeatures>(DEFAULT_AI_FEATURES);
  const [exportSettings, setExportSettings] = useState<ExportSettings>(DEFAULT_EXPORT_SETTINGS);

  // Generation Pipeline State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [generateError, setGenerateError] = useState("");
  const [clips, setClips] = useState<ClipData[] | null>(null);
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);

  // Load state on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Theme Check
      const storedTheme = localStorage.getItem("shortify_theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const shouldBeDark = storedTheme === "dark" || (!storedTheme && prefersDark);
      setDarkMode(shouldBeDark);
      if (shouldBeDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      // Restore inputs
      const cachedClips = localStorage.getItem("shortify_cached_clips");
      if (cachedClips) {
        try { setClips(JSON.parse(cachedClips)); } catch (e) { console.error(e); }
      }
      
      const cachedUrl = localStorage.getItem("shortify_cached_url");
      if (cachedUrl) setUrl(cachedUrl);
      
      const cachedYtInfo = localStorage.getItem("shortify_cached_yt_info");
      if (cachedYtInfo) {
        try { setYtInfo(JSON.parse(cachedYtInfo)); } catch (e) { console.error(e); }
      }

      const cachedAspectRatio = localStorage.getItem("shortify_cached_aspect_ratio");
      if (cachedAspectRatio) setAspectRatio(cachedAspectRatio as any);

      const cachedNumClips = localStorage.getItem("shortify_cached_num_clips");
      if (cachedNumClips) setNumClips(Number(cachedNumClips));
    }
  }, []);

  // Save states upon changes
  useEffect(() => {
    localStorage.setItem("shortify_cached_url", url);
  }, [url]);

  useEffect(() => {
    if (ytInfo) {
      localStorage.setItem("shortify_cached_yt_info", JSON.stringify(ytInfo));
    } else {
      localStorage.removeItem("shortify_cached_yt_info");
    }
  }, [ytInfo]);

  useEffect(() => {
    if (clips) {
      localStorage.setItem("shortify_cached_clips", JSON.stringify(clips));
    } else {
      localStorage.removeItem("shortify_cached_clips");
    }
  }, [clips]);

  useEffect(() => {
    localStorage.setItem("shortify_cached_aspect_ratio", aspectRatio);
  }, [aspectRatio]);

  useEffect(() => {
    localStorage.setItem("shortify_cached_num_clips", String(numClips));
  }, [numClips]);

  // Sync aspect ratio with target platforms automatically
  useEffect(() => {
    if (targetPlatform === "tiktok" || targetPlatform === "reels" || targetPlatform === "shorts") {
      setAspectRatio("9:16");
    }
  }, [targetPlatform]);

  // Sync duration slider with presets
  const handleDurationPresetChange = (preset: "15s" | "30s" | "45s" | "60s" | "custom") => {
    setDurationPreset(preset);
    if (preset === "15s") setDuration(15);
    else if (preset === "30s") setDuration(30);
    else if (preset === "45s") setDuration(45);
    else if (preset === "60s") setDuration(60);
  };

  const handleDurationSliderChange = (val: number) => {
    setDuration(val);
    if (val === 15) setDurationPreset("15s");
    else if (val === 30) setDurationPreset("30s");
    else if (val === 45) setDurationPreset("45s");
    else if (val === 60) setDurationPreset("60s");
    else setDurationPreset("custom");
  };

  // Dark Mode Toggle
  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("shortify_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("shortify_theme", "light");
    }
  };

  // Stepper incrementers
  const incrementClips = () => setNumClips(c => Math.min(10, c + 1));
  const decrementClips = () => setNumClips(c => Math.max(1, c - 1));

  // YouTube Info Fetcher
  const handleFetchInfo = async () => {
    if (!url) return null;
    setIsFetchingInfo(true);
    setInfoError("");
    setYtInfo(null);
    try {
      const data = await apiPost<YtInfo>("/api/info", { url });
      setYtInfo(data);
      return data;
    } catch (e) {
      setInfoError(e instanceof Error ? e.message : "Unknown error");
      return null;
    } finally {
      setIsFetchingInfo(false);
    }
  };

  // Progressive generate flow
  const handleGenerate = async () => {
    if (inputMode === "url" && !ytInfo) {
      const fetchedInfo = await handleFetchInfo();
      if (!fetchedInfo) return;
    }

    setIsGenerating(true);
    setGenerateError("");
    setGenerateProgress(0);
    setClips(null);

    // Simulate progress loops
    const progressInterval = setInterval(() => {
      setGenerateProgress(p => {
        if (p >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return p + Math.random() * 6;
      });
    }, 800);

    const settings = {
      duration,
      aspectRatio,
      numClips,
      aiFeatures,
      exportSettings
    };

    try {
      let data: any;
      if (inputMode === "url") {
        data = await apiPost("/api/generate", { url, settings });
      } else {
        const formData = new FormData();
        formData.append("file", file!);
        formData.append("settings", JSON.stringify(settings));
        data = await apiPostForm("/api/upload", formData);
      }
      clearInterval(progressInterval);
      setGenerateProgress(100);
      
      // Update local metrics count-up stats
      setStats(prev => ({
        videosProcessed: prev.videosProcessed + 1,
        clipsGenerated: prev.clipsGenerated + data.clips.length,
        totalDownloads: prev.totalDownloads,
        avgViralScore: Math.round((prev.avgViralScore * 5 + 85) / 6)
      }));

      setTimeout(() => {
        setClips(data.clips);
        setIsGenerating(false);
      }, 500);
    } catch (err: any) {
      clearInterval(progressInterval);
      setGenerateError(err.message || "An unexpected error occurred during clip creation.");
      setIsGenerating(false);
    }
  };

  const cancelGeneration = () => {
    setIsGenerating(false);
    setGenerateProgress(0);
    setGenerateError("Clip generation canceled.");
  };

  return {
    // Navigation/Shell
    activeTab,
    setActiveTab,
    sidebarCollapsed,
    setSidebarCollapsed,
    darkMode,
    toggleDarkMode,
    // Input
    inputMode,
    setInputMode,
    url,
    setUrl,
    file,
    setFile,
    ytInfo,
    setYtInfo,
    isFetchingInfo,
    infoError,
    handleFetchInfo,
    // Settings
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
    setTargetPlatform,
    // Panels
    aiFeatures,
    setAiFeatures,
    exportSettings,
    setExportSettings,
    // Pipeline
    isGenerating,
    generateProgress,
    generateError,
    clips,
    stats,
    handleGenerate,
    cancelGeneration
  };
};
export type UseDashboardType = ReturnType<typeof useDashboard>;
