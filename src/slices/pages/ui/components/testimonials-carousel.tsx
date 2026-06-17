"use client";

import { useEffect, useState } from "react";
import { cn } from "@core/ui";

/**
 * Testimonials carousel (client feedback B4 — Home / Owners / Guests reviews). Shows a
 * few reviews at a time (3 on desktop, 2 on tablet, 1 on mobile) and rotates through
 * the rest automatically with a smooth, continuous, wrapping motion. Larger rating
 * stars and a country flag reinforce credibility. Auto-advance pauses on hover/focus
 * and honors `prefers-reduced-motion`; prev/next controls + dots allow manual paging.
 *
 * Data is resolved server-side (the testimonials slice read model); this island only
 * handles presentation + motion. Cards keep the dark "feature" section styling.
 */
export interface CarouselItem {
  id: string;
  roleLabel: string;
  rating: number;
  quote: string;
  authorName: string;
  authorCountry: string;
  flag: string | null;
  propertyLocation: string | null;
}

const AUTO_MS = 5000;

function visibleFor(width: number): number {
  if (width >= 1024) return 3;
  if (width >= 640) return 2;
  return 1;
}

export function TestimonialsCarousel({
  items,
  prevLabel,
  nextLabel,
}: {
  items: CarouselItem[];
  prevLabel: string;
  nextLabel: string;
}) {
  const [visible, setVisible] = useState(3);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const maxIndex = Math.max(0, items.length - visible);
  // Derive the active index during render so a shrinking track can't leave it stranded
  // past the end (avoids a clamp-in-effect / cascading render).
  const activeIndex = Math.min(index, maxIndex);

  useEffect(() => {
    const onResize = () => setVisible(visibleFor(window.innerWidth));
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (paused || maxIndex === 0) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i >= maxIndex ? 0 : i + 1));
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [paused, maxIndex]);

  const go = (next: number) => {
    if (maxIndex === 0) return;
    setIndex(next < 0 ? maxIndex : next > maxIndex ? 0 : next);
  };

  const showControls = items.length > visible;

  return (
    <div
      className="mt-12"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${activeIndex * (100 / visible)}%)` }}
        >
          {items.map((tm) => (
            <div
              key={tm.id}
              className="shrink-0 px-3"
              style={{ flexBasis: `${100 / visible}%` }}
            >
              <figure className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-7">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.14em] text-surface/70">
                    {tm.roleLabel}
                  </span>
                  <Stars rating={tm.rating} />
                </div>
                <blockquote className="mt-4 grow leading-relaxed text-surface/90">
                  “{tm.quote}”
                </blockquote>
                <figcaption className="mt-5 text-sm text-surface/80">
                  <span className="font-medium text-surface">{tm.authorName}</span>
                  {" · "}
                  {tm.flag ? <span aria-hidden>{tm.flag} </span> : null}
                  {tm.authorCountry}
                  {tm.propertyLocation ? (
                    <span className="block text-surface/60">{tm.propertyLocation}</span>
                  ) : null}
                </figcaption>
              </figure>
            </div>
          ))}
        </div>
      </div>

      {showControls ? (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            aria-label={prevLabel}
            onClick={() => go(activeIndex - 1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-surface transition-colors hover:bg-white/10"
          >
            <span aria-hidden>‹</span>
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`${i + 1}`}
                aria-current={i === activeIndex ? "true" : undefined}
                onClick={() => go(i)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === activeIndex ? "w-6 bg-accent" : "w-2 bg-white/30 hover:bg-white/50",
                )}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label={nextLabel}
            onClick={() => go(activeIndex + 1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-surface transition-colors hover:bg-white/10"
          >
            <span aria-hidden>›</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Five large stars; the first `rating` are filled, the rest dimmed. */
function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5 text-2xl leading-none text-accent" aria-label={`${rating} / 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} aria-hidden className={i < rating ? "" : "text-surface/25"}>
          ★
        </span>
      ))}
    </span>
  );
}
