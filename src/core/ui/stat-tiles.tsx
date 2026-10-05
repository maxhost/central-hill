import { cn } from "./cn";
import { CountUp } from "./motion/count-up";

export type StatTile = { value: string; label: string; caption?: string };

/**
 * A hairline grid of light, centred stat tiles: each tile = a large serif accent figure that
 * counts up on scroll-in (`CountUp`), an uppercase label, and an optional muted caption. The
 * "hairline" is the grid's own `bg-line` showing through a `1px` gap between `bg-surface`
 * tiles, plus a `1px` `border-line` frame. 3 columns ≥981px, 2 columns 681–980px, 1 column
 * ≤680px (the original's `max-width:980px`/`max-width:680px` breakpoints). First built for
 * Real Estate's "Performance You Can Measure" (`#track-record` → `.tiles`/`.tile`/`.tval`/
 * `.tlbl`/`.tcap` in `real-estate-page.tsx`'s old `PAGE_STYLE`, identical to
 * `mock/real-estate.html`'s CSS) — ported 1:1 from the live computed styles, including the
 * `.mk` wrapper's inherited `line-height:1.6` (re-applied here as `leading-[1.6]`, since
 * outside `.mk` Tailwind's preflight would otherwise give 1.5).
 *
 * Not `StatBand`: that's a full-bleed dark (`bg-feature`) band of cream figures with no
 * bordered cells and no per-figure caption. Not `SpecStrip`: a flat, bottom-bordered-only
 * flex strip with ink-coloured values, no cells, no caption, deliberately no animation. Not
 * `StatBento`'s embedded 3-up strip: that lives inside one bento card (smaller figures, sentence
 * -case label, no caption, rounded) and isn't exported on its own. Close enough to none of them
 * to warrant a new primitive rather than bending one (those three are left untouched).
 *
 * Count-up: `CountUp` with `durationMs` (default 1600) — the same duration, easeOutCubic
 * easing, 0.4 visibility threshold, prefix/suffix split, thousands-grouping and exact-final-
 * text snap as the `OwnerStatsCounter` `[data-count]` island the original used. Before it
 * scrolls in (and on SSR / no JS / reduced motion) the final figure is shown statically.
 *
 * Bare (no own `Section`/`Container`/heading — the caller owns the section shell, sec-head and
 * entrance reveal, same as `StatBento`). MUST be rendered **outside** any `.mk`-scoped subtree:
 * `mock.css`'s un-layered `.mk * { margin:0; padding:0 }` beats `@layer`-wrapped Tailwind
 * utilities regardless of specificity (see `SpecStrip`'s docstring), which would zero the tile
 * padding and label margins. Purely presentational: no i18n, no data fetching.
 */
export function StatTiles({
  tiles,
  durationMs = 1600,
  className,
}: {
  tiles: StatTile[];
  /** Count-up duration per figure, in ms (default 1600 — the original's tuning). */
  durationMs?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-px border border-line bg-line min-[681px]:grid-cols-2 min-[981px]:grid-cols-3",
        className,
      )}
    >
      {tiles.map((tile, i) => (
        <div key={i} className="bg-surface px-[34px] py-10 text-center leading-[1.6]">
          <div className="font-serif text-[clamp(42px,5vw,58px)] leading-none font-medium text-accent">
            <CountUp value={tile.value} durationMs={durationMs} />
          </div>
          <div className="mt-[14px] mb-[6px] text-[13px] font-semibold uppercase tracking-[0.04em] text-ink">
            {tile.label}
          </div>
          {tile.caption ? <div className="text-[13.5px] text-ink-soft">{tile.caption}</div> : null}
        </div>
      ))}
    </div>
  );
}
