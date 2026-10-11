"use client";

import { useEffect, useRef } from "react";

/**
 * Lottie client island (spec home-admin-editor S6) — plays a Lottie JSON or a dotLottie
 * (`.lottie`) in a fixed frame. The player (`@lottiefiles/dotlottie-web`, WASM renderer)
 * is **imported dynamically inside the effect**, so it is split into its own chunk that
 * only downloads when a Lottie is actually rendered: a page without one ships none of it.
 *
 * The server renders the frame itself (same box, same classes), so mounting the canvas
 * causes no layout shift. The player's default `freezeOnOffscreen` pauses rendering while
 * the frame is off-screen. With `prefers-reduced-motion: reduce` it does not autoplay and
 * holds the first frame.
 */
export function LottiePlayer({
  src,
  className,
  label,
}: {
  /** Public URL of the `.json` / `.lottie` asset. */
  src: string;
  /** Frame classes (aspect ratio, rounding, `overflow-hidden`) — the canvas fills it. */
  className?: string;
  /** Accessible name; decorative (hidden from assistive tech) when blank. */
  label?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let player: { destroy(): void } | null = null;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    void import("@lottiefiles/dotlottie-web")
      .then(({ DotLottie }) => {
        if (disposed) return;
        player = new DotLottie({
          canvas,
          src,
          autoplay: !reduceMotion,
          loop: true,
          // Same crop as the photo / video it replaces (`object-cover` in a 4:5 frame).
          layout: { fit: "cover", align: [0.5, 0.5] },
          renderConfig: { autoResize: true, freezeOnOffscreen: true },
        });
      })
      .catch(() => {
        // A player that fails to load leaves the empty frame — never a broken page.
      });

    return () => {
      disposed = true;
      player?.destroy();
    };
  }, [src]);

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
