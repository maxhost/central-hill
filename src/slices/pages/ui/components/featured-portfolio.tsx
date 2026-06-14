import { getTranslations } from "next-intl/server";
import Link from "next/link";
import type { Locale } from "@core/db/columns";
import { MediaImage } from "@core/media";
import { ButtonLink, Container } from "@core/ui";
import { type BuildingSummary, getFeaturedBuildings } from "@slices/buildings/contract";
import { SectionHeading } from "./blocks";

/**
 * Featured portfolio (Home/Guest). Reads the featured buildings via the buildings
 * contract (`getFeaturedBuildings`, top 3 by position) and renders a card grid linking to
 * each building detail. Builds its own card from `BuildingSummary` (no cross-slice UI
 * import, golden rule 2). Subscribes transitively to `building-list`.
 */
export async function FeaturedPortfolio({ locale }: { locale: Locale }) {
  const buildings = await getFeaturedBuildings(locale, 3);
  if (buildings.length === 0) return null;

  const t = await getTranslations("pages");

  return (
    <section className="py-[clamp(64px,10vw,160px)]">
      <Container>
        <SectionHeading
          center
          eyebrow={t("portfolio.eyebrow")}
          title={t("portfolio.title")}
          intro={t("portfolio.intro")}
        />
        <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-3">
          {buildings.map((b, i) => (
            <PortfolioCard key={b.id} locale={locale} building={b} priority={i < 3} t={t} />
          ))}
        </div>
        <div className="mt-12 text-center">
          <ButtonLink href={`/${locale}/buildings`} variant="outline">
            {t("portfolio.viewAll")}
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}

function PortfolioCard({
  locale,
  building,
  priority,
  t,
}: {
  locale: Locale;
  building: BuildingSummary;
  priority: boolean;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  const meta = [
    t("portfolio.apartments", { count: building.stats.apartments }),
    t("portfolio.guests", { count: building.stats.capacity }),
  ].join(" · ");

  return (
    <Link href={`/${locale}/buildings/${building.slug}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface">
        {building.cover ? (
          <MediaImage
            data={building.cover}
            priority={priority}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : null}
        {building.isFeatured ? (
          <span className="absolute left-4 top-4 rounded-full bg-surface/90 px-3 py-1 text-xs font-medium text-ink">
            ★ {t("portfolio.featured")}
          </span>
        ) : null}
      </div>
      <h3 className="mt-4 font-serif text-xl text-ink">{building.name}</h3>
      <p className="mt-1 text-sm text-ink-soft">{meta}</p>
      <span className="mt-2 inline-block text-sm font-medium text-accent">{t("portfolio.view")}</span>
    </Link>
  );
}
