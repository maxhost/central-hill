import { getTranslations } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import { Container, Eyebrow, Section } from "@core/ui";
// Resolved through the buildings CONTRACT only (golden rule 2): we need the building
// id (to list its units) + its Avantio booking handle (card fallback link).
import { getBuildingBySlug } from "@slices/buildings/contract";
import { listByBuilding } from "../contract";
import { ApartmentCard } from "./components/apartment-card";

/**
 * "Apartments in this Building" grid (docs/content-briefs.md → building detail). A
 * self-contained section the building-detail composition embeds by slug; renders
 * nothing when the building is unpublished or has no published units.
 *
 * INTEGRATION (handoff to S2 / S9): drop `<BuildingApartments locale slug />` into
 * the building-detail page, after the gallery. This slice ships it ready to compose
 * but does not edit the buildings-owned detail component (golden rule 1).
 */
export async function BuildingApartments({ locale, slug }: { locale: Locale; slug: string }) {
  const building = await getBuildingBySlug(locale, slug);
  if (!building) return null;

  const apartments = await listByBuilding(locale, building.id);
  if (apartments.length === 0) return null;

  const t = await getTranslations("apartments");
  const bookingHref = building.avantio.url ?? "#book";

  return (
    <Section className="bg-surface">
      <Container>
        <div className="max-w-2xl" id="apartments">
          <Eyebrow accent>{t("eyebrow")}</Eyebrow>
          <h2 className="mt-3 font-serif text-3xl leading-tight text-ink md:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">{t("intro")}</p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {apartments.map((a, i) => (
            <ApartmentCard
              key={a.id}
              apartment={a}
              bookingHref={bookingHref}
              priority={i < 3}
            />
          ))}
        </div>

        <p className="mt-12 text-center text-sm text-ink-soft">{t("poweredBy")}</p>
      </Container>
    </Section>
  );
}
