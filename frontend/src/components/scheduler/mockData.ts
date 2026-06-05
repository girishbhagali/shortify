export interface ConnectedAccount {
  id: string;
  platform: "instagram" | "tiktok" | "youtube" | "twitter";
  handle?: string;
  isConnected: boolean;
}

export interface ScheduledPost {
  id: string;
  clipId: string;
  title: string;
  platform: "instagram" | "tiktok" | "youtube" | "twitter";
  date: Date;
  status: "scheduled" | "posted" | "failed" | "draft";
  caption: string;
  thumbnail: string;
}

export const MOCK_ACCOUNTS: ConnectedAccount[] = [
  { id: "acc_ig", platform: "instagram", handle: "@girish_creates", isConnected: true },
  { id: "acc_tt", platform: "tiktok", handle: "@girish.viral", isConnected: true },
  { id: "acc_yt", platform: "youtube", isConnected: false },
  { id: "acc_tw", platform: "twitter", isConnected: false },
];

// Generate some mock scheduled posts spanning the current month
const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth();

export const MOCK_SCHEDULED_POSTS: ScheduledPost[] = [
  {
    id: "post_1",
    clipId: "clip_1",
    title: "The Ultimate Setup Tour 2026",
    platform: "instagram",
    date: new Date(currentYear, currentMonth, today.getDate() + 1, 15, 0), // Tomorrow 3:00 PM
    status: "scheduled",
    caption: "My entire 2026 studio setup revealed! 🚀👇\\n\\n#SetupTour #TechTok #StudioMakeover",
    thumbnail: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=500&q=80"
  },
  {
    id: "post_2",
    clipId: "clip_1",
    title: "The Ultimate Setup Tour 2026",
    platform: "tiktok",
    date: new Date(currentYear, currentMonth, today.getDate() + 1, 15, 30), // Tomorrow 3:30 PM
    status: "scheduled",
    caption: "My entire 2026 studio setup revealed! 🚀👇\\n\\n#SetupTour #TechTok #StudioMakeover",
    thumbnail: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=500&q=80"
  },
  {
    id: "post_3",
    clipId: "clip_2",
    title: "10 React Tricks You Didn't Know",
    platform: "tiktok",
    date: new Date(currentYear, currentMonth, today.getDate() + 3, 10, 0),
    status: "draft",
    caption: "Did you know about useLayoutEffect? 🤯\\n\\n#ReactJS #WebDev #Coding",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500&q=80"
  },
  {
    id: "post_4",
    clipId: "clip_5",
    title: "Crazy Car Stunt CGI",
    platform: "youtube",
    date: new Date(currentYear, currentMonth, today.getDate() - 2, 18, 0),
    status: "posted",
    caption: "Behind the scenes of the crazy car flip! 🚗💥\\n\\n#VFX #BehindTheScenes #CGI",
    thumbnail: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=500&q=80"
  },
  {
    id: "post_5",
    clipId: "clip_6",
    title: "Mind Blowing AI Feature",
    platform: "instagram",
    date: new Date(currentYear, currentMonth, today.getDate() - 5, 12, 0),
    status: "failed",
    caption: "AI is getting out of hand... 🤖\\n\\n#AI #TechNews #ArtificialIntelligence",
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500&q=80"
  }
];

export const MOCK_ANALYTICS_DATA = [
  { name: 'Mon', posts: 2 },
  { name: 'Tue', posts: 1 },
  { name: 'Wed', posts: 4 },
  { name: 'Thu', posts: 3 },
  { name: 'Fri', posts: 5 },
  { name: 'Sat', posts: 2 },
  { name: 'Sun', posts: 6 },
];
