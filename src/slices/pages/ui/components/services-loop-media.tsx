"use client";

import { useEffect, useRef, useState } from "react";

/** No video source is attached until the visitor's motion preference is known. */
export function ServicesLoopMedia({
  src,
  poster,
  className,
}: {
  src: string;
  poster: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      if (preference.matches) ref.current?.pause();
      setAnimate(!preference.matches);
    };
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  return (
    <video
      ref={ref}
      src={animate ? src : undefined}
      poster={poster}
      autoPlay={animate}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      className={className}
    />
  );
}
