import { create } from 'zustand';
import { EditorState, EditorActions, HistoryItem } from '../types/editor';

const initialState = {
  videoUrl: '',
  duration: 0,
  currentTime: 0,
  isPlaying: false,
  speed: 1,
  
  trim: { start: 0, end: 100 },
  texts: [],
  crop: 'Original' as const,
  filters: { name: 'None' as const, intensity: 50 },
  audio: {
    masterVolume: 100,
    muteOriginal: false,
    bgMusicUrl: null,
    bgMusicVolume: 50,
    fadeIn: false,
    fadeOut: false,
  },
  timelineZoom: 100,
};

export const useVideoEditor = create<EditorState & EditorActions>((set, get) => ({
  ...initialState,
  history: [],
  future: [],

  // Helper to save current state to history before mutating with custom message
  saveStateToHistory: (message: string) => {
    const state = get();
    const stateToSave = {
      videoUrl: state.videoUrl,
      trim: state.trim,
      texts: state.texts,
      crop: state.crop,
      filters: state.filters,
      audio: state.audio,
      speed: state.speed
    };
    
    const historyItem: HistoryItem = {
      state: JSON.parse(JSON.stringify(stateToSave)),
      message
    };

    set((s) => ({
      history: [...s.history, historyItem],
      future: [] // Clear future on new action
    }));
  },

  setVideoUrl: (url) => set({ videoUrl: url }),
  setDuration: (duration) => set((state) => {
    // Also initialize trim to max duration when video loads
    if (state.trim.end === 100 && duration > 0) {
      return { duration, trim: { start: 0, end: duration } };
    }
    return { duration };
  }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setSpeed: (speed) => {
    get().saveStateToHistory(`Changed playback speed to ${speed}x`);
    set({ speed });
  },

  setTrim: (trim) => {
    get().saveStateToHistory(`Trimmed video to ${trim.start.toFixed(1)}s - ${trim.end.toFixed(1)}s`);
    set({ trim });
  },

  addText: (text) => {
    get().saveStateToHistory(`Added text overlay "${text.text}"`);
    set((state) => ({ texts: [...state.texts, text] }));
  },
  
  updateText: (id, updates) => {
    // We don't save minor typing updates to history to avoid bloating, but we can if updates contains text
    if (updates.text !== undefined) {
      get().saveStateToHistory(`Updated text to "${updates.text}"`);
    }
    set((state) => ({
      texts: state.texts.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  },
  
  removeText: (id) => {
    const textObj = get().texts.find(t => t.id === id);
    get().saveStateToHistory(`Removed text overlay "${textObj?.text || ''}"`);
    set((state) => ({ texts: state.texts.filter(t => t.id !== id) }));
  },

  setCrop: (crop) => {
    get().saveStateToHistory(`Set aspect ratio to ${crop}`);
    set({ crop });
  },

  setFilters: (filters) => {
    get().saveStateToHistory(`Applied filter ${filters.name} (${filters.intensity}%)`);
    set({ filters });
  },

  setAudio: (audioUpdates) => {
    // Determine context message for history logs
    let msg = 'Updated audio settings';
    if (audioUpdates.muteOriginal !== undefined) {
      msg = audioUpdates.muteOriginal ? 'Muted original video audio' : 'Unmuted original video audio';
    } else if (audioUpdates.masterVolume !== undefined) {
      msg = `Set master volume to ${audioUpdates.masterVolume}%`;
    } else if (audioUpdates.bgMusicUrl !== undefined) {
      msg = audioUpdates.bgMusicUrl ? 'Added custom background track' : 'Removed background track';
    } else if (audioUpdates.bgMusicVolume !== undefined) {
      msg = `Set background music volume to ${audioUpdates.bgMusicVolume}%`;
    }
    
    get().saveStateToHistory(msg);
    set((state) => ({ audio: { ...state.audio, ...audioUpdates } }));
  },

  setTimelineZoom: (zoom) => set({ timelineZoom: zoom }),

  undo: () => {
    const { history, future } = get();
    if (history.length === 0) return;
    
    const previousItem = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    
    // Save current editable state to future
    const state = get();
    const currentState = {
      videoUrl: state.videoUrl,
      trim: state.trim,
      texts: state.texts,
      crop: state.crop,
      filters: state.filters,
      audio: state.audio,
      speed: state.speed
    };
    
    const futureItem: HistoryItem = {
      state: JSON.parse(JSON.stringify(currentState)),
      message: previousItem.message
    };
    
    set({
      ...previousItem.state,
      history: newHistory,
      future: [futureItem, ...future]
    });
  },

  redo: () => {
    const { history, future } = get();
    if (future.length === 0) return;
    
    const nextItem = future[0];
    const newFuture = future.slice(1);
    
    // Save current editable state to history
    const state = get();
    const currentState = {
      videoUrl: state.videoUrl,
      trim: state.trim,
      texts: state.texts,
      crop: state.crop,
      filters: state.filters,
      audio: state.audio,
      speed: state.speed
    };
    
    const historyItem: HistoryItem = {
      state: JSON.parse(JSON.stringify(currentState)),
      message: nextItem.message
    };
    
    set({
      ...nextItem.state,
      history: [...history, historyItem],
      future: newFuture
    });
  }
}));
