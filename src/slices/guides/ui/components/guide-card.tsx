import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { MediaImage } from "@core/media";
import type { GuidePageSummary } from "../../contract";

/** Guide-page card — hero (4:3) with title + intro, links into the guide detail. */
export async function GuideCard({
  guide,
  locale,
  priority,
}: {
  guide: GuidePageSummary;
  locale: string;
  priority?: boolean;
}) {
  const t = await getTranslations("guides");

  return (
    <Link
      href={`/${locale}/guides/${guide.city.slug}/${guide.slug}`}
      className="group flex flex-col"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-surface">
        {guide.hero ? (
          <MediaImage
            data={guide.hero}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 33vw"
            priority={priority}
          />
        ) : null}
      </div>
      <h3 className="mt-4 font-serif text-xl leading-snug text-ink transition-colors group-hover:text-accent">
        {guide.title}
      </h3>
      {guide.intro ? (
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">{guide.intro}</p>
      ) : null}
      <span className="mt-3 inline-block text-sm font-medium text-accent transition-colors group-hover:text-accent-deep">
        {t("viewGuide")} →
      </span>
    </Link>
  );
}
