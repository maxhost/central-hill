import type { ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@core/db/columns";
import { MediaImage, type MediaImageData } from "@core/media";
import { JsonLd, breadcrumbLd } from "@core/seo";
import {
  AsideCta,
  ButtonLink,
  Callout,
  ContentBlock,
  DetailLayout,
  DetailTitle,
  MOSAIC_ADAPTIVE_MAX,
  MosaicGallery,
  SectionHead,
  StickyAside,
  TocList,
} from "@core/ui";
import { Icon } from "@core/ui/icon";
import { GUIDE_ASIDE_FALLBACK_IMAGE, getGuideAsideCta } from "@slices/pages/contract";
import { SITE_ICON_DEFAULTS, getGlobals } from "@slices/settings/contract";
import { getGuidePage, listGuideCityGroups } from "../contract";
import { GuideCard } from "./components/guide-card";
import { RecommendationCard } from "./components/recommendation-card";
import { sectionAnchorIds, sectionNumber } from "./format";

/**
 * Guide detail (`/[locale]/guides/[city]/[slug]`) — the approved `mock/guide-detail.html`: the
 * service-detail skeleton (`services/ui/service-detail.tsx`) applied to a city guide, fully
 * componentised and DB-driven (`getGuidePage`, ISR-cached + tagged; `listGuideCityGroups` for
 * the other guides of the city). DB text renders as React text (escaped). UI copy: `guides.*`.
 *
 * Skeleton, top to bottom:
 * 1. `DetailTitle` — breadcrumb Home / Guides / city, eyebrow = city, `<h1>`, tagline = intro,
 *    meta = template icon + "N areas" (sections) · pin + "N places" (all places).
 * 2. `MosaicGallery adaptive` — the hero + the sections' header images (deduplicated by URL),
 *    capped at `MOSAIC_ADAPTIVE_MAX` (no "show all" dialog: that one is services-internal).
 * 3. `DetailLayout`:
 *    - main: the collapsible `TocList` (≤980px only), then one `ContentBlock` per section
 *      (anchor id from `sectionAnchorIds`, eyebrow "01"…): prose · 16:9 image · "Local tip"
 *      `Callout` · places grid of `RecommendationCard` (place mode) · optional section CTA;
 *    - aside: `StickyAside` with the `TocList` (hidden ≤980px) + the accommodation `AsideCta`
 *      (`pages` contract `getGuideAsideCta`, photo or `GUIDE_ASIDE_FALLBACK_IMAGE`).
 * 4. "Keep exploring / More {city} guides" — `SectionHead` + the listing's `GuideCard` grid
 *    (max 3, current excluded) + "All {city} guides →", on the warm `alt` band; omitted when
 *    the city has no other guide.
 *
 * Icons are `core/ui` `<Icon>` with site icons (Settings → "Site icons"). Static (no `Reveal`).
 */

const WRAP = "mx-auto max-w-[1240px] px-[28px]";
const ALT_BAND = "bg-[color-mix(in_srgb,var(--color-line)_38%,var(--color-bg))]";
const MORE_MAX = 3;

// Gallery `sizes`, per adaptive layout (as on the service detail page).
const SIZES_FULL = "(max-width: 1240px) 100vw, 1184px";
const SIZES_LEAD = "(max-width: 780px) 100vw, 582px";
const SIZES_HALF = "(max-width: 780px) 50vw, 582px";
const SIZES_CELL = "(max-width: 780px) 50vw, 291px";

function gallerySizes(count: number, i: number): string {
  if (count === 1) return SIZES_FULL;
  if (count === 2) return SIZES_HALF;
  if (i === 0) return SIZES_LEAD;
  if (count === 3 || (count === 4 && i === 1)) return SIZES_HALF;
  return SIZES_CELL;
}

// The section image spans the content column (≈714px beside the 380px aside).
const SECTION_IMG_SIZES = "(max-width: 980px) calc(100vw - 56px), 714px";
const ASIDE_IMG_SIZES = "(max-width: 980px) calc(100vw - 118px), 318px";

/** Body text → paragraphs (blank lines separate them, as authored in the backoffice). */
function splitParagraphs(text: string | null): string[] {
  return (text ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

const META_TAG =
  "inline-flex items-center gap-[7px] text-ink-soft [&_svg]:block [&_svg]:size-4 [&_svg]:text-accent-deep";

export async function GuidePageView({
  locale,
  city,
  slug,
}: {
  locale: Locale;
  city: string;
  slug: string;
}) {
  setRequestLocale(locale);
  const guide = await getGuidePage(locale, city, slug);
  if (!guide) notFound();

  const [t, globals, groups, asideCta] = await Promise.all([
    getTranslations("guides"),
    getGlobals(locale),
    listGuideCityGroups(locale),
    getGuideAsideCta(locale),
  ]);
  const icons = globals?.icons ?? SITE_ICON_DEFAULTS;
  const guidesUrl = `/${locale}/guides`;
  const guideUrl = `${guidesUrl}/${guide.city.slug}/${guide.slug}`;
  const cityName = guide.city.name;

  const anchors = sectionAnchorIds(guide.sections.map((s) => s.title));
  const tocItems = guide.sections.map((s, i) => ({
    id: anchors[i] ?? `section-${i + 1}`,
    label: s.title,
    number: sectionNumber(i),
  }));
  const placeCount = guide.sections.reduce((n, s) => n + s.places.length, 0);

  // ---- gallery: hero + section images, deduplicated --------------------------------------------
  const seen = new Set<string>();
  const photos: MediaImageData[] = [];
  for (const img of [guide.hero, ...guide.sections.map((s) => s.headerImage)]) {
    if (!img?.url || seen.has(img.url)) continue;
    seen.add(img.url);
    photos.push(img);
  }
  const shown = photos.slice(0, MOSAIC_ADAPTIVE_MAX);
  const tiles = shown.map((p, i) => (
    <MediaImage key={p.url} data={p} sizes={gallerySizes(shown.length, i)} priority={i === 0} />
  ));

  // ---- title meta line ---------------------------------------------------------------------------
  const meta: ReactNode[] = [];
  if (guide.sections.length) {
    meta.push(
      <span className={META_TAG}>
        <Icon name={icons[`guide_${guide.template}`]} />
        {t("areaCount", { count: guide.sections.length })}
      </span>,
    );
  }
  if (placeCount) {
    meta.push(
      <span className={META_TAG}>
        <Icon name={icons.location} />
        {t("placeCount", { count: placeCount })}
      </span>,
    );
  }

  const recTypeLabels = {
    restaurant: t("recType.restaurant"),
    viewpoint: t("recType.viewpoint"),
    beach: t("recType.beach"),
  };

  const others = (groups.find((g) => g.city.id === guide.city.id)?.guides ?? [])
    .filter((g) => g.id !== guide.id)
    .slice(0, MORE_MAX);

  const ld = breadcrumbLd([
    { name: t("home"), url: `/${locale}` },
    { name: t("crumbGuides"), url: guidesUrl },
    { name: cityName, url: guidesUrl },
    { name: guide.title, url: guideUrl },
  ]);

  return (
    <>
      <JsonLd data={ld} />

      {/* 1 · title block */}
      <DetailTitle
        breadcrumbLabel={t("breadcrumbLabel")}
        crumbs={[
          { label: t("home"), href: `/${locale}` },
          { label: t("crumbGuides"), href: guidesUrl },
          { label: cityName, href: guidesUrl },
        ]}
        eyebrow={cityName}
        title={guide.title}
        tagline={guide.intro || undefined}
        meta={meta}
      />

      {/* 2 · gallery */}
      {tiles.length ? (
        <div className={WRAP}>
          <MosaicGallery adaptive images={tiles} />
        </div>
      ) : null}

      {/* 3 · body: sections + sticky aside */}
      <DetailLayout
        main={
          <>
            {tocItems.length ? <TocList collapsible title={t("toc")} items={tocItems} icon={<Icon name={icons.table_of_contents} />} /> : null}
            {guide.sections.map((section, i) => {
              const paragraphs = splitParagraphs(section.body);
              return (
                <ContentBlock
                  key={section.id}
                  id={tocItems[i]?.id}
                  eyebrow={sectionNumber(i)}
                  title={section.title}
                  className="scroll-mt-[96px]!"
                >
                  {paragraphs.length ? (
                    <div>
                      {paragraphs.map((p, pi) => (
                        <p key={pi} className="mb-4 max-w-[66ch] text-[17px] leading-[1.7] text-ink-soft last:mb-0">
                          {p}
                        </p>
                      ))}
                    </div>
                  ) : null}

                  {section.headerImage ? (
                    <div className="mt-[26px] aspect-[16/9] overflow-hidden rounded-[6px]">
                      <MediaImage
                        data={section.headerImage}
                        className="block h-full w-full object-cover"
                        sizes={SECTION_IMG_SIZES}
                      />
                    </div>
                  ) : null}

                  {section.localTip ? (
                    <Callout
                      variant="tip"
                      icon={<Icon name={icons.callout_tip} />}
                      label={t("localTip")}
                      className="mt-[26px]"
                    >
                      <p>{section.localTip}</p>
                    </Callout>
                  ) : null}

                  {section.places.length ? (
                    <div className="mt-[30px] grid grid-cols-1 gap-[22px] min-[561px]:grid-cols-2">
                      {section.places.map((place) => (
                        <RecommendationCard
                          key={place.id}
                          place={place}
                          directionsLabel={t("directions")}
                          typeLabels={recTypeLabels}
                          pinIcon={icons.location}
                        />
                      ))}
                    </div>
                  ) : null}

                  {section.cta ? (
                    <div className="mt-[30px]">
                      <ButtonLink href={section.cta.url}>{section.cta.label}</ButtonLink>
                    </div>
                  ) : null}
                </ContentBlock>
              );
            })}
          </>
        }
        aside={
          <StickyAside label={t("toc")}>
            {tocItems.length ? (
              <TocList
                className="max-[980px]:hidden"
                title={t("toc")}
                items={tocItems}
                icon={<Icon name={icons.table_of_contents} />}
              />
            ) : null}
            <AsideCta
              className={tocItems.length ? undefined : "mt-0! border-t-0! pt-0!"}
              image={
                asideCta.image ? (
                  <MediaImage data={asideCta.image} sizes={ASIDE_IMG_SIZES} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- static fallback photo until one is picked in the backoffice
                  <img
                    src={GUIDE_ASIDE_FALLBACK_IMAGE.url}
                    alt={GUIDE_ASIDE_FALLBACK_IMAGE.alt}
                    loading="lazy"
                    decoding="async"
                  />
                )
              }
              eyebrow={asideCta.eyebrow}
              title={asideCta.title}
              body={asideCta.body}
              cta={asideCta.cta}
            />
          </StickyAside>
        }
      />

      {/* 4 · other guides in the city */}
      {others.length ? (
        <section className={`scroll-mt-[84px] py-[clamp(72px,10vw,150px)] ${ALT_BAND}`}>
          <div className={WRAP}>
            <SectionHead eyebrow={t("moreEyebrow")} headline={t("moreTitle", { city: cityName })} />
            <div className="grid grid-cols-1 gap-[26px] min-[681px]:grid-cols-2 min-[981px]:grid-cols-3">
              {others.map((g) => (
                <GuideCard
                  key={g.id}
                  guide={g}
                  locale={locale}
                  viewLabel={t("viewGuide")}
                  icon={icons[`guide_${g.template}`]}
                />
              ))}
            </div>
            <div className="mt-10 text-center">
              <ButtonLink variant="ghost" href={guidesUrl}>
                {t("allCityGuides", { city: cityName })} →
              </ButtonLink>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
