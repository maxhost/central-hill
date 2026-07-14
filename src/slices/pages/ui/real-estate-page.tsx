import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { MediaImageData } from "@core/media";
import type { Locale } from "@core/db/columns";
import { getRealEstatePage, type RealEstateContent } from "../contract";
import {
  defaultCapabilities,
  defaultDealStructures,
  defaultProcess,
  defaultTrackRecord,
} from "../schemas/real-estate";
import { FaqSection } from "./components/faq-section";
import { OwnerStatsCounter } from "./components/owner-stats-counter";

/**
 * Real Estate page — the approved `mock/real-estate.html` embedded 1:1 inside the live app
 * shell. The mock's body markup is rendered verbatim; its page styles are scoped under `.mk`
 * (see `src/app/mock.css` for the shared design system) so nothing leaks to Home/admin.
 * The **hero** and the **partners** section ("Built for Institutional Partners") are wired to
 * the `real_estate` `page_content` row (text/images/CTA labels come from the DB, resolved for
 * the locale); the remaining sections are still the static mock layout. The real
 * header/footer + i18n come from the app layout. The Iconoir CDN stylesheet (used by the
 * mock's `<i class="iconoir-… ico">` glyphs) is imported inside this page's scoped `<style>`.
 *
 * The "Performance You Can Measure" tiles count up on scroll-in via the shared
 * `OwnerStatsCounter` island (it animates any `.mk [data-count]` figure). The "How it works"
 * section ("A Structured Path…") uses the same Editorial-Split layout as the partners section
 * (`partner-pitch`), with the step numbers as the hairline-list markers.
 *
 * Follow-up: the "Submit Partnership Enquiry" form is the mock's static markup (onsubmit
 * disabled, no action wired). Wiring it to the leads slice's deal-enquiry action is a
 * separate task. Organisation-detail fields are `required`; the Asset Details and Additional
 * Information sections are optional and collapsed into `<details>` accordions to shorten the
 * form. The mock's reveal-on-scroll JS isn't loaded, so `.reveal` is neutralised in mock.css
 * and all content renders immediately.
 */

// Image fallbacks = the approved mock photo, used 1:1 until a real R2 asset is set in the
// backoffice (the seeded `*_media_id` has no uploaded asset yet → resolved media is absent).
const HERO_FALLBACK_IMG =
  "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&w=1900&q=70";
const HERO_FALLBACK_ALT = "Aerial view of Lisbon's historic skyline and tiled rooftops at dusk";
const ASSET_FALLBACK_IMG =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=72";
const ASSET_FALLBACK_ALT = "Designer-furnished managed apartment in a Lisbon building";
const CAP_FALLBACK_IMG =
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=72";
const CAP_FALLBACK_ALT = "Central Hill's management team reviewing portfolio performance dashboards";

