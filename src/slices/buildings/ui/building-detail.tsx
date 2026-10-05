import { Fragment } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MediaImage, mediaImgTag } from "@core/media";
import type { Locale } from "@core/db/columns";
import { Container, Hero, ProseSection, SpecStrip, UnitCard, UnitCardGrid, type UnitCardSpec } from "@core/ui";
import { type ApartmentSummary, listByBuilding } from "@slices/apartments/contract";
import type { BuildingDetail as BuildingDetailModel } from "../contract";
import { getBuildingBySlug } from "../server/queries";

/**
 * Building detail page — the approved `mock/building-detail.html` design embedded 1:1
 * inside the live app shell, now **DB-driven**: most of the page is still the mock's
 * verbatim styling (scoped under `.mk` — see `src/app/mock.css`), generated from the
 * published `building` row (`getBuildingBySlug`) plus its bookable units
 * (`listByBuilding`, the apartments contract — golden rule 2). DB content is HTML-escaped
 * before interpolation; the real header/footer + i18n come from the app layout.
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
 * the hero/gallery (see `SpecStrip`'s docstring). The gallery beside it is untouched raw markup
 * (not this task's target), given its own tiny dedicated `.mk` wrapper so `.gallery`'s CSS
 * keeps resolving without reintroducing the reset.
 *
 * **"THE BUILDING" is real JSX** too — `core/ui`'s new `ProseSection` (eyebrow + serif `<h2>`
 * + free-prose paragraphs, with an optional "The Neighbourhood" `<h3>` subsection), replacing
 * the old `.mk`-scoped `buildingSection` HTML string in `bodyHtml()`. DB-sourced
 * `detail.descriptionIntro`/`descriptionNeighbourhood` are plain text, split into paragraph
 * arrays by `splitParagraphs()` (blank-line/newline split, same rule the old `paragraphs()`
 * HTML-string helper used) and passed as real `<p>` children — React escapes them, so no
 * `esc()` call is needed for this section anymore. Renders **outside** `.mk`, right after the
 * spec strip and before the apartments grid + the still-raw `.mk`-wrapped remainder
 * (amenities/FAQ/book band) — see `ProseSection`'s own docstring for the full cascade-layers reasoning (same trap
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
 * Resilient to sparse content (the catalog is filled incrementally via the backoffice):
 * - no R2 cover yet → a Warm-Editorial placeholder SVG is shown (building + per-unit);
 * - empty gallery / amenities / FAQ → that section is omitted (never an empty shell);
 * - no published apartments yet → the "Apartments in this Building" grid is omitted.
 * The Avantio booking CTA links to a unit's `avantio_url` (or the building's), falling
 * back to the in-page `#book` band when no engine handle is set.
 */

/** Minimal HTML escaper for interpolating DB content into the `.mk` markup string. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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
// `.gallery` is `2fr 1fr 1fr` × 2 rows with a 10px gap; `.g0` spans both rows (so it is
// the 2fr column) and goes full-width at 680px, where the rest become 2 columns.
const GALLERY_LEAD_SIZES = "(max-width: 680px) 100vw, 582px";
const GALLERY_SIZES = "(max-width: 680px) 50vw, 291px";

/** Generic amenity glyph (the DB stores an icon key, but a single check reads cleanly
 *  across the whole grid and degrades gracefully until a per-key icon map is wired). */
const AMENITY_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.4l2.4 2.4 4.6-5"/></svg>';

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

