import { getTranslations } from "next-intl/server";
import { MediaImage } from "@core/media";
import type { ApartmentSummary } from "../../contract";

/**
 * Apartment card — cover (4:3) with an optional badge overlay, name, the
 * "Bedrooms · Up to Guests · Beds" spec line, and a "Check availability" cue. Links
 * to the unit's own Avantio deep-link when present, else the building booking
 * section (`bookingHref`).
 */
export async function ApartmentCard({
  apartment,
  bookingHref,
  priority,
}: {
  apartment: ApartmentSummary;
  bookingHref: string;
  priority?: boolean;
}) {
  const t = await getTranslations("apartments");
  const href = apartment.avantio.url ?? bookingHref;
  const specs = [
    t("bedrooms", { count: apartment.bedrooms }),
    t("guests", { count: apartment.maxGuests }),
    t("beds", { count: apartment.bedsCount }),
  ].join(" · ");

  return (
    <a href={href} className="group flex flex-col">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-surface">
        {apartment.cover ? (
          <MediaImage
            data={apartment.cover}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 33vw"
            priority={priority}
          />
        ) : null}
        {apartment.badge ? (
          <span className="absolute left-3 top-3 rounded-full bg-bg/90 px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-ink backdrop-blur">
            {apartment.badge}
          </span>
        ) : null}
      </div>
      <h3 className="mt-4 font-serif text-xl leading-snug text-ink transition-colors group-hover:text-accent">
        {apartment.name}
      </h3>
      <div className="mt-2 text-sm text-ink-soft">{specs}</div>
      <span className="mt-3 inline-block text-sm font-medium text-accent transition-colors group-hover:text-accent-deep">
        {t("checkAvailability")} →
      </span>
    </a>
  );
}
