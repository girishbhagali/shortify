"use client";

import { motion } from "framer-motion";
import { 
  Sparkles, Captions, Smile, Maximize, Type, CheckCircle2, 
  Scissors, Music, Layers, Globe, Check, ChevronDown, UploadCloud
} from "lucide-react";
import { UseDashboardType } from "../../hooks/useDashboard";

interface AIEditsPanelProps {
  hook: UseDashboardType;
}

export default function AIEditsPanel({ hook }: AIEditsPanelProps) {
  const { aiFeatures, setAiFeatures } = hook;

  // Handler to toggle an AI Boolean state
  const toggleFeature = (key: keyof typeof aiFeatures) => {
    setAiFeatures(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Handler to update a specific select option
  const updateSelect = (key: keyof typeof aiFeatures, val: any) => {
    setAiFeatures(prev => ({
      ...prev,
      [key]: val
    }));
  };

  return (
    <div className="bg-canvas-white dark:bg-[#1A1A24] border border-cool-gray dark:border-zinc-800 rounded-[24px] p-6 shadow-subtle-2 space-y-6 text-left">
      
      {/* Title block */}
      <div className="flex items-center gap-2 border-b border-cool-gray dark:border-zinc-800 pb-3">
        <Sparkles className="w-4 h-4 text-[#534AB7]" />
        <h3 className="font-af font-bold text-sm text-dark-charcoal dark:text-canvas-white uppercase tracking-wider">AI Magic Edits</h3>
      </div>

      {/* Grid of Toggles */}
      <div className="grid sm:grid-cols-2 gap-4">
        
        {/* Card 1 - Auto Captions */}
        <div className={`p-4 border rounded-xl transition-all space-y-3 ${
          aiFeatures.autoCaptions 
            ? "border-[#534AB7]/30 bg-[#534AB7]/5" 
            : "border-steel-gray dark:border-zinc-800 bg-canvas-white dark:bg-zinc-800/10"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Captions className="w-4.5 h-4.5 text-[#534AB7]" />
              <span className="text-xs font-bold text-dark-charcoal dark:text-canvas-white font-af">Auto Captions</span>
            </div>
            <input 
              type="checkbox" 
              checked={aiFeatures.autoCaptions} 
              onChange={() => toggleFeature("autoCaptions")}
              className="accent-[#534AB7] cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-slate-gray dark:text-zinc-500 font-af">AI adds animated word-by-word subtitles.</p>
          
          {aiFeatures.autoCaptions && (
            <div className="flex items-center justify-between text-[10px] pt-1">
              <span className="text-slate-gray font-bold font-af">Caption Style</span>
              <select 
                value={aiFeatures.captionsStyle} 
                onChange={(e) => updateSelect("captionsStyle", e.target.value)}
                className="bg-canvas-white dark:bg-zinc-800 border border-steel-gray dark:border-zinc-700 rounded px-2 py-1 outline-none text-charcoal dark:text-canvas-white font-bold"
              >
                <option value="default">Default</option>
                <option value="viral-yellow">Viral Yellow</option>
                <option value="minimal">Minimal</option>
              </select>
            </div>
          )}
        </div>

        {/* Card 2 - Emoji Animations */}
        <div className={`p-4 border rounded-xl transition-all space-y-3 ${
          aiFeatures.emojiAnimations 
            ? "border-[#534AB7]/30 bg-[#534AB7]/5" 
            : "border-steel-gray dark:border-zinc-800 bg-canvas-white dark:bg-zinc-800/10"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Smile className="w-4.5 h-4.5 text-[#534AB7]" />
              <span className="text-xs font-bold text-dark-charcoal dark:text-canvas-white font-af">Emoji Animations</span>
            </div>
            <input 
              type="checkbox" 
              checked={aiFeatures.emojiAnimations} 
              onChange={() => toggleFeature("emojiAnimations")}
              className="accent-[#534AB7] cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-slate-gray dark:text-zinc-500 font-af">Auto-add relevant emojis to captions.</p>
          
          {aiFeatures.emojiAnimations && (
            <div className="flex items-center justify-between text-[10px] pt-1">
              <span className="text-slate-gray font-bold font-af">Emoji Frequency</span>
              <select 
                value={aiFeatures.emojiFrequency} 
                onChange={(e) => updateSelect("emojiFrequency", e.target.value)}
                className="bg-canvas-white dark:bg-zinc-800 border border-steel-gray dark:border-zinc-700 rounded px-2 py-1 outline-none text-charcoal dark:text-canvas-white font-bold"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          )}
        </div>

        {/* Card 3 - Auto Zoom */}
        <div className={`p-4 border rounded-xl transition-all space-y-3 ${
          aiFeatures.autoZoom 
            ? "border-[#534AB7]/30 bg-[#534AB7]/5" 
            : "border-steel-gray dark:border-zinc-800 bg-canvas-white dark:bg-zinc-800/10"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Maximize className="w-4.5 h-4.5 text-[#534AB7]" />
              <span className="text-xs font-bold text-dark-charcoal dark:text-canvas-white font-af">Auto Zoom</span>
            </div>
            <input 
              type="checkbox" 
              checked={aiFeatures.autoZoom} 
              onChange={() => toggleFeature("autoZoom")}
              className="accent-[#534AB7] cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-slate-gray dark:text-zinc-500 font-af">Ken Burns zoom effect on key moments.</p>
          
          {aiFeatures.autoZoom && (
            <div className="flex items-center justify-between text-[10px] pt-1">
              <span className="text-slate-gray font-bold font-af">Intensity</span>
              <select 
                value={aiFeatures.zoomIntensity} 
                onChange={(e) => updateSelect("zoomIntensity", e.target.value)}
                className="bg-canvas-white dark:bg-zinc-800 border border-steel-gray dark:border-zinc-700 rounded px-2 py-1 outline-none text-charcoal dark:text-canvas-white font-bold"
              >
                <option value="subtle">Subtle</option>
                <option value="medium">Medium</option>
                <option value="dramatic">Dramatic</option>
              </select>
            </div>
          )}
        </div>

        {/* Card 4 - Viral Hooks */}
        <div className={`p-4 border rounded-xl transition-all space-y-3 ${
          aiFeatures.viralHooks 
            ? "border-[#534AB7]/30 bg-[#534AB7]/5" 
            : "border-steel-gray dark:border-zinc-800 bg-canvas-white dark:bg-zinc-800/10"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Type className="w-4.5 h-4.5 text-[#534AB7]" />
              <span className="text-xs font-bold text-dark-charcoal dark:text-canvas-white font-af">Viral Hooks</span>
            </div>
            <input 
              type="checkbox" 
              checked={aiFeatures.viralHooks} 
              onChange={() => toggleFeature("viralHooks")}
              className="accent-[#534AB7] cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-slate-gray dark:text-zinc-500 font-af">AI adds attention-grabbing intro text.</p>
          
          {aiFeatures.viralHooks && (
            <div className="flex items-center justify-between text-[10px] pt-1">
              <span className="text-slate-gray font-bold font-af">Hook Style</span>
              <select 
                value={aiFeatures.hooksStyle} 
                onChange={(e) => updateSelect("hooksStyle", e.target.value)}
                className="bg-canvas-white dark:bg-zinc-800 border border-steel-gray dark:border-zinc-700 rounded px-2 py-1 outline-none text-charcoal dark:text-canvas-white font-bold"
              >
                <option value="question">Question</option>
                <option value="bold-statement">Bold Statement</option>
                <option value="curiosity">Curiosity</option>
              </select>
            </div>
          )}
        </div>

        {/* Card 5 - Face Tracking */}
        <div className={`p-4 border rounded-xl transition-all space-y-3 ${
          aiFeatures.faceTracking 
            ? "border-[#534AB7]/30 bg-[#534AB7]/5" 
            : "border-steel-gray dark:border-zinc-800 bg-canvas-white dark:bg-zinc-800/10"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4.5 h-4.5 text-[#534AB7]" />
              <span className="text-xs font-bold text-dark-charcoal dark:text-canvas-white font-af">Face Tracking</span>
            </div>
            <input 
              type="checkbox" 
              checked={aiFeatures.faceTracking} 
              onChange={() => toggleFeature("faceTracking")}
              className="accent-[#534AB7] cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-slate-gray dark:text-zinc-500 font-af">Auto-crop follows speaker's face.</p>
          
          {aiFeatures.faceTracking && (
            <div className="flex items-center justify-between text-[10px] pt-1">
              <span className="text-slate-gray font-bold font-af">Sensitivity</span>
              <select 
                value={aiFeatures.faceSensitivity} 
                onChange={(e) => updateSelect("faceSensitivity", e.target.value)}
                className="bg-canvas-white dark:bg-zinc-800 border border-steel-gray dark:border-zinc-700 rounded px-2 py-1 outline-none text-charcoal dark:text-canvas-white font-bold"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          )}
        </div>

        {/* Card 6 - Smart Silence Removal */}
        <div className={`p-4 border rounded-xl transition-all space-y-3 ${
          aiFeatures.silenceRemoval 
            ? "border-[#534AB7]/30 bg-[#534AB7]/5" 
            : "border-steel-gray dark:border-zinc-800 bg-canvas-white dark:bg-zinc-800/10"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Scissors className="w-4.5 h-4.5 text-[#534AB7]" />
              <span className="text-xs font-bold text-dark-charcoal dark:text-canvas-white font-af">Silence Removal</span>
            </div>
            <input 
              type="checkbox" 
              checked={aiFeatures.silenceRemoval} 
              onChange={() => toggleFeature("silenceRemoval")}
              className="accent-[#534AB7] cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-slate-gray dark:text-zinc-500 font-af">Removes awkward pauses automatically.</p>
          
          {aiFeatures.silenceRemoval && (
            <div className="flex items-center justify-between text-[10px] pt-1">
              <span className="text-slate-gray font-bold font-af">Threshold</span>
              <select 
                value={aiFeatures.silenceThreshold} 
                onChange={(e) => updateSelect("silenceThreshold", e.target.value)}
                className="bg-canvas-white dark:bg-zinc-800 border border-steel-gray dark:border-zinc-700 rounded px-2 py-1 outline-none text-charcoal dark:text-canvas-white font-bold"
              >
                <option value="0.5s">0.5s</option>
                <option value="1s">1.0s</option>
                <option value="2s">2.0s</option>
              </select>
            </div>
          )}
        </div>

        {/* Card 7 - Background Music */}
        <div className={`p-4 border rounded-xl transition-all space-y-3 ${
          aiFeatures.backgroundMusic 
            ? "border-[#534AB7]/30 bg-[#534AB7]/5" 
            : "border-steel-gray dark:border-zinc-800 bg-canvas-white dark:bg-zinc-800/10"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Music className="w-4.5 h-4.5 text-[#534AB7]" />
              <span className="text-xs font-bold text-dark-charcoal dark:text-canvas-white font-af">Background Music</span>
            </div>
            <input 
              type="checkbox" 
              checked={aiFeatures.backgroundMusic} 
              onChange={() => toggleFeature("backgroundMusic")}
              className="accent-[#534AB7] cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-slate-gray dark:text-zinc-500 font-af">Upload MP3 or pick lofi free audio tracks.</p>
          
          {aiFeatures.backgroundMusic && (
            <div className="space-y-2 text-[10px] pt-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-gray font-bold font-af">Track</span>
                <select 
                  value={aiFeatures.bgMusicTrack} 
                  onChange={(e) => updateSelect("bgMusicTrack", e.target.value)}
                  className="bg-canvas-white dark:bg-zinc-800 border border-steel-gray dark:border-zinc-700 rounded px-2 py-1 outline-none text-charcoal dark:text-canvas-white font-bold"
                >
                  <option value="Lofi Beats">Lofi Beats</option>
                  <option value="Cinematic Chill">Cinematic Chill</option>
                  <option value="Hip Hop Bounce">Hip Hop Bounce</option>
                  <option value="Upload Custom">Upload MP3...</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-gray font-bold font-af">Volume</span>
                <div className="flex items-center gap-2 w-32">
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={aiFeatures.bgMusicVolume}
                    onChange={(e) => updateSelect("bgMusicVolume", Number(e.target.value))}
                    className="w-full accent-[#534AB7] h-1"
                  />
                  <span>{aiFeatures.bgMusicVolume}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card 8 - Intro/Outro Cards */}
        <div className={`p-4 border rounded-xl transition-all space-y-3 ${
          aiFeatures.introOutro 
            ? "border-[#534AB7]/30 bg-[#534AB7]/5" 
            : "border-steel-gray dark:border-zinc-800 bg-canvas-white dark:bg-zinc-800/10"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Layers className="w-4.5 h-4.5 text-[#534AB7]" />
              <span className="text-xs font-bold text-dark-charcoal dark:text-canvas-white font-af">Intro/Outro Cards</span>
            </div>
            <input 
              type="checkbox" 
              checked={aiFeatures.introOutro} 
              onChange={() => toggleFeature("introOutro")}
              className="accent-[#534AB7] cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-slate-gray dark:text-zinc-500 font-af">Add branded introduction or end logos.</p>
          
          {aiFeatures.introOutro && (
            <div className="space-y-2 text-[10px] pt-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-gray font-bold font-af">Card Duration</span>
                <div className="flex items-center gap-1.5">
                  <input 
                    type="number" 
                    min="1" max="10" 
                    value={aiFeatures.introDuration}
                    onChange={(e) => updateSelect("introDuration", Number(e.target.value))}
                    className="w-12 bg-canvas-white dark:bg-zinc-800 border border-steel-gray dark:border-zinc-700 rounded px-1.5 py-0.5 text-center font-bold"
                  />
                  <span>sec</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card 9 - Auto Translate */}
        <div className={`p-4 border rounded-xl transition-all space-y-3 ${
          aiFeatures.autoTranslate 
            ? "border-[#534AB7]/30 bg-[#534AB7]/5" 
            : "border-steel-gray dark:border-zinc-800 bg-canvas-white dark:bg-zinc-800/10"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Globe className="w-4.5 h-4.5 text-[#534AB7]" />
              <span className="text-xs font-bold text-dark-charcoal dark:text-canvas-white font-af">Auto Translate</span>
            </div>
            <input 
              type="checkbox" 
              checked={aiFeatures.autoTranslate} 
              onChange={() => toggleFeature("autoTranslate")}
              className="accent-[#534AB7] cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-slate-gray dark:text-zinc-500 font-af">Translate subtitles into another language.</p>
          
          {aiFeatures.autoTranslate && (
            <div className="flex items-center justify-between text-[10px] pt-1">
              <span className="text-slate-gray font-bold font-af">Target Language</span>
              <select 
                value={aiFeatures.translateLanguage} 
                onChange={(e) => updateSelect("translateLanguage", e.target.value)}
                className="bg-canvas-white dark:bg-zinc-800 border border-steel-gray dark:border-zinc-700 rounded px-2 py-1 outline-none text-charcoal dark:text-canvas-white font-bold"
              >
                <option value="Hindi">Hindi</option>
                <option value="Tamil">Tamil</option>
                <option value="Telugu">Telugu</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
              </select>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
