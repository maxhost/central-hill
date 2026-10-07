import type { ReactNode } from "react";
import { ButtonLink } from "./button";

export type PhotoFeatureGridItem = {
  /** Caller-built icon element (e.g. a server parent's `<Icon name="car" size={30} />` from
   * `@core/ui/icon`, ADR 0034; same precedent as `IconFeatureGrid`'s `item.icon`). Rendered at
   * 30px, white, with a drop-shadow so it stays legible over any photo. */
  icon?: ReactNode;
  title: string;
  description: string;
  /** CSS `background-image` url, by position. TEMP Pexels-placeholder convention (same as
   * Owners' `journey`/`StepGallery` steps): no admin-managed image field exists for these
   * cards yet, so callers pass a positional stock-photo constant until one does. Omitting it
   * leaves the card on the plain `surface` background with **no** dark-gradient scrim — but
   * `title`/`description` still render in white (matching the live source CSS this was ported
   * from 1:1, see docstring below), so an image-less card is illegible. Every known caller
   * today supplies exactly one image per item; this isn't defended against further because the
   * source markup never did either. */
  image?: string;
};

/**
 * A bordered grid of full-bleed photo cards — icon, title, description in white over a dark
 * bottom-weighted gradient scrim — with an optional centered CTA row (button + note) below.
 * First built for the Guests page's "Make the Most of Your Stay" services teaser (`.feat-grid`/
 * `.feat`/`.cta-row` in `guest-page.tsx`'s old `PAGE_STYLE`, now trimmed to the page's
 * still-raw "What to Do" teaser only), ported 1:1 — not a new design.
 *
 * **Not `IconFeatureGrid`**, despite both being "N-up icon/title/description grids" — a real
 * difference in chrome, not just a style tweak: `IconFeatureGrid` is one outer banded strip
 * (`border-y` + tinted background, no per-card border) with a 48px bordered icon **circle**
 * beside plain-ink text, a single `821px` breakpoint (3→1 col), fixed at 3 items, and no CTA
 * slot. This component is the opposite shape on every one of those axes: no outer band, each
 * card is its own bordered/photo-backed unit, the icon is a bare 30px glyph over the photo (no
 * circle), white text (not ink), **two** breakpoints (`881px`/`641px`, 3→2→1 col) for **6**
 * items, plus a CTA row. Stretching `IconFeatureGrid`'s already-fixed `grid-cols-3`/band/no-CTA
 * contract to cover this on top would have forced new conditional chrome into a component whose
 * only real consumer (Services' "How It Works") needs none of it — a new, separate component
 * guarantees neither consumer's behavior can regress from the other's changes, same reasoning
 * `IconFeatureGrid`'s own docstring gives for not being `StepGallery`/`EditorialSplit`.
 *
 * **Not `StepGallery` either**, even though both are full-bleed photo cards with a dark scrim
 * and white overlay text (closer kin than `IconFeatureGrid`): `StepGallery` renders a numbered
 * **index** (not a caller icon), uses one shared hairline grid (`border` + `gap-px` + `bg-line`
 * "hairline" technique — cards have no border of their own), is pinned to exactly 5 items at a
 * `981px`/`681px` breakpoint pair, and has no CTA slot. This component's cards instead each
 * carry their own full `border-line` + `gap-[26px]` (plain grid gap, not the hairline trick),
 * a caller icon instead of a derived index, 6 items at `881px`/`641px`, and the CTA row. Same
 * "close in spirit, different enough in chrome/item-count/breakpoints that extending either
 * risks regressing its one real consumer" call as above.
 *
 * **Deviation found and ported deliberately, not silently**: the *approved static* baseline
 * (`mock/guest.html`) actually defines `.feat` as a plain card — `background:var(--surface);
 * border:1px solid var(--line);padding:34px 30px` — with **no** photo, no gradient scrim, and
 * ink-colored (not white) text. The *live, already-shipped* `guest-page.tsx` `PAGE_STYLE`
 * diverged from that mock some time before this extraction (`position:relative;isolation:
 * isolate;overflow:hidden;...background-size:cover;background-position:center` + a `::before`
 * gradient scrim + white icon/title/description), with an explicit in-code reason: "Premium
 * photo backgrounds for the Services/What-to-do teaser cards ... client feedback: premium look
 * for Services/What-to-do" (`guest-page.tsx`, `SERVICES_TEASER_BG`/`iconCards` docstring) — the
 * same documented, deliberate "trying a photo-background treatment" direction already applied
 * to Owners' `journey` (`StepGallery`). This component ports the **live** shipped chrome
 * (screenshotted/computed-style-diffed against `localhost:3026/en/guests`, not the stale mock),
 * per that precedent and because it's what's actually in production; flagged here, not resolved
 * unilaterally, per the component-extraction workflow's Lesson 2.
 *
 * A likely **future** second consumer of this exact shape: the Guests page's immediately
 * adjacent "What to Do" teaser (same `.feat-grid`/`.feat`/`.cta-row` markup, still raw HTML in
 * `guest-page.tsx` as of this extraction) — not migrated here (out of this task's scope), but
 * worth knowing when it's its turn: it only needs a `ctaVariant="ghost"` (its button is
 * `btn-ghost`, not `btn-accent`) and no other prop change.
 *
 * The CTA uses `core/ui`'s `ButtonLink` (not a pixel-reproduction of the mock's raw `.btn`
 * CSS) — same choice every other ported CTA in this codebase already made
 * (`TwoColumnShowcase`/`EditorialSplit`/`PricingCards`/`FeatureCtaBand`/`CalloutBand`), so this
 * inherits, not introduces, `ButtonLink`'s own small deviations from `.btn` (`rounded-md` 6px
 * vs the mock's `3px`, `py-3` 12px vs `14px`, `text-surface` `#fffdf8` vs the mock's literal
 * `#fff`) — noted here for completeness, not treated as this component's bug to fix.
 *
 * Purely presentational, per the `core/ui` ground rule: no `@core/media`, no slice icon
 * registry, no i18n, no `Reveal` wired in internally (the caller wraps it, same as
 * `StatBand`/`StepGallery`/`IconFeatureGrid`).
 */
