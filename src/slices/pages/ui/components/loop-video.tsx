"use client";

import { useEffect, useRef } from "react";
import { useMediaStatus, type MediaPlaybackCallbacks } from "./media-status";

/** Muted inline decorative loop; reduced motion holds its first frame. */
export function LoopVideo({ src, className, onReady, onError }: {
  src: string;
  className?: string;
} & MediaPlaybackCallbacks) {
  const ref = useRef<HTMLVideoElement>(null);
  const status = useMediaStatus();

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.autoplay = false;
      video.pause();
      video.currentTime = 0;
    }
    // Like an image, a cached video may have loaded before hydration.
    if (video.readyState >= 2) {
      onReady?.();
      status?.onReady?.();
    } else if (video.error) {
      onError?.();
      status?.onError?.();
    }
  }, [src, onReady, onError, status]);

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
      onLoadedData={() => { onReady?.(); status?.onReady?.(); }}
      onError={() => { onError?.(); status?.onError?.(); }}
    />
  );
}