// Escape admin-authored content before it is interpolated into the static body HTML string.
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s: string) => esc(s).replace(/"/g, "&quot;");

// Positional per-partner icons from the locked design — paired by index with the fixed
// four-item benefit list (funds / developers / operators / corporate). Only the benefit
// *text* is data-driven; the SVGs never change (mirrors the Owners `why` section).
const PARTNER_ICONS = [
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V10M19 21V10M9 21V10M15 21V10"/><path d="M3 10l9-6 9 6"/><path d="M3 10h18"/></svg>`,
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21l3-9 8 8-9 3-2-2z"/><path d="M14 12l6-6"/><path d="M18 2l4 4-3 3-4-4 3-3z"/></svg>`,
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M4 21V7l8-4v18"/><path d="M12 21V9l8 3v9"/><path d="M7 9h2M7 13h2M16 14h1"/></svg>`,
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 13.5L21 3"/><path d="M21 3l-6 18-3.5-7.5L4 10l17-7z"/></svg>`,
];

// Positional per-capability icons (digital excellence / operational mastery / strategic
// partnership), paired by index with the fixed three-item capabilities showcase list.
// Only the text is data-driven.
const CAPABILITY_ICONS = [
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l3-4 3 2 4-6"/><path d="M17 7h2v2"/></svg>`,
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 14l2 2 4-4"/><path d="M20.5 8.5L13 1 4 5v6c0 5 3.5 8.5 9 11 5.5-2.5 9-6 9-11"/></svg>`,
];

// Positional per-asset-type icons (residential / hotels / apart-hotels / corporate /
// development / portfolio), paired by index with the fixed six-item asset showcase list.
// Only the text is data-driven.
const ASSET_ICONS = [
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/></svg>`,
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16"/><path d="M15 9h2a2 2 0 0 1 2 2v10"/><path d="M8 7h2M8 11h2M8 15h2"/></svg>`,
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V8l5-3v16"/><path d="M10 21V11l5 2v8"/><path d="M15 21v-6l4 2v4"/></svg>`,
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1"/><path d="M16 5.5a3 3 0 0 1 0 5.5"/><path d="M19 20v-1a5 5 0 0 0-3-4.5"/></svg>`,
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l1-4L15 6l3 3L8 19l-4 1z"/><path d="M13.5 7.5l3 3"/></svg>`,
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>`,
];

/** Render the Why-Portugal bento (SECTION 6) from the DB-driven `market` content: a tall
 * feature card with a three-stat strip + two paragraphs, beside a regulatory cell and an
 * investment-thesis bullet list. All values are admin-authored and escaped. */
function marketSection(market: RealEstateContent["market"]): string {
  const stats = market.stats
    .map(
      (s) =>
        `<div class="stat"><div class="sv">${esc(s.value)}</div><span class="sl">${esc(s.label)}</span></div>`,
    )
    .join("");
  const fundamentals = market.fundamentals.body.map((p) => `<p>${esc(p)}</p>`).join("");
  const thesis = market.thesis.points.map((p) => `<li>${esc(p)}</li>`).join("");

  return `
<!-- SECTION 6 — WHY PORTUGAL (dynamic bento, DB-driven) -->
<section id="market">
  <div class="wrap">
    <div class="sec-head reveal">
      <h2 class="section-title">${esc(market.headline)}</h2>
      ${market.subheadline ? `<p class="lede" style="margin-top:16px">${esc(market.subheadline)}</p>` : ""}
    </div>
    <div class="market-bento reveal">
      <div class="mcell feature">
        <h3>${esc(market.fundamentals.title)}</h3>
        <div class="stat-row">${stats}</div>
        ${fundamentals}
      </div>
      <div class="mcell">
        <h3>${esc(market.regulatory.title)}</h3>
        <p>${esc(market.regulatory.body)}</p>
      </div>
      <div class="mcell">
        <h3>${esc(market.thesis.title)}</h3>
        <ul class="thesis">${thesis}</ul>
      </div>
    </div>
  </div>
</section>
`;
}

/** Render the "Deal Structures" partnership-model cards (SECTION 5) from the DB-driven
 * `deal_structures` content: a centered section head, a three-card grid (each card = name +
 * tagline + bullet list, optionally highlighted with a `feature_label` badge), and an
 * optional disclaimer note. All values are admin-authored and escaped. */
function dealStructuresSection(d: RealEstateContent["deal_structures"]): string {
  const cards = d.models
    .map((m) => {
      const points = m.points.map((p) => `<li>${esc(p)}</li>`).join("");
      const badge =
        m.featured && m.feature_label ? `<span class="feat-tag">${esc(m.feature_label)}</span>` : "";
      return `
      <div class="model${m.featured ? " featured" : ""}">
        ${badge}
        <h3>${esc(m.name)}</h3>
        <div class="mtag">${esc(m.tagline)}</div>
        <ul>${points}</ul>
      </div>`;
    })
    .join("");

  return `
<!-- SECTION 5 — PARTNERSHIP MODELS (DB-driven) -->
<section class="alt" id="deal-structures">
  <div class="wrap">
    <div class="sec-head center reveal">
      <h2 class="section-title">${esc(d.headline)}</h2>
      ${d.subheadline ? `<p class="lede" style="margin:16px auto 0">${esc(d.subheadline)}</p>` : ""}
    </div>
    <div class="models reveal">${cards}
    </div>
    ${d.note ? `<p class="model-note">${esc(d.note)}</p>` : ""}
  </div>
</section>
`;
}

/** Build the count-up animation attributes for a track-record figure from its displayed
 * string: the numeric core becomes `data-to`, any leading non-digits become `data-prefix`,
 * the trailing remainder becomes `data-suffix`, and a thousands comma sets `data-group`.
 * "85%+" → `data-to="85" data-suffix="%+"`; "+25%" → `data-to="25" data-prefix="+"
 * data-suffix="%"`. Returns "" when there is no number (the figure then renders static).
 * The `OwnerStatsCounter` island reads these and snaps to the exact text when it settles. */
function countAttrs(value: string): string {
  const m = value.match(/^(\D*)([\d.,]+)(.*)$/);
  const num = m?.[2];
  if (!num) return "";
  const prefix = m?.[1] ?? "";
  const suffix = m?.[3] ?? "";
  const to = num.replace(/[.,]/g, "");
  if (!to) return "";
  return [
    `data-count data-to="${escAttr(to)}"`,
    prefix ? ` data-prefix="${escAttr(prefix)}"` : "",
    suffix ? ` data-suffix="${escAttr(suffix)}"` : "",
    num.includes(",") ? ` data-group="true"` : "",
  ].join("");
}

/** Render the "Performance You Can Measure" track-record tiles (SECTION 7) from the DB-driven
 * `track_record` content. Each tile counts up on scroll-in via the shared `OwnerStatsCounter`
 * island. All values are admin-authored and escaped. */
function trackRecordSection(t: RealEstateContent["track_record"]): string {
  const tiles = t.tiles
    .map((tile) => {
      const attrs = countAttrs(tile.value);
      return `      <div class="tile"><div class="tval"${attrs ? ` ${attrs}` : ""}>${esc(tile.value)}</div><div class="tlbl">${esc(tile.label)}</div>${tile.caption ? `<div class="tcap">${esc(tile.caption)}</div>` : ""}</div>`;
    })
    .join("\n");

  return `
<!-- SECTION 7 — TRACK RECORD (DB-driven) -->
<section class="alt" id="track-record">
  <div class="wrap">
    <div class="sec-head reveal">
      <h2 class="section-title">${esc(t.headline)}</h2>
      ${t.subheadline ? `<p class="lede" style="margin-top:16px">${esc(t.subheadline)}</p>` : ""}
    </div>
    <div class="tiles reveal">
${tiles}
    </div>
  </div>
</section>
`;
}

/** Render the "How it works" onboarding steps (SECTION 8) from the DB-driven `process`
 * content. Reuses the partners Editorial-Split shell (`partner-pitch process-split`); each
 * step's number (01, 02, …) is positional — derived from order, not stored — so only the
 * title/description are data-driven. The single accent CTA anchors to the enquiry form. All
 * values are admin-authored and escaped. */
function processSection(p: RealEstateContent["process"]): string {
  const steps = p.steps
    .map(
      (s, i) => `
      <li>
        <span class="snum">${String(i + 1).padStart(2, "0")}</span>
        <div><h3>${esc(s.title)}</h3><p>${esc(s.description)}</p></div>
      </li>`,
    )
    .join("");

  return `
<!-- SECTION 8 — HOW IT WORKS (Editorial Split, mirrors "Built for Institutional Partners", DB-driven) -->
<section id="process" class="partner-pitch process-split">
  <div class="wrap">
    <div class="pitch-text reveal">
      <h2 class="section-title">${esc(p.headline)}</h2>
      ${p.subheadline ? `<p class="pitch-sub">${esc(p.subheadline)}</p>` : ""}
      <div class="pitch-cta">
        <a class="btn btn-accent" href="#deal-enquiry">${esc(p.cta.label)} →</a>
      </div>
    </div>
    <ul class="pitch-list reveal">${steps}
    </ul>
  </div>
</section>
`;
}

/** Render the partners benefit list (`<li>` = positional SVG + title/description), pairing
 * each item with its design icon by index. */
function benefitList(
  items: ReadonlyArray<{ title: string; description: string }>,
  icons: readonly string[],
): string {
  return items
    .map(
      (b, i) => `
      <li>
        ${icons[i] ?? ""}
        <div><h3>${esc(b.title)}</h3><p>${esc(b.description)}</p></div>
      </li>`,
    )
    .join("");
}

/**
 * Render an Image Showcase section (4:5 photo + headline/subheadline + benefit highlights +
 * CTA). Shared by "Asset Types" (image right, default) and the mirrored "Institutional-Grade
 * Management" (`reverse` → image left). The CTA renders only when it has a label; the floating
 * badge renders only when the CTA carries a note. `classes` lets the caller add layout
 * modifiers (`alt`, `reverse`, `cap-showcase`). All values are admin-authored and escaped.
 */
function showcase(opts: {
  id: string;
  classes: string;
  data: {
    headline: string;
    subheadline?: string;
    benefits: ReadonlyArray<{ title: string; description: string }>;
    cta: { label: string; url: string; note?: string };
  };
  icons: readonly string[];
  img: string;
  imgAlt: string;
}): string {
  const { data } = opts;
  const cta = data.cta.label
    ? `<div class="sh-cta"><a class="btn btn-accent" href="#deal-enquiry">${esc(data.cta.label)} →</a></div>
      ${data.cta.note ? `<p class="sh-note">${esc(data.cta.note)}</p>` : ""}`
    : "";
  const badge = data.cta.note
    ? `<div class="sh-badge">
        <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
        <span>${esc(data.cta.note)}</span>
      </div>`
    : "";
  return `
<section id="${opts.id}" class="${opts.classes}">
  <div class="wrap">
    <div class="sh-text reveal">
      <h2>${esc(data.headline)}</h2>
      ${data.subheadline ? `<p class="sh-sub">${esc(data.subheadline)}</p>` : ""}
      <ul class="sh-list">${benefitList(data.benefits, opts.icons)}
      </ul>
      ${cta}
    </div>
    <div class="sh-media reveal">
      <img src="${escAttr(opts.img)}" alt="${escAttr(opts.imgAlt)}">
      ${badge}
    </div>
  </div>
</section>
`;
}

const PAGE_STYLE = `
@import url("https://cdn.jsdelivr.net/npm/iconoir/css/iconoir.css");

/* Hero: vertically centre the text/CTAs (the base mock anchors them to the bottom,
   which read too low here) and strengthen the dark overlay over the photo so the
   white copy stays legible — matching the Buildings index treatment. Scoped to this
   page only via the [data-page] hook. */
.mk[data-page="real-estate"] .hero{align-items:center}
.mk[data-page="real-estate"] .hero .wrap{padding-top:40px;padding-bottom:40px}
.mk[data-page="real-estate"] .hero::after{background:linear-gradient(180deg,rgba(18,16,13,.5) 0%,rgba(18,16,13,.4) 45%,rgba(18,16,13,.82) 100%)}

.mk .ico{font-size:30px;line-height:1;color:var(--accent-deep);display:inline-block;margin-bottom:18px}

/* partners — Editorial Split (sticky title + CTAs beside a hairline benefit list),
   mirroring the Owners "why" section. */
.mk .partner-pitch .wrap{display:grid;grid-template-columns:.9fr 1.1fr;gap:64px;align-items:start}
.mk .partner-pitch .pitch-text{position:sticky;top:120px}
.mk .partner-pitch .pitch-sub{margin-top:18px;font-size:18px;line-height:1.6;color:var(--ink-soft)}
.mk .partner-pitch .pitch-cta{margin-top:28px;display:flex;flex-wrap:wrap;gap:14px}
.mk .partner-pitch .pitch-note{margin-top:14px;font-size:14px;color:var(--ink-soft)}
.mk .partner-pitch .pitch-list{list-style:none;margin:0;padding:0;border-top:1px solid var(--line)}
.mk .partner-pitch .pitch-list li{display:flex;gap:20px;padding:24px 0;border-bottom:1px solid var(--line)}
.mk .partner-pitch .pitch-list .ic{width:28px;height:28px;flex:0 0 auto;margin-top:2px;color:var(--accent-deep)}
.mk .partner-pitch .pitch-list h3{font-size:19px;margin:0 0 6px}
.mk .partner-pitch .pitch-list p{font-size:15px;line-height:1.6;color:var(--ink-soft);margin:0}
/* "How it works" reuses the Editorial-Split shell; the step number is the list marker. */
.mk .process-split .pitch-list .snum{flex:0 0 auto;width:44px;font-family:var(--serif);font-size:30px;line-height:1;color:var(--accent);opacity:.9;margin-top:-2px}

/* asset types — Image Showcase (4:5 image + 4 benefit highlights + CTA badge),
   mirroring the home guests-pitch / owners services layout. */
.mk .asset-showcase .wrap{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center}
.mk .asset-showcase .sh-text h2{font-size:clamp(28px,3.4vw,44px);line-height:1.12;margin:0;color:var(--ink)}
.mk .asset-showcase .sh-sub{margin-top:18px;font-size:18px;line-height:1.6;color:var(--ink-soft)}
.mk .asset-showcase .sh-list{list-style:none;margin:32px 0 0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:22px 32px}
.mk .asset-showcase .sh-list li{display:flex;gap:14px}
.mk .asset-showcase .sh-list .ic{width:26px;height:26px;flex:0 0 auto;margin-top:2px;color:var(--accent-deep)}
.mk .asset-showcase .sh-list h3{font-size:17px;margin:0 0 5px;color:var(--ink)}
.mk .asset-showcase .sh-list p{font-size:14px;line-height:1.55;color:var(--ink-soft);margin:0}
.mk .asset-showcase .sh-cta{margin-top:36px}
.mk .asset-showcase .sh-note{margin-top:14px;font-size:14px;color:var(--ink-soft)}
.mk .asset-showcase .sh-media{position:relative}
.mk .asset-showcase .sh-media img{aspect-ratio:4/5;width:100%;object-fit:cover;border-radius:3px;display:block}
.mk .asset-showcase .sh-badge{position:absolute;bottom:-20px;left:-16px;display:flex;align-items:flex-start;gap:10px;max-width:15rem;background:var(--surface);border:1px solid var(--line);border-radius:3px;padding:16px 20px;box-shadow:0 24px 50px -20px rgba(0,0,0,.4)}
.mk .asset-showcase .sh-badge .ic{width:20px;height:20px;flex:0 0 auto;margin-top:1px;color:var(--accent-deep)}
.mk .asset-showcase .sh-badge span{font-size:14px;line-height:1.4;color:var(--ink)}
/* mirrored showcase — image on the LEFT (used by "Institutional-Grade Management"). The
   media column is reordered to the front on desktop; the floating badge mirrors to the
   right edge so it still overhangs into the text gap. On mobile the base rule already
   stacks the media on top, so reverse changes nothing there. */
.mk .asset-showcase.reverse .sh-media{order:-1}
.mk .asset-showcase.reverse .sh-badge{left:auto;right:-16px}
/* capabilities: three longer highlights read better as a single column. */
.mk .cap-showcase .sh-list{grid-template-columns:1fr;gap:18px 0}
.mk .cap-showcase .sh-list p{font-size:14.5px}

/* partnership-model cards */
.mk .models{display:grid;grid-template-columns:repeat(3,1fr);gap:26px;align-items:start}
.mk .model{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:38px 32px;display:flex;flex-direction:column;position:relative;transition:.3s var(--ease)}
.mk .model:hover{transform:translateY(-4px);box-shadow:0 24px 50px -30px rgba(0,0,0,.42)}
.mk .model.featured{border-color:var(--accent);box-shadow:0 24px 54px -28px color-mix(in srgb,var(--accent) 55%,transparent)}
.mk .model .feat-tag{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:var(--accent);color:#fff;font-size:11px;font-weight:600;letter-spacing:.13em;text-transform:uppercase;padding:6px 16px;border-radius:30px}
.mk .model h3{font-size:26px;margin-bottom:6px}
.mk .model .mtag{font-size:13.5px;letter-spacing:.04em;color:var(--accent-deep);font-weight:600;text-transform:uppercase;margin-bottom:22px}
.mk .model ul{list-style:none;margin:0;flex:1}
.mk .model li{font-size:14.5px;color:var(--ink-soft);padding:11px 0 11px 28px;position:relative;border-top:1px solid var(--line)}
.mk .model li:first-child{border-top:0}
.mk .model li::before{content:"";position:absolute;left:0;top:16px;width:14px;height:8px;border-left:2px solid var(--accent);border-bottom:2px solid var(--accent);transform:rotate(-45deg)}
.mk .model-note{margin-top:34px;font-size:13.5px;color:var(--ink-soft);text-align:center;max-width:80ch;margin-left:auto;margin-right:auto}

/* why portugal — dynamic asymmetric bento (tall feature stat card + two supporting
   cells), all hover-reactive. Replaces the former flat 2x2 why-grid. */
.mk #market .market-bento{display:grid;grid-template-columns:1.5fr 1fr;gap:18px;margin-top:8px}
.mk #market .mcell{position:relative;overflow:hidden;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:38px 36px;transition:transform .38s var(--ease),box-shadow .38s var(--ease),border-color .38s var(--ease)}
.mk #market .mcell::before{content:"";position:absolute;top:0;left:0;height:3px;width:0;background:var(--accent);transition:width .45s var(--ease)}
.mk #market .mcell:hover{transform:translateY(-5px);box-shadow:0 28px 56px -32px rgba(0,0,0,.42);border-color:color-mix(in srgb,var(--accent) 38%,var(--line))}
.mk #market .mcell:hover::before{width:100%}
.mk #market .mcell h3{font-size:22px;margin-bottom:14px}
.mk #market .mcell p{font-size:15px;color:var(--ink-soft);line-height:1.7;margin-bottom:14px}
.mk #market .mcell p:last-child{margin-bottom:0}
.mk #market .feature{grid-row:span 2;display:flex;flex-direction:column}
.mk #market .stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:8px;overflow:hidden;margin-bottom:30px}
.mk #market .stat{background:var(--surface);padding:22px 16px;text-align:center;transition:background .3s var(--ease)}
.mk #market .stat:hover{background:color-mix(in srgb,var(--accent) 7%,var(--surface))}
.mk #market .stat .sv{font-family:var(--serif);font-size:clamp(28px,3.2vw,38px);line-height:1;color:var(--accent);font-weight:500}
.mk #market .stat .sl{display:block;margin-top:9px;font-size:12.5px;color:var(--ink-soft);line-height:1.4}
.mk #market .fig{color:var(--accent-deep);font-weight:600}
.mk #market .thesis{list-style:none;margin:0}
.mk #market .thesis li{font-size:14.5px;color:var(--ink-soft);padding:10px 0 10px 28px;position:relative;border-top:1px solid var(--line);transition:color .25s var(--ease),padding-left .25s var(--ease)}
.mk #market .thesis li:first-child{border-top:0}
.mk #market .thesis li:hover{color:var(--ink);padding-left:32px}
.mk #market .thesis li::before{content:"";position:absolute;left:0;top:15px;width:14px;height:8px;border-left:2px solid var(--accent);border-bottom:2px solid var(--accent);transform:rotate(-45deg)}

/* track-record stat tiles */
.mk .tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line);border:1px solid var(--line)}
.mk .tile{background:var(--surface);padding:40px 34px;text-align:center}
.mk .tile .tval{font-family:var(--serif);font-size:clamp(42px,5vw,58px);line-height:1;color:var(--accent);font-weight:500}
.mk .tile .tlbl{font-size:13px;letter-spacing:.04em;font-weight:600;color:var(--ink);margin:14px 0 6px;text-transform:uppercase}
.mk .tile .tcap{font-size:13.5px;color:var(--ink-soft)}

/* numbered process steps */
.mk .steps{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:var(--line);border:1px solid var(--line)}
.mk .step{background:var(--surface);padding:36px 28px}
.mk .step .snum{font-family:var(--serif);font-size:46px;line-height:1;color:var(--accent);opacity:.85;margin-bottom:16px}
.mk .step h3{font-size:19px;margin-bottom:9px}
.mk .step p{font-size:14px;color:var(--ink-soft)}

/* FAQ accordions */
.mk .faq{max-width:820px;margin:0 auto;border-top:1px solid var(--line)}
.mk .faq details{border-bottom:1px solid var(--line)}
.mk .faq summary{list-style:none;cursor:pointer;padding:24px 44px 24px 4px;position:relative;font-family:var(--serif);font-size:20px;color:var(--ink);transition:color .2s}
.mk .faq summary::-webkit-details-marker{display:none}
.mk .faq summary:hover{color:var(--accent-deep)}
.mk .faq summary::after{content:"+";position:absolute;right:6px;top:22px;font-family:var(--sans);font-size:24px;color:var(--accent);transition:transform .25s var(--ease)}
.mk .faq details[open] summary::after{transform:rotate(45deg)}
.mk .faq .faq-a{padding:0 44px 26px 4px;font-size:15.5px;color:var(--ink-soft);max-width:70ch}

/* deal-enquiry form */
.mk .enquiry{display:grid;grid-template-columns:.85fr 1.15fr;gap:56px;align-items:start}
.mk .enquiry-intro h2{font-size:clamp(30px,3.6vw,46px)}
.mk .enquiry-intro .lede{margin-top:18px}
.mk .contact-direct{margin-top:34px;border-top:1px solid var(--line);padding-top:26px;font-size:14.5px;color:var(--ink-soft);line-height:1.9}
.mk .contact-direct b{display:block;color:var(--ink);font-size:12px;letter-spacing:.14em;text-transform:uppercase;margin-bottom:10px}
.mk .contact-direct a{color:var(--accent-deep);font-weight:600}
.mk .form-card{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:38px 36px 34px;box-shadow:0 30px 60px -34px rgba(0,0,0,.45)}
.mk .fgroup{margin-bottom:30px}
.mk .fgroup-title{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent-deep);font-weight:600;margin-bottom:18px;padding-bottom:10px;border-bottom:1px solid var(--line)}
.mk .ffield{margin-bottom:16px}
.mk .ffield label{display:block;font-size:12.5px;letter-spacing:.03em;font-weight:600;color:var(--ink);margin-bottom:7px}
.mk .ffield input,.mk .ffield select,.mk .ffield textarea{width:100%;font-family:var(--sans);font-size:15px;color:var(--ink);background:var(--bg);border:1px solid var(--line);border-radius:4px;padding:13px 14px;transition:.2s var(--ease)}
.mk .ffield textarea{resize:vertical;min-height:110px}
.mk .ffield input:focus,.mk .ffield select:focus,.mk .ffield textarea:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 18%,transparent)}
.mk .ftwo{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.mk .form-card .btn{width:100%;justify-content:center;margin-top:6px}
.mk .form-note{text-align:center;font-size:12.5px;color:var(--ink-soft);margin-top:14px}
/* required-field marker + the "Required" tag on the Organisation Details group */
.mk .ffield label .req{color:var(--accent);margin-left:1px}
.mk .fgroup-tag{margin-left:8px;font-size:10px;letter-spacing:.1em;color:var(--accent-deep);background:color-mix(in srgb,var(--accent) 12%,transparent);border-radius:30px;padding:3px 9px;vertical-align:middle}
/* collapsible optional sections (Asset Details / Additional Information) */
.mk .facc{margin-bottom:16px;border:1px solid var(--line);border-radius:6px;background:var(--bg);overflow:hidden}
.mk .facc>summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:10px;padding:16px 18px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-weight:600;color:var(--accent-deep)}
.mk .facc>summary::-webkit-details-marker{display:none}
.mk .facc>summary .facc-hint{margin-left:auto;font-size:11px;letter-spacing:.04em;text-transform:none;color:var(--ink-soft);font-weight:500}
.mk .facc>summary::after{content:"+";font-family:var(--sans);font-size:20px;line-height:1;color:var(--accent);transition:transform .25s var(--ease)}
.mk .facc[open]>summary::after{transform:rotate(45deg)}
.mk .facc[open]>summary{border-bottom:1px solid var(--line)}
.mk .facc .facc-body{padding:22px 18px 8px}

