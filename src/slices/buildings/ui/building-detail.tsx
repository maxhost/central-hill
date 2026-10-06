import { Fragment } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MediaImage, type MediaImageData } from "@core/media";
import type { Locale } from "@core/db/columns";
import { JsonLd, faqPageLd } from "@core/seo";
import {
  ActionBand,
  AmenityGrid,
  Container,
  FaqAccordion,
  Hero,
  MosaicGallery,
  ProseSection,
  SectionHead,
  SpecStrip,
  UnitCard,
  UnitCardGrid,
  type UnitCardSpec,
} from "@core/ui";
import { type ApartmentSummary, listByBuilding } from "@slices/apartments/contract";
import { getBuildingBySlug } from "../server/queries";

/**
 * Building detail page — the approved `mock/building-detail.html` design, now **fully
 * componentised** JSX (`core/ui` primitives, no `.mk`-scoped mock markup, no
 * `dangerouslySetInnerHTML`, no `mock.css` dependency) and **DB-driven**: the published
 * `building` row (`getBuildingBySlug`) plus its bookable units (`listByBuilding`, the
 * apartments contract — golden rule 2). DB content is passed as React text (escaped by React);
 * the real header/footer + i18n come from the app layout.
 *
 * The **hero is real JSX**: `core/ui`'s `<Hero compact>`, the fourth consumer — needed two
 * more additive props (`breadcrumb`/`eyebrowBadge`, see `hero.tsx`'s docstring) for the
 * breadcrumb trail above the eyebrow and the inline "★ New" flag. The street address reuses
 * `subtitle`/`subtitleClassName` (no new prop); `headlineClassName` passes the mock's *generic*
 * compact headline rule (`max-w-[15ch]`, normal wrap) explicitly, since `compact`'s own default
 * is Owners' page-specific nowrap override, not this page's. Background is the real R2 cover
 * via `@core/media`'s `MediaImage` (falling back to the Warm-Editorial placeholder SVG when the
 * building has none yet) — the first DB-driven `background` this component has had, though the
 * prop itself needed no change (always caller-built).
 *
 * The **spec strip is real JSX** too — `core/ui`'s new `SpecStrip` (apartments/capacity/beds/
 * neighbourhood), adapted from the old `.mk`-scoped `.specstrip`/`.spec`/`.spec .n`/`.spec .l`
 * CSS. Not `StatBand`: no title, no dark band, no `CountUp` (one value here is a neighbourhood
 * *name*, not a number — see that component's docstring). It renders **outside** `.mk` (a first
 * cut nested it inside, which silently zeroed its padding/margins — `mock.css`'s
 * `.mk * {margin:0;padding:0}` reset is un-layered CSS, which always beats a layered Tailwind
 * utility of any specificity; see `SpecStrip`'s docstring). Client direction deliberately drops
 * the mock's own top rhythm here — no top gap, no top border, bottom-bordered only, flush under
 * the hero/gallery (see `SpecStrip`'s docstring).
 *
 * **The photo gallery above it is real JSX** too — `core/ui`'s new `MosaicGallery` (`2fr 1fr 1fr`,
 * first photo a two-row lead tile; 2 columns with a full-width lead at ≤680px), replacing the old
 * `galleryGridHtml()` string, its dedicated `.mk` wrapper and the `.mk .gallery*` rules in
 * `PAGE_STYLE`. Not `StepGallery` (numbered captioned cards — see `MosaicGallery`'s docstring).
 * Photos are `galleryImage()`'s `MediaImage`s (lead `GALLERY_LEAD_SIZES`, rest `GALLERY_SIZES`).
 * Verified computed-style- and screenshot-identical at 1440/834/390 with 8 photos; one attribute
 * deviation: the lead photo is now `loading="lazy"` (was `eager`) — see `galleryImage()`.
 *
 * **"THE BUILDING" is real JSX** too — `core/ui`'s new `ProseSection` (eyebrow + serif `<h2>`
 * + free-prose paragraphs, with an optional "The Neighbourhood" `<h3>` subsection), replacing
 * the old `.mk`-scoped `buildingSection` HTML string in `bodyHtml()`. DB-sourced
 * `detail.descriptionIntro`/`descriptionNeighbourhood` are plain text, split into paragraph
 * arrays by `splitParagraphs()` (blank-line/newline split, same rule the old `paragraphs()`
 * HTML-string helper used) and passed as real `<p>` children — React escapes them. Renders
 * right after the spec strip and before the apartments grid, the amenities grid, the FAQ and
 * the book band — see `ProseSection`'s own docstring for the full cascade-layers reasoning (same trap
 * as `SpecStrip`) and for a flagged pre-existing drift between `mock/assets/site.css`'s
 * `--section-y`/`--max` tokens (used here, to stay pixel-identical to the live page) and
 * `core/ui`'s canonical `Section`/`Container` values (ported, not reconciled — see that
 * docstring). Resilient to a building with no `descriptionNeighbourhood` at all (the
 * subsection is omitted, not rendered empty) — confirmed live against the DB that
 * "Bairro Alto View" (`bairro-alto-view`) currently has only `description_intro` populated,
 * no `description_neighbourhood` row; the mock's richer two-subsection copy was used only to
 * verify `ProseSection` renders the optional subsection correctly, never written to the DB.
 *
 * **"Apartments in this Building" is real JSX** too — `core/ui`'s new `UnitCard` +
 * `UnitCardGrid` (cover w/ hover zoom, badge, icon+value spec chips with per-chip `title`, the
 * underlined "Check availability →" CTA; 3→2→1 columns at 980/680px), replacing the old
 * `apartmentCardHtml()`/`.pcard` strings and the `.pspecs`/`.pspec`/`.check`/`.powered` rules
 * in `PAGE_STYLE`. Not `PropertyCard` (different padding/type scale, no zoom, text meta line,
 * `next/link` — see `UnitCard`'s docstring). The section shell, sec-head and the `#book`
 * "Booking powered by Avantio" line are inline JSX here (no `.mk`, so no `.mk` reset trap and
 * no `data-page` hook needed — nothing on this page keys off it for scroll-reveal; the old
 * `.reveal` classes were neutralised by `mock.css`, so the section was and stays static).
 * Covers: `MediaImage` (lazy, `CARD_SIZES`) for an R2 asset, else a plain lazy `<img>` of the
 * placeholder SVG — the same two branches `mediaImgTag()` produced. The badge now stays
 * visible on hover (it used to be painted over by the zoomed image — see `UnitCard`).
 *
 * **The closing "Book an apartment in this building" band is real JSX** too — `core/ui`'s new
 * `ActionBand` (full-bleed dark feature band: eyebrow/`<h2>`/line left, accent button + note
 * right), replacing the old `bookband` string in `bodyHtml()` and the `.mk .bookband*` rules in
 * `PAGE_STYLE`. Not `FeaturePanel`/`FeatureCtaBand`/`CalloutBand`, and its button is a literal
 * `.btn.btn-accent` port rather than `ButtonLink` (see `ActionBand`'s docstring). Rendered
 * after the FAQ (section order unchanged), on every building; static (the old `.reveal` was
 * neutralised). Verified computed-style- and screenshot-identical to the pre-extraction render
 * at 1440/834/390, hover included.
 *
 * **"Amenities" is real JSX** too — the standard page shell + `core/ui`'s `SectionHead` (title
 * only, left) + its new `AmenityGrid` (hairline 4→2→1 grid of icon + label cells), replacing the
 * old amenities string in `bodyHtml()` and the `.mk .am-grid`/`.am` rules in `PAGE_STYLE`. Not
 * `BenefitCards`/`IconFeatureGrid`/`ChipBar` (see `AmenityGrid`'s docstring). The glyph is the
 * same generic check, now a JSX `AMENITY_ICON` (`aria-hidden` added). Rendered
 * between the apartments grid and the FAQ (order unchanged); static. One visible change from
 * `SectionHead`: the eyebrow-less title drops `h2.section-title`'s `14px` top margin, so it sits
 * 14px higher (consistency with every other section head).
 *
 * **The FAQ is real JSX** too — the last raw piece — on the warm alt band (same shell as the
 * apartments section), `core/ui`'s centred `SectionHead` and its `FaqAccordion` (the one
 * site-wide accordion, shared with `pages`' `FaqSection`), plus `FAQPage` JSON-LD via
 * `core/seo` exactly like `FaqSection`. Replaces the old `bodyHtml()` string, its `.faq` rules
 * in `PAGE_STYLE`, `esc()` and the `.mk` wrapper. Deliberate visible changes (consistency over
 * mock fidelity): the head is centred like every other FAQ on the site, and the accordion
 * takes `FaqAccordion`'s approved metrics (18px serif question, 768px column, 70ch answer,
 * `accent` "+" top-aligned) instead of the buildings mock's `.faq` (21px, 780px, 64ch,
 * `accent-deep` "+" centred). Nothing on the page needs `mock.css` anymore, so the route no
 * longer imports it.
 *
 * Resilient to sparse content (the catalog is filled incrementally via the backoffice):
 * - no R2 cover yet → a Warm-Editorial placeholder SVG is shown (building + per-unit);
 * - empty gallery / amenities / FAQ → that section is omitted (never an empty shell);
 * - no published apartments yet → the "Apartments in this Building" grid is omitted.
 * The Avantio booking CTA links to a unit's `avantio_url` (or the building's), falling
 * back to the in-page `#book` band when no engine handle is set.
 */

