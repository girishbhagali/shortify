"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Zap, Target, Smartphone } from "lucide-react";

export default function AuthBrandingPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-10 xl:p-14 text-white"
      style={{ background: "linear-gradient(135deg, #534AB7 0%, #0284C7 100%)" }}
    >
      {/* Decorative grid overlay */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }}
      />

      {/* Ambient light blurs */}
      <div className="absolute top-[15%] right-[10%] w-[320px] h-[320px] bg-white/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[5%] w-[280px] h-[280px] bg-[#0284C7]/30 rounded-full blur-[100px] pointer-events-none" />

      {/* Top — Logo */}
      <div className="relative z-10">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-10 h-10 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-all">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="font-bold text-xl tracking-tight">ShortifyAI</span>
        </Link>
      </div>

      {/* Center — Hero */}
      <div className="relative z-10 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl xl:text-[44px] font-bold tracking-tight leading-[1.1] mb-4">
            Turn Videos into<br />Viral Shorts
          </h1>
          <p className="text-white/70 text-sm leading-relaxed max-w-sm">
            Join 10,000+ creators already using ShortifyAI to grow their audience
          </p>
        </motion.div>

        {/* Feature points */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="space-y-3.5"
        >
          {[
            { icon: Zap, text: "Generate 5 clips in under 2 minutes" },
            { icon: Target, text: "AI finds your most viral moments" },
            { icon: Smartphone, text: "Ready for TikTok, Reels & Shorts" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-white/85">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                <item.icon className="w-4 h-4" />
              </div>
              <span>{item.text}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Floating decorative cards */}
      <div className="absolute top-[18%] right-[8%] z-10 pointer-events-none">
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 shadow-xl"
        >
          <p className="text-xs font-bold">🔥 Viral Score: 94</p>
        </motion.div>
      </div>
      <div className="absolute bottom-[28%] left-[6%] z-10 pointer-events-none">
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 shadow-xl"
        >
          <p className="text-xs font-bold">✂️ 5 clips generated</p>
        </motion.div>
      </div>

      {/* Bottom — Social proof */}
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2.5">
            {["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A"].map((color, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-[#534AB7]"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <p className="text-sm text-white/70">
            <span className="text-white font-semibold">500+</span> creators joined this week
          </p>
        </div>
      </div>
    </div>
  );
}