@media(max-width:980px){
  .mk .partner-pitch .wrap{grid-template-columns:1fr;gap:36px}
  .mk .partner-pitch .pitch-text{position:static}
  .mk .asset-showcase .wrap{grid-template-columns:1fr;gap:36px}
  .mk .asset-showcase .sh-media{order:-1}
  .mk .models{grid-template-columns:1fr}
  .mk #market .market-bento{grid-template-columns:1fr}
  .mk #market .feature{grid-row:auto}
  .mk .tiles{grid-template-columns:1fr 1fr}
  .mk .steps{grid-template-columns:1fr 1fr}
  .mk .enquiry{grid-template-columns:1fr;gap:34px}
}
@media(max-width:680px){
  .mk .asset-showcase .sh-list{grid-template-columns:1fr}
  .mk #market .stat-row{grid-template-columns:1fr}
  .mk .tiles,.mk .steps,.mk .ftwo{grid-template-columns:1fr}
}
`;

// The institutional FAQ (former SECTION 9) is now a shared, editable <FaqSection> island chosen
// per page via `faq_group_key`, rendered between the process steps and the deal-enquiry form
// (outside `.mk` so its Tailwind markup doesn't pick up mock.css bare-element rules). The static
// body is split here around that island.
function bodyTop(content: RealEstateContent, media: Record<string, MediaImageData>): string {
  const { hero, partners, asset_management: assets, market } = content;
  // `capabilities` is newer than the original seed — fall back to the approved default copy
  // so a `real_estate` row authored before this section existed still renders correctly.
  const capabilities = content.capabilities ?? defaultCapabilities;
  const dealStructures = content.deal_structures ?? defaultDealStructures;
  const trackRecord = content.track_record ?? defaultTrackRecord;
  const process = content.process ?? defaultProcess;
  const heroImg = media[hero.image_media_id]?.url || HERO_FALLBACK_IMG;
  const heroAlt = media[hero.image_media_id]?.alt || HERO_FALLBACK_ALT;
  // Optional capability-statement asset behind the hero's secondary CTA (e.g. a PDF). If
  // no asset is set, the button keeps the design's in-page anchor.
  const capStmtUrl = media[hero.capability_statement_media_id ?? ""]?.url || "#deal-enquiry";
  const assetImg = media[assets.image_media_id ?? ""]?.url || ASSET_FALLBACK_IMG;
  const assetAlt = media[assets.image_media_id ?? ""]?.alt || ASSET_FALLBACK_ALT;
  const capImg = media[capabilities.image_media_id ?? ""]?.url || CAP_FALLBACK_IMG;
  const capAlt = media[capabilities.image_media_id ?? ""]?.alt || CAP_FALLBACK_ALT;

  return `