/** Split source prose into paragraph strings (blank lines or newlines split) for
 *  `ProseSection`'s real `<p>` children — no HTML-escaping needed, React escapes text nodes. */
function splitParagraphs(text: string): string[] {
  return text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

const PLACEHOLDER_BUILDING = "/placeholders/building.svg";
const PLACEHOLDER_APARTMENT = "/placeholders/apartment.svg";

// `.pf-grid` is 3 columns inside the 1240px `.wrap`, 2 under 980px, 1 under 680px.
const CARD_SIZES = "(max-width: 680px) 100vw, (max-width: 980px) 50vw, 394px";
// `MosaicGallery` is `2fr 1fr 1fr` × 2 rows with a 10px gap; the lead spans both rows (so it is
// the 2fr column) and goes full-width at 680px, where the rest become 2 columns. (Values assume
// the mock's 1184px `.wrap` content width; the live `Container` is 1200px → 590/295px tiles, and
// a 6th+ photo auto-places into the 2fr column with the 291px hint — pre-existing, unchanged.)
const GALLERY_LEAD_SIZES = "(max-width: 680px) 100vw, 582px";
const GALLERY_SIZES = "(max-width: 680px) 50vw, 291px";

/** Generic amenity glyph (the DB stores an icon key, but a single check reads cleanly
 *  across the whole grid and degrades gracefully until a per-key icon map is wired). */
const AMENITY_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.4l2.4 2.4 4.6-5" />
  </svg>
);

