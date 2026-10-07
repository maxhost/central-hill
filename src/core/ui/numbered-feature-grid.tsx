import { cn } from "./cn";

/**
 * A hairline-separated grid of numbered feature cards (index + title + body), each on the
 * `surface` background with a hover lift + accent-bordered inset glow. First built for About's
 * "What Guides Us" values grid (`#values`), ported 1:1 from its old `.mk`-scoped `.val-grid`/
 * `.val`/`.vnum` CSS (`about-page.tsx`'s `PAGE_STYLE`, including the page-scoped
 * `#values .val:hover`/`.val:hover .vnum` motion rules) — no new design.
 *
 * The index ("01".."0N") is derived from array position, not a caller-supplied field — same
 * convention as `StepGallery`'s step numbers and `PricingCards`' "Most Popular" ribbon, both
 * rendering concerns tied to order rather than data.
 *
 * Not `StatBand`: that's a dark `feature`-band count-up metric row (animated numbers, no title/
 * body copy per cell). Not `FeaturePanel`: that's a single dark CTA panel, not a repeating grid.
 * Not `SpecStrip`: that's a flat, unbordered value/label strip with no card chrome, no index
 * number, and (per its own docstring) deliberately no hover motion. This component is a
 * distinct shape — a bordered N-up grid of index+title+body cards with per-card hover lift —
 * close enough to `StepGallery`'s hairline-grid technique (`border` + `bg-line` wrapper,
 * `gap-px` children) that it reuses that same technique, but the cards are plain text on
 * `surface`, not full-bleed photos, so it isn't `StepGallery` either.
 *
 * Desktop grid is a literal `grid-cols-4` (the original CSS's `repeat(4,1fr)`, and About's
 * `values` content is fixed at exactly 4 items) — like `StepGallery`, the `681–980px`/`<681px`
 * breakpoints (2-col/1-col) degrade for any item count.
 *
 * Purely presentational, per the `core/ui` ground rule: no i18n, no entrance-reveal wiring
 * (the caller wraps the whole section, same as `StatBand`/`StepGallery`) — only the hover
 * motion is baked in here, since (like `PropertyCard`/`PricingCards`) that's intrinsic card
 * chrome, not a page-composition choice.
 */
export function NumberedFeatureGrid({
  items,
  className,
}: {
  items: { title: string; body: string }[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-px border border-line bg-line min-[681px]:grid-cols-2 min-[981px]:grid-cols-4",
        className,
      )}
    >
      {items.map((item, i) => (
        <div
          key={item.title}
          className="group bg-surface px-[30px] py-[38px] transition-[transform,box-shadow] duration-[350ms] ease-in-out hover:-translate-y-1 hover:shadow-[inset_0_0_0_1px_var(--color-accent-deep),0_16px_28px_-20px_rgba(0,0,0,0.35)]"
        >
          <div className="mb-[18px] font-serif text-[42px] leading-none text-accent opacity-[0.85] transition-[color,transform] duration-[350ms] ease-in-out group-hover:-translate-y-0.5 group-hover:text-accent-deep">
            {String(i + 1).padStart(2, "0")}
          </div>
          <h3 className="mb-[10px] font-serif text-[21px] leading-[1.08] tracking-[-0.015em] font-medium text-ink">
            {item.title}
          </h3>
          <p className="text-[14.5px] leading-[1.6] text-ink-soft">{item.body}</p>
        </div>
      ))}
    </div>
  );
}
