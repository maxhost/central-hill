import { getTranslations } from "next-intl/server";
import { MediaImage } from "@core/media";
import type { GuidePlace } from "../../contract";
import { priceTierSymbol } from "../format";

/**
 * Place card — image, name, category + price band, description, practical meta
 * (address, hours, phone) and outbound links (website / booking / directions).
 * Place fields vary by template, so every field renders only when present
 * (content brief 4.2).
 */
export async function PlaceCard({ place }: { place: GuidePlace }) {
  const t = await getTranslations("guides");
  const price = priceTierSymbol(place.priceTier);
  const mapsUrl =
    place.latitude !== null && place.longitude !== null
      ? `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`
      : place.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`
        : null;

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface">
      {place.image ? (
        <div className="aspect-[4/3] w-full overflow-hidden bg-bg">
          <MediaImage
            data={place.image}
            className="h-full w-full object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-serif text-lg leading-snug text-ink">{place.name}</h3>
          {price ? <span className="shrink-0 text-sm font-medium text-accent">{price}</span> : null}
        </div>

        {place.category ? (
          <span className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-ink-soft">
            {place.category}
          </span>
        ) : null}

        {place.description ? (
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">{place.description}</p>
        ) : null}

        <dl className="mt-4 space-y-1 text-xs text-ink-soft">
          {place.address ? (
            <div className="flex gap-2">
              <dt className="sr-only">{t("address")}</dt>
              <dd>{place.address}</dd>
            </div>
          ) : null}
          {place.openingHours ? (
            <div className="flex gap-2">
              <dt className="font-medium text-ink">{t("hours")}</dt>
              <dd>{place.openingHours}</dd>
            </div>
          ) : null}
          {place.phone ? (
            <div className="flex gap-2">
              <dt className="font-medium text-ink">{t("phone")}</dt>
              <dd>{place.phone}</dd>
            </div>
          ) : null}
        </dl>

        {place.websiteUrl || place.bookingUrl || mapsUrl ? (
          <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2 pt-4 text-sm font-medium">
            {place.websiteUrl ? (
              <a
                href={place.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent transition-colors hover:text-accent-deep"
              >
                {t("website")} →
              </a>
            ) : null}
            {place.bookingUrl ? (
              <a
                href={place.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent transition-colors hover:text-accent-deep"
              >
                {t("book")} →
              </a>
            ) : null}
            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink-soft transition-colors hover:text-ink"
              >
                {t("directions")} →
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