/** Apartment-card spec-row glyphs (bedrooms, beds, guests, size) — positional, always
 *  the same four, so plain consts rather than an icon-key map like the amenities grid.
 *  `UnitCard` sizes (16px) and tints (`accent-deep`) them. Same paths/attributes as the old
 *  HTML-string glyphs; no a11y attributes added (the old markup had none either — each
 *  chip's accessible hint is its `title`). */
const SPEC_SVG = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;
const SPEC_ICONS = {
  bedrooms: (
    <svg {...SPEC_SVG}>
      <rect x="5" y="3" width="12" height="18" rx="1" />
      <path d="M14 12v.01" />
    </svg>
  ),
  beds: (
    <svg {...SPEC_SVG}>
      <path d="M3 19v-7a2 2 0 012-2h14a2 2 0 012 2v7" />
      <path d="M3 19h18M3 17v2M21 17v2" />
      <path d="M7 10V7a1 1 0 011-1h3a1 1 0 011 1v3" />
    </svg>
  ),
  guests: (
    <svg {...SPEC_SVG}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20c0-3.6 3.1-6.5 7-6.5s7 2.9 7 6.5" />
    </svg>
  ),
  size: (
    <svg {...SPEC_SVG}>
      <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" />
    </svg>
  ),
} as const;

