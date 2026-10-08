import Link from "next/link";
import type { ReactNode } from "react";
import { MediaImage, type MediaImageData } from "@core/media";
import { Icon } from "@core/ui/icon";
import type { Locale } from "@core/db/columns";
import {
  RECOMMENDATION_TYPES,
  type GuidePlace,
  type GuideRecommendation,
  type GuideRecommendationType,
} from "../../contract";
import { placeDirectionsUrl, priceTierSymbol } from "../format";

// One cell of the listing's 3/2/1-column grid — the same `sizes` as `GuideCard`.
const CARD_SIZES = "(max-width: 680px) 100vw, (max-width: 980px) 50vw, 420px";
// One cell of the guide detail's 2/1-column places grid (≈714px content column, 22px gap).
const PLACE_SIZES = "(max-width: 560px) 100vw, (max-width: 980px) 50vw, 346px";

/** `core/media`'s `mediaImgTag` fallback when there is no asset (it isn't exported). */
const EMPTY_SRC = "/placeholders/building.svg";

const IMG_CLASS =
  "h-full w-full object-cover transition-transform duration-[600ms] ease-in-out group-hover:scale-[1.04]";

// The `.pcard` shell. The listing card is a link and lifts on hover; the detail's place card is
// a plain `<article>` (it has nowhere to go but its own "Directions" link), so it stays still.
const CARD_CLASS = "group block overflow-hidden border border-line bg-surface leading-[1.6] text-ink";
const CARD_HOVER =
  "transition-[transform,box-shadow] duration-300 ease-in-out hover:-translate-y-1 hover:shadow-[0_20px_44px_-26px_rgba(0,0,0,0.42)]";

type TypeLabels = Partial<Record<GuideRecommendationType, string>>;

/** The listing ("Top Recommendations") usage: a `GuideRecommendation`, the whole card links to its guide. */
type RecProps = {
  rec: GuideRecommendation;
  locale: Locale;
  place?: never;
};

/**
 * The guide detail usage: one `GuidePlace` of a section, with the footer row (phone ·
 * "Directions →"). Every field is optional on a place, so each part renders only when present.
 */
type PlaceProps = {
  place: GuidePlace;
  /** Pre-translated "Directions" label (the arrow is appended here). */
  directionsLabel: string;
  rec?: never;
};

/**
 * Guides "Top Recommendations" card — the locked mock's plain `.pcard` with the page's
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
 * **Two uses, one card** (session 5, `mock/guide-detail.html`):
 * - `rec` — the guides index: the whole card links to the guide page the place belongs to
 *   (`/[locale]/guides/[city]/[slug]`); image, type and address are always there.
 * - `place` — a guide section's places grid: an `<article>` (no hover lift), with the
 *   price band after the type (`· €€€`, ink-soft) and the mock's `.rec-foot` row: the phone
 *   (`tel:` link) on the left, "Directions →" on the right (Google Maps from lat/lng or the
 *   address, new tab); the row is omitted when neither exists, the photo when there is no image.
 *
 * **Guides-only, not a `core/ui` primitive** (same reasoning as `GuideCard`): it owns the
 * guides types. Type label: `typeLabels[type]` (pre-translated `guides.recType.*`, matched
 * case-insensitively for a place's free-text category), falling back to the raw `category`
 * text. Image: `MediaImage` when the asset has real dimensions; otherwise the same plain
 * `<img>` fallback `GuideCard` uses. The pin is `core/ui` `<Icon>` (ADR 0034).
 */
export function RecommendationCard(
  props: (RecProps | PlaceProps) & {
    typeLabels: TypeLabels;
    /** Iconoir name of the address pin (the `location` site icon). */
    pinIcon: string;
  },
) {
  const { typeLabels, pinIcon } = props;

  if (props.rec) {
    const { rec, locale } = props;
    return (
      <Link
        href={`/${locale}/guides/${rec.guide.citySlug}/${rec.guide.slug}`}
        className={`${CARD_CLASS} ${CARD_HOVER}`}
      >
        <CardPhoto img={rec.image} name={rec.name} sizes={CARD_SIZES} />
        <CardBody
          typeLabel={typeLabels[rec.type] ?? rec.category}
          name={rec.name}
          description={rec.description}
          address={rec.address}
          pinIcon={pinIcon}
        />
      </Link>
    );
  }

  const { place, directionsLabel } = props;
  const category = place.category?.trim() || null;
  const known = RECOMMENDATION_TYPES.find((type) => type === category?.toLowerCase());
  const typeLabel = (known && typeLabels[known]) || category;
  const price = priceTierSymbol(place.priceTier);
  const directions = placeDirectionsUrl(place);
  const phone = place.phone?.trim() || null;

  return (
    <article className={CARD_CLASS}>
      {place.image ? <CardPhoto img={place.image} name={place.name} sizes={PLACE_SIZES} /> : null}
      <CardBody
        typeLabel={typeLabel}
        price={price}
        name={place.name}
        description={place.description}
        address={place.address}
        pinIcon={pinIcon}
      >
        {phone || directions ? (
          // `.rec-foot` (mock/guide-detail.html): hairline, phone left, directions right.
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-[14px] text-[13px] text-ink-soft">
            {phone ? (
              <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="hover:text-ink">
                {phone}
              </a>
            ) : (
              <span />
            )}
            {directions ? (
              <a
                href={directions}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-accent-deep hover:underline"
              >
                {directionsLabel} →
              </a>
            ) : null}
          </div>
        ) : null}
      </CardBody>
    </article>
  );
}

function CardPhoto({ img, name, sizes }: { img: MediaImageData; name: string; sizes: string }) {
  const alt = img.alt || name;
  return (
    <div className="relative aspect-[4/3] overflow-hidden">
      {img.url && img.width > 0 && img.height > 0 ? (
        <MediaImage data={{ ...img, alt }} className={IMG_CLASS} sizes={sizes} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- `mediaImgTag`'s unoptimised fallback (no asset / no dimensions)
        <img src={img.url || EMPTY_SRC} alt={alt} className={IMG_CLASS} loading="lazy" decoding="async" />
      )}
    </div>
  );
}

function CardBody({
  typeLabel,
  price,
  name,
  description,
  address,
  pinIcon,
  children,
}: {
  typeLabel: string | null;
  price?: string | null;
  name: string;
  description: string | null;
  address: string | null;
  pinIcon: string;
  children?: ReactNode;
}) {
  return (
    <div className="px-6 pt-[22px] pb-[26px]">
      {typeLabel || price ? (
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-deep">
          {typeLabel}
          {price ? (
            <span className="ml-[6px] tracking-[0.04em] text-ink-soft">
              {typeLabel ? "· " : null}
              {price}
            </span>
          ) : null}
        </span>
      ) : null}
      <h3 className="mt-[8px] mb-[6px] font-serif text-[25px] font-medium leading-[1.08] tracking-[-0.015em] text-ink">
        {name}
      </h3>
      {description ? <p className="mt-[8px] text-[14px] text-ink-soft">{description}</p> : null}
      {address ? (
        <span className="mt-[14px] inline-flex items-center gap-[6px] text-[12.5px] tracking-[0.04em] text-ink-soft">
          <Icon name={pinIcon} size={15} className="shrink-0 text-accent-deep" />
          {address}
        </span>
      ) : null}
      {children}
    </div>
  );
}
