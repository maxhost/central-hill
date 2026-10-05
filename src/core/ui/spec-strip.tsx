import { cn } from "./cn";

/**
 * A plain, static value/label strip — bordered bottom only, flex items spread evenly
 * (`flex:1 1 0`, 140px min each). Ported from `building-detail.tsx`'s old `.mk`-scoped
 * `.specstrip`/`.spec`/`.spec .n`/`.spec .l` CSS, with one deliberate client-direction
 * deviation from the mock: no top border and no extra top margin/padding above it (the mock's
 * `margin-top:46px` + `border-top` + the wrapping section's own top padding) — it sits flush
 * under whatever precedes it instead, bottom-bordered only.
 *
 * Deliberately **not** `StatBand`: this strip has no title, no dark "feature" background,
 * no entrance-count animation (`CountUp`) — and one of its values can be plain text (a
 * neighbourhood name), not a number, so an animated counter would be wrong for it. Bare (no
 * own `Section`/`Container`, same reasoning as `FeaturePanel`) — the caller places it inside
 * whatever wrapper its own page's layout needs; `className` is an additive escape hatch for
 * that wrapper's own spacing.
 *
 * MUST be rendered **outside** any `.mk`-scoped subtree: `mock.css`'s `.mk * { margin:0;
 * padding:0 }` reset is a plain (un-layered) rule, and `@import "tailwindcss"` wraps every
 * Tailwind utility in a CSS cascade layer — an un-layered rule always wins over a layered one
 * regardless of specificity, so a `.mk`-nested instance would silently lose its own
 * `py-[34px]`/`mt-2.5` to that reset (discovered the hard way: the first cut nested this
 * inside `.mk` to reach `var(--section-y)`/the raw gallery's CSS, which zeroed its padding and
 * margins). `building-detail.tsx` now keeps this component outside `.mk` entirely and gives
 * the still-raw gallery its own tiny dedicated `.mk` wrapper instead.
 */
export function SpecStrip({
  items,
  className,
}: {
  items: { value: string | number; label: string }[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap justify-between gap-6 border-b border-line py-[34px]", className)}>
      {items.map((item) => (
        <div key={item.label} className="min-w-[140px] flex-1 text-center">
          <div className="font-serif text-[clamp(1.875rem,3.4vw,2.75rem)] leading-none text-ink">
            {item.value}
          </div>
          <div className="mt-2.5 text-xs font-semibold tracking-[0.14em] uppercase text-ink-soft">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}