const PAGE_STYLE = `
.mk .gallery{display:grid;grid-template-columns:2fr 1fr 1fr;grid-template-rows:1fr 1fr;gap:10px;border-radius:4px;overflow:hidden}
.mk .gallery img{width:100%;height:100%;object-fit:cover;display:block}
.mk .gallery .g0{grid-row:1/3}
@media(max-width:680px){.mk .gallery{grid-template-columns:1fr 1fr}.mk .gallery .g0{grid-row:auto;grid-column:1/3}}
.mk .am-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line);border:1px solid var(--line)}
.mk .am{background:var(--surface);display:flex;align-items:center;gap:14px;padding:24px 26px}
.mk .am svg{width:22px;height:22px;flex:none;color:var(--accent-deep)}
.mk .am span{font-size:15px;color:var(--ink)}
@media(max-width:980px){.mk .am-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:680px){.mk .am-grid{grid-template-columns:1fr}}
.mk .faq{max-width:780px}
.mk .faq details{border-bottom:1px solid var(--line)}
.mk .faq summary{cursor:pointer;list-style:none;padding:24px 0;font-family:var(--serif);font-size:21px;color:var(--ink);display:flex;justify-content:space-between;align-items:center;gap:20px;transition:color .2s}
.mk .faq summary::-webkit-details-marker{display:none}
.mk .faq summary:hover{color:var(--accent-deep)}
.mk .faq summary::after{content:"+";font-family:var(--sans);font-size:24px;color:var(--accent-deep);line-height:1;transition:transform .25s var(--ease)}
.mk .faq details[open] summary::after{transform:rotate(45deg)}
.mk .faq details p{color:var(--ink-soft);font-size:16px;padding:0 0 26px;max-width:64ch}
.mk .bookband{background:var(--feature);color:var(--on-feature)}
.mk .bookband .inner{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:30px;padding:64px 0}
.mk .bookband .eyebrow{color:var(--feature-accent)}
.mk .bookband h2{font-size:clamp(28px,3.6vw,46px);color:#fff;margin:12px 0 14px;max-width:18ch}
.mk .bookband .sub{color:var(--on-feature-soft);font-size:15px;max-width:46ch}
.mk .bookband .act{display:flex;flex-direction:column;gap:12px;align-items:flex-start}
.mk .bookband .note{font-size:12.5px;color:var(--on-feature-soft);letter-spacing:.02em}
`;

/** The gallery grid only (the specstrip beside it is real JSX now — `core/ui`'s `SpecStrip`). */
function galleryGridHtml(detail: BuildingDetailModel): string {
  if (!detail.gallery.length) return "";
  return `<div class="gallery">${detail.gallery
    .map((g, i) =>
      mediaImgTag({
        data: g,
        sizes: i === 0 ? GALLERY_LEAD_SIZES : GALLERY_SIZES,
        ...(i === 0 ? { className: "g0", loading: "eager" as const } : {}),
      }),
    )
    .join("")}</div>`;
}

/** The still-raw `.mk` remainder after the apartments grid: amenities, FAQ, book band. */
function bodyHtml(detail: BuildingDetailModel, L: BuildingLabels): string {
  const amenitiesSection = detail.amenities.length
    ? `
<section>
  <div class="wrap">
    <div class="sec-head reveal">
      <h2 class="section-title">${esc(L.amenities)}</h2>
    </div>
    <div class="am-grid reveal">${detail.amenities
      .map((am) => `<div class="am">${AMENITY_ICON}<span>${esc(am.label)}</span></div>`)
      .join("")}</div>
  </div>
</section>`
    : "";

  const faqSection = detail.faq.length
    ? `
<section class="alt">
  <div class="wrap">
    <div class="sec-head reveal">
      <h2 class="section-title">${esc(L.faq)}</h2>
    </div>
    <div class="faq reveal">${detail.faq
      .map((f) => `<details><summary>${esc(f.question)}</summary><p>${esc(f.answer)}</p></details>`)
      .join("")}</div>
  </div>
</section>`
    : "";

  const bookHref = detail.avantio.url ?? "#book";
  const bookExternal = detail.avantio.url ? ' target="_blank" rel="noopener noreferrer"' : "";
  const bookband = `
<section class="bookband" style="padding:0">
  <div class="wrap">
    <div class="inner reveal">
      <div>
        <span class="eyebrow">${esc(L.bookEyebrow)}</span>
        <h2>${esc(L.bookTitle)}</h2>
        <p class="sub">${esc(L.bookIntro)}</p>
      </div>
      <div class="act">
        <a class="btn btn-accent" href="${esc(bookHref)}"${bookExternal}>${esc(L.bookCta)} →</a>
        <span class="note">${esc(L.bookNote)}</span>
      </div>
    </div>
  </div>
</section>`;

  return amenitiesSection + faqSection + bookband;
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
       * docstring). The gallery beside it is untouched raw markup (not this task's target) —
       * given its own tiny, dedicated `.mk` wrapper so `.gallery`'s CSS still resolves without
       * reintroducing the whole page's `.mk` subtree here.
       */}
      <Container>
        {detail.gallery.length > 0 ? (
          <div className="mk">
            <div dangerouslySetInnerHTML={{ __html: galleryGridHtml(detail) }} />
          </div>
        ) : null}
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
      <div className="mk" data-page="building">
        <style dangerouslySetInnerHTML={{ __html: PAGE_STYLE }} />
        <div dangerouslySetInnerHTML={{ __html: bodyHtml(detail, L) }} />
      </div>
    </Fragment>
  );
}
