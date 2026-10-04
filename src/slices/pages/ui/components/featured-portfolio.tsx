import { getTranslations } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import { MediaImage } from "@core/media";
import { ButtonLink, Carousel, Container, PropertyCard } from "@core/ui";
import { getFeaturedBuildings } from "@slices/buildings/contract";
import { SectionHeading } from "./blocks";

/** How many featured buildings feed the carousel (three visible at a time). */
const CAROUSEL_LIMIT = 9;

/**
 * Featured portfolio (Home/Guest). The heading, intro and button copy default to the shared
 * `pages.portfolio.*` messages; the Guests page overrides them with its own admin-authored
 * `guest.portfolio` block (Home passes nothing and renders unchanged).
 * Reads the featured buildings via the buildings
 * contract (`getFeaturedBuildings`, by position) and renders them in a carousel that
 * shows **three properties at a time** (two on tablet, one on mobile) with prev/next
 * controls. Builds each slide's props from `BuildingSummary` and renders the shared
 * `core/ui` `PropertyCard` (no cross-slice UI import, golden rule 2). Subscribes
 * transitively to `building-list`. The carousel itself is a small client island
 * (`core/ui`'s `Carousel`); cards are server-rendered here and passed in.
 */
export async function FeaturedPortfolio({
  locale,
  showEyebrow = true,
  eyebrow,
  title,
  intro,
  ctaLabel,
  ctaNote,
  ctaHref,
  tightBottom,
}: {
  locale: Locale;
  showEyebrow?: boolean;
  /** Overrides `portfolio.eyebrow` (and forces the eyebrow to show). */
  eyebrow?: string;
  /** Overrides `portfolio.title`. */
  title?: string;
  /** Overrides `portfolio.intro`. */
  intro?: string;
  /** Overrides `portfolio.viewAll`. */
  ctaLabel?: string;
  /** Small helper line under the button. No default — omitted unless provided. */
  ctaNote?: string;
  /** Overrides the `/{locale}/buildings` button target. */
  ctaHref?: string;
  /**
   * Drops the section's own bottom padding — for when the next section already supplies
   * its own top padding, so the two don't stack into a double-sized gap (client feedback,
   * Home: this section now sits directly above the services carousel).
   */
  tightBottom?: boolean;
}) {
  const buildings = await getFeaturedBuildings(locale, CAROUSEL_LIMIT);
  if (buildings.length === 0) return null;

  const t = await getTranslations("pages");

  const slides = buildings.map((b, i) => {
    const meta = [
      t("portfolio.apartments", { count: b.stats.apartments }),
      t("portfolio.guests", { count: b.stats.capacity }),
    ].join(" · ");

    return (
      <PropertyCard
        key={b.id}
        href={`/${locale}/buildings/${b.slug}`}
        image={
          b.cover ? (
            <MediaImage
              data={b.cover}
              priority={i < 3}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : null
        }
        name={b.name}
        meta={meta}
        badge={b.isFeatured ? `★ ${t("portfolio.featured")}` : undefined}
        viewLabel={t("portfolio.view")}
      />
    );
  });

  return (
    <section
      className="pt-[clamp(64px,10vw,160px)]"
      style={tightBottom ? undefined : { paddingBottom: "clamp(64px, 10vw, 160px)" }}
    >
      <Container>
        <SectionHeading
          center
          eyebrow={eyebrow ?? (showEyebrow ? t("portfolio.eyebrow") : undefined)}
          title={title ?? t("portfolio.title")}
          intro={intro ?? t("portfolio.intro")}
        />
        <div className="mt-12">
          <Carousel
            slides={slides}
            prevLabel={t("portfolio.prev")}
            nextLabel={t("portfolio.next")}
            gap="lg"
            basis={{ base: "100%", sm: "calc((100%-1.75rem)/2)", lg: "calc((100%-3.5rem)/3)" }}
            buttonPlacement="below"
          />
        </div>
        <div className="mt-12 text-center">
          <ButtonLink href={ctaHref ?? `/${locale}/buildings`} variant="outline">
            {ctaLabel ?? t("portfolio.viewAll")}
          </ButtonLink>
          {ctaNote ? <p className="mt-4 text-sm text-ink-soft">{ctaNote}</p> : null}
        </div>
      </Container>
    </section>
  );
}