<!-- SECTION 1 — HERO -->
<section class="hero compact" id="top">
  <img src="${escAttr(heroImg)}" alt="${escAttr(heroAlt)}">
  <div class="wrap">
    ${hero.subheadline ? `<div class="eyebrow">${esc(hero.subheadline)}</div>` : ""}
    <h1>${esc(hero.headline)}</h1>
    <p>${esc(hero.positioning)}</p>
    <div class="hero-cta">
      <a class="btn btn-accent" href="#deal-enquiry">${esc(hero.cta_primary.label)} →</a>
      <a class="btn btn-light" href="${escAttr(capStmtUrl)}">${esc(hero.cta_secondary.label)} →</a>
    </div>
  </div>
</section>

<!-- positioning statement band -->
<section class="alt" style="padding:48px 0">
  <div class="wrap">
    <p class="lede reveal" style="max-width:78ch;font-size:19px">We bring together AI-driven pricing technology, deep operational expertise, and a proven track record in Portugal's most competitive rental markets to deliver measurable, institutional-grade performance — at any scale.</p>
  </div>
</section>

<!-- SECTION 2 — WHO WE WORK WITH (Editorial Split, DB-driven) -->
<section id="partners" class="partner-pitch">
  <div class="wrap">
    <div class="pitch-text reveal">
      <h2 class="section-title">${esc(partners.headline)}</h2>
      ${partners.subheadline ? `<p class="pitch-sub">${esc(partners.subheadline)}</p>` : ""}
      <div class="pitch-cta">
        <a class="btn btn-accent" href="#deal-enquiry">${esc(partners.cta_primary.label)} →</a>
        <a class="btn btn-ghost" href="#deal-structures">${esc(partners.cta_secondary.label)}</a>
      </div>
      ${partners.cta_primary.note ? `<p class="pitch-note">${esc(partners.cta_primary.note)}</p>` : ""}
    </div>
    <ul class="pitch-list reveal">${benefitList(partners.benefits, PARTNER_ICONS)}
    </ul>
  </div>
