import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import { Container, Eyebrow, Section } from "@core/ui";
import { listBuildings } from "../contract";
import { BuildingCard } from "./components/building-card";
import { BuildingFilter } from "./components/building-filter";

/**
 * Buildings listing (content-briefs.md → 2 · Buildings): hero + city/neighbourhood
 * filter + responsive card grid. Fully static (ISR); the filter runs client-side
 * over server-rendered cards.
 */
export async function BuildingsListing({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const t = await getTranslations("buildings");

  const buildings = await listBuildings(locale);

  // Derive the (deduplicated, order-preserving) city + neighbourhood tab sets from
  // the buildings actually present, so empty taxonomy entries never show.
  const cities = new Map<string, { id: string; name: string }>();
  const neighbourhoods = new Map<string, { id: string; name: string; cityId: string }>();
  for (const b of buildings) {
    if (b.city.name && !cities.has(b.city.id)) {
      cities.set(b.city.id, { id: b.city.id, name: b.city.name });
    }
    if (b.neighbourhood?.name && !neighbourhoods.has(b.neighbourhood.id)) {
      neighbourhoods.set(b.neighbourhood.id, {
        id: b.neighbourhood.id,
        name: b.neighbourhood.name,
        cityId: b.city.id,
      });
    }
  }

  const items = buildings.map((b, i) => ({
    id: b.id,
    cityId: b.city.id,
    neighbourhoodId: b.neighbourhood?.id ?? null,
    node: <BuildingCard building={b} locale={locale} priority={i < 3} />,
  }));

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

      <Section className="pt-16">
        <Container>
          {items.length ? (
            <BuildingFilter
              cities={[...cities.values()]}
              neighbourhoods={[...neighbourhoods.values()]}
              items={items}
              allLabel={t("all")}
              countLabel={(n) => t("count", { count: n })}
            />
          ) : (
            <p className="text-ink-soft">{t("empty")}</p>
          )}
        </Container>
      </Section>
    </main>
  );
}
