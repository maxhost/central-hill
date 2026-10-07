import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * The standard section head: an optional uppercase eyebrow, a serif `<h2>` title and an
 * optional lede/intro paragraph, left-aligned or centred, sitting above a section's body. It is
 * the React port of the mocks' `.sec-head` > `.eyebrow` + `h2.section-title` + `.lede` markup
 * (the old `src/app/mock.css`), which the `.mk` pages used to render as raw HTML strings. First
 * applied on Real Estate (`#deal-structures`, `#market`, `#track-record`).
 *
 * **Variants found in the survey** (raw `sec-head`s on Guests, About, Services listing/detail,
 * Blog, Guides, Buildings detail and Real Estate), and how each maps onto the props:
 * - eyebrow + title + lede, left: About ("One Platform", "What Guides Us", "Independently
 *   Verified") and Guides' "Top Recommendations" → `eyebrow` + `headline` + `intro`.
 * - eyebrow + title + lede, centred: Guests (`secHead()`: why-book-direct, services and
 *   what-to-do teasers), Services listing → the same plus `align="center"`.
 * - eyebrow + title, no lede: Services detail (partners, gallery, more services, rates,
 *   notes), Blog's "From the Journal", About's "Get in Touch", Guides' per-city heads.
 * - title + lede, no eyebrow: Real Estate `#market` and `#track-record` (left), and
 *   `#deal-structures` (`align="center"`).
 * - title only: Buildings detail (amenities, FAQ).
 * - eyebrow only: Blog's "Featured" label (no `headline`).
 * - custom bottom spacing: Blog's two heads override the `54px` gap (`28px`/`34px`). Pass
 *   `flush` to drop the built-in margin and space the next element yourself, because `cn` only
 *   joins classes and does not resolve a conflicting `mb-*` passed through `className`.
 * - lede offset: the raw markup uses an inline `margin-top` of `16px` (Real Estate, Guides,
 *   Guests) or `18px` (About). This standardises on `16px`, the same as `StepGallery` and
 *   `PricingCards`.
 *
 * **Look (consistency over mock fidelity).** This matches the section heads that `core/ui`
 * already renders, rather than introducing a new style. The eyebrow, title and lede use the
 * classes of `ProseSection`/`IconFeatureGrid`'s eyebrow and the `h2` and lede shared with
 * `StepGallery`/`PricingCards`. Those are themselves 1:1 ports of the old `mock.css`: eyebrow
 * `12px/600/.18em` uppercase in `accent-deep`; title `clamp(30px,4vw,50px)`, `1.08` leading and
 * `-0.015em` tracking; lede `18px` in `ink-soft`, capped at `62ch`; head `max-width:720px`
 * (`45rem`) with a `54px` bottom margin. Two deliberate choices:
 * - The title's `14px` top margin applies only when there is an eyebrow above it, as in every
 *   sibling. `mock.css`'s `h2.section-title { margin:14px 0 0 }` kept it even with no eyebrow,
 *   so eyebrow-less heads sit `14px` higher than their raw versions.
 * - The lede sets `leading-[1.6]` explicitly to keep the old `.mk` wrapper's inherited
 *   `line-height:1.6` (28.8px), as `EditorialSplit`'s body and `StatTiles` do. Tailwind's `text-lg`
 *   alone would give 28px.
 * It does not reuse `Eyebrow`: that component is `500/.16em` in `accent` (the
 * `EditorialSplit`/`TwoColumnShowcase` look), not the `600/.18em` `accent-deep` sec-head label. The
 * slice-local `SectionHeading` (`slices/pages/ui/components/blocks.tsx`) is an older, smaller
 * (`text-3xl/4xl`) heading, so it is not this one either.
 *
 * Bare and purely presentational: no `Section`/`Container`, no data fetching, no i18n, and no
 * entrance animation. The caller owns the section shell and wraps the head in `Reveal` where the
 * page animates it, as Real Estate does. Pages whose raw `.reveal` was neutralised by the old
 * `mock.css` (Services, Blog, Guides, Buildings detail) render it statically.
 */
export function SectionHead({
  eyebrow,
  headline,
  intro,
  align = "left",
  flush = false,
  className,
}: {
  /** Small uppercase label above the title. */
  eyebrow?: ReactNode;
  /** The `<h2>` title. Omit only for an eyebrow-only label head (Blog's "Featured"). */
  headline?: ReactNode;
  /** Lede/intro paragraph under the title (capped at `62ch`, centred along with the head). */
  intro?: ReactNode;
  /** `"left"` (default) or `"center"`: centres the 720px head block, its text and the lede. */
  align?: "left" | "center";
  /** Drop the built-in `54px` bottom margin so the caller can space the next element. */
  flush?: boolean;
  className?: string;
}) {
  const center = align === "center";
  return (
    <div
      className={cn(
        "max-w-[45rem]",
        !flush && "mb-[54px]",
        center && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? (
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-deep">
          {eyebrow}
        </span>
      ) : null}
      {headline ? (
        <h2
          className={cn(
            "font-serif text-[clamp(1.875rem,4vw,3.125rem)] font-medium leading-[1.08] tracking-[-0.015em] text-ink",
            eyebrow ? "mt-[14px]" : undefined,
          )}
        >
          {headline}
        </h2>
      ) : null}
      {intro ? (
        <p
          className={cn(
            "max-w-[62ch] text-lg leading-[1.6] text-ink-soft",
            eyebrow || headline ? "mt-4" : undefined,
            center && "mx-auto",
          )}
        >
          {intro}
        </p>
      ) : null}
    </div>
  );
}
