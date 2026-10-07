import { cn } from "./cn";

export type StatBentoStat = { value: string; label: string };

export type StatBentoCell =
  | { kind: "text"; title: string; body: string }
  | { kind: "list"; title: string; items: string[] };

/**
 * An asymmetric two-column "bento": a tall feature cell (title + an embedded 3-up stat strip
 * + supporting paragraphs) spanning two grid rows, beside two stacked cells (plain text or a
 * checkmark bullet list). Every cell shares the same bordered-card hover chrome: a `-5px`
 * lift, a soft drop shadow, the border tinting toward the accent colour, and a 3px accent
 * line that sweeps in from the left edge along the top. First built for Real Estate's "Why
 * Portugal" section (`#market` → `.market-bento`/`.mcell`/`.stat-row`/`.thesis` in
 * `real-estate-page.tsx`'s old `PAGE_STYLE`) — ported 1:1 from the *live* render, not from
 * `mock/real-estate.html`.
 *
 * **Known mock/live drift, resolved in favour of the live render.** `mock/real-estate.html`
 * still has this slot as a flat 4-column `.why-grid`/`.why-block` grid — a different, simpler
 * layout. The shipped `real-estate-page.tsx` had already replaced it with this asymmetric
 * bento (the old code even carries a comment: "Replaces the former flat 2x2 why-grid"), so
 * the mock is the stale artifact here, not the live code. This component extracts what's
 * actually live (verified against `localhost:3025/en/real-estate`'s rendered DOM/computed
 * styles before touching anything) — the mock should be updated separately to catch up, not
 * the other way around.
 *
 * Not `StatBand`: that's a full-bleed dark band of top-level count-up figures (no title/body
 * copy per cell, no card chrome, no hover motion) — a page-level proof band, not a small
 * stat strip embedded inside one card of a bento. Not `SpecStrip`: that's a flat, unbordered,
 * deliberately un-animated value/label strip, not a 2-column asymmetric card grid with
 * per-cell hover lift. Not `NumberedFeatureGrid`/`IconFeatureGrid`: both are flat N-up grids
 * of same-shaped cards (index+title+body / icon+title+description) — this bento is a single
 * asymmetric layout with a genuinely different feature cell (title + embedded stat strip +
 * paragraphs) beside two differently-shaped side cells, close enough to nothing else in
 * `core/ui` to warrant a new primitive rather than stretching an existing one.
 *
 * `cells` is a fixed 2-tuple, not an arbitrary array: the feature cell's `row-span-2` (desktop
 * only — collapses to `row-span-1`/stacked under `981px`, mirroring the original's
 * `max-width:980px` breakpoint) is sized to exactly two stacked side cells, same
 * "pinned to the source content's shape" assumption `IconFeatureGrid`'s fixed `grid-cols-3`
 * documents for itself — the content schema (`RealEstateContent["market"]`) always supplies
 * exactly a `regulatory` (text) and a `thesis` (list) cell alongside `fundamentals` (feature).
 *
 * Purely presentational, per the `core/ui` ground rule: no i18n, no entrance-reveal wiring
 * (the caller wraps the whole section in `Reveal`, same as `NumberedFeatureGrid`) — only the
 * hover motion and the accent sweep-line are baked in here, since (like
 * `NumberedFeatureGrid`/`PropertyCard`) that's intrinsic card chrome, not a page-composition
 * choice.
 */
export function StatBento({
  feature,
  cells,
  className,
}: {
  feature: { title: string; stats: StatBentoStat[]; paragraphs: string[] };
  /** Exactly the two side cells stacked beside the feature cell — see docstring. */
  cells: [StatBentoCell, StatBentoCell];
  className?: string;
}) {
  const cellChrome =
    "relative overflow-hidden rounded-[10px] border border-line bg-surface px-9 py-[38px] " +
    "transition-[transform,box-shadow,border-color] duration-[380ms] ease-in-out " +
    "hover:-translate-y-[5px] hover:shadow-[0_28px_56px_-32px_rgba(0,0,0,0.42)] " +
    "hover:border-[color-mix(in_srgb,var(--color-accent)_38%,var(--color-line))] " +
    "before:absolute before:left-0 before:top-0 before:h-[3px] before:w-0 before:bg-accent " +
    "before:transition-[width] before:duration-[450ms] before:ease-in-out hover:before:w-full";
  const cellTitle = "mb-[14px] font-serif text-[22px] font-medium leading-[1.08] tracking-[-0.015em] text-ink";

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-[18px] mt-2 min-[981px]:grid-cols-[1.5fr_1fr]",
        className,
      )}
    >
      <div className={cn(cellChrome, "flex flex-col min-[981px]:row-span-2")}>
        <h3 className={cellTitle}>{feature.title}</h3>
        <div className="mb-[30px] grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-line bg-line min-[681px]:grid-cols-3">
          {feature.stats.map((s) => (
            <div
              key={s.label}
              className="bg-surface px-4 py-[22px] text-center transition-colors duration-300 ease-in-out hover:bg-[color-mix(in_srgb,var(--color-accent)_7%,var(--color-surface))]"
            >
              <div className="font-serif text-[clamp(28px,3.2vw,38px)] leading-none font-medium text-accent">
                {s.value}
              </div>
              <span className="mt-[9px] block text-[12.5px] leading-[1.4] text-ink-soft">
                {s.label}
              </span>
            </div>
          ))}
        </div>
        {feature.paragraphs.map((p, i) => (
          <p key={i} className="mb-[14px] text-[15px] leading-[1.7] text-ink-soft last:mb-0">
            {p}
          </p>
        ))}
      </div>

      {cells.map((cell, i) => (
        <div key={i} className={cellChrome}>
          <h3 className={cellTitle}>{cell.title}</h3>
          {cell.kind === "text" ? (
            <p className="text-[15px] leading-[1.7] text-ink-soft">{cell.body}</p>
          ) : (
            <ul className="m-0 list-none">
              {cell.items.map((item, j) => (
                <li
                  key={j}
                  className="relative border-t border-line py-[10px] pl-7 text-[14.5px] leading-[1.6] text-ink-soft transition-[color,padding-left] duration-[250ms] ease-in-out first:border-t-0 hover:pl-8 hover:text-ink before:absolute before:left-0 before:top-[15px] before:h-2 before:w-3.5 before:-rotate-45 before:border-b-2 before:border-l-2 before:border-accent before:content-['']"
                >
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
