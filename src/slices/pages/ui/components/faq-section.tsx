import type { Locale } from "@core/db/columns";
import { JsonLd, faqPageLd } from "@core/seo";
import { Container } from "@core/ui";
import { getFaqGroup } from "@slices/faq/contract";
import { SectionHeading } from "./blocks";

/**
 * Marketing FAQ section (Owners/Guests/Real-Estate). Reads a group by its language-neutral
 * key from the faq slice; renders nothing when the group is empty. Subscribes transitively
 * to `faq-list`. (Distinct from per-building FAQ, which lives on the building detail.)
 * Emits `FAQPage` JSON-LD via the kernel `core/seo` builder (ADR 0020, resolving the
 * prior escalation note).
 */
export async function FaqSection({
  locale,
  groupKey,
  eyebrow,
  title,
  intro,
}: {
  locale: Locale;
  groupKey: string;
  eyebrow?: string;
  title: string;
  intro?: string;
}) {
  const group = await getFaqGroup(locale, groupKey);
  if (!group || group.items.length === 0) return null;

  return (
    <section className="py-[clamp(64px,10vw,160px)]">
      <JsonLd
        data={faqPageLd(group.items.map((item) => ({ question: item.question, answer: item.answer })))}
      />
      <Container>
        <div className="mx-auto max-w-3xl">
          <SectionHeading eyebrow={eyebrow} title={title} intro={intro} />
          <dl className="mt-10 divide-y divide-line border-t border-line">
            {group.items.map((item) => (
              <div key={item.id} className="py-6">
                <dt className="font-medium text-ink">{item.question}</dt>
                <dd className="mt-2 leading-relaxed text-ink-soft">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}
