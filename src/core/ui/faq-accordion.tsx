import { cn } from "./cn";

export type FaqAccordionItem = {
  /** Stable key (e.g. the DB row id); falls back to the item's index when absent. */
  id?: string;
  question: string;
  /** Plain text, rendered as-is in one `<p>` (React escapes it; newlines collapse like any
   *  HTML whitespace — the same behaviour `FaqSection` has always had). */
  answer: string;
};

/**
 * The site's one FAQ accordion: a narrow (`max-w-3xl`, centred) column of hairline-separated
 * native `<details>`/`<summary>` rows — serif question with an accent "+" that rotates to "×"
 * when open (`group-open:rotate-45`), ink-soft answer paragraph capped at `70ch`. Native
 * disclosure, so it stays a server component with zero JS, is keyboard-accessible and degrades
 * gracefully; the default disclosure triangle is hidden. Moved **verbatim** out of `pages`'
 * `FaqSection` (the approved look, mirroring `mock/owners.html` `.faq`), whose markup it was.
 *
 * First consumers: `FaqSection` (Home/Owners/Real-Estate/About/Guests) and the per-building
 * FAQ on `building-detail.tsx` (which used to be a raw `.mk`-scoped `.faq` HTML string).
 *
 * Reuse decision: **one accordion site-wide** (consistency over mock fidelity). The buildings
 * mock's own `.faq` metrics — 21px summary, 780px column, 64ch answer, `+` as a `::after` in
 * `accent-deep` — were intentionally dropped in favour of this one, so every FAQ on the site
 * looks and behaves the same. Change the look here, once, for all of them.
 *
 * Bare (no own `Section`/`Container`/heading, no `FAQPage` JSON-LD): the caller owns the
 * section shell, the `SectionHead` above it and the structured data (`core/seo`'s
 * `faqPageLd` + `JsonLd`), same split as `AmenityGrid`/`StatTiles`. Purely presentational: no
 * i18n, no data fetching, no slice imports.
 */
export function FaqAccordion({ items, className }: { items: FaqAccordionItem[]; className?: string }) {
  return (
    <div className={cn("mx-auto max-w-3xl", className)}>
      <div className="border-t border-line">
        {items.map((item, i) => (
          <details key={item.id ?? i} className="group border-b border-line">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 font-serif text-lg text-ink transition-colors hover:text-accent-deep [&::-webkit-details-marker]:hidden">
              {item.question}
              <span
                aria-hidden
                className="mt-1 shrink-0 text-2xl leading-none text-accent transition-transform duration-200 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="max-w-[70ch] pb-6 leading-relaxed text-ink-soft">{item.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