export function PhotoFeatureGrid({
  items,
  cta,
  className,
}: {
  items: PhotoFeatureGridItem[];
  cta?: {
    label: string;
    href: string;
    note?: string;
    /** `"ghost"` for a `.btn-ghost`-style secondary CTA (e.g. a future "What to Do" teaser
     * consumer); defaults to the primary accent-filled button (`.btn-accent`). */
    variant?: "primary" | "ghost";
  };
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="grid grid-cols-1 gap-[26px] min-[641px]:grid-cols-2 min-[881px]:grid-cols-3">
        {items.map((item, i) => (
          <div
            key={i}
            className="group relative isolate flex min-h-[260px] flex-col justify-end overflow-hidden border border-line bg-cover bg-center px-[30px] py-[34px] transition-transform duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-1"
            style={item.image ? { backgroundImage: `url(${item.image})` } : undefined}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(180deg,rgba(12,10,8,0.15)_0%,rgba(12,10,8,0.55)_60%,rgba(12,10,8,0.82)_100%)]"
            />
            <div className="relative z-[1]">
              {item.icon ? (
                <span
                  aria-hidden
                  className="mb-[18px] block text-[30px] leading-none text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] transition-transform duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:-translate-y-[3px] group-hover:scale-110"
                >
                  {item.icon}
                </span>
              ) : null}
              <h3 className="mb-2 font-serif text-[20px] font-medium leading-[1.08] text-white">
                {item.title}
              </h3>
              <p className="text-[14.5px] leading-[1.6] text-white/[0.88]">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      {cta ? (
        <div className="mt-11 flex flex-wrap items-center justify-center gap-4">
          <ButtonLink href={cta.href} variant={cta.variant === "ghost" ? "ghost" : "primary"}>
            {cta.label}
          </ButtonLink>
          {cta.note ? <span className="text-[13px] text-ink-soft">{cta.note}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
