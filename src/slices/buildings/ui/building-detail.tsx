import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@core/db/columns";
import { type ApartmentSummary, listByBuilding } from "@slices/apartments/contract";
import type { BuildingDetail as BuildingDetailModel } from "../contract";
import { getBuildingBySlug } from "../server/queries";

/**
 * Building detail page — the approved `mock/building-detail.html` design embedded 1:1
 * inside the live app shell, now **DB-driven**: the page styles are the mock's verbatim
 * (scoped under `.mk` — see `src/app/mock.css`), but every section is generated from the
 * published `building` row (`getBuildingBySlug`) plus its bookable units
 * (`listByBuilding`, the apartments contract — golden rule 2). DB content is HTML-escaped
 * before interpolation; the real header/footer + i18n come from the app layout.
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

/** Generic amenity glyph (the DB stores an icon key, but a single check reads cleanly
 *  across the whole grid and degrades gracefully until a per-key icon map is wired). */
const AMENITY_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.4l2.4 2.4 4.6-5"/></svg>';

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
}

/** One `.pcard` for the "Apartments in this Building" grid, built from a published unit. */
function apartmentCardHtml(a: ApartmentSummary, labels: ApartmentLabels): string {
  const cover = a.cover?.url ?? PLACEHOLDER_APARTMENT;
  const alt = a.cover?.alt ?? a.name;
  const meta = [labels.bedrooms(a.bedrooms), labels.guests(a.maxGuests), labels.beds(a.bedsCount)].join(
    " · ",
  );
  const href = a.avantio.url ?? "#book";
  const external = a.avantio.url ? ' target="_blank" rel="noopener noreferrer"' : "";
  return `
      <a class="pcard" href="${esc(href)}"${external}>
        <div class="ph">${
          a.badge ? `<span class="badge">${esc(a.badge)}</span>` : ""
        }<img src="${esc(cover)}" alt="${esc(alt)}" loading="lazy"></div>
        <div class="pbody"><h3>${esc(a.name)}</h3><div class="pmeta">${esc(meta)}</div><span class="check">${esc(labels.checkAvailability)} →</span></div>
      </a>`;
}

const PAGE_STYLE = `
/* Hero: strengthen the dark overlay over the cover photo so the white breadcrumb/
   headline/address stay legible (matches the Buildings index treatment). Scoped to
   this page — overrides the kernel \`.mk .hero::after\`. */
.mk[data-page="building"] .hero::after{background:linear-gradient(180deg,rgba(18,16,13,.42) 0%,rgba(18,16,13,.30) 45%,rgba(18,16,13,.85) 100%)}
.mk .crumb{font-size:13px;letter-spacing:.02em;color:#ecdcc2;margin-bottom:6px}
.mk .crumb a{color:#ecdcc2;opacity:.85;transition:opacity .2s}
.mk .crumb a:hover{opacity:1;text-decoration:underline}
.mk .crumb span{opacity:.55;margin:0 8px}
.mk .crumb .here{opacity:.7}
.mk .hero .addr{font-size:16px;color:#f1ece2;max-width:none;margin:6px 0 0}
.mk .hero .flag{display:inline-block;background:var(--accent);color:#fff;font-size:11px;letter-spacing:.13em;text-transform:uppercase;padding:4px 10px;font-weight:600;margin-right:12px}
.mk .gallery{display:grid;grid-template-columns:2fr 1fr 1fr;grid-template-rows:1fr 1fr;gap:10px;border-radius:4px;overflow:hidden}
.mk .gallery img{width:100%;height:100%;object-fit:cover;display:block}
.mk .gallery .g0{grid-row:1/3}
@media(max-width:680px){.mk .gallery{grid-template-columns:1fr 1fr}.mk .gallery .g0{grid-row:auto;grid-column:1/3}}
.mk .specstrip{display:flex;flex-wrap:wrap;justify-content:space-between;gap:24px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:34px 0;margin-top:46px}
.mk .spec{flex:1 1 0;min-width:140px;text-align:center}
.mk .spec .n{font-family:var(--serif);font-size:clamp(30px,3.4vw,44px);line-height:1;color:var(--ink)}
.mk .spec .l{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft);margin-top:10px}
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

function bodyHtml(
  detail: BuildingDetailModel,
  apartments: ApartmentSummary[],
  locale: Locale,
  L: BuildingLabels,
  AL: ApartmentLabels,
): string {
  const heroCover = detail.cover?.url ?? PLACEHOLDER_BUILDING;
  const heroAlt = detail.cover?.alt ?? detail.name;
  const locationLine = `${detail.neighbourhood ? `${esc(detail.neighbourhood.name)} · ` : ""}${esc(detail.city.name)}`;
  const addrHtml = detail.streetAddress ? `<p class="addr">${esc(detail.streetAddress)}</p>` : "";

  const hero = `
<section class="hero compact" style="padding:0">
  <img src="${esc(heroCover)}" alt="${esc(heroAlt)}">
  <div class="wrap">
    <nav class="crumb" aria-label="Breadcrumb">
      <a href="/${locale}">${esc(L.home)}</a><span>/</span><a href="/${locale}/buildings">${esc(L.breadcrumb)}</a><span>/</span><span class="here">${esc(detail.name)}</span>
    </nav>
    <span class="eyebrow">${detail.isNew ? `<span class="flag">★ ${esc(L.new)}</span>` : ""}${locationLine}</span>
    <h1>${esc(detail.name)}</h1>
    ${addrHtml}
  </div>
</section>`;

  const galleryHtml = detail.gallery.length
    ? `<div class="gallery reveal">${detail.gallery
        .map(
          (g, i) =>
            `<img${i === 0 ? ' class="g0"' : ""} src="${esc(g.url)}" alt="${esc(g.alt)}"${i > 0 ? ' loading="lazy"' : ""}>`,
        )
        .join("")}</div>`
    : "";

  const specstrip = `
    <div class="specstrip reveal">
      <div class="spec"><div class="n">${detail.stats.apartments}</div><div class="l">${esc(L.statApartments)}</div></div>
      <div class="spec"><div class="n">${detail.stats.capacity}</div><div class="l">${esc(L.statCapacity)}</div></div>
      <div class="spec"><div class="n">${detail.stats.beds}</div><div class="l">${esc(L.statBeds)}</div></div>
      <div class="spec"><div class="n">${esc(detail.neighbourhood?.name ?? detail.city.name)}</div><div class="l">${esc(L.statNeighbourhood)}</div></div>
    </div>`;

  const gallerySection = `
<section style="padding-bottom:0">
  <div class="wrap">
    ${galleryHtml}
    ${specstrip}
  </div>
</section>`;

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

  return (
    hero +
    gallerySection +
    buildingSection +
    apartmentsSection +
    amenitiesSection +
    faqSection +
    bookband
  );
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
  };

  return (
    <div className="mk" data-page="building">
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLE }} />
      <div dangerouslySetInnerHTML={{ __html: bodyHtml(detail, apartments, locale, L, AL) }} />
    </div>
  );
}
