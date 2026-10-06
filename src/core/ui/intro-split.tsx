import type { ReactNode } from "react";
import { cn } from "./cn";

export type IntroSplitBadge = {
  /** Caller-built icon element (e.g. an Iconoir `<i>` sized by the caller), rendered as-is. */
  icon?: ReactNode;
  label: string;
};

/**
 * An editorial intro split: a serif `<h2>` headline, a larger lede, a few free-prose paragraphs
 * and an optional inline accent "badge" line (icon + bold label) on the left, beside a single
 * full-height cover image on the right (`1.05fr/.95fr`, 56px gap, vertically centred; one
 * column with a 32px gap at ≤880px, text first). First built for Guests' "Welcome to Central
 * Hill" (the old `<!-- WELCOME -->` block in `guest-page.tsx`'s `bodyTop()` → `.welcome`/
 * `.guarantee` in its `PAGE_STYLE`, identical to `mock/guest.html`'s CSS, plus `mock.css`'s
 * `h2.section-title`/`.lede`) — ported 1:1 from the live computed styles, including the `.mk`
 * wrapper's inherited `line-height:1.6` (re-applied as `leading-[1.6]` on the root; Tailwind's
 * preflight would otherwise give 1.5) and `h2.section-title`'s `margin-top:14px`.
 *
 * **Checked against every existing `core/ui` component first** — none fit structurally:
 * `TwoColumnShowcase` (the closest: copy beside one image) has a single `body` string and no
 * way to render a lede *and* several paragraphs, and its `badge` is a floating card over the
 * image with a fixed check glyph — not an inline accent line in the text column with a
 * caller-chosen icon; using it would have meant dropping DB paragraphs or misusing slots.
 * `EditorialSplit` pairs the headline with a hairline icon list + CTAs (no image).
 * `ProseSection` is headline + paragraphs with no image column. `FeatureCtaBand`/`FeaturePanel`/
 * `SplitCtaPanels` are dark/solid CTA panels. Hence a new primitive (those are left untouched).
 *
 * Image: `image` is the caller's own `<MediaImage>`/`<img>` (media + fallback logic already
 * applied — no `@core/media` here, per the `core/ui` ground rule). It is placed in a grid cell
 * that stretches to the row (`self-stretch`) with the original `min-height` (380px, 280px at
 * ≤880px), and its direct child is forced to `w-full h-full object-cover` — reproducing the
 * original `.welcome img{width:100%;height:100%;object-fit:cover;min-height:…}`: the row is as
 * tall as the text column or the min-height, whichever is larger, and the photo covers it.
 *
 * The badge is an `inline-flex` span (not a block), exactly like the original `.guarantee` — so
 * its line box keeps the same trailing baseline space under it. Font-size is the literal
 * `text-[16px]` (not `text-base`, which would also set a 1.5 line-height).
 *
 * Bare (no own `Section`/`Container`/eyebrow — the caller owns the section shell and the
 * entrance reveal, same as `StatTiles`/`ChecklistCards`/`SplitCtaPanels`): Guests' still-raw
 * `.wrap`-based neighbours use `1240px/28px` + `clamp(72px,10vw,150px)`, which differ from the
 * kernel `Section`/`Container` tokens, so the shell is reproduced at the call site. MUST be
 * rendered **outside** any `.mk`-scoped subtree: `mock.css`'s un-layered `.mk * { margin:0;
 * padding:0 }` beats `@layer`-wrapped Tailwind utilities regardless of specificity (see
 * `SpecStrip`'s docstring). Purely presentational: no i18n, no data fetching; React escapes the
 * admin-authored strings.
 */
export function IntroSplit({
  headline,
  lede,
  paragraphs,
  badge,
  image,
  className,
}: {
  headline: string;
  /** Larger intro line under the headline (18px, max 62ch). */
  lede?: string;
  /** Body paragraphs, rendered in order as separate `<p>` elements (empty strings skipped). */
  paragraphs?: string[];
  /** Inline accent line under the copy (e.g. a best-price guarantee); omitted when absent. */
  badge?: IntroSplitBadge;
  /** Caller's own `<MediaImage>`/`<img>`; sized to cover its full-height cell (see above). */
  image: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[1fr] items-center gap-8 leading-[1.6] min-[881px]:grid-cols-[1.05fr_.95fr] min-[881px]:gap-14",
        className,
      )}
    >
      <div>
        <h2 className="mt-[14px] font-serif text-[clamp(30px,4vw,50px)] font-medium leading-[1.08] tracking-[-0.015em] text-ink">
          {headline}
        </h2>
        {lede ? <p className="mt-[18px] max-w-[62ch] text-[18px] text-ink-soft">{lede}</p> : null}
        {paragraphs
          ?.filter(Boolean)
          .map((p, i) => (
            <p key={i} className="mt-[14px] text-ink-soft">
              {p}
            </p>
          ))}
        {badge ? (
          <span className="mt-[22px] inline-flex items-center gap-2.5 text-[16px] font-semibold text-accent-deep">
            {badge.icon}
            {badge.label}
          </span>
        ) : null}
      </div>
      <div className="min-h-[280px] self-stretch *:h-full *:w-full *:object-cover min-[881px]:min-h-[380px]">
        {image}
      </div>
    </div>
  );
}
