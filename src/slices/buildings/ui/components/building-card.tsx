import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { MediaImage } from "@core/media";
import type { BuildingSummary } from "../../contract";

/**
 * Building card (content-briefs.md → Buildings listing): image (4:3) with ★NEW
 * badge, name, street · city · neighbourhood, apartment count and ~180-char teaser,
 * linking to the building's own page. Server-rendered; the listing filters these
 * client-side (no request-time DB).
 */
export async function BuildingCard({
  building,
  locale,
  priority,
}: {
  building: BuildingSummary;
  locale: string;
  priority?: boolean;
}) {
  const t = await getTranslations("buildings");

  const place = [building.streetAddress, building.city.name, building.neighbourhood?.name]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link href={`/${locale}/buildings/${building.slug}`} className="group flex flex-col">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-surface">
        {building.cover ? (
          <MediaImage
            data={building.cover}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 33vw"
            priority={priority}
          />
        ) : null}
        {building.isNew ? (
          <span className="absolute left-3 top-3 rounded-full bg-ink px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-bg">
            {t("new")}
          </span>
        ) : null}
      </div>

      <h3 className="mt-4 font-serif text-xl leading-snug text-ink transition-colors group-hover:text-accent">
        {building.name}
      </h3>
      {place ? (
        <p className="mt-1 text-xs uppercase tracking-[0.1em] text-ink-soft">
          {place} · {t("apartments", { count: building.stats.apartments })}
        </p>
      ) : null}
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">{building.teaser}</p>
      <span className="mt-3 inline-block text-sm font-medium text-accent transition-colors group-hover:text-accent-deep">
        {t("viewMore")} →
      </span>
    </Link>
  );
}