interface BuildingLabels {
  home: string;
  breadcrumb: string;
  new: string;
  statApartments: string;
  statCapacity: string;
  statBeds: string;
  statNeighbourhood: string;
  theBuilding: string;
  theNeighbourhood: string;
  amenities: string;
  faq: string;
  bookEyebrow: string;
  bookTitle: string;
  bookIntro: string;
  bookCta: string;
  bookNote: string;
}

interface ApartmentLabels {
  eyebrow: string;
  title: string;
  intro: string;
  poweredBy: string;
  checkAvailability: string;
  bedrooms: (n: number) => string;
  guests: (n: number) => string;
  beds: (n: number) => string;
  size: (n: number) => string;
}

/** A unit's `UnitCard` spec chips — bedrooms/beds/guests always, size only when `sizeM2` is set. */
function apartmentSpecs(a: ApartmentSummary, labels: ApartmentLabels): UnitCardSpec[] {
  const specs: UnitCardSpec[] = [
    { icon: SPEC_ICONS.bedrooms, value: a.bedrooms, label: labels.bedrooms(a.bedrooms) },
    { icon: SPEC_ICONS.beds, value: a.bedsCount, label: labels.beds(a.bedsCount) },
    { icon: SPEC_ICONS.guests, value: a.maxGuests, label: labels.guests(a.maxGuests) },
  ];
  if (a.sizeM2) specs.push({ icon: SPEC_ICONS.size, value: a.sizeM2, label: labels.size(a.sizeM2) });
  return specs;
}

/** One `MosaicGallery` photo: the R2 asset via `MediaImage` (responsive `sizes` — the lead tile's
 *  own, the rest the 1fr cells'), else a plain `<img>` — the same two branches the old
 *  `mediaImgTag()` call produced. The old lead tile was `loading="eager"` with no `fetchpriority`;
 *  `MediaImage` exposes only `priority` (eager **plus** `fetchpriority=high` **plus** a preload that
 *  would compete with the hero cover, the real LCP), so on the asset branch every photo is now
 *  lazy — an escalated deviation (see the slice README → gallery). The plain-`<img>` branch keeps it. */
function galleryImage(g: MediaImageData, i: number) {
  if (g.url && g.width > 0 && g.height > 0) {
    return <MediaImage data={g} sizes={i === 0 ? GALLERY_LEAD_SIZES : GALLERY_SIZES} />;
  }
  // eslint-disable-next-line @next/next/no-img-element -- dimensionless asset, not optimisable
  return <img src={g.url || PLACEHOLDER_BUILDING} alt={g.alt} loading={i === 0 ? "eager" : "lazy"} decoding="async" />;
}

/** A unit's cover for `UnitCard`: the R2 asset (lazy, responsive `sizes`) or the placeholder
 *  SVG — same two branches/attributes the old `mediaImgTag()` call produced. */
function apartmentCover(a: ApartmentSummary) {
  if (a.cover?.url && a.cover.width > 0 && a.cover.height > 0) {
    return <MediaImage data={a.cover} sizes={CARD_SIZES} />;
  }
  // Asset without usable dimensions → served unoptimised (as `mediaImgTag` did); none → placeholder.
  // eslint-disable-next-line @next/next/no-img-element -- placeholder SVG / dimensionless asset, not optimisable
  return <img src={a.cover?.url || PLACEHOLDER_APARTMENT} alt={a.cover?.alt || a.name} loading="lazy" decoding="async" />;
}

