import type { ReactNode } from "react";
import { cn } from "./cn";

export type CertificationCardItem = {
  /** Caller-built logo node, rendered in the card's 48px-tall centred logo slot (which scales up
   * slightly on card hover). Pass either an external/R2 `<img>` — any `<img>` inside the slot is
   * sized by the slot itself (`h-[48px] w-auto max-w-[160px] object-contain`), so the caller only
   * supplies `src`/`alt` — or a placeholder glyph such as
   * `<i className="iconoir-check-circle text-[40px] leading-none text-accent-deep" aria-hidden />`
   * (`mock.css` loads the Iconoir mask-icon stylesheet globally, unscoped from `.mk`, same
   * precedent as `BenefitCards`/`IconFeatureGrid`'s `item.icon`). Omitted → no slot. */
  logo?: ReactNode;
  /** Serif card title (`<h3>`), e.g. the certification or membership name. */
  name: string;
  /** Issuing body, rendered as a small uppercase `accent-deep` line under the name. */
  issuer: string;
  description: string;
};

/**
 * A grid of bordered, rounded, centred certification cards — each = a logo slot (an issuer's logo
 * image or a placeholder glyph), a serif name, an uppercase accent issuing-body line and an
 * ink-soft description — with a hover lift + soft shadow (the logo scales to 1.08). 3 columns
 * from 981px, 2 at 681–980px, 1 at ≤680px. First built for About's "Independently Verified"
 * (`#certifications` → `.cert-grid`/`.cert`/`.cert-logo`/`.cert-logo--placeholder`/`.cert-body`
 * in `about-page.tsx`'s old page-scoped `PAGE_STYLE`, identical to `mock/about.html`'s CSS) —
 * ported 1:1: `26px` plain grid gap, `surface` cards with a `1px` `line` border, `8px` radius,
 * `38px 32px` padding, `text-align:center`; the logo slot `48px` tall, `max-width:160px`, centred
 * with an `18px` bottom margin; the name `22px` serif 500 / `1.08` / `-0.015em` in `ink` (the
 * `.mk h3` base) with `6px` below; the issuer `12px` / `.1em` / uppercase / 600 in `accent-deep`
 * with `14px` below; the description `14px` in `ink-soft`. The `.mk` wrapper's inherited
 * `line-height:1.6` is re-applied as `leading-[1.6]` on each card (Tailwind's preflight would
 * otherwise give 1.5). Hover lift / shadow are literal `[transform:…]` / `[box-shadow:…]`
 * arbitrary properties (Tailwind v4's translate/shadow utilities wouldn't produce the original
 * computed values — see `ChecklistCards`), easing `cubic-bezier(0.4,0,0.2,1)` (`--ease`) over
 * `.35s`. Tracks are `repeat(N,1fr)` (not `minmax(0,1fr)`), as in the original; breakpoints are
 * the old `max-width:980px`/`680px` media queries expressed mobile-first as
 * `min-[681px]:`/`min-[981px]:` (same convention as `AmenityGrid`/`EnquirySplit`).
 *
 * Logo slot: one wrapper for both kinds of logo (the original had an `<img class="cert-logo">`
 * and a separate `<span class="cert-logo cert-logo--placeholder">` flex box). It is a block-level
 * flex box (`h-[48px]`, `max-w-[160px]`, `mx-auto`, centred contents) that sizes any `<img>`
 * child via `[&_img]:` selectors — so a centred, contained 48px-tall logo, exactly as the old
 * `display:block; margin:0 auto` image — and carries the `scale(1.08)` hover transform. Since the
 * image is centred in the slot, scaling the slot scales around the same point as scaling the
 * image did.
 *
 * **Reuse check** — nothing existing fits:
 * - `ChecklistCards` (Real Estate's deal structures) is the nearest: same `26px`-gap grid of
 *   rounded `8px`, `38px 32px`, `surface`/`line` cards with a hover lift, serif name + uppercase
 *   accent line. But it is left-aligned, its card body is a hairline *checklist* (not a
 *   paragraph), it has no logo slot, its type scale differs (26px name, 13.5px/.04em tagline with
 *   22px below), its hover shadow is heavier (`0 24px 50px -30px …42`), it has a `featured`
 *   state/badge and it goes 3 → 1 columns with no 2-up step. Covering certifications would need a
 *   prop for nearly every value.
 * - `BenefitCards` is icon/title/description, but on a *hairline* 4 → 2 → 1 grid (`gap-px` on a
 *   `line` background, square cells), left-aligned, with a 30px icon that lifts/recolours and an
 *   optional CTA row — no rounded bordered cards, no issuer line, no image logo slot.
 * - `IconFeatureGrid` bakes in its own tinted band, `Container` and centred heading, with a 48px
 *   icon *circle* beside the copy, fixed 1 → 3 columns — and can't be used bare.
 * - `PhotoFeatureGrid` is full-bleed photo cards with white text over a scrim.
 * - `StatTiles` is centred hairline tiles too, but its content is a count-up figure + label +
 *   caption — no logo, name or description.
 * Hence a new primitive (those are left untouched).
 *
 * Bare (no own `Section`/`Container`/heading — the caller owns the section shell, its
 * `SectionHead` and the entrance `Reveal`, same as `AmenityGrid`/`ChecklistCards`). The original
 * per-card stagger (`.reveal-stagger`) isn't reproduced; callers wrap the grid in one `Reveal`.
 * MUST be rendered **outside** any `.mk`-scoped subtree: `mock.css`'s un-layered
 * `.mk * { margin:0; padding:0 }` beats `@layer`-wrapped Tailwind utilities regardless of
 * specificity (see `SpecStrip`'s docstring). Purely presentational: no i18n, no data fetching,
 * no icon registry, no `@core/media`.
 */
export function CertificationCards({
  items,
  className,
}: {
  items: CertificationCardItem[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[1fr] gap-[26px]",
        "min-[681px]:grid-cols-[repeat(2,1fr)] min-[981px]:grid-cols-[repeat(3,1fr)]",
        className,
      )}
    >
      {items.map((item, i) => (
        <div
          key={i}
          className="group rounded-[8px] border border-line bg-surface px-[32px] py-[38px] text-center leading-[1.6] transition-[transform,box-shadow] duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:[transform:translateY(-4px)] hover:[box-shadow:0_16px_28px_-20px_rgba(0,0,0,0.35)]"
        >
          {item.logo ? (
            <div className="mx-auto mb-[18px] flex h-[48px] max-w-[160px] items-center justify-center transition-transform duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:[transform:scale(1.08)] [&_img]:h-[48px] [&_img]:w-auto [&_img]:max-w-[160px] [&_img]:object-contain">
              {item.logo}
            </div>
          ) : null}
          <h3 className="mb-[6px] font-serif text-[22px] font-medium leading-[1.08] tracking-[-0.015em] text-ink">
            {item.name}
          </h3>
          <div className="mb-[14px] text-[12px] font-semibold uppercase tracking-[0.1em] text-accent-deep">
            {item.issuer}
          </div>
          <p className="text-[14px] text-ink-soft">{item.description}</p>
        </div>
      ))}
    </div>
  );
}
