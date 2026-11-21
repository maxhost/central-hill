"use client";

import { useEffect, useRef } from "react";
import { useMediaStatus, type MediaPlaybackCallbacks } from "./media-status";

/** Lazy WASM island. The caller supplies the frame; layout crops centrally with cover. */
export function LottiePlayer({ src, className, label, onReady, onError }: {
  src: string;
  className?: string;
  label?: string;
} & MediaPlaybackCallbacks) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const status = useMediaStatus();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let rendered = false;
    let failed = false;
    let player: { destroy(): void } | null = null;
    const fail = () => {
      if (disposed || failed) return;
      failed = true;
      onError?.();
      status?.onError?.();
    };
    const firstRender = () => {
      if (disposed || failed || rendered) return;
      rendered = true;
      onReady?.();
      status?.onReady?.();
    };
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    void import("@lottiefiles/dotlottie-web")
      .then(({ DotLottie }) => {
        if (disposed) return;
        const instance = new DotLottie({
          canvas,
          src,
          autoplay: !reduceMotion,
          loop: true,
          layout: { fit: "cover", align: [0.5, 0.5] },
          renderConfig: { autoResize: true, freezeOnOffscreen: true },
        });
        player = instance;
        instance.addEventListener("render", firstRender);
        instance.addEventListener("loadError", fail);
        instance.addEventListener("renderError", fail);
      })
      .catch(fail);

    return () => {
      disposed = true;
      player?.destroy();
    };
  }, [src, onReady, onError, status]);

  const decorative = !label?.trim();
  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": label })}
      />
    </div>
  );
}
