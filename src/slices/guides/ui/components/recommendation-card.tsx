import Link from "next/link";
import { MediaImage } from "@core/media";
import type { Locale } from "@core/db/columns";
import type { GuideRecommendation, GuideRecommendationType } from "../../contract";

// One cell of the listing's 3/2/1-column grid — the same `sizes` as `GuideCard`.
const CARD_SIZES = "(max-width: 680px) 100vw, (max-width: 980px) 50vw, 420px";

/** `core/media`'s `mediaImgTag` fallback when there is no asset (it isn't exported). */
const EMPTY_SRC = "/placeholders/building.svg";

const IMG_CLASS =
  "h-full w-full object-cover transition-transform duration-[600ms] ease-in-out group-hover:scale-[1.04]";

/**
 * Guides-index "Top Recommendations" card — the locked mock's plain `.pcard` with the page's
 * `.rec-type` / `.rec-loc` rules (`mock/what-to-do.html`), ported 1:1 into Tailwind. The
 * shared `.pcard` parts (border/surface, hover lift + shadow, 4:3 photo with hover scale,
 * body padding, serif `h3` at leading 1.08, the `.mk` wrapper's inherited `leading-[1.6]`)
 * use exactly `GuideCard`'s classes, so the two card types on the page stay
 * pixel-consistent. Unlike `.gcard`, the mock's recommendation card has **no** photo scrim.
 * Mock specifics: the uppercase type label (11px, .16em tracking, accent-deep, 600), the
 * `h3` at `.pbody h3`'s base 25px with the inline `margin-top:8px`, the 14px ink-soft
 * description (`text-[14px]`, not `text-sm`, so it keeps the inherited 1.6 line-height the
 * mock's inline-styled `<p>` had), and the location line (Iconoir map pin, 12.5px, .04em).
 *
 * **Guides-only, not a `core/ui` primitive** (same reasoning as `GuideCard`): it owns the
 * `GuideRecommendation` coupling. The whole card links to the guide page the place belongs
 * to (`/[locale]/guides/[city]/[slug]`).
 *
 * Type label: `typeLabels[type]` (pre-translated `guides.recType.*`), falling back to the
 * raw `category` text. Image: `MediaImage` when the asset has real dimensions; otherwise the
 * same plain `<img>` fallback `GuideCard` uses. The pin is an Iconoir `<i>` — the stylesheet
 * loads via the route's `mock.css` import (parked ADR 0033).
 */
export function RecommendationCard({
  rec,
  locale,
  typeLabels,
}: {
  rec: GuideRecommendation;
  locale: Locale;
  typeLabels: Partial<Record<GuideRecommendationType, string>>;
}) {
  const img = rec.image;
  const alt = img.alt || rec.name;
  const typeLabel = typeLabels[rec.type] ?? rec.category;

  return (
    <Link
      href={`/${locale}/guides/${rec.guide.citySlug}/${rec.guide.slug}`}
      className="group block overflow-hidden border border-line bg-surface leading-[1.6] text-ink transition-[transform,box-shadow] duration-300 ease-in-out hover:-translate-y-1 hover:shadow-[0_20px_44px_-26px_rgba(0,0,0,0.42)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {img.url && img.width > 0 && img.height > 0 ? (
          <MediaImage data={{ ...img, alt }} className={IMG_CLASS} sizes={CARD_SIZES} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- `mediaImgTag`'s unoptimised fallback (no asset / no dimensions)
          <img src={img.url || EMPTY_SRC} alt={alt} className={IMG_CLASS} loading="lazy" decoding="async" />
        )}
      </div>
      <div className="px-6 pt-[22px] pb-[26px]">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-deep">{typeLabel}</span>
        <h3 className="mt-[8px] mb-[6px] font-serif text-[25px] font-medium leading-[1.08] tracking-[-0.015em] text-ink">
          {rec.name}
        </h3>
        {rec.description ? <p className="mt-[8px] text-[14px] text-ink-soft">{rec.description}</p> : null}
        <span className="mt-[14px] inline-flex items-center gap-[6px] text-[12.5px] tracking-[0.04em] text-ink-soft">
          <i className="iconoir-map-pin text-[15px] text-accent-deep" aria-hidden="true" />
          {rec.address}
        </span>
      </div>
    </Link>
  );
}
