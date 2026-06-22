"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

/**
 * Presentational carousel for the featured portfolio (Home/Guest). Receives the
 * server-rendered building cards as `slides` and lays them out in a scroll-snap track
 * showing **three at a time** on desktop (two on tablet, one on mobile), with prev/next
 * controls. Data fetching stays in the server `FeaturedPortfolio`; this island only
 * arranges the slides and drives horizontal scrolling, so the cards keep their RSC
 * payload (images, links). Honors `prefers-reduced-motion` (instant scroll) and degrades
 * to native swipe/scroll when JS is unavailable.
 */
export function PortfolioCarousel({
  slides,
  prevLabel,
  nextLabel,
}: {
  slides: ReactNode[];
  prevLabel: string;
  nextLabel: string;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft >= max - 1);
  }, []);

  useEffect(() => {
    updateEdges();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, [updateEdges]);

  const scrollByPage = useCallback((dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    // One "step" = the width of a single card (first child) + its right margin/gap.
    const first = el.firstElementChild as HTMLElement | null;
    const gap = Number.parseFloat(getComputedStyle(el).columnGap || "0") || 0;
    const step = first ? first.offsetWidth + gap : el.clientWidth;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * step, behavior: reduce ? "auto" : "smooth" });
  }, []);

  // A single slide doesn't need controls (and three exactly fills the desktop view).
  const showControls = slides.length > 1;

  return (
    <div className="relative">
      <ul
        ref={trackRef}
        className="ch-pf-track flex snap-x snap-mandatory gap-7 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, i) => (
          <li
            // slides are a stable, order-only list (server-rendered cards) — index key is fine
            key={i}
            className="min-w-0 shrink-0 grow-0 basis-full snap-start sm:basis-[calc((100%-1.75rem)/2)] lg:basis-[calc((100%-3.5rem)/3)]"
          >
            {slide}
          </li>
        ))}
      </ul>

      {showControls ? (
        <div className="mt-8 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            disabled={atStart}
            aria-label={prevLabel}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-line"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            disabled={atEnd}
            aria-label={nextLabel}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-line"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      ) : null}
    </div>
  );
}
