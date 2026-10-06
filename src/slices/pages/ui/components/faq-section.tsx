import type { Locale } from "@core/db/columns";
import { JsonLd, faqPageLd } from "@core/seo";
import { SectionHead } from "@core/ui";
import { getFaqGroup } from "@slices/faq/contract";

/**
 * Marketing FAQ section (Owners/Guests/Real-Estate). Reads a group by its language-neutral
 * key from the faq slice; renders nothing when the group is empty. Subscribes transitively
 * to `faq-list`. (Distinct from per-building FAQ, which lives on the building detail.)
 * Emits `FAQPage` JSON-LD via the kernel `core/seo` builder (ADR 0020, resolving the
 * prior escalation note). The head is `core/ui`'s centred `SectionHead` in the standard page
 * shell (see `FeaturedPortfolio`); the accordion keeps its narrower `max-w-3xl` column.
 */
export async function FaqSection({
  locale,
  groupKey,
  title,
  intro,
}: {
  locale: Locale;
  groupKey: string;
  title: string;
  intro?: string;
}) {
  const group = await getFaqGroup(locale, groupKey);
  if (!group || group.items.length === 0) return null;

  return (
    <section className="scroll-mt-[84px] py-[clamp(72px,10vw,150px)]">
      <JsonLd
        data={faqPageLd(group.items.map((item) => ({ question: item.question, answer: item.answer })))}
      />
      <div className="mx-auto max-w-[1240px] px-[28px]">
        <SectionHead align="center" headline={title} intro={intro || undefined} />
        <div className="mx-auto max-w-3xl">
          {/*
           * Expand/collapse accordion (mirrors `mock/owners.html` `.faq`): native
           * <details>/<summary> so it stays a server component with zero JS, is keyboard-
           * accessible, and degrades gracefully. The "+" marker rotates to "×" via the
           * Tailwind `open:` group variant; the default disclosure triangle is hidden.
           */}
          <div className="border-t border-line">
            {group.items.map((item) => (
              <details key={item.id} className="group border-b border-line">
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
      </div>
    </section>
  );
}
