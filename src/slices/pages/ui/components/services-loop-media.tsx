"use client";

import { useEffect, useRef, useState } from "react";
import { LottiePlayer } from "./lottie-player";

/** Motion preference is resolved before fetching animation; side media waits for the viewport. */
function useMediaPlayback<T extends HTMLElement>(eager: boolean) {
  const ref = useRef<T>(null);
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(eager);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setAnimate(!preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const element = ref.current;
    if (eager || !element) return;
    if (!("IntersectionObserver" in window)) {
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(!!entry?.isIntersecting),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [eager]);
  return { ref, play: animate && visible };
}

/** No video source is attached until motion and visibility permit playback. */
export function ServicesLoopMedia({
  src,
  poster,
  className,
  eager = false,
}: {
  src: string;
  poster: string;
  className?: string;
  eager?: boolean;
}) {
  const { ref, play } = useMediaPlayback<HTMLVideoElement>(eager);
  useEffect(() => {
    if (!play) ref.current?.pause();
  }, [play, ref]);
  return (
    <video
      ref={ref}
      src={play ? src : undefined}
      poster={poster}
      autoPlay={play}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      className={className}
    />
  );
}

/** Reuses the existing player, with a real still for reduced motion and before activation. */
export function ServicesLottieMedia({
  src,
  poster,
  alt,
  className,
  eager = false,
}: {
  src: string;
  poster: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const { ref, play } = useMediaPlayback<HTMLDivElement>(eager);
  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      {play ? (
        <LottiePlayer
          src={src}
          label={alt}
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- original real still; no animation player for reduced motion
        <img
          src={poster}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}
