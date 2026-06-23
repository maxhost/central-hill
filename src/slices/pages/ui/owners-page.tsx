import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { MediaImageData } from "@core/media";
import type { Locale } from "@core/db/columns";
import { getOwnersPage, type OwnersContent } from "../contract";
import { FaqSection } from "./components/faq-section";
import { OwnerStatsCounter } from "./components/owner-stats-counter";
import { TestimonialsRow } from "./components/testimonials-row";

// Image fallbacks = the approved mock photos, used 1:1 until a real R2 asset is set in the
// backoffice (the seeded `*_media_id`s have no uploaded asset yet → resolved media is absent).
const HERO_FALLBACK_IMG =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1900&q=72";
const HERO_FALLBACK_ALT = "Bright, designer-furnished Lisbon apartment interior";

// Escape admin-authored content before it is interpolated into the static body HTML string.
// `esc` is for text nodes; `escAttr` also neutralises the attribute quote.
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s: string) => esc(s).replace(/"/g, "&quot;");

/**
 * Owners page — a focused conversion landing embedded 1:1 inside the live app shell.
 * The mock's body markup is rendered verbatim; its page styles are scoped under `.mk`
 * (see `src/app/mock.css` for the shared design system) so nothing leaks to Home/admin.
 * The static body is split around one shared React island — the testimonials marquee — which
 * is the only piece that reads the DB (via the testimonials contract, like the home).
 *
 * Sections (owner direction): hero + earnings form, the animated "numbers" band, then the
 * full marketing flow — why / services / plans (up to 4 tiers) / journey / technology /
 * testimonials / faq — and the closing CTA. Per owner request the per-section *eyebrow* labels
 * were dropped (the big section titles stay); the "★ Earn +25%" badge sits inside the form card
 * (highlighted); the `why` section uses the home's Editorial-Split layout; `services`
 * ("Everything Handled") and `dashboard` ("Always in Sight") use the home's Image-Showcase layout
 * (4 benefit highlights + CTA beside a 4:5 image with a floating badge) — `dashboard` mirrored
 * with the image on the left; the `testimonials` section is the shared <TestimonialsRow> marquee
 * (the home "Partners & Guests" carousel), rendered outside `.mk` to avoid style leak. Marketing
 * sections are mirrored in the owners schema (editor-ready, drizzle 0005→0007). (The static body
 * content is still markup for now; wiring it to the DB + leads action is a follow-up.)
 */

const OWNERS_STYLE = `
.mk [id]{scroll-margin-top:130px}
.mk .owner-hero .wrap{display:grid;grid-template-columns:1.05fr .95fr;gap:48px;align-items:end}
.mk .owner-hero .hero-copy{max-width:34ch}
.mk .est-card{background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:34px 32px 30px;box-shadow:0 30px 60px -30px rgba(0,0,0,.5)}
.mk .est-card .earn-badge{display:inline-flex;align-items:center;gap:.5em;background:var(--accent);color:#fff;font-size:13px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;padding:9px 18px;border-radius:30px;margin-bottom:16px;box-shadow:0 10px 24px -10px color-mix(in srgb,var(--accent) 75%,transparent)}
.mk .est-card h3{font-size:26px;margin-bottom:8px}
.mk .est-card .est-sub{font-size:14px;color:var(--ink-soft);margin-bottom:22px}
.mk .est-field{margin-bottom:16px}
.mk .est-field label{display:block;font-size:12px;letter-spacing:.04em;font-weight:600;color:var(--ink);margin-bottom:7px}
.mk .est-field input,.mk .est-field select{width:100%;font-family:var(--sans);font-size:15px;color:var(--ink);background:var(--bg);border:1px solid var(--line);border-radius:4px;padding:13px 14px;transition:.2s var(--ease)}
.mk .est-field input:focus,.mk .est-field select:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 18%,transparent)}
.mk .est-two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.mk .est-card .btn{width:100%;justify-content:center;margin-top:6px}
.mk .est-note{text-align:center;font-size:12.5px;color:var(--ink);font-weight:500;margin-top:14px}
.mk .owner-pitch .wrap{display:grid;grid-template-columns:.9fr 1.1fr;gap:64px;align-items:start}
.mk .owner-pitch .pitch-text{position:sticky;top:120px}
.mk .owner-pitch .pitch-sub{margin-top:18px;font-size:18px;line-height:1.6;color:var(--ink-soft)}
.mk .owner-pitch .pitch-cta{margin-top:28px;display:flex;flex-wrap:wrap;gap:14px}
.mk .owner-pitch .pitch-note{margin-top:14px;font-size:14px;color:var(--ink-soft)}
.mk .owner-pitch .pitch-list{list-style:none;margin:0;padding:0;border-top:1px solid var(--line)}
.mk .owner-pitch .pitch-list li{display:flex;gap:20px;padding:24px 0;border-bottom:1px solid var(--line)}
.mk .owner-pitch .pitch-list .ic{width:28px;height:28px;flex:0 0 auto;margin-top:2px;color:var(--accent-deep)}
.mk .owner-pitch .pitch-list h3{font-size:19px;margin:0 0 6px}
.mk .owner-pitch .pitch-list p{font-size:15px;line-height:1.6;color:var(--ink-soft);margin:0}
.mk .owner-showcase .wrap{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center}
.mk .owner-showcase .sh-text h2{font-size:clamp(28px,3.4vw,44px);line-height:1.12;margin:0;color:var(--ink)}
.mk .owner-showcase .sh-sub{margin-top:18px;font-size:18px;line-height:1.6;color:var(--ink-soft)}
.mk .owner-showcase .sh-list{list-style:none;margin:32px 0 0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:22px 32px}
.mk .owner-showcase .sh-list li{display:flex;gap:14px}
.mk .owner-showcase .sh-list .ic{width:26px;height:26px;flex:0 0 auto;margin-top:2px;color:var(--accent-deep)}
.mk .owner-showcase .sh-list h3{font-size:17px;margin:0 0 5px;color:var(--ink)}
.mk .owner-showcase .sh-list p{font-size:14px;line-height:1.55;color:var(--ink-soft);margin:0}
.mk .owner-showcase .sh-cta{margin-top:36px}
.mk .owner-showcase .sh-note{margin-top:14px;font-size:14px;color:var(--ink-soft)}
.mk .owner-showcase .sh-media{position:relative}
.mk .owner-showcase .sh-media img{aspect-ratio:4/5;width:100%;object-fit:cover;border-radius:3px;display:block}
.mk .owner-showcase .sh-badge{position:absolute;bottom:-20px;left:-16px;display:flex;align-items:flex-start;gap:10px;max-width:15rem;background:var(--surface);border:1px solid var(--line);border-radius:3px;padding:16px 20px;box-shadow:0 24px 50px -20px rgba(0,0,0,.4)}
.mk .owner-showcase .sh-badge .ic{width:20px;height:20px;flex:0 0 auto;margin-top:1px;color:var(--accent-deep)}
.mk .owner-showcase .sh-badge span{font-size:14px;line-height:1.4;color:var(--ink)}
.mk .owner-showcase.reverse .sh-media{order:-1}
.mk .owner-showcase.reverse .sh-badge{left:auto;right:-16px}
.mk .plans{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;align-items:start}
.mk .plan{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:34px 26px;display:flex;flex-direction:column;position:relative;transition:.3s var(--ease)}
.mk .plan:hover{transform:translateY(-4px);box-shadow:0 24px 50px -30px rgba(0,0,0,.42)}
.mk .plan.popular{border-color:var(--accent);box-shadow:0 24px 54px -28px color-mix(in srgb,var(--accent) 55%,transparent)}
.mk .plan .pop-tag{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:var(--accent);color:#fff;font-size:11px;font-weight:600;letter-spacing:.13em;text-transform:uppercase;padding:6px 16px;border-radius:30px}
.mk .plan .pname{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent-deep);font-weight:600}
.mk .plan .ptag{font-family:var(--serif);font-size:25px;color:var(--ink);margin:10px 0 22px;line-height:1.2}
.mk .plan ul{list-style:none;margin:0 0 28px;flex:1}
.mk .plan li{font-size:14.5px;color:var(--ink-soft);padding:9px 0 9px 28px;position:relative;border-top:1px solid var(--line)}
.mk .plan li:first-child{border-top:0}
.mk .plan li::before{content:"";position:absolute;left:0;top:14px;width:14px;height:8px;border-left:2px solid var(--accent);border-bottom:2px solid var(--accent);transform:rotate(-45deg)}
.mk .plan .btn{width:100%;justify-content:center}
.mk .plan-helpers{margin-top:80px}
.mk .plan-helper{display:flex;align-items:center;justify-content:space-between;gap:40px;background:color-mix(in srgb,var(--accent) 8%,var(--surface));border:1px solid color-mix(in srgb,var(--accent) 35%,var(--line));border-radius:10px;padding:38px 48px;box-shadow:0 26px 56px -34px color-mix(in srgb,var(--accent) 50%,transparent)}
.mk .plan-helper .ph-text{max-width:62ch}
.mk .plan-helper h4{font-family:var(--serif);font-size:25px;font-weight:500;color:var(--ink);margin-bottom:9px}
.mk .plan-helper p{font-size:15px;color:var(--ink-soft);margin:0}
.mk .plan-helper .btn{flex:0 0 auto}
.mk .steps{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:var(--line);border:1px solid var(--line)}
.mk .step{background:var(--surface);padding:36px 28px}
.mk .step .snum{font-family:var(--serif);font-size:46px;line-height:1;color:var(--accent);opacity:.85;margin-bottom:16px}
.mk .step h3{font-size:20px;margin-bottom:9px}
.mk .step p{font-size:14px;color:var(--ink-soft)}
.mk .faq{max-width:820px;margin:0 auto;border-top:1px solid var(--line)}
.mk .faq details{border-bottom:1px solid var(--line)}
.mk .faq summary{list-style:none;cursor:pointer;padding:24px 44px 24px 4px;position:relative;font-family:var(--serif);font-size:20px;color:var(--ink);transition:color .2s}
.mk .faq summary::-webkit-details-marker{display:none}
.mk .faq summary:hover{color:var(--accent-deep)}
.mk .faq summary::after{content:"+";position:absolute;right:6px;top:22px;font-family:var(--sans);font-size:24px;color:var(--accent);transition:transform .25s var(--ease)}
.mk .faq details[open] summary::after{transform:rotate(45deg)}
.mk .faq .faq-a{padding:0 44px 26px 4px;font-size:15.5px;color:var(--ink-soft);max-width:70ch}
@media(max-width:980px){.mk .owner-hero .wrap{grid-template-columns:1fr;gap:34px}.mk .owner-pitch .wrap{grid-template-columns:1fr;gap:36px}.mk .owner-pitch .pitch-text{position:static}.mk .owner-showcase .wrap{grid-template-columns:1fr;gap:36px}.mk .owner-showcase .sh-media,.mk .owner-showcase.reverse .sh-media{order:-1}.mk .owner-showcase .sh-badge{left:0}.mk .owner-showcase.reverse .sh-badge{left:0;right:auto}.mk .plans{grid-template-columns:repeat(2,1fr)}.mk .plan-helper{flex-direction:column;align-items:flex-start;gap:22px;padding:32px 30px}.mk .steps{grid-template-columns:1fr 1fr}}
@media(max-width:680px){.mk .est-two{grid-template-columns:1fr}.mk .owner-showcase .sh-list{grid-template-columns:1fr}.mk .plans{grid-template-columns:1fr}.mk .steps{grid-template-columns:1fr}}
`;

const SERVICES_FALLBACK_IMG =
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=72";
const SERVICES_FALLBACK_ALT = "Designer-furnished Lisbon apartment, guest-ready";
const DASHBOARD_FALLBACK_IMG =
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=72";
const DASHBOARD_FALLBACK_ALT = "Owner dashboard showing live revenue and occupancy";

// Bespoke per-benefit icons from the locked design — positional (paired by index with the
// fixed-count benefit lists). Only the benefit *text* is data-driven; the SVGs never change.
const WHY_ICONS = [
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20H4V4"/><path d="M4 16.5L12 9L15 12L19.5 7.5"/></svg>`,
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6.74534 4H17.3132C17.3132 4 16.4326 17.2571 12.0293 17.2571C9.87826 17.2571 8.56786 14.0935 7.79011 10.8571C6.97574 7.46844 6.74534 4 6.74534 4Z"/><path d="M17.3132 4C17.3132 4 18.2344 3.01733 19 2.99999C20.5 2.96603 20.7773 4 20.7773 4C21.0709 4.60953 21.3057 6.19429 19.8967 7.65715C18.4876 9.12 16.9103 10.4 16.2684 10.8571"/><path d="M6.74527 4.00001C6.74527 4.00001 5.78547 3.00614 4.99995 3.00001C3.49995 2.9883 3.22264 4.00001 3.22264 4.00001C2.92908 4.60953 2.69424 6.19429 4.1033 7.65715C5.51235 9.12001 7.14823 10.4 7.79004 10.8572"/><path d="M8.50662 20C8.50662 18.1714 12.0292 17.2571 12.0292 17.2571C12.0292 17.2571 15.5519 18.1714 15.5519 20H8.50662Z"/></svg>`,
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8.4C18 6.70261 17.3679 5.07475 16.2426 3.87452C15.1174 2.67428 13.5913 2 12 2C10.4087 2 8.88258 2.67428 7.75736 3.87452C6.63214 5.07475 6 6.70261 6 8.4C6 15.8667 3 18 3 18H21C21 18 18 15.8667 18 8.4Z"/><path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"/></svg>`,
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 20V19C5 15.134 8.13401 12 12 12C15.866 12 19 15.134 19 19V20"/><path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z"/></svg>`,
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10C20 14.4183 12 22 12 22C12 22 4 14.4183 4 10C4 5.58172 7.58172 2 12 2C16.4183 2 20 5.58172 20 10Z"/><path d="M12 11C12.5523 11 13 10.5523 13 10C13 9.44772 12.5523 9 12 9C11.4477 9 11 9.44772 11 10C11 10.5523 11.4477 11 12 11Z" fill="currentColor"/></svg>`,
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 17L21 21"/><path d="M3 11C3 15.4183 6.58172 19 11 19C13.213 19 15.2161 18.1015 16.6644 16.6493C18.1077 15.2022 19 13.2053 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11Z"/></svg>`,
];
const SERVICES_ICONS = [
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="14" rx="2"/><circle cx="12" cy="13" r="4"/><path d="M8 6l1.5-2h5L16 6"/></svg>`,
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>`,
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19 6l-2 2-4-4 2-2a2.8 2.8 0 0 1 4 4z" transform="translate(-3 0)"/><path d="M3 21l9-9M5 14l5 5"/></svg>`,
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5-5 4 4 8-9"/><path d="M21 7v5h-5"/></svg>`,
];
const DASHBOARD_ICONS = [
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M14.5 9.5a2.5 2 0 0 0-2.5-1.5c-1.4 0-2.5.8-2.5 2s1.1 2 2.5 2 2.5.9 2.5 2-1.1 2-2.5 2a2.5 2 0 0 1-2.5-1.5"/></svg>`,
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 9h18M8 2v4M16 2v4M8 14h3M8 17h6"/></svg>`,
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg>`,
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/></svg>`,
];

/** Render a benefit list (`<li>` = positional SVG + title/description), pairing each item with
 * its design icon by index. Used by the `why` / `services` / `dashboard` sections. */
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
 * Top body sections (hero → technology), all wired to the owners `page_content` row while
 * preserving the locked design markup/CSS/SVGs verbatim. The bespoke per-benefit SVGs and the
 * decorative "★" badge / "→" CTA glyphs are design — only text/images/labels come from
 * `content`. In-page CTAs keep their design anchors (`#worth` form, `#start` contact); the
 * schema's CTA `url` isn't used for these. The form *fields* (address / properties / bedrooms)
 * stay fixed in code (they map to `lead.kind='earnings_estimate'`). Plan `commission` is held
 * in the schema but intentionally not shown (the locked design has no commission display).
 */
function ownersBodyTop(content: OwnersContent, media: Record<string, MediaImageData>): string {
  const { hero, earnings_form: form, stats, why, services, plans, journey, dashboard } = content;
  const heroImg = media[hero.image_media_id]?.url || HERO_FALLBACK_IMG;
  const heroAlt = media[hero.image_media_id]?.alt || HERO_FALLBACK_ALT;
  const servicesImg = media[services.image_media_id ?? ""]?.url || SERVICES_FALLBACK_IMG;
  const servicesAlt = media[services.image_media_id ?? ""]?.alt || SERVICES_FALLBACK_ALT;
  const dashboardImg = media[dashboard.image_media_id ?? ""]?.url || DASHBOARD_FALLBACK_IMG;
  const dashboardAlt = media[dashboard.image_media_id ?? ""]?.alt || DASHBOARD_FALLBACK_ALT;

  return `
<section id="worth" class="hero compact owner-hero" style="padding:0">
  <img src="${escAttr(heroImg)}" alt="${escAttr(heroAlt)}">
  <div class="wrap">
    <div class="hero-copy">
      <h1>${esc(hero.headline)}</h1>
      <p>${esc(hero.copy)}</p>
    </div>

    <form class="est-card reveal" onsubmit="return false">
      ${form.badge ? `<span class="earn-badge">★ ${esc(form.badge)}</span>` : ""}
      <h3>${esc(form.headline)}</h3>
      ${form.subheadline ? `<p class="est-sub">${esc(form.subheadline)}</p>` : ""}
      <div class="est-field">
        <label for="addr">Property Address</label>
        <input id="addr" type="text" placeholder="Street, neighbourhood, city" autocomplete="off">
      </div>
      <div class="est-two">
        <div class="est-field">
          <label for="nprop">Nº of Properties</label>
          <select id="nprop">
            <option>1</option><option>2</option><option>3</option><option>4</option><option>5+</option>
          </select>
        </div>
        <div class="est-field">
          <label for="nbed">Nº of Bedrooms</label>
          <select id="nbed">
            <option>Studio</option><option>1</option><option>2</option><option>3</option><option>4+</option>
          </select>
        </div>
      </div>
      <a class="btn btn-accent" href="#">${esc(form.cta_label)} →</a>
      ${form.note ? `<p class="est-note">${esc(form.note)}</p>` : ""}
    </form>
  </div>
</section>

<div id="numbers" class="stats">
  <div class="wrap stats-grid">${stats
    .map((s) => {
      const num = s.group ? Number(s.to).toLocaleString("en-US") : s.to;
      const display = `${s.prefix ?? ""}${num}${s.suffix ?? ""}`;
      return `
    <div class="stat"><div class="num" data-count data-to="${escAttr(s.to)}"${s.prefix ? ` data-prefix="${escAttr(s.prefix)}"` : ""} data-suffix="${escAttr(s.suffix ?? "")}"${s.group ? ` data-group="true"` : ""}>${esc(display)}</div><div class="lbl">${esc(s.label)}</div></div>`;
    })
    .join("")}
  </div>
</div>

<section id="why" class="owner-pitch">
  <div class="wrap">
    <div class="pitch-text">
      <h2 class="section-title">${esc(why.headline)}</h2>
      ${why.subheadline ? `<p class="pitch-sub">${esc(why.subheadline)}</p>` : ""}
      <div class="pitch-cta">
        <a class="btn btn-accent" href="#worth">${esc(why.cta_primary.label)} →</a>
        <a class="btn btn-ghost" href="#start">${esc(why.cta_secondary.label)}</a>
      </div>
      ${why.cta_primary.note ? `<p class="pitch-note">${esc(why.cta_primary.note)}</p>` : ""}
    </div>
    <ul class="pitch-list">${benefitList(why.benefits, WHY_ICONS)}
    </ul>
  </div>
</section>

<section id="services" class="alt owner-showcase">
  <div class="wrap">
    <div class="sh-text reveal">
      <h2>${esc(services.headline)}</h2>
      ${services.subheadline ? `<p class="sh-sub">${esc(services.subheadline)}</p>` : ""}
      <ul class="sh-list">${benefitList(services.benefits, SERVICES_ICONS)}
      </ul>
      <div class="sh-cta"><a class="btn btn-accent" href="#worth">${esc(services.cta.label)} →</a></div>
      ${services.cta.note ? `<p class="sh-note">${esc(services.cta.note)}</p>` : ""}
    </div>
    <div class="sh-media reveal">
      <img src="${escAttr(servicesImg)}" alt="${escAttr(servicesAlt)}">
      <div class="sh-badge">
        <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
        <span>Every detail handled — you stay free.</span>
      </div>
    </div>
  </div>
</section>

<section id="plans">
  <div class="wrap">
    <div class="sec-head center reveal">
      <h2 class="section-title">${esc(plans.headline)}</h2>
      ${plans.subheadline ? `<p class="lede" style="margin:16px auto 0">${esc(plans.subheadline)}</p>` : ""}
    </div>

    <div class="plans reveal">${plans.tiers
      .map(
        (t) => `
      <div class="plan${t.is_popular ? " popular" : ""}">
        ${t.is_popular ? `<span class="pop-tag">Most Popular</span>` : ""}
        <div class="pname">${esc(t.name)}</div>
        ${t.tag ? `<div class="ptag">${esc(t.tag)}</div>` : ""}
        <ul>${t.features.map((f) => `\n          <li>${esc(f)}</li>`).join("")}
        </ul>
        <a class="btn ${t.is_popular ? "btn-accent" : "btn-ghost"}" href="#">Choose ${esc(t.name)}</a>
      </div>`,
      )
      .join("")}
    </div>

    <div class="plan-helpers reveal">${plans.helpers
      .map(
        (h) => `
      <div class="plan-helper">
        <div class="ph-text">
          <h4>${esc(h.title)}</h4>
          <p>${esc(h.copy)}</p>
        </div>
        ${h.cta ? `<a class="btn btn-accent" href="#">${esc(h.cta.label)} →</a>` : ""}
      </div>`,
      )
      .join("")}
    </div>
  </div>
</section>

<section id="journey" class="alt">
  <div class="wrap">
    <div class="sec-head center reveal">
      <h2 class="section-title">${esc(journey.headline)}</h2>
      ${journey.subheadline ? `<p class="lede" style="margin:16px auto 0">${esc(journey.subheadline)}</p>` : ""}
    </div>
    <div class="steps reveal">${journey.steps
      .map(
        (s, i) => `
      <div class="step">
        <div class="snum">${String(i + 1).padStart(2, "0")}</div>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.description)}</p>
      </div>`,
      )
      .join("")}
    </div>
  </div>
</section>

<section id="technology" class="owner-showcase reverse">
  <div class="wrap">
    <div class="sh-text reveal">
      <h2>${esc(dashboard.headline)}</h2>
      ${dashboard.subheadline ? `<p class="sh-sub">${esc(dashboard.subheadline)}</p>` : ""}
      <ul class="sh-list">${benefitList(dashboard.benefits, DASHBOARD_ICONS)}
      </ul>
      <div class="sh-cta"><a class="btn btn-accent" href="#worth">${esc(dashboard.cta.label)} →</a></div>
      ${dashboard.cta.note ? `<p class="sh-note">${esc(dashboard.cta.note)}</p>` : ""}
    </div>
    <div class="sh-media reveal">
      <img src="${escAttr(dashboardImg)}" alt="${escAttr(dashboardAlt)}">
      <div class="sh-badge">
        <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
        <span>Real-time data, from anywhere.</span>
      </div>
    </div>
  </div>
</section>

`;
}

