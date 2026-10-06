import type { Locale } from "@core/db/columns";
import { JsonLd, faqPageLd } from "@core/seo";
import { FaqAccordion, SectionHead } from "@core/ui";
import { getFaqGroup } from "@slices/faq/contract";

/**
 * Marketing FAQ section (Owners/Guests/Real-Estate). Reads a group by its language-neutral
 * key from the faq slice; renders nothing when the group is empty. Subscribes transitively
 * to `faq-list`. (Distinct from per-building FAQ, which lives on the building detail.)
 * Emits `FAQPage` JSON-LD via the kernel `core/seo` builder (ADR 0020, resolving the
 * prior escalation note). The head is `core/ui`'s centred `SectionHead` in the standard page
 * shell (see `FeaturedPortfolio`); the accordion itself is `core/ui`'s `FaqAccordion` (the
 * one site-wide accordion, narrower `max-w-3xl` column — moved there verbatim from here, also
 * used by the per-building FAQ), so this component is only data + JSON-LD + shell + head.
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
        <FaqAccordion items={group.items} />
      </div>
    </section>
  );
}
