/**
 * A plain, static value/label strip — bordered top/bottom, flex items spread evenly
 * (`flex:1 1 0`, 140px min each). Ported 1:1 from `building-detail.tsx`'s old `.mk`-scoped
 * `.specstrip`/`.spec`/`.spec .n`/`.spec .l` CSS (shared `mock.css` section-rhythm rules
 * untouched — that page still embeds other raw sections).
 *
 * Deliberately **not** `StatBand`: this strip has no title, no dark "feature" background,
 * no entrance-count animation (`CountUp`) — and one of its values can be plain text (a
 * neighbourhood name), not a number, so an animated counter would be wrong for it. Bare (no
 * own `Section`/`Container`, same reasoning as `FeaturePanel`) — the caller places it inside
 * whatever wrapper its own page's layout needs (`building-detail.tsx`'s is a flush-under-hero
 * band with a negative bottom margin pulling the next section closer).
 */
export function SpecStrip({ items }: { items: { value: string | number; label: string }[] }) {
  return (
    <div className="flex flex-wrap justify-between gap-6 border-y border-line py-[34px]">
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
