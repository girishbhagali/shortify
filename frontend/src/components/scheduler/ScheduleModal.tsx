import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Sparkles, Camera, Smartphone, Video, Image as ImageIcon, Calendar, Zap } from "lucide-react";
import { UseDashboardType } from "../../hooks/useDashboard";
import { apiPost } from "@/lib/api";
import { getThumbnailUrl } from "@/lib/storage";

export default function ScheduleModal({ onClose, initialDate, hook }: { onClose: () => void, initialDate: Date | null, hook: UseDashboardType }) {
  const [step, setStep] = useState(1);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [time, setTime] = useState("15:00");
  const [date, setDate] = useState(initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPostingNow, setIsPostingNow] = useState(false);
  const [postResult, setPostResult] = useState<{success: boolean, message: string} | null>(null);
  
  // Use real clips from the Supabase dashboard state
  // These are the user's actual generated clips with UUIDs
  const clips = (hook.clips || []).filter((c: any) => c.status === "ready");

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };
  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const togglePlatform = (p: string) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const handleAI = () => {
    // Use the selected clip's title for a more relevant caption
    const selectedClipData = clips.find((c: any) => c.id === selectedClip);
    const clipTitle = selectedClipData?.title || "my latest video";
    setCaption(`Check out ${clipTitle}! 🚀🔥\n\nLet me know in the comments what you think! 👇\n\n#Shorts #Viral #ShortifyAI`);
  };
  
  const handleSubmit = async () => {
    if (!selectedClip || platforms.length === 0) return;
    
    setIsSubmitting(true);
    try {
      const scheduledTime = new Date(`${date}T${time}:00`).toISOString();
      
      // Submit for each selected platform — pass the real UUID clip_id
      await Promise.all(platforms.map(platform => 
        apiPost("/api/scheduler/posts", {
          clip_id: selectedClip, // UUID string directly
          platform,
          scheduled_time: scheduledTime,
          caption
        })
      ));
      
      onClose();
    } catch (err) {
      console.error("Failed to schedule post:", err);
      alert("Failed to schedule post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostNow = async () => {
    if (!selectedClip || platforms.length === 0) return;
    
    setIsPostingNow(true);
    setPostResult(null);
    try {
      // Post immediately for each selected platform
      await Promise.all(platforms.map(platform => 
        apiPost("/api/scheduler/posts/now", {
          clip_id: selectedClip,
          platform,
          caption
        })
      ));
      
      setPostResult({ success: true, message: `Upload successful!` });
      setTimeout(() => onClose(), 2000);
    } catch (err: any) {
      console.error("Failed to post:", err);
      setPostResult({ success: false, message: err.message || "Upload failed" });
    } finally {
      setIsPostingNow(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 font-af">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-3xl bg-white dark:bg-[#121217] rounded-[24px] border border-cool-gray dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-cool-gray dark:border-zinc-800 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-pitch-black dark:text-white">Schedule New Post</h2>
            <div className="flex items-center gap-2 mt-2">
              {[1,2,3,4].map(s => (
                <div key={s} className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= s ? 'bg-[#534AB7] text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-slate-gray'}`}>
                    {s}
                  </div>
                  {s < 4 && <div className={`w-8 h-px ${step > s ? 'bg-[#534AB7]' : 'bg-zinc-200 dark:bg-zinc-800'}`} />}
                </div>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-gray" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            
            {step === 1 && (
              <motion.div key="step1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-4">
                <h3 className="font-bold text-lg dark:text-white">Select a Clip</h3>
                
                {clips.length === 0 ? (
                  <div className="text-center py-12 text-slate-gray">
                    <Video className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="font-bold">No clips ready</p>
                    <p className="text-xs mt-1">Generate some clips first, then come back to schedule them.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {clips.slice(0, 6).map((clip: any) => (
                      <div 
                        key={clip.id} 
                        onClick={() => setSelectedClip(clip.id)}
                        className={`relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${selectedClip === clip.id ? 'border-[#534AB7]' : 'border-transparent hover:border-zinc-400'} bg-zinc-900 flex items-center justify-center`}
                      >
                        <img 
                          src={getThumbnailUrl(clip.id)} 
                          alt={clip.title || "Clip"} 
                          className="w-full h-full object-cover" 
                        />
                        {selectedClip === clip.id && (
                          <div className="absolute inset-0 bg-[#534AB7]/20 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-[#534AB7] flex items-center justify-center shadow-lg">
                              <span className="text-white text-xs font-bold">✓</span>
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                          <p className="text-white text-xs font-bold line-clamp-1">{clip.title || "Untitled Clip"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-6">
                <h3 className="font-bold text-lg dark:text-white">Select Platforms</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { id: "instagram", name: "Instagram Reels", icon: Camera, color: "text-pink-500", limits: "2,200 chars • 30 tags" },
                    { id: "tiktok", name: "TikTok", icon: Smartphone, color: "dark:text-white text-black", limits: "4,000 chars • 100 tags" },
                    { id: "youtube", name: "YouTube Shorts", icon: Video, color: "text-red-500", limits: "100 chars (Title)" },
                  ].map(p => (
                    <div 
                      key={p.id}
                      onClick={() => togglePlatform(p.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${platforms.includes(p.id) ? 'border-[#534AB7] bg-[#534AB7]/5' : 'border-cool-gray dark:border-zinc-800 hover:border-zinc-400 bg-white dark:bg-[#1A1A24]'}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <p.icon className={`w-6 h-6 ${p.color}`} />
                        <div className={`w-5 h-5 rounded flex items-center justify-center border ${platforms.includes(p.id) ? 'bg-[#534AB7] border-[#534AB7]' : 'border-zinc-400'}`}>
                          {platforms.includes(p.id) && <span className="text-white text-xs font-bold">✓</span>}
                        </div>
                      </div>
                      <p className="font-bold text-sm dark:text-white">{p.name}</p>
                      <p className="text-[10px] text-slate-gray mt-1">{p.limits}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg dark:text-white">Write Caption</h3>
                  <button onClick={handleAI} className="flex items-center gap-1.5 text-xs font-bold bg-[#534AB7]/10 text-[#534AB7] px-3 py-1.5 rounded-lg hover:bg-[#534AB7]/20 transition-colors">
                    <Sparkles className="w-3.5 h-3.5" /> Auto-Generate
                  </button>
                </div>
                
                <div className="relative">
                  <textarea 
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write a catchy caption..."
                    className="w-full h-40 p-4 rounded-xl border border-cool-gray dark:border-zinc-700 bg-white dark:bg-[#1A1A24] focus:outline-none focus:border-[#534AB7] dark:text-zinc-200 text-sm resize-none"
                  ></textarea>
                  <div className="absolute bottom-4 right-4 text-[10px] font-bold text-slate-gray">
                    {caption.length} / 2200
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-gray mb-2">Suggested Hashtags</p>
                  <div className="flex flex-wrap gap-2">
                    {["#Shorts", "#Viral", "#ShortifyAI", "#Trending", "#Reels"].map(t => (
                      <button key={t} onClick={() => setCaption(c => c + " " + t)} className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-slate-gray hover:bg-[#534AB7] hover:text-white transition-colors">
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-6">
                <h3 className="font-bold text-lg dark:text-white">Schedule Time</h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="text-sm font-bold dark:text-zinc-300">Select Date</label>
                    <div className="p-4 border border-cool-gray dark:border-zinc-700 rounded-xl bg-white dark:bg-[#1A1A24] flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-[#534AB7]" />
                      <input 
                        type="date" 
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="bg-transparent border-none focus:outline-none text-sm dark:text-white font-af w-full cursor-pointer"
                      />
                    </div>

                    <label className="text-sm font-bold dark:text-zinc-300 mt-4 block">Select Time</label>
                    <input 
                      type="time" 
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full p-4 border border-cool-gray dark:border-zinc-700 rounded-xl bg-white dark:bg-[#1A1A24] focus:outline-none dark:text-white text-sm font-af cursor-pointer"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-bold dark:text-zinc-300">AI Recommendations</label>
                    <div className="flex flex-col gap-2">
                      <button className="flex items-center justify-between p-3 rounded-xl border border-[#534AB7] bg-[#534AB7]/5 text-left transition-all hover:bg-[#534AB7]/10">
                        <div>
                          <p className="text-sm font-bold text-[#534AB7] flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> Best Time</p>
                          <p className="text-xs text-slate-gray mt-0.5">Tomorrow at 3:00 PM</p>
                        </div>
                        <div className="w-4 h-4 rounded-full border-4 border-[#534AB7]"></div>
                      </button>
                      <button className="flex items-center justify-between p-3 rounded-xl border border-cool-gray dark:border-zinc-800 bg-white dark:bg-[#1A1A24] text-left hover:border-zinc-400 transition-all">
                        <div>
                          <p className="text-sm font-bold dark:text-white">Weekend Spike</p>
                          <p className="text-xs text-slate-gray mt-0.5">Saturday at 11:00 AM</p>
                        </div>
                        <div className="w-4 h-4 rounded-full border-2 border-cool-gray dark:border-zinc-600"></div>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Post Result Toast */}
        {postResult && (
          <div className={`mx-6 mb-2 p-3 rounded-xl text-sm font-bold text-center ${
            postResult.success 
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" 
              : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30"
          }`}>
            {postResult.success ? "✅" : "❌"} {postResult.message}
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-6 border-t border-cool-gray dark:border-zinc-800 bg-zinc-50 dark:bg-[#1A1A24] shrink-0 flex items-center justify-between">
          <button 
            onClick={step === 1 ? onClose : handlePrev}
            className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-gray hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>
          
          <div className="flex items-center gap-3">
            {/* Post Now button — only on step 4 */}
            {step === 4 && (
              <button 
                onClick={handlePostNow}
                disabled={isPostingNow || isSubmitting}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isPostingNow ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" /> Post Now
                  </>
                )}
              </button>
            )}

            <button 
              onClick={step === 4 ? handleSubmit : handleNext}
              disabled={(step === 1 && !selectedClip) || (step === 2 && platforms.length === 0) || isSubmitting || isPostingNow}
              className="flex items-center gap-2 bg-gradient-to-r from-[#534AB7] to-[#a855f7] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? "Scheduling..." : (step === 4 ? "Schedule Post" : "Next Step")} 
              {step < 4 && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
