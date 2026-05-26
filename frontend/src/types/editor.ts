export interface TrimRegion {
  start: number;
  end: number;
}

export interface TextOverlay {
  id: string;
  text: string;
  font: string;
  size: 'small' | 'medium' | 'large';
  color: string;
  position: 'top' | 'center' | 'bottom';
  startTime: number;
  endTime: number;
}

export interface FilterSettings {
  name: 'None' | 'Bright' | 'Contrast' | 'Vintage' | 'B&W' | 'Warm' | 'Cool';
  intensity: number;
}

export interface AudioSettings {
  masterVolume: number;
  muteOriginal: boolean;
  bgMusicUrl: string | null;
  bgMusicVolume: number;
  fadeIn: boolean;
  fadeOut: boolean;
}

export interface HistoryItem {
  state: {
    videoUrl: string;
    trim: TrimRegion;
    texts: TextOverlay[];
    crop: 'Original' | '9:16' | '1:1' | '16:9';
    filters: FilterSettings;
    audio: AudioSettings;
    speed: number;
  };
  message: string;
}

export interface EditorState {
  // Video core state
  videoUrl: string;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  speed: number;
  
  // Tools state
  trim: TrimRegion;
  texts: TextOverlay[];
  crop: 'Original' | '9:16' | '1:1' | '16:9';
  filters: FilterSettings;
  audio: AudioSettings;
  
  // Timeline zoom
  timelineZoom: number;
  
  // History logs
  history: HistoryItem[];
  future: HistoryItem[];
}

export interface EditorActions {
  setVideoUrl: (url: string) => void;
  setDuration: (duration: number) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setSpeed: (speed: number) => void;
  
  setTrim: (trim: TrimRegion) => void;
  addText: (text: TextOverlay) => void;
  updateText: (id: string, updates: Partial<TextOverlay>) => void;
  removeText: (id: string) => void;
  
  setCrop: (crop: 'Original' | '9:16' | '1:1' | '16:9') => void;
  setFilters: (filters: FilterSettings) => void;
  setAudio: (audio: Partial<AudioSettings>) => void;
  
  setTimelineZoom: (zoom: number) => void;
  
  undo: () => void;
  redo: () => void;
  saveStateToHistory: (message: string) => void;
}
