"use client";

import { type CSSProperties, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { UiIcon } from "./ui-icon";

/** `gap-5` (services' tighter track) or `gap-7` (portfolio's wider track) — literal Tailwind
 * classes so the JIT scanner can see them (never built from the prop value at runtime). */
const GAP_CLASSES: Record<"sm" | "lg", string> = {
  sm: "gap-5",
  lg: "gap-7",
};

export interface CarouselBasis {
  /** Slide width below the smallest breakpoint, e.g. `"100%"` or `"78%"`. */
  base: string;
  sm?: string;
  md?: string;
  lg?: string;
}

/**
 * Shared presentational carousel for Home's two scroll-snap tracks (featured portfolio,
 * services & partners). Receives pre-rendered `slides` from the server-side composer and only
 * handles scroll/arrows — no data fetching here (see `04-carousel.md`). Per-breakpoint slide
 * width is driven by `basis`, applied through CSS custom properties rather than interpolated
 * into the className string, so Tailwind's static scanner can still generate the (always
 * literal) `basis-[var(--…)]` utilities regardless of the actual values passed in. Honors
 * `prefers-reduced-motion` (instant scroll) and degrades to native swipe/scroll when JS is
 * unavailable.
 */
export function Carousel({
  slides,
  prevLabel,
  nextLabel,
  regionLabel,
  gap = "lg",
  basis = { base: "100%" },
  buttonPlacement = "below",
}: {
  slides: ReactNode[];
  prevLabel: string;
  nextLabel: string;
  /** When set, wraps the track in `role="region" aria-label={regionLabel}` (services' behavior). */
  regionLabel?: string;
  /** `sm` = services' `gap-5`, `lg` = portfolio's `gap-7`. */
  gap?: "sm" | "lg";
  /** Per-breakpoint slide width. A missing breakpoint simply keeps the previous one's value. */
  basis?: CarouselBasis;
  /** `below` = portfolio's centered row under the track, `overlay` = services' floating edges. */
  buttonPlacement?: "below" | "overlay";
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
    const gapPx = Number.parseFloat(getComputedStyle(el).columnGap || "0") || 0;
    const step = first ? first.offsetWidth + gapPx : el.clientWidth;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * step, behavior: reduce ? "auto" : "smooth" });
  }, []);

  const showControls = slides.length > 1;

  // Fallback chain so an omitted breakpoint keeps whichever narrower breakpoint's value was
  // last set — the same effect as not emitting that breakpoint's class at all.
  const basisVars = {
    "--carousel-basis-base": basis.base,
    "--carousel-basis-sm": basis.sm ?? basis.base,
    "--carousel-basis-md": basis.md ?? basis.sm ?? basis.base,
    "--carousel-basis-lg": basis.lg ?? basis.md ?? basis.sm ?? basis.base,
  } as CSSProperties;

  const track = (
    <ul
      ref={trackRef}
      style={basisVars}
      className={`flex snap-x snap-mandatory ${GAP_CLASSES[gap]} overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
    >
      {slides.map((slide, i) => (
        <li
          // slides are a stable, order-only list (server-rendered cards) — index key is fine
          key={i}
          className="min-w-0 shrink-0 grow-0 basis-[var(--carousel-basis-base)] snap-start sm:basis-[var(--carousel-basis-sm)] md:basis-[var(--carousel-basis-md)] lg:basis-[var(--carousel-basis-lg)]"
        >
          {slide}
        </li>
      ))}
    </ul>
  );

  if (buttonPlacement === "overlay") {
    return (
      <div className="relative" role={regionLabel ? "region" : undefined} aria-label={regionLabel}>
        {track}
        {showControls ? (
          <>
            <TrackButton side="left" label={prevLabel} disabled={atStart} onClick={() => scrollByPage(-1)} />
            <TrackButton side="right" label={nextLabel} disabled={atEnd} onClick={() => scrollByPage(1)} />
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative" role={regionLabel ? "region" : undefined} aria-label={regionLabel}>
      {track}

      {showControls ? (
        <div className="mt-8 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            disabled={atStart}
            aria-label={prevLabel}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-line"
          >
            <UiIcon name="nav-arrow-left" size={20} />
          </button>
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            disabled={atEnd}
            aria-label={nextLabel}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-line"
          >
            <UiIcon name="nav-arrow-right" size={20} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * A circular control floated over the track's vertical centre (`buttonPlacement="overlay"`).
 * Hidden from the a11y tree on touch-first widths is *not* done on purpose: the buttons stay
 * reachable by keyboard everywhere, and swiping remains available alongside them.
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
      <UiIcon name={side === "left" ? "nav-arrow-left" : "nav-arrow-right"} size={20} />
    </button>
  );
}
