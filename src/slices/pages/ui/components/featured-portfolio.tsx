import { getTranslations } from "next-intl/server";
import Link from "next/link";
import type { Locale } from "@core/db/columns";
import { MediaImage } from "@core/media";
import { ButtonLink, Container } from "@core/ui";
import { type BuildingSummary, getFeaturedBuildings } from "@slices/buildings/contract";
import { SectionHeading } from "./blocks";
import { PortfolioCarousel } from "./portfolio-carousel";

/** How many featured buildings feed the carousel (three visible at a time). */
const CAROUSEL_LIMIT = 9;

/**
 * Featured portfolio (Home/Guest). Reads the featured buildings via the buildings
 * contract (`getFeaturedBuildings`, by position) and renders them in a carousel that
 * shows **three properties at a time** (two on tablet, one on mobile) with prev/next
 * controls. Builds its own card from `BuildingSummary` (no cross-slice UI import, golden
 * rule 2). Subscribes transitively to `building-list`. The carousel itself is a small
 * client island (`PortfolioCarousel`); cards are server-rendered here and passed in.
 */
export async function FeaturedPortfolio({
  locale,
  showEyebrow = true,
}: {
  locale: Locale;
  showEyebrow?: boolean;
}) {
  const buildings = await getFeaturedBuildings(locale, CAROUSEL_LIMIT);
  if (buildings.length === 0) return null;

  const t = await getTranslations("pages");

  const slides = buildings.map((b, i) => (
    <PortfolioCard key={b.id} locale={locale} building={b} priority={i < 3} t={t} />
  ));

  return (
    <section className="py-[clamp(64px,10vw,160px)]">
      <Container>
        <SectionHeading
          center
          eyebrow={showEyebrow ? t("portfolio.eyebrow") : undefined}
          title={t("portfolio.title")}
          intro={t("portfolio.intro")}
        />
        <div className="mt-12">
          <PortfolioCarousel
            slides={slides}
            prevLabel={t("portfolio.prev")}
            nextLabel={t("portfolio.next")}
          />
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
    <Link
      href={`/${locale}/buildings/${building.slug}`}
      className="group block overflow-hidden border border-line bg-surface transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_-26px_rgba(0,0,0,0.42)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {building.cover ? (
          <MediaImage
            data={building.cover}
            priority={priority}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : null}
        {building.isFeatured ? (
          <span className="absolute left-3.5 top-3.5 bg-accent px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.13em] text-surface">
            ★ {t("portfolio.featured")}
          </span>
        ) : null}
      </div>
      <div className="p-6">
        <h3 className="font-serif text-2xl text-ink">{building.name}</h3>
        <p className="mt-1.5 text-xs uppercase tracking-[0.05em] text-ink-soft">{meta}</p>
        <span className="mt-4 inline-block text-sm font-semibold text-accent-deep">
          {t("portfolio.view")}
        </span>
      </div>
    </Link>
  );
}
