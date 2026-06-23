import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { MediaImageData } from "@core/media";
import type { Locale } from "@core/db/columns";
import { getRealEstatePage, type RealEstateContent } from "../contract";
import { FaqSection } from "./components/faq-section";

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
 * Follow-up: the "Submit Partnership Enquiry" form is the mock's static markup (onsubmit
 * disabled, no action wired). Wiring it to the leads slice's deal-enquiry action is a
 * separate task. The mock's reveal-on-scroll JS isn't loaded, so `.reveal` is neutralised in
 * mock.css and all content renders immediately.
 */

// Image fallbacks = the approved mock photo, used 1:1 until a real R2 asset is set in the
// backoffice (the seeded `*_media_id` has no uploaded asset yet → resolved media is absent).
const HERO_FALLBACK_IMG =
  "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&w=1900&q=70";
const HERO_FALLBACK_ALT = "Aerial view of Lisbon's historic skyline and tiled rooftops at dusk";
const ASSET_FALLBACK_IMG =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=72";
const ASSET_FALLBACK_ALT = "Designer-furnished managed apartment in a Lisbon building";

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

// Positional per-asset-type icons (residential / hotels / corporate / portfolio), paired by
// index with the fixed four-item asset showcase list. Only the text is data-driven.
const ASSET_ICONS = [
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/></svg>`,
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16"/><path d="M15 9h2a2 2 0 0 1 2 2v10"/><path d="M8 7h2M8 11h2M8 15h2"/></svg>`,
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1"/><path d="M16 5.5a3 3 0 0 1 0 5.5"/><path d="M19 20v-1a5 5 0 0 0-3-4.5"/></svg>`,
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>`,
];

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

/* why portugal blocks */
.mk .why-grid{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--line);border:1px solid var(--line)}
.mk .why-block{background:var(--surface);padding:40px 36px}
.mk .why-block h3{font-size:22px;margin-bottom:12px}
.mk .why-block p{font-size:15px;color:var(--ink-soft);margin-bottom:14px}
.mk .why-block p:last-child{margin-bottom:0}
.mk .thesis{list-style:none;margin:0}
.mk .thesis li{font-size:14.5px;color:var(--ink-soft);padding:10px 0 10px 28px;position:relative;border-top:1px solid var(--line)}
.mk .thesis li:first-child{border-top:0}
.mk .thesis li::before{content:"";position:absolute;left:0;top:15px;width:14px;height:8px;border-left:2px solid var(--accent);border-bottom:2px solid var(--accent);transform:rotate(-45deg)}

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

@media(max-width:980px){
  .mk .partner-pitch .wrap{grid-template-columns:1fr;gap:36px}
  .mk .partner-pitch .pitch-text{position:static}
  .mk .asset-showcase .wrap{grid-template-columns:1fr;gap:36px}
  .mk .asset-showcase .sh-media{order:-1}
  .mk .models{grid-template-columns:1fr}
  .mk .why-grid{grid-template-columns:1fr}
  .mk .tiles{grid-template-columns:1fr 1fr}
  .mk .steps{grid-template-columns:1fr 1fr}
  .mk .enquiry{grid-template-columns:1fr;gap:34px}
}
@media(max-width:680px){
  .mk .asset-showcase .sh-list{grid-template-columns:1fr}
  .mk .tiles,.mk .steps,.mk .ftwo{grid-template-columns:1fr}
}
`;

// The institutional FAQ (former SECTION 9) is now a shared, editable <FaqSection> island chosen
// per page via `faq_group_key`, rendered between the process steps and the deal-enquiry form
// (outside `.mk` so its Tailwind markup doesn't pick up mock.css bare-element rules). The static
// body is split here around that island.
function bodyTop(content: RealEstateContent, media: Record<string, MediaImageData>): string {
  const { hero, partners, asset_management: assets } = content;
  const heroImg = media[hero.image_media_id]?.url || HERO_FALLBACK_IMG;
  const heroAlt = media[hero.image_media_id]?.alt || HERO_FALLBACK_ALT;
  // Optional capability-statement asset behind the hero's secondary CTA (e.g. a PDF). If
  // no asset is set, the button keeps the design's in-page anchor.
  const capStmtUrl = media[hero.capability_statement_media_id ?? ""]?.url || "#deal-enquiry";
  const assetImg = media[assets.image_media_id ?? ""]?.url || ASSET_FALLBACK_IMG;
  const assetAlt = media[assets.image_media_id ?? ""]?.alt || ASSET_FALLBACK_ALT;

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

<!-- SECTION 3 — WHAT WE OFFER -->
<section class="alt" id="capabilities">
  <div class="wrap">
    <div class="sec-head reveal">
      <h2 class="section-title">Institutional-Grade Management, End to End</h2>
      <p class="lede" style="margin-top:16px">We operate at the intersection of hospitality excellence and real estate performance. Our capabilities cover every dimension of asset management — from technology and distribution to operations and strategic partnership.</p>
    </div>
    <div class="grid-3 reveal">
      <div class="bcard">
        <i class="iconoir-stats-up-square ico" aria-hidden="true"></i>
        <h3>Digital Excellence</h3>
        <p>Multi-platform distribution across Airbnb, Booking.com, and direct channels. AI-powered dynamic pricing updated daily. Automated financial reporting, occupancy analytics, and a real-time performance dashboard accessible by asset managers and fund controllers.</p>
      </div>
      <div class="bcard">
        <i class="iconoir-settings ico" aria-hidden="true"></i>
        <h3>Operational Mastery</h3>
        <p>Professional housekeeping and linen services. 24/7 guest concierge. Premium amenities and quality assurance protocols. Regular property inspections. Rapid-response maintenance with preventive asset protection built into every management contract.</p>
      </div>
      <div class="bcard">
        <i class="iconoir-peace-hand ico" aria-hidden="true"></i>
        <h3>Strategic Partnership</h3>
        <p>Project design consultancy at the planning stage. Dedicated account management throughout the contract term. Performance benchmarking against market comparables. Proactive recommendations for yield improvement and capital expenditure prioritisation.</p>
      </div>
    </div>
  </div>
</section>

<!-- SECTION 4 — ASSET TYPES (Image Showcase, DB-driven) -->
<section id="manage" class="asset-showcase">
  <div class="wrap">
    <div class="sh-text reveal">
      <h2>${esc(assets.headline)}</h2>
      ${assets.subheadline ? `<p class="sh-sub">${esc(assets.subheadline)}</p>` : ""}
      <ul class="sh-list">${benefitList(assets.benefits, ASSET_ICONS)}
      </ul>
      <div class="sh-cta"><a class="btn btn-accent" href="#deal-enquiry">${esc(assets.cta.label)} →</a></div>
      ${assets.cta.note ? `<p class="sh-note">${esc(assets.cta.note)}</p>` : ""}
    </div>
    <div class="sh-media reveal">
      <img src="${escAttr(assetImg)}" alt="${escAttr(assetAlt)}">
      ${
        assets.cta.note
          ? `<div class="sh-badge">
        <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
        <span>${esc(assets.cta.note)}</span>
      </div>`
          : ""
      }
    </div>
  </div>
</section>

<!-- SECTION 5 — PARTNERSHIP MODELS -->
<section class="alt" id="deal-structures">
  <div class="wrap">
    <div class="sec-head center reveal">
      <h2 class="section-title">Deal Structures Built Around Your Risk Profile</h2>
      <p class="lede" style="margin:16px auto 0">We offer three core partnership models designed to align with different investment strategies, risk appetites, and return expectations. All models include full management, technology access, and institutional reporting.</p>
    </div>
    <div class="models reveal">
      <div class="model">
        <h3>Fixed Rent</h3>
        <div class="mtag">Guaranteed income, maximum certainty</div>
        <ul>
          <li>Guaranteed monthly rent regardless of occupancy</li>
          <li>Contract terms: 10–25 years</li>
          <li>Zero revenue variability — full income certainty</li>
          <li>Ideal for funds requiring predictable cash flows</li>
          <li>Asset maintenance obligations shared</li>
          <li>Annual rent review mechanism</li>
          <li>Full operational management by Central Hill</li>
        </ul>
      </div>
      <div class="model featured">
        <span class="feat-tag">Most Flexible</span>
        <h3>Management Commission</h3>
        <div class="mtag">Maximum upside, pure performance</div>
        <ul>
          <li>Revenue-based model: total receipts minus management fee</li>
          <li>Contract terms: 3–25 years</li>
          <li>Owner captures full revenue upside</li>
          <li>Transparent monthly reporting and payouts</li>
          <li>Ideal for operators seeking market-rate returns</li>
          <li>Performance KPIs agreed at contract stage</li>
          <li>Full operational management by Central Hill</li>
        </ul>
      </div>
      <div class="model">
        <h3>Hybrid Model</h3>
        <div class="mtag">Balanced risk and reward</div>
        <ul>
          <li>Guaranteed base rent plus revenue share above threshold</li>
          <li>Contract terms: 10–25 years</li>
          <li>Downside protection with upside participation</li>
          <li>Ideal for funds seeking blended return profiles</li>
          <li>Revenue share trigger agreed at contract stage</li>
          <li>Regular performance review meetings</li>
          <li>Full operational management by Central Hill</li>
        </ul>
      </div>
    </div>
    <p class="model-note">All partnership models are subject to individual asset assessment and negotiation. Contract structures, commission rates, and performance targets are agreed on a case-by-case basis.</p>
  </div>
</section>

<!-- SECTION 6 — WHY PORTUGAL -->
<section id="market">
  <div class="wrap">
    <div class="sec-head reveal">
      <h2 class="section-title">Portugal: One of Europe's Strongest Hospitality Markets</h2>
      <p class="lede" style="margin-top:16px">Portugal consistently ranks among Europe's top-performing short-term rental markets, combining exceptional tourism growth, favourable regulation, strong international demand, and some of the continent's highest yields on residential real estate.</p>
    </div>
    <div class="why-grid reveal">
      <div class="why-block">
        <h3>Market Fundamentals</h3>
        <p>Portugal welcomed over <strong>30 million tourists</strong> in 2024, with Lisbon and Porto ranking among the most visited cities in Southern Europe. International arrivals continue to grow year-on-year, driven by leisure, remote working, and corporate relocation demand.</p>
        <p>Short-term rental yields in Lisbon's prime locations consistently outperform traditional residential letting by <strong>20–40%</strong>, with average occupancy rates above <strong>75%</strong> in managed, professionally operated properties.</p>
      </div>
      <div class="why-block">
        <h3>Regulatory Environment</h3>
        <p>Portugal's Alojamento Local framework provides a clear, stable regulatory structure for short-term rental operations. Central Hill's regulatory compliance team manages all licensing, tax registration, and reporting obligations on behalf of our partners.</p>
      </div>
      <div class="why-block">
        <h3>Why Lisbon Specifically</h3>
        <p>Lisbon is one of Europe's fastest-growing luxury travel destinations and a leading hub for corporate relocation, technology companies, and international organisations establishing European bases. The city's combination of climate, culture, infrastructure, and relative affordability continues to attract high-value, long-stay demand.</p>
      </div>
      <div class="why-block">
        <h3>Investment Thesis</h3>
        <ul class="thesis">
          <li>Strong and growing tourism demand year-round</li>
          <li>Corporate relocation and mid-term rental demand rising</li>
          <li>Prime residential yields 20–40% above long-term letting</li>
          <li>Stable regulatory framework with clear compliance path</li>
          <li>Undersupply of professionally managed, institutional-grade stock</li>
          <li>Lisbon positioned as a tier-1 European destination</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<!-- SECTION 7 — TRACK RECORD -->
<section class="alt" id="track-record">
  <div class="wrap">
    <div class="sec-head reveal">
      <h2 class="section-title">Performance You Can Measure</h2>
      <p class="lede" style="margin-top:16px">Our track record is built on consistent, data-driven results across a growing portfolio of managed assets. We report transparently, benchmark rigorously, and continuously optimise performance for every asset under management.</p>
    </div>
    <div class="tiles reveal">
      <div class="tile"><div class="tval">85%+</div><div class="tlbl">Average Occupancy</div><div class="tcap">Across all managed properties year-round</div></div>
      <div class="tile"><div class="tval">+25%</div><div class="tlbl">Revenue Premium</div><div class="tcap">Vs. traditional residential letting</div></div>
      <div class="tile"><div class="tval">24/7</div><div class="tlbl">Operational Coverage</div><div class="tcap">Guest support, reporting, and management</div></div>
      <div class="tile"><div class="tval">10+</div><div class="tlbl">Years of Experience</div><div class="tcap">Managing assets in Portugal's prime markets</div></div>
      <div class="tile"><div class="tval">14+</div><div class="tlbl">Buildings Managed</div><div class="tcap">Across Lisbon's most in-demand locations</div></div>
      <div class="tile"><div class="tval">100%</div><div class="tlbl">Transparent Reporting</div><div class="tcap">Real-time dashboard access for all partners</div></div>
    </div>
  </div>
</section>

<!-- SECTION 8 — HOW IT WORKS -->
<section id="process">
  <div class="wrap">
    <div class="sec-head reveal">
      <h2 class="section-title">A Structured Path from First Conversation to Full Performance</h2>
      <p class="lede" style="margin-top:16px">Our onboarding process is designed for institutional partners. Every step is documented, timeline-driven, and managed by a dedicated account team.</p>
    </div>
    <div class="steps reveal">
      <div class="step">
        <div class="snum">01</div>
        <h3>Asset Assessment &amp; Commercial Proposal</h3>
        <p>We conduct a detailed assessment of your asset — location, unit mix, current performance, and market positioning — and present a tailored commercial proposal including projected yield, recommended partnership model, and contract terms.</p>
      </div>
      <div class="step">
        <div class="snum">02</div>
        <h3>Due Diligence &amp; Contract Negotiation</h3>
        <p>Our legal and commercial team works with your advisors to structure and finalise the management agreement. All performance KPIs, reporting cadence, revenue share triggers, and exit terms are agreed and documented.</p>
      </div>
      <div class="step">
        <div class="snum">03</div>
        <h3>Operational Onboarding</h3>
        <p>We handle all elements of the operational setup: professional photography, platform registration and listing creation, pricing strategy implementation, staff assignment, and property preparation — typically completed within 10–15 business days.</p>
      </div>
      <div class="step">
        <div class="snum">04</div>
        <h3>Asset Goes Live</h3>
        <p>Your property launches across all distribution channels simultaneously. AI-powered pricing begins optimising daily rates from day one. Your account manager is active and reporting from the first booking.</p>
      </div>
      <div class="step">
        <div class="snum">05</div>
        <h3>Ongoing Management &amp; Reporting</h3>
        <p>Monthly performance reports delivered to your agreed format. Quarterly review meetings with your account manager. Continuous yield optimisation and strategic recommendations as market conditions evolve.</p>
      </div>
    </div>
  </div>
</section>

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
          <div class="fgroup-title">Organisation Details</div>
          <div class="ffield">
            <label for="company">Company / Fund Name</label>
            <input id="company" name="company" type="text" placeholder="Your organisation">
          </div>
          <div class="ffield">
            <label for="contact">Contact Name &amp; Title</label>
            <input id="contact" name="contact" type="text" placeholder="Name, role">
          </div>
          <div class="ftwo">
            <div class="ffield">
              <label for="email">Email Address</label>
              <input id="email" name="email" type="email" placeholder="name@company.com">
            </div>
            <div class="ffield">
              <label for="phone">Phone Number</label>
              <input id="phone" name="phone" type="tel" placeholder="+351 …">
            </div>
          </div>
          <div class="ffield">
            <label for="country">Country / Jurisdiction</label>
            <input id="country" name="country" type="text" placeholder="e.g. Portugal, United Kingdom">
          </div>
        </div>

        <div class="fgroup">
          <div class="fgroup-title">Asset Details</div>
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

        <div class="fgroup">
          <div class="fgroup-title">Additional Information</div>
          <div class="ffield">
            <label for="notes">Tell us more about your asset and what you are looking to achieve</label>
            <textarea id="notes" name="notes" placeholder="Your goals, asset details, any specific requirements…"></textarea>
          </div>
        </div>

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
    </>
  );
}
