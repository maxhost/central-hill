import type { ReactNode } from "react";
import { ButtonLink } from "./button";
import { cn } from "./cn";

export type BenefitCardItem = {
  /** Caller-built icon element (e.g. `<i className="iconoir-key" aria-hidden />` — `mock.css`
   * loads the Iconoir mask-icon stylesheet globally, unscoped from `.mk`, so the raw class still
   * resolves outside it, same precedent as `IconFeatureGrid`/`PhotoFeatureGrid`'s `item.icon`).
   * Rendered at 30px in `accent-deep`, shifting to `accent` with a small lift on card hover. */
  icon?: ReactNode;
  title: string;
  description: string;
};

/**
 * A hairline grid of light benefit cards — each = an icon above a serif title and an ink-soft
 * description, with a hover lift + soft shadow (the icon nudges up, scales and warms to
 * `accent`) — plus an optional centred CTA row (one `ButtonLink` + helper note). First built for
 * Guests' "Why Book Directly With Us?" (`.grid-3`/`.bcard`/`.ico`/`.cta-row`/`.cta-note` in
 * `mock.css` + `guest-page.tsx`'s old page-scoped `.bcard`/`.ico` hover rules), ported 1:1 from
 * the live computed styles — including the `.mk` wrapper's inherited `line-height:1.6` on the
 * card (re-applied as `leading-[1.6]`), which sets the height of the icon's line box and so the
 * icon→title spacing.
 *
 * Why nothing existing fit:
 * - `NumberedFeatureGrid` (About's values) is the nearest — same hairline technique (`border` +
 *   `bg-line` + `gap-px`), same 4 → 2 → 1 column breakpoints, `surface` cards with a hover lift —
 *   but its leading element is a position-derived "01".."0N" serif index, with no icon slot, and
 *   its card metrics differ (30/38px padding vs 34/40px, 21px vs 23px title, 14.5px vs 15px body,
 *   an inset accent-border glow on hover vs a plain soft shadow) and it has no CTA row. Using it
 *   would mean a kernel prop that swaps its defining index for an icon, so it's left untouched.
 * - `IconFeatureGrid` (Services' "How It Works") bakes in its own tinted/bordered band and
 *   heading, lays each item out as an icon *circle beside* the copy (no card chrome, no hairline
 *   grid), is fixed at 3 columns and has no CTA.
 * - `PhotoFeatureGrid` (this page's two teasers) is full-bleed photo cards with white text over a
 *   scrim and per-card borders with a 26px gap — a different card.
 * - `ChecklistCards` / `StatTiles` / `PricingCards` carry checklists, count-up figures or plan
 *   CTAs per card — not icon/title/description.
 * The CTA row is `PhotoFeatureGrid`'s exactly (`mt-11`, centred, wrapping, 16px gap, `ButtonLink`
 * + 13px ink-soft note), so the page's CTA rows stay consistent; that means `ButtonLink`'s small
 * inherited deviations from the mock's raw `.btn` (6px radius vs 3px, 12px vs 14px vertical
 * padding) apply here too — see `PhotoFeatureGrid`'s docstring.
 *
 * Columns: 4 from 981px, 2 at 681–980px, 1 at ≤680px — `mock.css`'s own `.grid-3` responsive
 * breakpoints. Deliberate deviation from the *source markup*: `mock/guest.html` put an inline
 * `style="grid-template-columns:repeat(4,1fr)"` on this grid, which (inline beats the stylesheet's
 * media queries) pinned it to 4 columns at every width — ~146px-wide cards and a horizontally
 * overflowing grid at 390px. The breakpoints the shared `.grid-3` rule clearly intended are used
 * instead (they're also `NumberedFeatureGrid`'s). Tracks are `repeat(N,1fr)` (not
 * `minmax(0,1fr)`), as in the original.
 *
 * Icon→title spacing: the original bare `<i class="ico">` was an `inline-block` with no line box
 * of its own, so its baseline was its bottom *margin* edge and the card's 25.6px strut added
 * ~7.6px of descent below its 18px margin (title 55.6px under the icon top). The wrapper here
 * reproduces that exactly with `inline-block` + `overflow-hidden` (CSS 2.1: an inline-block
 * whose `overflow` isn't `visible` also takes its baseline from the bottom margin edge) at a
 * fixed `1em` (30px) height — the glyph is exactly 1em, so nothing is clipped. (Forcing the child
 * to `display:block` doesn't work: Iconoir's un-layered `[class^='iconoir-']{display:inline-block}`
 * beats a layered Tailwind utility.) `PhotoFeatureGrid`'s plain `block` wrapper lands ~3.6px
 * tighter.
 *
 * Bare (no own `Section`/`Container`/heading — the caller owns the section shell, sec-head and
 * entrance reveal, same as `PhotoFeatureGrid`/`StatTiles`). MUST be rendered **outside** any
 * `.mk`-scoped subtree: `mock.css`'s un-layered `.mk * { margin:0; padding:0 }` beats
 * `@layer`-wrapped Tailwind utilities regardless of specificity (see `SpecStrip`'s docstring).
 * Purely presentational: no i18n, no data fetching, no icon registry.
 */
export function BenefitCards({
  items,
  cta,
  className,
}: {
  items: BenefitCardItem[];
  cta?: {
    label: string;
    href: string;
    note?: string;
  };
  className?: string;
}) {
  return (
    <div className={className}>
      <div
        className={cn(
          "grid grid-cols-[1fr] gap-px border border-line bg-line",
          "min-[681px]:grid-cols-[repeat(2,1fr)] min-[981px]:grid-cols-[repeat(4,1fr)]",
        )}
      >
        {items.map((item, i) => (
          <div
            key={i}
            className="group bg-surface px-[34px] py-10 leading-[1.6] transition-[transform,box-shadow] duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:[transform:translateY(-4px)] hover:[box-shadow:0_16px_28px_-20px_rgba(0,0,0,0.35)]"
          >
            {item.icon ? (
              <span
                aria-hidden
                className="mb-[18px] inline-block h-[1em] overflow-hidden text-[30px] leading-none text-accent-deep transition-[transform,color] duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:text-accent group-hover:[transform:translateY(-3px)_scale(1.1)]"
              >
                {item.icon}
              </span>
            ) : null}
            <h3 className="mb-[10px] font-serif text-[23px] font-medium leading-[1.08] tracking-[-0.015em] text-ink">
              {item.title}
            </h3>
            <p className="text-[15px] leading-[1.6] text-ink-soft">{item.description}</p>
          </div>
        ))}
      </div>

      {cta ? (
        <div className="mt-11 flex flex-wrap items-center justify-center gap-4">
          <ButtonLink href={cta.href}>{cta.label}</ButtonLink>
          {cta.note ? <span className="text-[13px] text-ink-soft">{cta.note}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
