"use client";

import dynamic from "next/dynamic";

const VideoEditor = dynamic(() => import("@/components/VideoEditor"), { ssr: false });

export interface EditorPageClientProps {
  videoUrl?: string | null;
}

export default function EditorPageClient({ videoUrl }: EditorPageClientProps) {
  return (
    <main className="min-h-screen bg-black">
      <VideoEditor videoUrl={videoUrl ?? null} />
    </main>
  );
}
