import { getTranslations } from "next-intl/server";
import Link from "next/link";
import type { Locale } from "@core/db/columns";
import { MediaImage } from "@core/media";
import { Container, Eyebrow } from "@core/ui";
import { type ServiceSummary, listServices } from "@slices/services/contract";
import { ServicesCarouselTrack } from "./services-carousel-track";
import { Icon } from "./icon";

/**
 * Services & partners carousel (Home, ADR 0032). Two sources, deliberately split:
 *
 * - the **copy** (heading, the three reassurance marks, which category to show) is the
 *   page's own `services_carousel` block, authored in the Home editor;
 * - the **cards** are the published services of slice `services`, read through its
 *   contract (`listServices`, golden rule 2) in their admin-set `position` order.
 *
 * Renders nothing when no published service matches the chosen category, so an empty or
 * not-yet-seeded catalogue simply removes the band instead of leaving a bare heading. The
 * card is built here from `ServiceSummary` (no cross-slice UI import). Subscribes
 * transitively to `service-list`, so publishing a service refreshes Home.
 */

/** Cards fed to the track — four are visible at a time, so this is ~3 pages of scroll. */
const CAROUSEL_LIMIT = 12;

/** The section's editable copy (a legacy `page_content` row may not have it yet). */
export interface ServicesCarouselContent {
  eyebrow?: string;
  headline: string;
  assurances: { icon_key?: string; label: string }[];
  service_category_slug?: string;
}

export async function ServicesCarousel({
  locale,
  content,
}: {
  locale: Locale;
  /** Absent on a `home` row saved before this section existed — the band is then skipped. */
  content?: ServicesCarouselContent;
}) {
  if (!content) return null;

  const services = await listServices(locale, content.service_category_slug || undefined);
  if (services.length === 0) return null;

  const t = await getTranslations("pages");
  const assurances = content.assurances.filter((a) => a.label.trim() !== "");

  const slides = services
    .slice(0, CAROUSEL_LIMIT)
    .map((service, i) => (
      <ServiceCard key={service.id} locale={locale} service={service} priority={i < 4} />
    ));

  return (
    <section className="py-[clamp(56px,8vw,112px)]">
      <Container>
        {content.eyebrow ? <Eyebrow accent>{content.eyebrow}</Eyebrow> : null}
        <h2 className="mt-3 font-serif text-3xl leading-tight text-ink md:text-4xl">
          {content.headline}
        </h2>

        {assurances.length > 0 ? (
          <ul className="mt-8 grid gap-4 sm:grid-cols-3 sm:gap-8">
            {assurances.map((a, i) => (
              <li key={i} className="flex items-center gap-3">
                <Icon name={a.icon_key} className="h-6 w-6 shrink-0 text-accent-deep" />
                <span className="text-sm font-medium text-ink md:text-base">{a.label}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-10">
          <ServicesCarouselTrack
            slides={slides}
            prevLabel={t("servicesCarousel.prev")}
            nextLabel={t("servicesCarousel.next")}
            regionLabel={t("servicesCarousel.region")}
          />
        </div>
      </Container>
    </section>
  );
}

/**
 * One portrait card: full-bleed cover, the service name set vertically along the bottom-left
 * edge, and the partner rating as a chip in the top-left corner (hidden when unrated). The
 * whole card is the link to the service's detail page.
 */
function ServiceCard({
  locale,
  service,
  priority,
}: {
  locale: Locale;
  service: ServiceSummary;
  priority: boolean;
}) {
  return (
    <Link
      href={`/${locale}/services/${service.slug}`}
      className="group relative block aspect-[3/4] overflow-hidden rounded-2xl bg-surface shadow-[0_10px_30px_-22px_rgba(0,0,0,0.55)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_-24px_rgba(0,0,0,0.5)]"
    >
      {service.cover ? (
        <MediaImage
          data={service.cover}
          priority={priority}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          sizes="(max-width: 640px) 78vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      ) : null}

      {/* Legibility scrim for the vertical name — bottom-heavy so the photo stays the subject. */}
      <span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent"
      />

      {service.rating != null ? <RatingChip locale={locale} rating={service.rating} /> : null}

      <h3 className="absolute bottom-5 left-4 max-h-[58%] [writing-mode:vertical-rl] rotate-180 truncate text-xs font-semibold uppercase tracking-[0.18em] text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] md:text-sm">
        {service.name}
      </h3>
    </Link>
  );
}

/** Star + one-decimal score, localized (PT/ES/FR render "4,7"). */
function RatingChip({ locale, rating }: { locale: Locale; rating: number }) {
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(rating);

  return (
    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-surface/95 px-2.5 py-1 text-xs font-semibold text-ink backdrop-blur">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-accent" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 2.8l2.65 5.37 5.93.86-4.29 4.18 1.01 5.9L12 16.33l-5.3 2.78 1.01-5.9L3.42 9.03l5.93-.86L12 2.8z"
        />
      </svg>
      {formatted}
    </span>
  );
}
