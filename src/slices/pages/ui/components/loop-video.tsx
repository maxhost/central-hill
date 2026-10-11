"use client";

import { useEffect, useRef } from "react";

/**
 * A muted, looping, inline decorative video (spec home-admin-editor S6 — the guests-pitch
 * side media). Server-rendered with `autoPlay` so it starts without waiting for
 * hydration; on mount, a `prefers-reduced-motion: reduce` preference stops it and rewinds
 * to the first frame. No controls: it is decorative and hidden from assistive tech.
 */
export function LoopVideo({ src, className }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || !window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    video.autoplay = false;
    video.pause();
    video.currentTime = 0;
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden
      className={className}
    />
  );
}
