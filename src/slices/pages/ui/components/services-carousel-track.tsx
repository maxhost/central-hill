"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

/**
 * Presentational carousel for the home services & partners strip (ADR 0032). Receives the
 * server-rendered service cards as `slides` and lays them out in a scroll-snap track showing
 * **four at a time** on desktop (three on tablet, two on small tablet, one-and-a-peek on
 * phones), with prev/next controls floated over the track edges — the arrangement of the
 * approved reference.
 *
 * Same division of labour as `PortfolioCarousel`: data is fetched by the server
 * `ServicesCarousel`, so the cards keep their RSC payload (optimised images, links) and this
 * island only arranges them and drives horizontal scrolling. Honors `prefers-reduced-motion`
 * (instant scroll) and degrades to native swipe/scroll when JS is unavailable.
 */
export function ServicesCarouselTrack({
  slides,
  prevLabel,
  nextLabel,
  regionLabel,
}: {
  slides: ReactNode[];
  prevLabel: string;
  nextLabel: string;
  regionLabel: string;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 1);
    // `max <= 1` means everything already fits — then we are simultaneously at both
    // edges and neither control can do anything.
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
    // One "step" = the width of a single card (first child) + the track's column gap.
    const first = el.firstElementChild as HTMLElement | null;
    const gap = Number.parseFloat(getComputedStyle(el).columnGap || "0") || 0;
    const step = first ? first.offsetWidth + gap : el.clientWidth;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * step, behavior: reduce ? "auto" : "smooth" });
  }, []);

  const showControls = slides.length > 1;

  return (
    <div className="relative" role="region" aria-label={regionLabel}>
      <ul
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, i) => (
          <li
            // slides are a stable, order-only list (server-rendered cards) — index key is fine
            key={i}
            className="min-w-0 shrink-0 grow-0 basis-[78%] snap-start sm:basis-[calc((100%-1.25rem)/2)] md:basis-[calc((100%-2.5rem)/3)] lg:basis-[calc((100%-3.75rem)/4)]"
          >
            {slide}
          </li>
        ))}
      </ul>

      {showControls ? (
        <>
          <TrackButton
            side="left"
            label={prevLabel}
            disabled={atStart}
            onClick={() => scrollByPage(-1)}
          />
          <TrackButton
            side="right"
            label={nextLabel}
            disabled={atEnd}
            onClick={() => scrollByPage(1)}
          />
        </>
      ) : null}
    </div>
  );
}

/**
 * A circular control floated over the track's vertical centre. Hidden from the a11y tree
 * on touch-first widths is *not* done on purpose: the buttons stay reachable by keyboard
 * everywhere, and swiping remains available alongside them.
 */
function TrackButton({
  side,
  label,
  disabled,
  onClick,
}: {
  side: "left" | "right";
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`absolute top-[calc(50%-0.25rem)] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface/95 text-ink shadow-[0_6px_20px_-8px_rgba(0,0,0,0.45)] backdrop-blur transition-[opacity,transform] hover:scale-105 disabled:pointer-events-none disabled:opacity-0 sm:inline-flex ${
        side === "left" ? "left-3" : "right-3"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d={side === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
      </svg>
    </button>
  );
}
