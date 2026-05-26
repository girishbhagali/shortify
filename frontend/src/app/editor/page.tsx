"use client";

import dynamic from 'next/dynamic';

// We MUST dynamically import the editor with SSR disabled because 
// fabric.js and wavesurfer.js rely on browser APIs (Canvas, AudioContext, window).
const VideoEditor = dynamic(() => import('@/components/VideoEditor'), { ssr: false });

export default function EditorPage() {
  return (
    <main className="min-h-screen bg-black">
      <VideoEditor />
    </main>
  );
}
