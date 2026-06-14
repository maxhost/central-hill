import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { MediaImage } from "@core/media";
import type { ServiceSummary } from "../../contract";
import { formatPrice } from "../format";

/** Service card — cover (4:3) with category tag overlay + name, excerpt, price. */
export async function ServiceCard({
  service,
  locale,
  priority,
}: {
  service: ServiceSummary;
  locale: string;
  priority?: boolean;
}) {
  const t = await getTranslations("services");
  const price = formatPrice(service.priceFrom, locale);

  return (
    <Link href={`/${locale}/services/${service.slug}`} className="group flex flex-col">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-surface">
        {service.cover ? (
          <MediaImage
            data={service.cover}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 33vw"
            priority={priority}
          />
        ) : null}
        <span className="absolute left-3 top-3 rounded-full bg-bg/90 px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-ink backdrop-blur">
          {service.category.name}
        </span>
      </div>
      <h3 className="mt-4 font-serif text-xl leading-snug text-ink transition-colors group-hover:text-accent">
        {service.name}
      </h3>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">{service.excerpt}</p>
      <div className="mt-3 flex items-center gap-2 text-xs text-ink-soft">
        {price ? <span className="font-medium text-ink">{t("priceFrom", { price })}</span> : null}
        {price && service.durationLabel ? <span aria-hidden>·</span> : null}
        {service.durationLabel ? <span>{service.durationLabel}</span> : null}
      </div>
      <span className="mt-3 inline-block text-sm font-medium text-accent transition-colors group-hover:text-accent-deep">
        {t("viewDetails")} →
      </span>
    </Link>
  );
}
