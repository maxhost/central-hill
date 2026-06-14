import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import { Container, Eyebrow, Section } from "@core/ui";
import { listGuideCityGroups } from "../contract";
import { GuideCard } from "./components/guide-card";

/** Guides index: hero + per-city sections of guide-page cards ("What to Do"). */
export async function GuidesListing({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const t = await getTranslations("guides");
  const groups = await listGuideCityGroups(locale);

  // Flat index across all cities for `priority` (LCP) on the first few cards.
  let rendered = 0;

  return (
    <main>
      <Section as="header" className="pb-0">
        <Container>
          <Eyebrow accent>{t("eyebrow")}</Eyebrow>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight text-ink md:text-6xl">
            {t("title")}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">{t("intro")}</p>
        </Container>
      </Section>

      {groups.length === 0 ? (
        <Section>
          <Container>
            <p className="text-center text-ink-soft">{t("empty")}</p>
          </Container>
        </Section>
      ) : (
        groups.map((group, gi) => (
          <Section key={group.city.id} className={gi % 2 === 1 ? "bg-surface" : undefined}>
            <Container>
              <Eyebrow accent>{t("citiesEyebrow")}</Eyebrow>
              <h2 className="mt-3 font-serif text-3xl leading-tight text-ink md:text-4xl">
                {t("guidesIn", { city: group.city.name })}
              </h2>
              <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {group.guides.map((guide) => {
                  const priority = rendered < 3;
                  rendered += 1;
                  return <GuideCard key={guide.id} guide={guide} locale={locale} priority={priority} />;
                })}
              </div>
            </Container>
          </Section>
        ))
      )}
    </main>
  );
}
