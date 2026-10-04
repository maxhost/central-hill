"use client";

import { useEffect, useRef } from "react";
import { debugLog } from "./debug-log";

/**
 * Diagnostic-only, dev-build-only (see `debug-log.ts`) mount: logs the viewport size on
 * mount and on every resize, logs scroll position (throttled to ~400ms) while scrolling,
 * and logs once the moment the page's scroll reaches its bottom. Renders nothing. Drop one
 * per page (`<ScrollDebugProbe page="home" />`) when debugging a "something below section X
 * doesn't load / scroll won't advance" report — the logs tell you the exact viewport size in
 * play (mobile vs. desktop) and whether the browser ever actually reached the end of the
 * document, without needing a real browser/screenshot tool in this environment.
 *
 * Intended to be reused on every page this project redesigns, not just Home — keep it
 * mounted (or easy to re-add) rather than writing a one-off `console.log` each time.
 */
export function ScrollDebugProbe({ page }: { page: string }) {
  const reachedBottom = useRef(false);
  const lastLogAt = useRef(0);

  useEffect(() => {
    debugLog("scroll-probe", `${page}: mounted`);

    const onResize = () => {
      reachedBottom.current = false;
      debugLog("scroll-probe", `${page}: viewport resized`);
    };

    const onScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      const atBottom = scrollY + viewportHeight >= docHeight - 2;

      const now = Date.now();
      if (now - lastLogAt.current > 400) {
        lastLogAt.current = now;
        debugLog("scroll-probe", `${page}: scrollY=${scrollY} docHeight=${docHeight}`, {
          atBottom,
        });
      }

      if (atBottom && !reachedBottom.current) {
        reachedBottom.current = true;
        debugLog("scroll-probe", `${page}: reached the bottom of the page`, {
          scrollY,
          docHeight,
          viewportHeight,
        });
      }
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, [page]);

  return null;
}
