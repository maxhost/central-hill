import Link from "next/link";
import { MediaImage } from "@core/media";
import type { ServiceSummary } from "../../contract";

// The listing grid is 3 columns inside the 1240px/28px column, 2 at 681–980px, 1 at ≤680px.
const CARD_SIZES = "(max-width: 680px) 100vw, (max-width: 980px) 50vw, 394px";

/**
 * Iconoir glyph class for a category's curated `icon` key. The Iconoir stylesheet is loaded
 * by `mock.css`'s `@import` (the route still imports it for that alone, like Guests). Unknown
 * or missing keys fall back to the decorative `sparks` glyph rather than an empty circle.
 */
const ICON_FALLBACK = "iconoir-sparks";
const iconClass = (key: string | null): string =>
  key && key.length <= 64 && /^[a-z0-9-]+$/.test(key) ? `iconoir-${key}` : ICON_FALLBACK;

/**
 * Services listing card: the locked mock `.pcard` design (`mock/services.html`, the same
 * `.pcard`/`.ph`/`.pbody`/`.view` base as `buildings`' `BuildingListingCard`), plus the two
 * services-only overlays from that page's old `PAGE_STYLE`: the category pill top-left
 * (`.svc-tag`) and the 46px category-icon circle bottom-left (`.svc-ico`). Ported 1:1 into
 * Tailwind.
 *
 * Deliberately a services-only card (user decision), not a shared `core/ui` primitive: the
 * buildings card lives in the `buildings` slice (golden rule 2 forbids importing it) and
 * `core/ui`'s `PropertyCard` is the smaller featured-portfolio card. Fed from the DB through
 * `ServiceSummary`: the pill is the category name, the icon is the category's curated
 * `icon` key, the body is the excerpt, and the card links to the per-locale detail slug.
 * Price/duration aren't shown, as in the mock.
 */
export function ServiceCard({
  service,
  locale,
  viewLabel,
  priority,
}: {
  service: ServiceSummary;
  locale: string;
  /** Pre-translated "View details" label (the arrow is appended here). */
  viewLabel: string;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/${locale}/services/${service.slug}`}
      className="group block overflow-hidden border border-line bg-surface text-ink transition-[transform,box-shadow] duration-300 ease-in-out hover:-translate-y-1 hover:shadow-[0_20px_44px_-26px_rgba(0,0,0,0.42)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-line">
        <span className="absolute left-4 top-4 z-10 rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink">
          {service.category.name}
        </span>
        {service.cover ? (
          <MediaImage
            data={service.cover}
            className="h-full w-full object-cover transition-transform duration-[600ms] ease-in-out group-hover:scale-[1.04]"
            sizes={CARD_SIZES}
            priority={priority}
          />
        ) : null}
        <span className="absolute bottom-4 left-4 z-10 grid h-[46px] w-[46px] place-items-center rounded-full bg-surface text-[24px] text-accent-deep shadow-[0_8px_22px_-12px_rgba(0,0,0,0.5)]">
          <i className={iconClass(service.category.icon)} aria-hidden="true" />
        </span>
      </div>
      <div className="px-6 pt-[22px] pb-[26px]">
        <h3 className="mb-[6px] font-serif text-[25px] font-medium leading-[1.08] tracking-[-0.015em] text-ink">
          {service.name}
        </h3>
        {service.excerpt ? <p className="mt-[10px] text-sm text-ink-soft">{service.excerpt}</p> : null}
        <div className="mt-4 text-sm font-semibold text-accent-deep">{viewLabel} →</div>
      </div>
    </Link>
  );
}