// The "What our owners say" testimonials AND the FAQ are rendered by shared React islands
// (TestimonialsRow + FaqSection) outside the `.mk` wrapper, so the static body is split here:
// top sections above the carousel, only the closing CTA below it. The FAQ is now editable —
// its group is chosen per page via `faq_group_key` (see OwnersPage below).
const OWNERS_BODY_BOTTOM = `
<section id="start" class="stats" style="padding:var(--section-y) 0">
  <div class="wrap" style="text-align:center;max-width:760px">
    <span class="eyebrow" style="color:var(--feature-accent)">Start Earning More Today</span>
    <h2 class="section-title" style="color:#fff;margin-top:14px">Ready to Make Your Property Work for You?</h2>
    <p style="color:var(--on-feature-soft);font-size:18px;margin:18px auto 0;max-width:60ch">Join the growing number of property owners across Portugal who trust Central Hill Apartments to deliver exceptional results. Start with a free, no-obligation profitability analysis.</p>
    <div style="margin-top:34px">
      <a class="btn btn-accent" href="#worth">Get Your Free Earnings Estimate →</a>
    </div>
    <p style="color:var(--on-feature-soft);font-size:14px;letter-spacing:.03em;margin-top:26px">
      Call +351 910 075 725 &nbsp;·&nbsp; info@centralhill.pt &nbsp;·&nbsp; WhatsApp +351 910 075 725
    </p>
  </div>
</section>
`;

