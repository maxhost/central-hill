import Link from "next/link";
import { MediaImage } from "@core/media";
import { Icon } from "@core/ui/icon";
import type { Locale } from "@core/db/columns";
import type { GuidePageSummary } from "../../contract";

// One cell of the listing's 3/2/1-column grid (`mock.css`'s `.pf-grid` breakpoints) — the
// exact `sizes` the old `mediaImgTag` string used, so the browser picks the same candidate.
const CARD_SIZES = "(max-width: 680px) 100vw, (max-width: 980px) 50vw, 420px";

/** `core/media`'s `mediaImgTag` fallback when there is no asset (it isn't exported). */
const EMPTY_SRC = "/placeholders/building.svg";

const IMG_CLASS =
  "h-full w-full object-cover transition-transform duration-[600ms] ease-in-out group-hover:scale-[1.04]";

/**
 * Guides-listing card — the locked mock `.pcard.gcard` design (`mock/what-to-do.html`: the
 * shared `mock.css` `.pcard`/`.ph`/`.pbody`/`.view` rules plus the page's own `.gcard` rules —
 * bottom gradient scrim over the photo, the 28px accent template icon, a 22px title and the
 * `.g-teaser` intro), ported 1:1 into Tailwind, including the `.mk` wrapper's inherited
 * `line-height:1.6` (`leading-[1.6]` on the root; Tailwind's preflight would otherwise give
 * 1.5). The shared `.pcard` parts (border/surface, hover lift + shadow, 4:3 photo with hover
 * scale, body padding, serif `h3`, view line) use exactly the classes of the Buildings
 * listing's `BuildingListingCard`, so the two listings stay pixel-consistent — mirrored, not
 * imported (another slice's internals). The slice's previous `GuideCard` (a different,
 * unused look) was replaced by this one.
 *
 * **Guides-only, not a `core/ui` primitive** (user decision): it owns its `GuidePageSummary`
 * coupling, which is guides-domain, not a layout pattern.
 *
 * Image: `MediaImage` when the hero has a URL and real dimensions (alt falls back to the
 * guide title, as `mediaImgTag` did); otherwise the same plain `<img>` `mediaImgTag` emits for
 * missing/dimensionless media (the asset URL or the building placeholder SVG).
 *
 * The template icon is `core/ui` `<Icon>` (inline Iconoir SVG, ADR 0034). The caller passes
 * its name: the guide template's site icon (`settings` `SiteIcons.guide_<template>`, editable
 * in Settings → "Site icons").
 */
export function GuideCard({
  guide,
  locale,
  viewLabel,
  icon,
  priority,
}: {
  guide: GuidePageSummary;
  locale: Locale;
  /** Pre-translated "View guide" label (the arrow is appended here). */
  viewLabel: string;
  /** Iconoir name of the template icon. */
  icon: string;
  priority?: boolean;
}) {
  const hero = guide.hero;
  const alt = hero?.alt || guide.title;

  return (
    <Link
      href={`/${locale}/guides/${guide.city.slug}/${guide.slug}`}
      className="group block overflow-hidden border border-line bg-surface leading-[1.6] text-ink transition-[transform,box-shadow] duration-300 ease-in-out hover:-translate-y-1 hover:shadow-[0_20px_44px_-26px_rgba(0,0,0,0.42)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {hero?.url && hero.width > 0 && hero.height > 0 ? (
          <MediaImage data={{ ...hero, alt }} className={IMG_CLASS} sizes={CARD_SIZES} priority={priority} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- `mediaImgTag`'s unoptimised fallback (no asset / no dimensions)
          <img
            src={hero?.url || EMPTY_SRC}
            alt={alt}
            className={IMG_CLASS}
            {...(priority ? { loading: "eager" as const, fetchPriority: "high" as const } : { loading: "lazy" as const })}
            decoding="async"
            {...(hero?.width && hero.width > 0 ? { width: hero.width, height: hero.height } : {})}
          />
        )}
        {/* `.gcard .ph::after` — bottom scrim. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(18,16,13,0)_38%,rgba(18,16,13,0.42)_100%)]"
        />
      </div>
      <div className="px-6 pt-[22px] pb-[26px]">
        <Icon name={icon} size={28} className="mb-[14px] inline-block align-baseline text-accent-deep" />
        <h3 className="mb-[6px] font-serif text-[22px] font-medium leading-[1.08] tracking-[-0.015em] text-ink">
          {guide.title}
        </h3>
        {guide.intro ? (
          <p className="mt-[10px] text-[14.5px] leading-[1.55] text-ink-soft">{guide.intro}</p>
        ) : null}
        <div className="mt-4 text-sm font-semibold text-accent-deep">{viewLabel} →</div>
      </div>
    </Link>
  );
}
