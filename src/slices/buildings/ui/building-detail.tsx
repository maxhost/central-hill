import { Fragment } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MediaImage, mediaImgTag } from "@core/media";
import type { Locale } from "@core/db/columns";
import { Container, Hero, SpecStrip } from "@core/ui";
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

/** Split source prose into escaped `<p>` paragraphs (blank lines or newlines split). */
function paragraphs(text: string): string {
  return text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p)}</p>`)
    .join("");
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
 *  the same four, so plain consts rather than an icon-key map like the amenities grid. */
const SPEC_ICONS = {
  bedrooms:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="12" height="18" rx="1"/><path d="M14 12v.01"/></svg>',
  beds: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 19v-7a2 2 0 012-2h14a2 2 0 012 2v7"/><path d="M3 19h18M3 17v2M21 17v2"/><path d="M7 10V7a1 1 0 011-1h3a1 1 0 011 1v3"/></svg>',
  guests:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.2"/><path d="M5 20c0-3.6 3.1-6.5 7-6.5s7 2.9 7 6.5"/></svg>',
  size: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/></svg>',
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

/** One icon+value chip in an apartment card's spec row (bedrooms/beds/guests/size). */
function specChip(icon: string, value: number, label: string): string {
  return `<span class="pspec" title="${esc(label)}">${icon}${esc(String(value))}</span>`;
}

/** One `.pcard` for the "Apartments in this Building" grid, built from a published unit. */
function apartmentCardHtml(a: ApartmentSummary, labels: ApartmentLabels): string {
  const coverTag = mediaImgTag({
    data: a.cover,
    fallbackSrc: PLACEHOLDER_APARTMENT,
    fallbackAlt: a.name,
    sizes: CARD_SIZES,
  });
  const specs = [
    specChip(SPEC_ICONS.bedrooms, a.bedrooms, labels.bedrooms(a.bedrooms)),
    specChip(SPEC_ICONS.beds, a.bedsCount, labels.beds(a.bedsCount)),
    specChip(SPEC_ICONS.guests, a.maxGuests, labels.guests(a.maxGuests)),
    a.sizeM2 ? specChip(SPEC_ICONS.size, a.sizeM2, labels.size(a.sizeM2)) : "",
  ].join("");
  const href = a.avantio.url ?? "#book";
  const external = a.avantio.url ? ' target="_blank" rel="noopener noreferrer"' : "";
  return `
      <a class="pcard" href="${esc(href)}"${external}>
        <div class="ph">${
          a.badge ? `<span class="badge">${esc(a.badge)}</span>` : ""
        }${coverTag}</div>
        <div class="pbody"><h3>${esc(a.name)}</h3><div class="pspecs">${specs}</div><span class="check">${esc(labels.checkAvailability)} →</span></div>
      </a>`;
}

const PAGE_STYLE = `
.mk .gallery{display:grid;grid-template-columns:2fr 1fr 1fr;grid-template-rows:1fr 1fr;gap:10px;border-radius:4px;overflow:hidden}
.mk .gallery img{width:100%;height:100%;object-fit:cover;display:block}
.mk .gallery .g0{grid-row:1/3}
@media(max-width:680px){.mk .gallery{grid-template-columns:1fr 1fr}.mk .gallery .g0{grid-row:auto;grid-column:1/3}}
/* Apartment-card spec row (icon + value chips) — replaces the plain-text .pmeta line
   on unit cards only; the building-listing cards keep the kernel .pmeta unchanged. */
.mk .pspecs{display:flex;flex-wrap:wrap;gap:14px;margin-top:4px}
.mk .pspec{display:inline-flex;align-items:center;gap:5px;font-size:13px;font-weight:600;color:var(--ink-soft)}
.mk .pspec svg{width:16px;height:16px;color:var(--accent-deep)}
.mk .prose{max-width:68ch}
.mk .prose p{color:var(--ink-soft);margin-bottom:18px;font-size:17px}
.mk .prose h3{font-size:clamp(24px,3vw,34px);margin:46px 0 16px}
.mk .pbody .check{margin-top:18px;display:inline-flex;align-items:center;gap:.45em;font-size:13.5px;font-weight:600;letter-spacing:.02em;color:var(--accent-deep);border-bottom:1px solid color-mix(in srgb,var(--accent-deep) 35%,transparent);padding-bottom:2px;transition:.2s}
.mk .pcard:hover .check{color:var(--accent)}
.mk .powered{font-size:12.5px;letter-spacing:.04em;color:var(--ink-soft);margin-top:30px;text-align:center}
.mk .powered b{color:var(--ink);font-weight:600}
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

function bodyHtml(
  detail: BuildingDetailModel,
  apartments: ApartmentSummary[],
  L: BuildingLabels,
  AL: ApartmentLabels,
): string {
  const introHtml = detail.descriptionIntro.trim() ? paragraphs(detail.descriptionIntro) : "";
  const neighHtml = detail.descriptionNeighbourhood?.trim()
    ? `<h3>${esc(L.theNeighbourhood)}</h3>${paragraphs(detail.descriptionNeighbourhood)}`
    : "";
  const buildingSection =
    introHtml || neighHtml
      ? `
<section>
  <div class="wrap">
    <div class="sec-head reveal">
      <span class="eyebrow">${esc(L.theBuilding)}</span>
      <h2 class="section-title">${esc(detail.headline || detail.name)}</h2>
    </div>
    <div class="prose reveal">${introHtml}${neighHtml}</div>
  </div>
</section>`
      : "";

  const apartmentsSection = apartments.length
    ? `
<section class="alt" id="apartments">
  <div class="wrap">
    <div class="sec-head reveal">
      <span class="eyebrow">${esc(AL.eyebrow)}</span>
      <h2 class="section-title">${esc(AL.title)}</h2>
      <p class="lede" style="margin-top:16px">${esc(AL.intro)}</p>
    </div>
    <div class="pf-grid reveal">${apartments.map((a) => apartmentCardHtml(a, AL)).join("")}
    </div>
    <div class="powered" id="book">${esc(AL.poweredBy)}</div>
  </div>
</section>`
    : "";

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

  return buildingSection + apartmentsSection + amenitiesSection + faqSection + bookband;
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
      <div className="mk" data-page="building">
        <style dangerouslySetInnerHTML={{ __html: PAGE_STYLE }} />
        <div dangerouslySetInnerHTML={{ __html: bodyHtml(detail, apartments, L, AL) }} />
      </div>
    </Fragment>
  );
}
