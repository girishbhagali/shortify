export interface ClipData {
  clip_number: number;
  file_path: string;
  start_time: number;
  end_time: number;
  score: number;
  hook_strength: string;
  energy_level: string;
  transcript: string;
  duration: number;
  video_url: string;
}

export interface YtInfo {
  title: string;
  thumbnail: string;
  duration: number;
  uploader: string;
}

export interface DashboardStats {
  videosProcessed: number;
  clipsGenerated: number;
  totalDownloads: number;
  avgViralScore: number;
}

export interface AIFeatures {
  autoCaptions: boolean;
  captionsStyle: "default" | "viral-yellow" | "minimal";
  emojiAnimations: boolean;
  emojiFrequency: "low" | "medium" | "high";
  autoZoom: boolean;
  zoomIntensity: "subtle" | "medium" | "dramatic";
  viralHooks: boolean;
  hooksStyle: "question" | "bold-statement" | "curiosity";
  faceTracking: boolean;
  faceSensitivity: "low" | "medium" | "high";
  silenceRemoval: boolean;
  silenceThreshold: "0.5s" | "1s" | "2s";
  backgroundMusic: boolean;
  bgMusicTrack: string;
  bgMusicVolume: number;
  bgMusicFade: boolean;
  introOutro: boolean;
  introLogo: string | null;
  introColor: string;
  introDuration: number;
  autoTranslate: boolean;
  translateLanguage: string;
}

export interface ExportSettings {
  resolution: "720p" | "1080p" | "4k";
  fps: "24" | "30" | "60";
  format: "mp4" | "mov" | "webm";
  compression: "small" | "balanced" | "best";
  watermark: boolean;
  watermarkLogo: string | null;
  watermarkPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  watermarkOpacity: number;
  deliveryZip: boolean;
  deliveryGDrive: boolean;
  deliverySocialDirect: boolean;
  deliveryEmailTick: boolean;
}
