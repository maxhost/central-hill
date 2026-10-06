import Link from "next/link";

const PILL =
  "inline-block rounded-full border border-line px-5 py-2.5 text-[13.5px] text-ink transition-colors duration-200 hover:border-accent-deep hover:text-accent-deep";

/**
 * "Other Guest Services": a wrapping row of pill links, one per other published service, then a
 * last "View all services →" pill to the listing. Port of the old `.mk .more-row`. Links take
 * the per-locale slugs the caller passes (from `listServices(locale)`).
 */
export function RelatedServices({
  locale,
  services,
  viewAllLabel,
}: {
  locale: string;
  services: { id: string; slug: string; name: string }[];
  viewAllLabel: string;
}) {
  return (
    <ul className="flex flex-wrap gap-[10px]">
      {services.map((s) => (
        <li key={s.id}>
          <Link href={`/${locale}/services/${s.slug}`} className={PILL}>
            {s.name}
          </Link>
        </li>
      ))}
      <li>
        <Link href={`/${locale}/services`} className={PILL}>
          {viewAllLabel} →
        </Link>
      </li>
    </ul>
  );
}
