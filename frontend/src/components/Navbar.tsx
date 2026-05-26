"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Navbar() {
  return (
    <header className="fixed top-4 w-full z-50 px-4 flex justify-center">
      <nav className="w-full max-w-5xl bg-ash-gray/80 backdrop-blur-md border border-cool-gray rounded-[50.496px] shadow-sm px-6 py-2.5 flex justify-between items-center transition-all">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cofounder-blue rounded-full flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-canvas-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-af font-bold text-lg text-dark-charcoal tracking-tight">Shortify<span className="text-cofounder-blue">AI</span></span>
          </Link>
        </div>
        
        <div className="hidden md:flex space-x-6 items-center">
          <Link href="#features" className="text-charcoal hover:text-cofounder-blue px-3 py-1.5 rounded-lg text-[15px] font-medium font-af transition-colors">Features</Link>
          <Link href="#how-it-works" className="text-charcoal hover:text-cofounder-blue px-3 py-1.5 rounded-lg text-[15px] font-medium font-af transition-colors">How it Works</Link>
          <Link href="#pricing" className="text-charcoal hover:text-cofounder-blue px-3 py-1.5 rounded-lg text-[15px] font-medium font-af transition-colors">Pricing</Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link href="/login" className="hidden sm:block text-charcoal hover:text-cofounder-blue text-[15px] font-medium font-af transition-colors">Login</Link>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link href="/signup" className="bg-night-sky hover:bg-rich-black text-canvas-white border border-rich-black rounded-lg text-[15px] font-bold font-af px-5 py-2 transition-all shadow-md">
              Get ShortifyAI
            </Link>
          </motion.div>
        </div>
      </nav>
    </header>
  );
}