export async function OwnersPage({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const [page, t] = await Promise.all([getOwnersPage(locale), getTranslations("pages")]);
  if (!page) notFound();

  const { content, media } = page;
  const faqGroupKey = content.faq_group_key ?? "";

  return (
    <>
      <div className="mk" data-page="owners">
        <style dangerouslySetInnerHTML={{ __html: OWNERS_STYLE }} />
        <OwnerStatsCounter />
        <div dangerouslySetInnerHTML={{ __html: ownersBodyTop(content, media) }} />
      </div>
      {/*
       * Shared testimonials marquee + FAQ accordion (same components/visuals as the home
       * "Partners & Guests" carousel and the marketing FAQ). Rendered OUTSIDE the `.mk` wrapper
       * so `mock.css`'s bare-element rules don't leak into their Tailwind markup. Each wrapper
       * carries the `#…` anchor + scroll offset the header's Owners section menu links to. The
       * FAQ group is editable per page (`faq_group_key`); blank/empty → nothing renders.
       */}
      <div id="testimonials" style={{ scrollMarginTop: 130 }}>
        <TestimonialsRow locale={locale} showEyebrow={false} />
      </div>
      {faqGroupKey ? (
        <div id="faq" style={{ scrollMarginTop: 130 }}>
          <FaqSection
            locale={locale}
            groupKey={faqGroupKey}
            eyebrow={t("faqEyebrow")}
            title={t("owners.faqTitle")}
          />
        </div>
      ) : null}
      <div className="mk" data-page="owners">
        <div dangerouslySetInnerHTML={{ __html: OWNERS_BODY_BOTTOM }} />
      </div>
    </>
  );
}
