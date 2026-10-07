import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { MediaImage } from "@core/media";
import type { Locale } from "@core/db/columns";
import { Icon } from "@core/ui/icon";
import type { BuildingSummary } from "../../contract";

const PLACEHOLDER_COVER = "/placeholders/building.svg";
// `.pf-grid` is 3 columns inside the 1240px `.wrap` (28px padding, 1px gaps), 2 columns
// under 980px and 1 under 680px — one of those grid cells (see `building-listing-grid`'s
// own breakpoints in `buildings-listing.tsx`).
const CARD_SIZES = "(max-width: 680px) 100vw, (max-width: 980px) 50vw, 394px";

/**
 * Buildings-listing card — the locked mock `.pcard` design (`mock/buildings.html`/
 * `mock.css`'s `.pcard`/`.ph`/`.badge`/`.pbody`/`.pmeta`/`.view`), ported 1:1 into Tailwind.
 * **Not** the same component as `core/ui`'s `PropertyCard` (Home/Guest's featured-portfolio
 * carousel — a smaller, simpler card: no separate location line, different aspect ratio/
 * padding). This one is purpose-built for the
 * Buildings listing grid specifically and owns its `BuildingSummary` coupling directly
 * (unlike `core/ui`'s cards, which take caller-resolved image/meta `ReactNode`s) — it isn't a
 * `core/ui` primitive because it isn't generic: the booking-out-link behavior and the
 * `street · neighbourhood · N apartments` meta line are buildings-domain logic, not a layout
 * pattern another slice would plausibly reuse.
 *
 * When the building has booking enabled + an external URL, the whole card links out to it
 * (new tab) instead of the internal detail page. City is intentionally omitted from the meta
 * line (client direction B6) — only street/neighbourhood/apartment count.
 */
export async function BuildingListingCard({
  building,
  locale,
  priority,
}: {
  building: BuildingSummary;
  locale: Locale;
  priority?: boolean;
}) {
  const t = await getTranslations("buildings");

  const meta = [building.streetAddress, building.neighbourhood?.name, t("apartments", { count: building.stats.apartments })]
    .filter(Boolean)
    .join(" · ");
  const bookOut = building.booking.enabled && Boolean(building.booking.url);
  const href = bookOut ? building.booking.url! : `/${locale}/buildings/${building.slug}`;

  return (
    <Link
      href={href}
      {...(bookOut ? { target: "_blank", rel: "noopener noreferrer" } : null)}
      className="group block overflow-hidden border border-line bg-surface text-ink transition-[transform,box-shadow] duration-300 ease-in-out hover:-translate-y-1 hover:shadow-[0_20px_44px_-26px_rgba(0,0,0,0.42)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {building.isNew ? (
          <span className="absolute left-[14px] top-[14px] z-10 bg-accent px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.13em] text-white">
            <Icon name="star" size="1em" className="inline-block align-[-0.125em] [&_path]:fill-current" /> {t("new")}
          </span>
        ) : null}
        {building.cover ? (
          <MediaImage
            data={building.cover}
            className="h-full w-full object-cover transition-transform duration-[600ms] ease-in-out group-hover:scale-[1.04]"
            sizes={CARD_SIZES}
            priority={priority}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- static placeholder SVG, not an R2 asset
          <img
            src={PLACEHOLDER_COVER}
            alt={building.name}
            className="h-full w-full object-cover transition-transform duration-[600ms] ease-in-out group-hover:scale-[1.04]"
          />
        )}
      </div>
      <div className="px-6 pt-[22px] pb-[26px]">
        <h3 className="mb-[6px] font-serif text-[25px] font-medium leading-[1.08] tracking-[-0.015em] text-ink">
          {building.name}
        </h3>
        {meta ? (
          <div className="text-[12.5px] uppercase tracking-[0.05em] text-ink-soft">{meta}</div>
        ) : null}
        <p className="mt-[10px] text-sm text-ink-soft">{building.teaser}</p>
        <div className="mt-4 text-sm font-semibold text-accent-deep">{t("viewMore")} →</div>
      </div>
    </Link>
  );
}