</section>

<!-- SECTION 3 — INSTITUTIONAL-GRADE MANAGEMENT (Image Showcase, MIRRORED, DB-driven) -->
${showcase({
  id: "capabilities",
  classes: "alt asset-showcase reverse cap-showcase",
  data: capabilities,
  icons: CAPABILITY_ICONS,
  img: capImg,
  imgAlt: capAlt,
})}
<!-- SECTION 4 — ASSET TYPES (Image Showcase, DB-driven) -->
${showcase({
  id: "manage",
  classes: "asset-showcase",
  data: assets,
  icons: ASSET_ICONS,
  img: assetImg,
  imgAlt: assetAlt,
})}

${dealStructuresSection(dealStructures)}
${marketSection(market)}
${trackRecordSection(trackRecord)}
${processSection(process)}
`;
}

const BODY_BOTTOM = `
<!-- SECTION 10 — DEAL ENQUIRY -->
<section id="deal-enquiry">
  <div class="wrap">
    <div class="enquiry">
      <div class="enquiry-intro reveal">
        <h2>Ready to Explore a Partnership?</h2>
        <p class="lede">Whether you represent an investment fund, a development company, a large property operator, or a corporate seeking managed accommodation — we want to hear from you. Complete the enquiry form below and one of our senior team will respond within 24 hours.</p>
        <div class="contact-direct">
          <b>Contact Our Institutional Team Directly</b>
          Email: <a href="mailto:realestate@centralhillapartments.com">realestate@centralhillapartments.com</a><br>
          Tel: <a href="tel:+351910075725">+351 910 075 725</a><br>
          LinkedIn: <a href="#">Central Hill Apartments</a>
        </div>
      </div>

      <form class="form-card reveal" onsubmit="return false">
        <div class="fgroup">
          <div class="fgroup-title">Organisation Details <span class="fgroup-tag">Required</span></div>
          <div class="ffield">
            <label for="company">Company / Fund Name <span class="req" aria-hidden="true">*</span></label>
            <input id="company" name="company" type="text" placeholder="Your organisation" required>
          </div>
          <div class="ffield">
            <label for="contact">Contact Name &amp; Title <span class="req" aria-hidden="true">*</span></label>
            <input id="contact" name="contact" type="text" placeholder="Name, role" required>
          </div>
          <div class="ftwo">
            <div class="ffield">
              <label for="email">Email Address <span class="req" aria-hidden="true">*</span></label>
              <input id="email" name="email" type="email" placeholder="name@company.com" required>
            </div>
            <div class="ffield">
              <label for="phone">Phone Number <span class="req" aria-hidden="true">*</span></label>
              <input id="phone" name="phone" type="tel" placeholder="+351 …" required>
            </div>
          </div>
          <div class="ffield">
            <label for="country">Country / Jurisdiction <span class="req" aria-hidden="true">*</span></label>
            <input id="country" name="country" type="text" placeholder="e.g. Portugal, United Kingdom" required>
          </div>
        </div>

        <details class="facc">
          <summary class="facc-summary">Asset Details <span class="facc-hint">Optional</span></summary>
          <div class="facc-body">
            <div class="ffield">
              <label for="asset-type">Type of Asset</label>
              <select id="asset-type" name="asset-type">
                <option value="" selected disabled>Select asset type…</option>
                <option>Apartments</option>
                <option>Apart-hotel</option>
                <option>Hotel</option>
                <option>Mixed</option>
                <option>Corporate housing</option>
              </select>
            </div>
            <div class="ftwo">
              <div class="ffield">
                <label for="units">Number of Units or Keys</label>
                <input id="units" name="units" type="text" placeholder="e.g. 24">
              </div>
              <div class="ffield">
                <label for="locations">Location(s) in Portugal</label>
                <input id="locations" name="locations" type="text" placeholder="e.g. Lisbon, Porto">
              </div>
            </div>
            <div class="ffield">
              <label for="status">Current Status</label>
              <select id="status" name="status">
                <option value="" selected disabled>Select current status…</option>
                <option>Operating</option>
                <option>In development</option>
                <option>Acquisition phase</option>
              </select>
            </div>
            <div class="ftwo">
              <div class="ffield">
                <label for="model">Target Partnership Model</label>
                <select id="model" name="model">
                  <option value="" selected disabled>Select model…</option>
                  <option>Fixed rent</option>
                  <option>Management commission</option>
                  <option>Hybrid</option>
                  <option>Open to discussion</option>
                </select>
              </div>
              <div class="ffield">
                <label for="timeline">Anticipated Start Date / Timeline</label>
                <input id="timeline" name="timeline" type="text" placeholder="e.g. Q3 2026">
              </div>
            </div>
          </div>
        </details>

        <details class="facc">
          <summary class="facc-summary">Additional Information <span class="facc-hint">Optional</span></summary>
          <div class="facc-body">
            <div class="ffield">
              <label for="notes">Tell us more about your asset and what you are looking to achieve</label>
              <textarea id="notes" name="notes" placeholder="Your goals, asset details, any specific requirements…"></textarea>
            </div>
          </div>
        </details>

        <button class="btn btn-accent" type="submit">Submit Partnership Enquiry →</button>
        <p class="form-note">A senior member of our institutional team will respond within 24 hours.</p>
      </form>
    </div>
  </div>
</section>
`;

export async function RealEstatePage({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const [page, t] = await Promise.all([getRealEstatePage(locale), getTranslations("pages")]);
  if (!page) notFound();

  const { content, media } = page;
  const faqGroupKey = content.faq_group_key ?? "";

  return (
    <>
      <div className="mk" data-page="real-estate">
        <style dangerouslySetInnerHTML={{ __html: PAGE_STYLE }} />
        <div dangerouslySetInnerHTML={{ __html: bodyTop(content, media) }} />
      </div>
      {faqGroupKey ? (
        <div id="faq" style={{ scrollMarginTop: 130 }}>
          <FaqSection
            locale={locale}
            groupKey={faqGroupKey}
            eyebrow={t("faqEyebrow")}
            title={t("realEstate.faqTitle")}
          />
        </div>
      ) : null}
      <div className="mk" data-page="real-estate">
        <div dangerouslySetInnerHTML={{ __html: BODY_BOTTOM }} />
      </div>
      {/* Counts up the "Performance You Can Measure" tiles ([data-count]) on scroll-in. */}
      <OwnerStatsCounter />
    </>
  );
}
