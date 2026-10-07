import { cn } from "./cn";

export type ChecklistCard = {
  /** Serif card title (`<h3>`), e.g. a partnership-model name. */
  name: string;
  /** Short uppercase accent line under the title. */
  tagline: string;
  /** The card's bullet list; each item gets a CSS-drawn accent check. */
  points: string[];
  /** Highlight the card: accent border + accent glow shadow (kept on hover). */
  featured?: boolean;
  /** Pill badge floating centred over the top edge — only rendered when `featured` and non-empty. */
  featureLabel?: string;
};

/**
 * A grid of bordered option cards (3 columns ≥981px, 1 column ≤980px, top-aligned), each =
 * serif title + uppercase accent tagline + a hairline-separated checklist (accent check drawn
 * in `::before`), with a hover lift. One card can be `featured` (accent border + accent glow,
 * plus an optional floating pill badge whose text is caller-supplied). First built for Real
 * Estate's "Deal Structures" partnership models (`#deal-structures` → `.models`/`.model`/
 * `.feat-tag`/`.mtag` in `real-estate-page.tsx`'s old `PAGE_STYLE`, identical to
 * `mock/real-estate.html`'s CSS) — ported 1:1 from the live computed styles, including the
 * old `.mk` wrapper's inherited `line-height:1.6` (re-applied as `leading-[1.6]`; Tailwind's
 * preflight would otherwise give 1.5).
 *
 * Not `PricingCards` (Owners' plans), although the card chrome looks related: that one is a
 * 4-column grid (gap 20px vs 26px here), padding 34/26px (vs 38/32px), an inverted hierarchy
 * (name = small uppercase label above a 25px serif tag line, vs a 26px serif `<h3>` name above
 * an uppercase tagline here), a mandatory CTA button per card (none here), a hardcoded "Most
 * Popular" ribbon (here the badge text is data), tighter list rows (9px vs 11px padding, check
 * at 14px vs 16px), and its own `Section`/`Container`/heading. Bending it to cover both would
 * change Owners' rendering or need a prop for nearly every value, so `PricingCards` is left
 * untouched and this is a separate primitive.
 *
 * Exactness notes: the hover lift / shadows are literal `[transform:…]` / `[box-shadow:…]`
 * arbitrary properties, not `-translate-y-1` / `shadow-[…]` — Tailwind v4's translate
 * utilities write the separate `translate` property and its shadow utilities compose several
 * `--tw-*` layers, so neither would produce the original computed `transform` / `box-shadow`.
 * As in the original, a featured card keeps its accent glow on hover (the original's
 * `.model.featured` rule came after `.model:hover` at equal specificity), so the neutral hover
 * shadow is only applied to non-featured cards. Grid tracks are `repeat(3,1fr)` (not
 * `minmax(0,1fr)`) to match the original exactly.
 *
 * Bare (no own `Section`/`Container`/heading/note — the caller owns the section shell, sec-head,
 * entrance reveal and any footnote, same as `StatTiles`/`StatBento`). Purely presentational: no
 * i18n, no data fetching.
 */
export function ChecklistCards({
  cards,
  className,
}: {
  cards: ChecklistCard[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[1fr] items-start gap-[26px] leading-[1.6] min-[981px]:grid-cols-[repeat(3,1fr)]",
        className,
      )}
    >
      {cards.map((card, i) => (
        <div
          key={i}
          className={cn(
            "relative flex flex-col rounded-[8px] border bg-surface px-[32px] py-[38px] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:[transform:translateY(-4px)]",
            card.featured
              ? "border-accent [box-shadow:0_24px_54px_-28px_color-mix(in_srgb,var(--color-accent)_55%,transparent)]"
              : "border-line hover:[box-shadow:0_24px_50px_-30px_rgba(0,0,0,0.42)]",
          )}
        >
          {card.featured && card.featureLabel ? (
            <span className="absolute -top-[13px] left-1/2 rounded-[30px] bg-accent px-[16px] py-[6px] text-[11px] font-semibold uppercase tracking-[0.13em] text-white [transform:translateX(-50%)]">
              {card.featureLabel}
            </span>
          ) : null}
          <h3 className="mb-[6px] font-serif text-[26px] font-medium leading-[1.08] tracking-[-0.015em] text-ink">
            {card.name}
          </h3>
          <div className="mb-[22px] text-[13.5px] font-semibold uppercase tracking-[0.04em] text-accent-deep">
            {card.tagline}
          </div>
          <ul className="m-0 flex-1 list-none p-0">
            {card.points.map((point, j) => (
              <li
                key={j}
                className="relative border-t border-line py-[11px] pr-0 pl-[28px] text-[14.5px] text-ink-soft first:border-t-0 before:absolute before:top-[16px] before:left-0 before:h-[8px] before:w-[14px] before:border-b-2 before:border-l-2 before:border-accent before:content-[''] before:[transform:rotate(-45deg)]"
              >
                {point}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