export async function BuildingDetail({ locale, slug }: { locale: Locale; slug: string }) {
  setRequestLocale(locale);

  const detail = await getBuildingBySlug(locale, slug);
  if (!detail) notFound();

  const [apartments, t, ta] = await Promise.all([
    listByBuilding(locale, detail.id),
    getTranslations("buildings"),
    getTranslations("apartments"),
  ]);

  const L: BuildingLabels = {
    home: t("home"),
    breadcrumb: t("breadcrumb"),
    new: t("new"),
    statApartments: t("statApartments"),
    statCapacity: t("statCapacity"),
    statBeds: t("statBeds"),
    statNeighbourhood: t("statNeighbourhood"),
    theBuilding: t("theBuilding"),
    theNeighbourhood: t("theNeighbourhood"),
    amenities: t("amenities"),
    faq: t("faq"),
    bookEyebrow: t("bookEyebrow"),
    bookTitle: t("bookTitle"),
    bookIntro: t("bookIntro"),
    bookCta: t("bookCta"),
    bookNote: t("bookNote"),
  };

  const AL: ApartmentLabels = {
    eyebrow: ta("eyebrow"),
    title: ta("title"),
    intro: ta("intro"),
    poweredBy: ta("poweredBy"),
    checkAvailability: ta("checkAvailability"),
    bedrooms: (n) => ta("bedrooms", { count: n }),
    guests: (n) => ta("guests", { count: n }),
    beds: (n) => ta("beds", { count: n }),
    size: (n) => ta("size", { count: n }),
  };

  const locationLine = `${detail.neighbourhood ? `${detail.neighbourhood.name} · ` : ""}${detail.city.name}`;

  return (
    <Fragment>
      {/*
       * Real JSX — `core/ui`'s `<Hero compact>`, the breadcrumb trail + "★ New" flag are the
       * two new additive props (`breadcrumb`/`eyebrowBadge`, see that component's docstring);
       * the street address reuses `subtitle`/`subtitleClassName`. Background is the real R2
       * cover (`MediaImage`), falling back to the Warm-Editorial placeholder SVG.
       */}
      <Hero
        background={
          detail.cover ? (
            <MediaImage
              data={detail.cover}
              className="absolute inset-0 -z-10 h-full w-full object-cover"
              sizes="100vw"
              priority
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- placeholder SVG, not an R2 asset
            <img
              src={PLACEHOLDER_BUILDING}
              alt={detail.name}
              className="absolute inset-0 -z-10 h-full w-full object-cover"
            />
          )
        }
        compact
        overlayClassName="bg-[linear-gradient(180deg,rgba(18,16,13,0.42)_0%,rgba(18,16,13,0.30)_45%,rgba(18,16,13,0.85)_100%)]"
        breadcrumb={
          <nav aria-label="Breadcrumb" className="mb-1.5 text-[13px] tracking-[0.02em] text-feature-accent">
            <Link href={`/${locale}`} className="opacity-85 transition-opacity duration-200 hover:opacity-100 hover:underline">
              {L.home}
            </Link>
            <span className="mx-2 opacity-55">/</span>
            <Link
              href={`/${locale}/buildings`}
              className="opacity-85 transition-opacity duration-200 hover:opacity-100 hover:underline"
            >
              {L.breadcrumb}
            </Link>
            <span className="mx-2 opacity-55">/</span>
            <span className="opacity-70">{detail.name}</span>
          </nav>
        }
        eyebrowBadge={
          detail.isNew ? (
            <span className="mr-3 inline-block bg-accent px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.13em] text-white">
              ★ {L.new}
            </span>
          ) : null
        }
        eyebrow={locationLine}
        headline={detail.name}
        headlineClassName="max-w-[15ch] text-[clamp(2.5rem,5.4vw,4.25rem)]"
        subtitle={detail.streetAddress ?? undefined}
        subtitleClassName="mt-1.5 max-w-none text-base"
      />
      {/*
       * Real JSX — the spec strip (apartments/capacity/beds/neighbourhood), `core/ui`'s new
       * `SpecStrip` (see that component's docstring for why it's not `StatBand`), rendered
       * *outside* `.mk` (required — see `SpecStrip`'s own docstring for the `.mk * {margin:0;
       * padding:0}` layering trap). Client direction: no top gap and no top border — it sits
       * flush under the hero/gallery, bottom-bordered only (a deliberate deviation from the
       * mock's own `margin-top:46px`/top `border`/section top-padding — see `SpecStrip`'s
       * docstring). The photo gallery above it is `core/ui`'s `MosaicGallery` (also *outside*
       * `.mk`, no wrapper), omitted when the building has no gallery photos.
       */}
      <Container>
        {detail.gallery.length > 0 ? <MosaicGallery images={detail.gallery.map(galleryImage)} /> : null}
        <SpecStrip
          items={[
            { value: detail.stats.apartments, label: L.statApartments },
            { value: detail.stats.capacity, label: L.statCapacity },
            { value: detail.stats.beds, label: L.statBeds },
            { value: detail.neighbourhood?.name ?? detail.city.name, label: L.statNeighbourhood },
          ]}
        />
      </Container>
      {/*
       * Real JSX — "THE BUILDING" (eyebrow + headline + free prose, optional "The
       * Neighbourhood" subsection), `core/ui`'s new `ProseSection` (see that component's
       * docstring for the reuse check, the `.mk`-cascade-layers requirement, and the flagged
       * `--section-y`/`--max` drift vs. `core/ui`'s canonical `Section`/`Container`).
       * Rendered *outside* `.mk`, same requirement as `Hero`/`SpecStrip` above. Omitted
       * entirely when the building has neither an intro nor a neighbourhood description yet.
       */}
      {detail.descriptionIntro.trim() || detail.descriptionNeighbourhood?.trim() ? (
        <ProseSection
          eyebrow={L.theBuilding}
          headline={detail.headline || detail.name}
          paragraphs={detail.descriptionIntro.trim() ? splitParagraphs(detail.descriptionIntro) : []}
          subsection={
            detail.descriptionNeighbourhood?.trim()
              ? { heading: L.theNeighbourhood, paragraphs: splitParagraphs(detail.descriptionNeighbourhood) }
              : undefined
          }
        />
      ) : null}
      {/*
       * Real JSX — "Apartments in this Building": `core/ui`'s new `UnitCard`/`UnitCardGrid`
       * (see that file's docstring for why not `PropertyCard`), with the section shell (alt
       * band, `--section-y` rhythm, 1240px/28px column), sec-head and the "Booking powered by
       * Avantio" line (`#book`, the cards' fallback anchor) ported 1:1 from the old `.mk`
       * `section.alt`/`.wrap`/`.sec-head`/`.eyebrow`/`h2.section-title`/`.lede`/`.powered`
       * CSS. Rendered *outside* `.mk` (cascade-layers trap — see `SpecStrip`'s docstring).
       * No `Reveal`: the old `.reveal` classes were neutralised by `mock.css` and this page
       * mounts no scroll-reveal script, so the live section was static — kept static.
       * Omitted entirely when the building has no published apartments.
       */}
      {apartments.length > 0 ? (
        <section
          id="apartments"
          className="scroll-mt-[84px] bg-[color-mix(in_srgb,var(--color-line)_38%,var(--color-bg))] py-[clamp(72px,10vw,150px)] leading-[1.6] text-ink"
        >
          <div className="mx-auto max-w-[1240px] px-[28px]">
            <div className="mb-[54px] max-w-[720px]">
              <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-accent-deep">{AL.eyebrow}</span>
              <h2 className="mt-[14px] font-serif text-[clamp(30px,4vw,50px)] font-medium leading-[1.08] tracking-[-0.015em] text-ink">
                {AL.title}
              </h2>
              <p className="mt-4 max-w-[62ch] text-[18px] text-ink-soft">{AL.intro}</p>
            </div>
            <UnitCardGrid>
              {apartments.map((a) => (
                <UnitCard
                  key={a.id}
                  href={a.avantio.url ?? "#book"}
                  external={Boolean(a.avantio.url)}
                  image={apartmentCover(a)}
                  name={a.name}
                  badge={a.badge}
                  specs={apartmentSpecs(a, AL)}
                  ctaLabel={AL.checkAvailability}
                />
              ))}
            </UnitCardGrid>
            <div id="book" className="mt-[30px] text-center text-[12.5px] tracking-[0.04em] text-ink-soft">
              {AL.poweredBy}
            </div>
          </div>
        </section>
      ) : null}
      {/*
       * Real JSX — "Amenities": the standard page shell (`--section-y` rhythm, 1240px/28px
       * column), `core/ui`'s `SectionHead` (title only, left) and its new `AmenityGrid` (see that
       * file's docstring for the reuse check), replacing the old `.mk` amenities string in
       * `bodyHtml()` and the `.mk .am-grid`/`.am` rules in `PAGE_STYLE`. Each cell's glyph is the
       * generic `AMENITY_ICON` check. Rendered *outside* `.mk` (cascade-layers trap — see
       * `SpecStrip`'s docstring). No `Reveal` — static, like the apartments section above.
       * Omitted entirely when the building has no amenities.
       */}
      {detail.amenities.length > 0 ? (
        <section className="scroll-mt-[84px] py-[clamp(72px,10vw,150px)]">
          <div className="mx-auto max-w-[1240px] px-[28px]">
            <SectionHead headline={L.amenities} />
            <AmenityGrid items={detail.amenities.map((am) => ({ icon: AMENITY_ICON, label: am.label }))} />
          </div>
        </section>
      ) : null}
      {/*
       * Real JSX — the building FAQ: the warm alt band (same shell as the apartments section),
       * `core/ui`'s centred `SectionHead` (centred like `FaqSection` on every other page) and
       * `FaqAccordion` (the one site-wide accordion), plus `FAQPage` JSON-LD from `core/seo`,
       * emitted the same way `FaqSection` does. Replaces the old `.mk`-scoped `bodyHtml()` string
       * and its `.faq` rules. Static (native `<details>`, zero JS). Omitted when there is no FAQ.
       */}
      {detail.faq.length > 0 ? (
        <section className="scroll-mt-[84px] bg-[color-mix(in_srgb,var(--color-line)_38%,var(--color-bg))] py-[clamp(72px,10vw,150px)]">
          <JsonLd data={faqPageLd(detail.faq.map((f) => ({ question: f.question, answer: f.answer })))} />
          <div className="mx-auto max-w-[1240px] px-[28px]">
            <SectionHead align="center" headline={L.faq} />
            <FaqAccordion items={detail.faq.map((f) => ({ id: f.id, question: f.question, answer: f.answer }))} />
          </div>
        </section>
      ) : null}
      {/*
       * Real JSX — the closing "Book an apartment in this building" band, `core/ui`'s new
       * `ActionBand` (see its docstring for why not `FeaturePanel`/`FeatureCtaBand`/`CalloutBand`
       * and why the button isn't `ButtonLink`), replacing the old `.mk` `bookband` string and its
       * `.mk .bookband*` rules. Rendered *outside* `.mk` (cascade-layers trap — see `SpecStrip`'s
       * docstring), after the FAQ so the section order is unchanged.
       * Always rendered. The CTA links to the building's Avantio URL in a new tab, or falls back
       * to the in-page `#book` anchor. Static, like the original (its `.reveal` was neutralised).
       */}
      <ActionBand
        eyebrow={L.bookEyebrow}
        title={L.bookTitle}
        body={L.bookIntro}
        cta={{ href: detail.avantio.url ?? "#book", label: L.bookCta, external: Boolean(detail.avantio.url) }}
        note={L.bookNote}
      />
    </Fragment>
  );
}
