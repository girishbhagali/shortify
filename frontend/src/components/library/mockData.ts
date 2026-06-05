export interface LibraryClip {
  id: string;
  title: string;
  source: string;
  duration: number;
  score: number;
  createdAgo: string;
  thumbnail: string;
  status: "ready" | "processing";
  platforms: ("tiktok" | "reels" | "shorts")[];
  features: ("auto-captions" | "emoji" | "zoom" | "silence")[];
  isDownloaded: boolean;
  isScheduled: boolean;
}

export const MOCK_LIBRARY_CLIPS: LibraryClip[] = [
  {
    id: "clip_1",
    title: "The Ultimate Setup Tour 2026",
    source: "My Studio Makeover",
    duration: 32,
    score: 87,
    createdAgo: "2h ago",
    thumbnail: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=500&q=80",
    status: "ready",
    platforms: ["tiktok", "reels", "shorts"],
    features: ["auto-captions", "emoji", "zoom"],
    isDownloaded: true,
    isScheduled: false,
  },
  {
    id: "clip_2",
    title: "10 React Tricks You Didn't Know",
    source: "Advanced Web Dev",
    duration: 55,
    score: 94,
    createdAgo: "5h ago",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500&q=80",
    status: "ready",
    platforms: ["tiktok", "reels"],
    features: ["auto-captions", "silence"],
    isDownloaded: true,
    isScheduled: true,
  },
  {
    id: "clip_3",
    title: "Funny Podcast Moment",
    source: "The Tech Show EP45",
    duration: 21,
    score: 65,
    createdAgo: "1d ago",
    thumbnail: "https://images.unsplash.com/photo-1581368135153-a506cf13b1e1?w=500&q=80",
    status: "ready",
    platforms: ["shorts"],
    features: ["emoji", "zoom"],
    isDownloaded: false,
    isScheduled: false,
  },
  {
    id: "clip_4",
    title: "How to tie a tie fast",
    source: "Life Hacks 101",
    duration: 15,
    score: 72,
    createdAgo: "Just now",
    thumbnail: "https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=500&q=80",
    status: "processing",
    platforms: ["tiktok", "reels", "shorts"],
    features: ["auto-captions"],
    isDownloaded: false,
    isScheduled: false,
  },
  {
    id: "clip_5",
    title: "Crazy Car Stunt CGI",
    source: "Behind the Scenes VFX",
    duration: 45,
    score: 91,
    createdAgo: "3d ago",
    thumbnail: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=500&q=80",
    status: "ready",
    platforms: ["tiktok", "shorts"],
    features: ["auto-captions", "emoji", "zoom", "silence"],
    isDownloaded: true,
    isScheduled: true,
  },
  {
    id: "clip_6",
    title: "Mind Blowing AI Feature",
    source: "Tech News Weekly",
    duration: 59,
    score: 88,
    createdAgo: "1w ago",
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500&q=80",
    status: "ready",
    platforms: ["tiktok", "reels"],
    features: ["auto-captions", "silence"],
    isDownloaded: true,
    isScheduled: false,
  }
];
