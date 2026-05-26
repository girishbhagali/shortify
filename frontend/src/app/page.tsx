"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Scissors, Captions, Smartphone, Download, CheckCircle2,
  Sparkles, Smile, Maximize, Play, Clock, Check, Type, 
  ArrowRight, Activity, ShieldCheck, Mail, Send, Hash, Calendar, Layers
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  const [heroUrl, setHeroUrl] = useState("");
  
  // Waitlist State
  const [email, setEmail] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [waitlistMessage, setWaitlistMessage] = useState("");

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroUrl) return;
    localStorage.setItem("shortify_cached_url", heroUrl);
    localStorage.setItem("shortify_cached_input_mode", "url");
    router.push(`/dashboard`);
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setWaitlistStatus("loading");
    setWaitlistMessage("");
    try {
      const { error } = await supabase.from("waitlist").insert([{ email }]);
      if (error) throw error;
      setWaitlistStatus("success");
      setWaitlistMessage("Success! You've joined the waitlist.");
      setEmail("");
    } catch (err) {
      console.error("Waitlist database registration failed:", err);
      // Fallback message
      setWaitlistStatus("error");
      setWaitlistMessage("Could not join waitlist. Please verify your connection or try again.");
    }
  };

  const features = [
    {
      id: "smart-clip",
      icon: Scissors,
      title: "AI Smart Clipping",
      desc: "Our model reads dialogue context, analyzes hook dynamics, and clips key viral sections automatically."
    },
    {
      id: "auto-caps",
      icon: Captions,
      title: "Auto Captions",
      desc: "Generate animated word-by-word subtitles with dynamic emoji placements to retain viewer attention."
    },
    {
      id: "resize",
      icon: Smartphone,
      title: "9:16 Resize",
      desc: "Advanced auto-face tracking keeps the primary speaker centered in standard vertical frame ratios."
    },
    {
      id: "hashtag",
      icon: Hash,
      title: "Hashtag Generator",
      desc: "Instantly draft optimized viral descriptions, keywords, and meta tags for high SEO discoverability."
    },
    {
      id: "bulk-dl",
      icon: Download,
      title: "Bulk Download",
      desc: "Compile all analyzed clips and export them collectively as a single organized high-speed ZIP bundle."
    },
    {
      id: "schedule",
      icon: Calendar,
      title: "Social Scheduling",
      desc: "Link your profiles and queue your generated short videos for publication directly from our hub."
    }
  ];

  return (
    <div className="min-h-screen bg-canvas-white text-dark-charcoal font-af tracking-[-0.0100em] selection:bg-cofounder-blue/20 overflow-x-hidden">
      <Navbar />

      {/* HERO SECTION - NIGHT SKY STYLE */}
      <section className="relative pt-36 pb-24 md:pt-48 md:pb-36 px-4 bg-night-sky text-canvas-white overflow-hidden">
        {/* Subtle Architectural Grid Lines */}
        <div className="absolute inset-0 grid grid-cols-6 gap-0 pointer-events-none opacity-[0.03]">
          <div className="border-r border-canvas-white h-full"></div>
          <div className="border-r border-canvas-white h-full"></div>
          <div className="border-r border-canvas-white h-full"></div>
          <div className="border-r border-canvas-white h-full"></div>
          <div className="border-r border-canvas-white h-full"></div>
          <div></div>
        </div>
        <div className="absolute inset-0 grid grid-rows-6 gap-0 pointer-events-none opacity-[0.03]">
          <div className="border-b border-canvas-white w-full"></div>
          <div className="border-b border-canvas-white w-full"></div>
          <div className="border-b border-canvas-white w-full"></div>
          <div className="border-b border-canvas-white w-full"></div>
          <div className="border-b border-canvas-white w-full"></div>
          <div></div>
        </div>

        {/* Evocative Glowing Orbs */}
        <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-cofounder-blue/15 rounded-full blur-[140px] -z-10 pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-action-azure/10 rounded-full blur-[160px] -z-10 pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-canvas-white/5 border border-canvas-white/10 text-xs font-semibold text-light-gray mb-8 shadow-sm font-af">
              <Sparkles className="w-3.5 h-3.5 text-action-azure animate-pulse" />
              <span>ShortifyAI is the #1 rated AI Clipper</span>
            </div>
            
            <h1 className="font-ppmondwest text-5xl md:text-7xl font-normal tracking-[-0.0200em] mb-6 leading-[1.08] text-canvas-white">
              Turn Long YouTube Videos into <br className="hidden md:block"/>
              <span className="text-action-azure italic">Viral Shorts</span> in 60 Seconds
            </h1>
            
            <p className="font-af text-base md:text-lg text-light-gray mb-12 max-w-2xl mx-auto leading-relaxed tracking-[-0.0100em] font-normal">
              AI automatically finds the best moments, adds captions, and resizes for Reels, TikTok & YouTube Shorts
            </p>

            {/* Quick URL Input form that feeds directly to /dashboard */}
            <form onSubmit={handleHeroSubmit} className="max-w-2xl mx-auto bg-canvas-white border border-steel-gray rounded-[20px] p-2 shadow-subtle-3 text-left mb-6 flex flex-col sm:flex-row gap-2.5 items-center">
              <div className="flex-1 w-full flex items-center bg-ash-gray border border-cool-gray rounded-xl p-1.5 transition-all focus-within:border-action-azure">
                <div className="pl-3 pr-2 text-slate-gray">
                  <Play className="w-4 h-4 text-cofounder-blue" />
                </div>
                <input 
                  type="url" 
                  required
                  placeholder="Paste YouTube URL here..." 
                  value={heroUrl}
                  onChange={(e) => setHeroUrl(e.target.value)}
                  className="flex-1 bg-transparent border-none text-dark-charcoal text-sm focus:ring-0 py-2 px-1 outline-none w-full placeholder:text-slate-gray font-af"
                />
              </div>
              <button 
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 bg-cofounder-blue hover:bg-cofounder-blue/90 text-canvas-white rounded-xl text-xs font-bold font-af transition-all flex items-center justify-center gap-2 active:scale-98 whitespace-nowrap"
              >
                <span>Generate Shorts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            <p className="text-xs text-light-gray/60 font-af">
              No credit card required • 2 free videos/month
            </p>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS (3 steps) */}
      <section className="py-24 px-4 bg-ash-gray border-y border-cool-gray" id="how-it-works">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-bold text-cofounder-blue uppercase tracking-widest mb-1.5 font-af">Simple Workflow</div>
            <h2 className="font-ppmondwest text-4xl font-normal text-pitch-black tracking-[-0.0200em]">How It Works</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {[
              { step: "01", title: "Paste YouTube URL", desc: "Drop your video link or drag and drop local media onto our dashboard editor." },
              { step: "02", title: "AI finds best moments", desc: "Our engine reviews timestamps, transcript context, and hook scores automatically." },
              { step: "03", title: "Download your Shorts", desc: "Review captions, adjust aspect cropping presets, and export clips in bulk ZIP packs." }
            ].map((s, idx) => (
              <div key={idx} className="bg-canvas-white border border-steel-gray rounded-[20px] p-6 shadow-subtle-2 relative group hover:border-steel-gray transition-all">
                <div className="font-ppmondwest text-5xl text-cofounder-blue/20 font-normal mb-4 group-hover:text-cofounder-blue/40 transition-colors">{s.step}</div>
                <h3 className="font-ppmondwest text-xl font-normal text-pitch-black mb-2 tracking-[-0.0200em]">{s.title}</h3>
                <p className="text-xs text-medium-gray leading-relaxed font-af">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES SECTION (6 cards in a grid) */}
      <section className="py-24 px-4 bg-canvas-white" id="features">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-bold text-cofounder-blue uppercase tracking-widest mb-1.5 font-af">Elite Capabilities</div>
            <h2 className="font-ppmondwest text-4xl md:text-5xl font-normal text-pitch-black tracking-[-0.0200em]">An Unfair Advantage for Creators</h2>
            <p className="text-medium-gray text-sm max-w-xl mx-auto mt-3 font-af">Everything you need to automate shorts production, enhance dialogue retention, and skyrocket social growth.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat) => (
              <div key={feat.id} className="bg-off-white border border-cool-gray rounded-[20px] p-6 shadow-subtle-2 hover:border-steel-gray hover:shadow-sm-2 transition-all flex flex-col justify-between">
                <div className="w-10 h-10 rounded-lg bg-cofounder-blue/5 border border-cofounder-blue/10 flex items-center justify-center mb-6">
                  <feat.icon className="w-5 h-5 text-cofounder-blue" />
                </div>
                <div>
                  <h3 className="font-ppmondwest text-xl font-normal mb-2 text-pitch-black tracking-[-0.0200em]">{feat.title}</h3>
                  <p className="text-charcoal text-xs leading-relaxed font-af">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING SECTION (3 cards) */}
      <section className="py-24 px-4 bg-ash-gray border-y border-cool-gray" id="pricing">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-bold text-cofounder-blue uppercase tracking-widest mb-1.5 font-af">Transparent Plans</div>
            <h2 className="font-ppmondwest text-4xl font-normal text-pitch-black tracking-[-0.0200em]">Simple, Transparent Pricing</h2>
            <p className="text-medium-gray text-xs font-af mt-2">Start producing free clips, unlock absolute scalability when ready.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {/* Free Plan */}
            <div className="p-8 rounded-[24px] border border-cool-gray bg-canvas-white hover:border-steel-gray shadow-subtle-2 transition-all flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-gray mb-1.5 font-af">Free</h3>
                <div className="mb-4">
                  <span className="font-ppmondwest text-5xl font-normal text-pitch-black">₹0</span>
                  <span className="text-slate-gray font-bold font-af text-xs">/month</span>
                </div>
                <p className="text-xs text-medium-gray mb-6 font-af">2 videos, basic features</p>
                <ul className="space-y-3 mb-8 text-xs text-charcoal font-af">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cofounder-blue" strokeWidth={2.5} /> 2 videos per month</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cofounder-blue" strokeWidth={2.5} /> Standard 720p Render</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cofounder-blue" strokeWidth={2.5} /> AI Hook Analysis</li>
                </ul>
              </div>
              <Link 
                href="/dashboard"
                className="w-full py-3 bg-ash-gray hover:bg-cool-gray text-dark-charcoal border border-steel-gray text-xs font-bold font-af rounded-lg transition-all text-center"
              >
                Get Started Free
              </Link>
            </div>

            {/* Pro Plan (Most Popular) */}
            <div className="p-8 rounded-[24px] bg-cofounder-blue text-canvas-white relative shadow-subtle-3 md:-translate-y-4 transition-transform flex flex-col justify-between">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-night-sky text-canvas-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-widest border border-rich-black">
                Most Popular
              </div>
              <div>
                <h3 className="text-lg font-bold text-canvas-white/80 mb-1.5 font-af">Pro</h3>
                <div className="mb-4">
                  <span className="font-ppmondwest text-5xl font-normal text-canvas-white">₹499</span>
                  <span className="text-canvas-white/70 font-bold font-af text-xs">/month</span>
                </div>
                <p className="text-xs text-canvas-white/80 mb-6 font-af">unlimited, all features</p>
                <ul className="space-y-3 mb-8 text-xs text-canvas-white/95 font-af">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-canvas-white" strokeWidth={2.5} /> Unlimited videos</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-canvas-white" strokeWidth={2.5} /> Ultra-HD 4K Export</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-canvas-white" strokeWidth={2.5} /> No Watermark</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-canvas-white" strokeWidth={2.5} /> AI Viral Hook Generator</li>
                </ul>
              </div>
              <Link 
                href="/dashboard"
                className="w-full py-3 bg-canvas-white hover:bg-ash-gray text-cofounder-blue text-xs font-bold font-af rounded-lg transition-all shadow-md text-center"
              >
                Upgrade to Pro
              </Link>
            </div>

            {/* Creator Plan */}
            <div className="p-8 rounded-[24px] border border-cool-gray bg-canvas-white hover:border-steel-gray shadow-subtle-2 transition-all flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-gray mb-1.5 font-af">Creator</h3>
                <div className="mb-4">
                  <span className="font-ppmondwest text-5xl font-normal text-pitch-black">₹999</span>
                  <span className="text-slate-gray font-bold font-af text-xs">/month</span>
                </div>
                <p className="text-xs text-medium-gray mb-6 font-af">teams, API, white-label</p>
                <ul className="space-y-3 mb-8 text-xs text-charcoal font-af">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cofounder-blue" strokeWidth={2.5} /> Full Team Access</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cofounder-blue" strokeWidth={2.5} /> Direct API Integrations</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cofounder-blue" strokeWidth={2.5} /> White-Label Branding</li>
                </ul>
              </div>
              <Link
                href="/dashboard"
                className="w-full py-3 bg-ash-gray hover:bg-cool-gray text-dark-charcoal border border-steel-gray text-xs font-bold font-af rounded-lg transition-all text-center"
              >
                Try Creator
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* WAITLIST SECTION */}
      <section className="py-24 px-4 bg-canvas-white relative overflow-hidden" id="waitlist">
        <div className="absolute inset-0 bg-ash-gray/20 pointer-events-none"></div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="w-12 h-12 bg-cofounder-blue/5 border border-cofounder-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-5 h-5 text-cofounder-blue" />
          </div>
          
          <h2 className="font-ppmondwest text-4xl font-normal text-pitch-black mb-4 tracking-[-0.0200em]">
            Join 500+ creators on the waitlist
          </h2>
          <p className="text-xs text-medium-gray max-w-md mx-auto mb-8 font-af">
            Secure early beta access, discount priorities, and unlimited trial rendering spots.
          </p>

          <form onSubmit={handleWaitlistSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row gap-2 bg-ash-gray border border-steel-gray p-1.5 rounded-xl">
            <input 
              type="email" 
              required
              placeholder="Enter your email address..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-transparent border-none text-dark-charcoal text-xs focus:ring-0 py-2.5 px-3 outline-none placeholder:text-slate-gray font-af"
            />
            <button 
              type="submit"
              disabled={waitlistStatus === "loading"}
              className="px-6 py-2.5 bg-night-sky hover:bg-rich-black text-canvas-white rounded-lg text-xs font-bold font-af transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-98"
            >
              <span>Join Free</span>
              <Send className="w-3 h-3" />
            </button>
          </form>

          {/* Waitlist Response Message */}
          <AnimatePresence>
            {waitlistMessage && (
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mt-4 text-xs font-bold ${waitlistStatus === "success" ? "text-green-600" : "text-red-500"}`}
              >
                {waitlistMessage}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-steel-gray bg-canvas-white text-center font-af">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between text-xs text-slate-gray">
          <div className="text-base font-bold tracking-tight mb-4 md:mb-0 text-pitch-black">
            Shortify<span className="text-cofounder-blue">AI</span>
          </div>
          <div className="flex gap-6 text-[13px] text-charcoal">
            <a href="#" className="hover:text-cofounder-blue transition-colors">Privacy</a>
            <a href="#" className="hover:text-cofounder-blue transition-colors">Terms</a>
            <a href="#" className="hover:text-cofounder-blue transition-colors">Contact</a>
          </div>
          <p className="text-medium-gray text-[11px] mt-4 md:mt-0">© {new Date().getFullYear()} ShortifyAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
