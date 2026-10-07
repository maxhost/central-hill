import type { ReactNode } from "react";
import { cn } from "./cn";
import { SectionHead } from "./section-head";

export type IntroSplitBadge = {
  /** Caller-built icon element (e.g. a server parent's
   * `<Icon name="percentage-circle" size={22} />` from `@core/ui/icon`, ADR 0034), rendered
   * as-is. */
  icon?: ReactNode;
  label: string;
};

/**
 * An editorial intro split: a serif `<h2>` headline, a larger lede, a few free-prose paragraphs
 * and an optional inline accent "badge" line (icon + bold label) on the left, beside a single
 * full-height cover image on the right (`1.05fr/.95fr`, 56px gap, vertically centred; one
 * column with a 32px gap at ≤880px, text first). First built for Guests' "Welcome to Central
 * Hill" (the old `<!-- WELCOME -->` block in `guest-page.tsx`'s `bodyTop()` → `.welcome`/
 * `.guarantee` in its `PAGE_STYLE`, identical to `mock/guest.html`'s CSS, plus the old `mock.css`'s
 * `h2.section-title`/`.lede`) — ported 1:1 from the live computed styles, including the old `.mk`
 * wrapper's inherited `line-height:1.6` (re-applied as `leading-[1.6]` on the root; Tailwind's
 * preflight would otherwise give 1.5). The headline + lede are now `SectionHead` (`flush`), so
 * the title drops `h2.section-title`'s eyebrow-less `margin-top:14px` and the lede offset is
 * `16px` instead of `18px`, matching every other section head (consistency over mock fidelity).
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
 * Optional `eyebrow` and `imagePosition` were added for About (see the props). Bare (no own
 * `Section`/`Container` — the caller owns the section shell and the
 * entrance reveal, same as `StatTiles`/`ChecklistCards`/`SplitCtaPanels`): Guests' still-raw
 * `.wrap`-based neighbours use `1240px/28px` + `clamp(72px,10vw,150px)`, which differ from the
 * kernel `Section`/`Container` tokens, so the shell is reproduced at the call site. Purely
 * presentational: no i18n, no data fetching; React escapes the admin-authored strings.
 */
export function IntroSplit({
  eyebrow,
  headline,
  lede,
  paragraphs,
  badge,
  image,
  imagePosition = "right",
  className,
}: {
  /** Small uppercase label above the headline (`SectionHead`'s eyebrow); omitted when absent. */
  eyebrow?: string;
  headline: string;
  /** Larger intro line under the headline (18px, max 62ch). */
  lede?: string;
  /** Body paragraphs, rendered in order as separate `<p>` elements (empty strings skipped). */
  paragraphs?: string[];
  /** Inline accent line under the copy (e.g. a best-price guarantee); omitted when absent. */
  badge?: IntroSplitBadge;
  /** Caller's own `<MediaImage>`/`<img>`; sized to cover its full-height cell (see above). */
  image: ReactNode;
  /**
   * `"right"` (default, Guests): copy then image, text first when stacked. `"left"` (About's
   * "How We Started"/"Giving Back"): the columns mirror (image `.95fr`, copy `1.05fr`) and the
   * image also comes first when stacked, as in that page's original `.comm` markup.
   */
  imagePosition?: "left" | "right";
  className?: string;
}) {
  const imageLeft = imagePosition === "left";
  return (
    <div
      className={cn(
        "grid grid-cols-[1fr] items-center gap-8 leading-[1.6] min-[881px]:gap-14",
        imageLeft ? "min-[881px]:grid-cols-[.95fr_1.05fr]" : "min-[881px]:grid-cols-[1.05fr_.95fr]",
        className,
      )}
    >
      <div className={imageLeft ? "order-last" : undefined}>
        <SectionHead flush eyebrow={eyebrow || undefined} headline={headline} intro={lede || undefined} />
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
