"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "../cn";
import { debugLog } from "./debug-log";

/**
 * Scroll-reveal wrapper for a Home section: fades/slides in once, immediately on mount if
 * already in the initial viewport (no flash), otherwise on first scroll-into-view. Mirrors
 * the old `.mk` pages' reveal-io/pre-reveal pattern (the former scroll-reveal.tsx) but as a real
 * React wrapper, since Home has no `.mk` HTML-string/CSS-class scaffolding to hook into.
 *
 * Wrap at the home-page.tsx call site (not inside a shared section component like
 * `FeaturedPortfolio`, which Guest also renders) so the effect stays Home-only.
 *
 * IntersectionObserver fires asynchronously even for an element already in the initial
 * viewport (never synchronously within the effect), so one observer handles both the
 * "already visible" and "scrolls into view later" cases with no flash and no separate
 * synchronous state update. `motion-reduce:*` below keeps content fully visible and
 * untransformed for `prefers-reduced-motion: reduce` via CSS, not a JS check. The
 * `data-reveal` marker lets a one-time <noscript> rule in home-page.tsx keep content
 * visible with JS off.
 *
 * `label` is optional diagnostic-only: when set, logs to the console (dev builds only, see
 * `debug-log.ts`) the moment this section reveals, whether that happened immediately on
 * mount (already in the initial viewport) or later on scroll, plus the viewport size at
 * that moment — pass it whenever debugging a "works on one viewport, not another" report.
 */
export function Reveal({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  /** Diagnostic-only name for console logging; omit for silent (default) behavior. */
  label?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(true);
  const mountedAt = useRef(0);

  useEffect(() => {
    mountedAt.current = Date.now();
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setHidden(false);
            io.disconnect();
            if (label) {
              const trigger = Date.now() - mountedAt.current < 150 ? "initial viewport" : "scroll";
              debugLog("reveal", `"${label}" revealed (${trigger})`);
            }
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [label]);

  return (
    <div
      ref={ref}
      data-reveal
      data-reveal-label={label}
      className={cn(
        "transition-all duration-700 ease-in-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none",
        hidden ? "translate-y-[18px] opacity-0" : "translate-y-0 opacity-100",
        className,
      )}
    >
      {children}
    </div>
  );
}
