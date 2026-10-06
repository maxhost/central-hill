import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { MediaImage } from "@core/media";
import type { Locale } from "@core/db/columns";
import {
  ButtonLink,
  ChecklistCards,
  EditorialSplit,
  Hero,
  Reveal,
  StatBento,
  StatTiles,
  TwoColumnShowcase,
} from "@core/ui";
import { getRealEstatePage, type RealEstateContent } from "../contract";
import {
  defaultCapabilities,
  defaultDealStructures,
  defaultProcess,
  defaultTrackRecord,
} from "../schemas/real-estate";
import { DealEnquirySection } from "./components/deal-enquiry-section";
import { FaqSection } from "./components/faq-section";
import { Icon } from "./components/icon";
import { ScrollReveal } from "./components/scroll-reveal";

/**
 * Real Estate page — the approved `mock/real-estate.html` embedded 1:1 inside the live app
 * shell. The mock's body markup is rendered verbatim; its page styles are scoped under `.mk`
 * (see `src/app/mock.css` for the shared design system) so nothing leaks to Home/admin.
 * Every section is wired to the `real_estate` `page_content` row (text/images/CTA labels come
 * from the DB, resolved for the locale), and all of them except "How it works" (`#process`) and
 * the three sec-heads noted below are now real JSX outside `.mk`. The real
 * header/footer + i18n come from the app layout. The Iconoir CDN stylesheet (used by the
 * mock's `<i class="iconoir-… ico">` glyphs) is imported inside this page's scoped `<style>`.
 *
 * The "How it works" section ("A Structured Path…") still uses the raw Editorial-Split CSS the
 * partners section used to have (`partner-pitch`), with the step numbers as the hairline-list
 * markers.
 *
 * The hero (`#top`, SECTION 1) is now real JSX — `core/ui`'s `<Hero compact align="center">`,
 * rendered outside (before) `.mk` — not raw `dangerouslySetInnerHTML` markup. Still DB-driven
 * exactly as before (`hero.subheadline` → eyebrow, `headline` → h1, `positioning` → p, the two
 * CTA labels → `#deal-enquiry` / the capability-statement asset URL), with the hero image as a
 * `MediaImage` (or the fallback `<img>`) background, still the eager/high-priority LCP element.
 * It uses exactly Buildings' listing-hero configuration (centred copy, 1600px/40px wrap, 26ch
 * h1, 60ch p, `.5/.46/.88` scrim, default eyebrow, `ButtonLink` CTAs) for cross-page
 * consistency; its former `.mk[data-page="real-estate"] .hero` overrides are gone.
 *
 * "Built for Institutional Partners" (`#partners`, SECTION 2) is likewise real JSX — `core/ui`'s
 * `EditorialSplit`, rendered outside (before) `.mk` right after the Hero, with exactly Owners'
 * `#why` configuration (`id` on a wrapping div — with this page's 84px scroll margin, headline/body/items,
 * `→`-suffixed primary CTA → `#deal-enquiry`, ghost secondary → `#deal-structures`, note) and
 * its own internal `Reveal`s. Still DB-driven (`partners.headline`/`subheadline`/`benefits`/CTA
 * labels/note); the positional icons are `<Icon>` keys styled like Owners' `why` icons. Cross-page
 * consistency was chosen over this page's 1240px/28px `.wrap`: it takes `EditorialSplit`'s own
 * Section/Container spacing.
 *
 * The "Why Portugal" section (`#market`, `marketSection`'s former home) is now real JSX —
 * `core/ui`'s `StatBento`, wrapped in `Reveal` — not raw `dangerouslySetInnerHTML` markup. Its
 * `sec-head` (title/lede) stays raw mock markup in its own small `.mk[data-page="real-estate"]`
 * wrapper (same convention as the rest of this page). See `StatBento`'s docstring for the full mock-vs-live drift this extraction resolved
 * (`mock/real-estate.html` still shows the old flat `.why-grid`, superseded here by the bento).
 *
 * "Performance You Can Measure" (`#track-record`, SECTION 7) is likewise real JSX — `core/ui`'s
 * `StatTiles` (hairline tile grid, each figure counting up via `CountUp`), wrapped in `Reveal`,
 * with its sec-head kept raw in its own `.mk[data-page="real-estate"]` wrapper, same as
 * `#market`. It replaced the raw `.tiles` markup + the `OwnerStatsCounter` `[data-count]`
 * island (no longer mounted on this page — nothing else here used `[data-count]`).
 *
 * "Deal Structures" (`#deal-structures`, SECTION 5 — the partnership-model cards) is likewise
 * real JSX — `core/ui`'s `ChecklistCards` in `Reveal`, plus its optional disclaimer note as a
 * plain JSX `<p>` — with its centred sec-head kept raw in its own `.mk[data-page="real-estate"]`
 * wrapper.
 *
 * "Institutional-Grade Management" (`#capabilities`, SECTION 3) and "Asset Types" (`#manage`,
 * SECTION 4) are likewise real JSX — `core/ui`'s existing `TwoColumnShowcase` (consistency with
 * Owners over this page's mock), each in `Reveal`, rendered outside `.mk` right after the
 * partners section: `#capabilities` mirrored on the `alt` band exactly like Owners' `#technology`
 * (`imagePosition="left"`), `#manage` with Owners' `#services` configuration. The old
 * `bodyTopA` raw chunk, `showcase()`/`benefitList()` and the `.asset-showcase`/`.cap-showcase`
 * CSS are gone; only an empty `.mk` wrapper carrying `PAGE_STYLE` + `ScrollReveal` remains
 * ahead of them, for the raw sections further down.
 *
 * "Ready to Explore a Partnership?" (`#deal-enquiry`, SECTION 10 — the former `BODY_BOTTOM`) is
 * likewise real JSX — `DealEnquirySection` (`./components/deal-enquiry-section.tsx`), built on
 * `core/ui`'s `EnquirySplit` + form-card primitives, rendered outside `.mk` after the FAQ.
 * Follow-up: that form still submits nothing (`StaticFormCard` cancels the submit, exactly like
 * the mock's `onsubmit="return false"`) and its copy is hardcoded English (not i18n'd, not in
 * `page_content`). Wiring it to the leads slice's deal-enquiry action is a separate task.
 * Organisation-detail fields are `required`; the Asset Details and Additional Information
 * sections are optional and collapsed into `<details>` accordions to shorten the form.
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

// `#capabilities`/`#manage`'s images: one of `TwoColumnShowcase`'s two `lg:` (1024px) columns — the same value
// Owners (`TWO_COL_SHOWCASE_SIZES`) and Home's `guests-section.tsx` use for the same component.
const TWO_COL_SHOWCASE_SIZES = "(max-width: 1024px) 100vw, 560px";

// Escape admin-authored content before it is interpolated into the static body HTML string.
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Positional per-partner icon keys from the locked design — paired by index with the fixed
// four-item benefit list (funds / developers / operators / corporate). Only the benefit
// *text* is data-driven; the glyphs never change. Rendered through the slice's `<Icon>`
// registry (`./components/icon.tsx`), exactly like Owners' `WHY_ICON_KEYS`.
const PARTNER_ICON_KEYS = ["landmark", "trowel", "buildings", "send"] as const;

// Bullet-icon box for both `TwoColumnShowcase` sections (`#capabilities`, `#manage`) — Owners'
// exact `TwoColumnShowcase` bullet-icon config (26px, `mt-0.5`, accent-deep). The glyphs are
// JSX (not SVG strings) since both showcases are real JSX now.
const SHOWCASE_ICON_CLASS = "mt-0.5 h-[26px] w-[26px] flex-none text-accent-deep";
function showcaseIcons(paths: ReadonlyArray<readonly string[]>) {
  return paths.map((ds, i) => (
    <svg
      key={i}
      className={SHOWCASE_ICON_CLASS}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {ds.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  ));
}

// Positional per-capability icons (digital excellence / operational mastery / strategic
// partnership), paired by index with the fixed three-item capabilities showcase list.
// Only the text is data-driven.
const CAPABILITY_ICONS = showcaseIcons([
  ["M3 3v18h18", "M7 15l3-4 3 2 4-6", "M17 7h2v2"],
  [
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  ],
  ["M11 14l2 2 4-4", "M20.5 8.5L13 1 4 5v6c0 5 3.5 8.5 9 11 5.5-2.5 9-6 9-11"],
]);

// Positional per-asset-type icons (residential / hotels / apart-hotels / corporate /
// development / portfolio), paired by index with the fixed six-item asset showcase list.
// Only the text is data-driven.
const ASSET_ICONS = showcaseIcons([
  ["M3 10.5L12 3l9 7.5", "M5 9.5V21h14V9.5", "M10 21v-6h4v6"],
  [
    "M3 21h18",
    "M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16",
    "M15 9h2a2 2 0 0 1 2 2v10",
    "M8 7h2M8 11h2M8 15h2",
  ],
  ["M3 21h18", "M5 21V8l5-3v16", "M10 21V11l5 2v8", "M15 21v-6l4 2v4"],
  [
    "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    "M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1",
    "M16 5.5a3 3 0 0 1 0 5.5",
    "M19 20v-1a5 5 0 0 0-3-4.5",
  ],
  ["M4 20l1-4L15 6l3 3L8 19l-4 1z", "M13.5 7.5l3 3"],
  ["M4 20V10M10 20V4M16 20v-7M22 20H2"],
]);

/** Render just the "Why Portugal" (`#market`) section head — raw mock markup (title + optional
 * lede), still `.mk`-scoped since it reuses mock.css's generic `.sec-head`/`.section-title`/
 * `.lede` rules. The bento below it (SECTION 6's former body) is now `core/ui`'s `StatBento`,
 * real JSX rendered outside `.mk` — see `RealEstatePage`. All values are admin-authored and
 * escaped. */
function marketSecHead(market: RealEstateContent["market"]): string {
  return `
<!-- SECTION 6 — WHY PORTUGAL (sec-head only; the bento is real JSX, see RealEstatePage) -->
<div class="sec-head reveal reveal-io pre-reveal">
  <h2 class="section-title">${esc(market.headline)}</h2>
  ${market.subheadline ? `<p class="lede" style="margin-top:16px">${esc(market.subheadline)}</p>` : ""}
</div>
`;
}

/** Render just the "Deal Structures" (`#deal-structures`, SECTION 5) centred section head —
 * raw mock markup (title + optional lede), still `.mk`-scoped since it reuses mock.css's generic
 * `.sec-head.center`/`.section-title`/`.lede` rules (same treatment as `marketSecHead`). The
 * partnership-model cards are `core/ui`'s `ChecklistCards` and the disclaimer note is plain JSX,
 * both rendered outside `.mk` — see `RealEstatePage`. All values are admin-authored and
 * escaped. */
function dealStructuresSecHead(d: RealEstateContent["deal_structures"]): string {
  return `
<!-- SECTION 5 — PARTNERSHIP MODELS (sec-head only; the cards are real JSX, see RealEstatePage) -->
<div class="sec-head center reveal reveal-io pre-reveal">
  <h2 class="section-title">${esc(d.headline)}</h2>
  ${d.subheadline ? `<p class="lede" style="margin:16px auto 0">${esc(d.subheadline)}</p>` : ""}
</div>
`;
}

/** Render just the "Performance You Can Measure" (`#track-record`, SECTION 7) section head —
 * raw mock markup (title + optional lede), still `.mk`-scoped since it reuses mock.css's generic
 * `.sec-head`/`.section-title`/`.lede` rules (same treatment as `marketSecHead`). The tiles are
 * `core/ui`'s `StatTiles`, real JSX rendered outside `.mk` — see `RealEstatePage`. All values are
 * admin-authored and escaped. */
function trackRecordSecHead(t: RealEstateContent["track_record"]): string {
  return `
<!-- SECTION 7 — TRACK RECORD (sec-head only; the tiles are real JSX, see RealEstatePage) -->
<div class="sec-head reveal reveal-io pre-reveal">
  <h2 class="section-title">${esc(t.headline)}</h2>
  ${t.subheadline ? `<p class="lede" style="margin-top:16px">${esc(t.subheadline)}</p>` : ""}
</div>
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
    <div class="pitch-text reveal reveal-io pre-reveal">
      <h2 class="section-title">${esc(p.headline)}</h2>
      ${p.subheadline ? `<p class="pitch-sub">${esc(p.subheadline)}</p>` : ""}
      <div class="pitch-cta">
        <a class="btn btn-accent" href="#deal-enquiry">${esc(p.cta.label)} →</a>
      </div>
    </div>
    <ul class="pitch-list reveal reveal-io pre-reveal">${steps}
    </ul>
  </div>
</section>
`;
}

const PAGE_STYLE = `
@import url("https://cdn.jsdelivr.net/npm/iconoir/css/iconoir.css");

/* hero — now real JSX (core/ui's Hero, rendered outside .mk before it); it uses
   Buildings' listing-hero configuration, so no hero CSS is left here. */

.mk .ico{font-size:30px;line-height:1;color:var(--accent-deep);display:inline-block;margin-bottom:18px}

/* Editorial Split shell (sticky title + CTAs beside a hairline list), now used only by
   "How it works" (#process, .partner-pitch.process-split). The partners section itself is
   real JSX (core/ui's EditorialSplit, rendered outside .mk) and no longer uses these rules. */
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

/* Image Showcases — "Institutional-Grade Management" (#capabilities) and asset types (#manage)
   are both real JSX now (core/ui's TwoColumnShowcase, outside .mk); no showcase CSS left here. */

/* partnership-model cards — now real JSX (core/ui's ChecklistCards + a JSX note, rendered
   outside .mk); only their centred .sec-head is still raw mock markup, styled by mock.css's
   generic .sec-head/.section-title/.lede rules. */

/* why portugal — the asymmetric bento (tall feature stat card + two supporting cells) is now
   real JSX (core/ui's StatBento, rendered outside .mk); only its .sec-head (title/lede) is
   still raw mock markup, styled by mock.css's generic .sec-head/.section-title/.lede rules
   above — no #market-scoped CSS needed here any more. */

/* track-record stat tiles — now real JSX (core/ui's StatTiles, rendered outside .mk); only
   its .sec-head is still raw mock markup, styled by mock.css's generic rules. */

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

/* deal-enquiry — now real JSX (DealEnquirySection: core/ui's EnquirySplit + form-card
   primitives, rendered outside .mk); no CSS left here. */

@media(max-width:980px){
  .mk .partner-pitch .wrap{grid-template-columns:1fr;gap:36px}
  .mk .partner-pitch .pitch-text{position:static}
  .mk .steps{grid-template-columns:1fr 1fr}
}
@media(max-width:680px){
  .mk .steps{grid-template-columns:1fr}
}

/* Page-wide entrance motion (immediate on load for above-the-fold content, on scroll for
   the rest, via <ScrollReveal page="real-estate">/scroll-reveal.tsx) — same pattern
   already applied to About and Guests. This page's card/bento hover states
   (.mcell, .stat, .thesis li) already existed and are left as-is. The hidden
   state is baked straight into the server-rendered markup (.pre-reveal, applied on the
   elements below) so there's no flash of visible-then-hidden; the <noscript> rule keeps
   content visible with JS off. Scoped to [data-page="real-estate"] so it never touches
   the shared, neutralised .reveal rule in mock.css or any other page. */
.mk[data-page="real-estate"] .reveal-io{transition:opacity .7s var(--ease),transform .7s var(--ease)}
.mk[data-page="real-estate"] .reveal-io.pre-reveal{opacity:0;transform:translateY(18px)}
`;

// The institutional FAQ (former SECTION 9) is now a shared, editable <FaqSection> island chosen
// per page via `faq_group_key`, rendered between the process steps and the deal-enquiry form
// (outside `.mk` so its Tailwind markup doesn't pick up mock.css bare-element rules). Every
// section before it is real JSX now (hero, partners, `#capabilities`, `#manage`, and the
// `#deal-structures`/`#market`/`#track-record` bodies — only their sec-heads are still raw, in
// their own `.mk[data-page="real-estate"]` wrappers); `bodyTopB` is the last raw chunk,
// SECTION 8 (process).
function bodyTopB(content: RealEstateContent): string {
  const process = content.process ?? defaultProcess;
  return `
${processSection(process)}
`;
}

export async function RealEstatePage({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const [page, t] = await Promise.all([getRealEstatePage(locale), getTranslations("pages")]);
  if (!page) notFound();

  const { content, media } = page;
  const faqGroupKey = content.faq_group_key ?? "";
  const market = content.market;
  const trackRecord = content.track_record ?? defaultTrackRecord;
  const dealStructures = content.deal_structures ?? defaultDealStructures;
  const hero = content.hero;
  const heroMedia = media[hero.image_media_id];
  // Optional capability-statement asset behind the hero's secondary CTA (e.g. a PDF). If
  // no asset is set, the button keeps the design's in-page anchor.
  const capStmtUrl = media[hero.capability_statement_media_id ?? ""]?.url || "#deal-enquiry";
  const partners = content.partners;
  const partnerItems = partners.benefits.map((b, i) => ({
    icon: <Icon name={PARTNER_ICON_KEYS[i]} className="mt-0.5 h-7 w-7 flex-none text-accent-deep" />,
    title: b.title,
    description: b.description,
  }));
  // `capabilities` is newer than the original seed — fall back to the approved default copy
  // so a `real_estate` row authored before this section existed still renders correctly.
  const capabilities = content.capabilities ?? defaultCapabilities;
  const capMedia = media[capabilities.image_media_id ?? ""];
  const assets = content.asset_management;
  const assetMedia = media[assets.image_media_id ?? ""];

  return (
    <>
      {/*
       * Hero (`#top`, SECTION 1) — real JSX, `core/ui`'s `<Hero compact align="center">`, with
       * exactly the same configuration as Buildings' listing hero (`buildings-listing.tsx`) so
       * the two heroes are consistent — the user's call over 1:1 fidelity to this page's own
       * mock overrides (`.5/.4/.82` scrim, `#ecdcc2` 600/.18em eyebrow, 1.08 h1 leading, 19px
       * `#f1ece2` lede), which differed from Buildings' by a hair. CTAs are `ButtonLink`
       * primary/light, the same look as Buildings' light hero button.
       */}
      <Hero
        id="top"
        background={
          heroMedia?.url && heroMedia.width > 0 && heroMedia.height > 0 ? (
            <MediaImage
              data={{ ...heroMedia, alt: heroMedia.alt || HERO_FALLBACK_ALT }}
              className="absolute inset-0 -z-10 h-full w-full object-cover"
              sizes="100vw"
              priority // full-bleed hero — the LCP element on this page
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- external TEMP fallback, not an R2 asset
            <img
              src={heroMedia?.url || HERO_FALLBACK_IMG}
              alt={heroMedia?.alt || HERO_FALLBACK_ALT}
              className="absolute inset-0 -z-10 h-full w-full object-cover"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          )
        }
        compact
        align="center"
        overlayClassName="bg-[linear-gradient(180deg,rgba(18,16,13,0.5)_0%,rgba(18,16,13,0.46)_45%,rgba(18,16,13,0.88)_100%)]"
        wrapClassName="mx-auto max-w-[1600px] p-10"
        copyClassName="max-w-none"
        headlineClassName="max-w-[26ch] text-[clamp(2.5rem,5.4vw,4.25rem)]"
        subtitleClassName="mt-5 max-w-[60ch] text-lg"
        actionsClassName="mt-2"
        eyebrow={hero.subheadline || undefined}
        headline={hero.headline}
        subtitle={hero.positioning}
        actions={
          <>
            <ButtonLink href="#deal-enquiry">{`${hero.cta_primary.label} →`}</ButtonLink>
            <ButtonLink href={capStmtUrl} variant="light">
              {`${hero.cta_secondary.label} →`}
            </ButtonLink>
          </>
        }
      />
      {/*
       * "Built for Institutional Partners" (`#partners`, SECTION 2) — `core/ui`'s
       * `EditorialSplit`, configured exactly like Owners' `#why` (same wrapper `id` — but
       * this page's `scroll-mt-[84px]` like its other JSX sections, same props, same `→` on the primary CTA, same icon size/colour)
       * for cross-page consistency, accepting its Container width/spacing over this page's
       * 1240px/28px `.wrap`. Rendered outside `.mk` (Lesson 1); the entrance animation is
       * `EditorialSplit`'s own internal `Reveal`s (sticky-safe), so no call-site `Reveal`.
       * `#deal-structures` below is the secondary CTA's target.
       */}
      <div id="partners" className="scroll-mt-[84px]">
        <EditorialSplit
          headline={partners.headline}
          body={partners.subheadline}
          items={partnerItems}
          primaryCta={{ href: "#deal-enquiry", label: `${partners.cta_primary.label} →` }}
          secondaryCta={{ href: "#deal-structures", label: partners.cta_secondary.label }}
          note={partners.cta_primary.note}
        />
      </div>
      {/*
       * Page styles + entrance-motion wiring for the raw sections that remain further down (the
       * `#deal-structures`/`#market`/`#track-record` sec-heads and `bodyTopB`'s `#process`). No
       * markup of its own any more — `#capabilities`, its last raw section, is real JSX below —
       * but kept here, ahead of those sections, so `PAGE_STYLE`'s `.pre-reveal` hidden state is
       * parsed before the markup it applies to. `ScrollReveal` sweeps the whole document's
       * `.mk[data-page="real-estate"] .pre-reveal` elements, so its position doesn't matter.
       */}
      <div className="mk" data-page="real-estate">
        <style dangerouslySetInnerHTML={{ __html: PAGE_STYLE }} />
        <noscript>
          <style
            dangerouslySetInnerHTML={{
              __html: `.mk[data-page="real-estate"] .pre-reveal,[data-reveal]{opacity:1!important;transform:none!important}`,
            }}
          />
        </noscript>
        <ScrollReveal page="real-estate" />
      </div>
      {/*
       * "Institutional-Grade Management" (`#capabilities`, SECTION 3) — real JSX, rendered
       * outside `.mk`: the same `TwoColumnShowcase` as `#manage` below, mirrored exactly like
       * Owners' `#technology` (`imagePosition="left"`), on the warm `alt` band the raw section had
       * (`class="alt"`). The user's call: consistency over the mock's single-column, 14.5px
       * `.cap-showcase` bullet list — it takes the component's 2-column bullets, and the badge
       * stays bottom-left like Owners' `#technology`. Wrapped in `Reveal` at the call site. Still
       * DB-driven (`content.capabilities ?? defaultCapabilities`); the CTA keeps the hard-wired
       * `#deal-enquiry` anchor and renders only with a label; the badge is the CTA note. The
       * wrapper keeps the `id` with this page's 84px scroll offset.
       */}
      <div id="capabilities" className="scroll-mt-[84px]">
        <Reveal label="real-estate-capabilities">
          <TwoColumnShowcase
            headline={capabilities.headline}
            body={capabilities.subheadline || undefined}
            bullets={capabilities.benefits.map((b, i) => ({
              icon: CAPABILITY_ICONS[i],
              title: b.title,
              description: b.description,
            }))}
            cta={
              capabilities.cta.label
                ? {
                    href: "#deal-enquiry",
                    label: `${capabilities.cta.label} →`,
                    note: capabilities.cta.note,
                  }
                : undefined
            }
            badge={capabilities.cta.note || undefined}
            tone="alt"
            imagePosition="left"
            image={
              capMedia?.url && capMedia.width > 0 && capMedia.height > 0 ? (
                <MediaImage
                  data={{ ...capMedia, alt: capMedia.alt || CAP_FALLBACK_ALT }}
                  className="aspect-[4/5] w-full rounded-sm object-cover"
                  sizes={TWO_COL_SHOWCASE_SIZES}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- external TEMP fallback, not an R2 asset
                <img
                  src={capMedia?.url || CAP_FALLBACK_IMG}
                  alt={capMedia?.alt || CAP_FALLBACK_ALT}
                  className="aspect-[4/5] w-full rounded-sm object-cover"
                  loading="lazy"
                  decoding="async"
                />
              )
            }
          />
        </Reveal>
      </div>
      {/*
       * "Asset Types" (`#manage`, SECTION 4) — real JSX, rendered outside `.mk`: `core/ui`'s
       * existing `TwoColumnShowcase` with Owners' exact `#services` configuration (same role,
       * and the old `.asset-showcase` CSS was byte-identical to Owners' `.owner-showcase`) — the
       * user's call: consistency with Owners over 1:1 fidelity to this page's mock. Wrapped in
       * `Reveal` at the call site, same as Owners. Still DB-driven (`asset_management`); the CTA
       * keeps the original hard-wired `#deal-enquiry` anchor, renders only with a label, and the
       * floating badge is the CTA note (shown only when there is one), exactly as before. The
       * wrapper keeps the `id` the header's "What We Manage" link targets, with this page's own
       * 84px scroll offset (`.mk section`'s `scroll-margin-top`). Its icons share
       * `#capabilities`' `SHOWCASE_ICON_CLASS`.
       */}
      <div id="manage" className="scroll-mt-[84px]">
        <Reveal label="real-estate-manage">
          <TwoColumnShowcase
            headline={assets.headline}
            body={assets.subheadline || undefined}
            bullets={assets.benefits.map((b, i) => ({
              icon: ASSET_ICONS[i],
              title: b.title,
              description: b.description,
            }))}
            cta={
              assets.cta.label
                ? { href: "#deal-enquiry", label: `${assets.cta.label} →`, note: assets.cta.note }
                : undefined
            }
            badge={assets.cta.note || undefined}
            imagePosition="right"
            image={
              assetMedia?.url && assetMedia.width > 0 && assetMedia.height > 0 ? (
                <MediaImage
                  data={{ ...assetMedia, alt: assetMedia.alt || ASSET_FALLBACK_ALT }}
                  className="aspect-[4/5] w-full rounded-sm object-cover"
                  sizes={TWO_COL_SHOWCASE_SIZES}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- external TEMP fallback, not an R2 asset
                <img
                  src={assetMedia?.url || ASSET_FALLBACK_IMG}
                  alt={assetMedia?.alt || ASSET_FALLBACK_ALT}
                  className="aspect-[4/5] w-full rounded-sm object-cover"
                  loading="lazy"
                  decoding="async"
                />
              )
            }
          />
        </Reveal>
      </div>
      {/*
       * "Deal Structures" (`#deal-structures`, SECTION 5 — partnership models) — same shell
       * technique as `#track-record` below: the `<section>`/`.wrap` metrics reproduced exactly
       * (`.mk section`'s `padding:clamp(72px,10vw,150px) 0; scroll-margin-top:84px`, `.mk .wrap`'s
       * `max-width:1240px; padding:0 28px`) plus the original's `class="alt"` warm band. The
       * centred sec-head stays raw markup in its own `.mk[data-page="real-estate"]` wrapper so
       * `ScrollReveal` still fades it in. The cards are `core/ui`'s `ChecklistCards` in `Reveal`
       * (the original `.models` was one `reveal-io pre-reveal` unit; its `.reveal-stagger` only set
       * per-card `transition-delay`s, and since the cards themselves don't change during the
       * reveal — only the `.models` container fades/slides — no entrance stagger was ever visible;
       * one `Reveal` is equivalent. The only observable effect of those delays was cards 2–3's
       * hover lift starting 70/140ms late — an unintended side effect, deliberately not kept). The disclaimer note had no reveal in the original, so it sits
       * outside `Reveal` (`.model-note`'s exact metrics as Tailwind tokens). `id` is kept — the
       * partners section's secondary CTA anchors to `#deal-structures`.
       */}
      <section
        id="deal-structures"
        className="scroll-mt-[84px] bg-[color-mix(in_srgb,var(--color-line)_38%,var(--color-bg))] py-[clamp(72px,10vw,150px)]"
      >
        <div className="mx-auto max-w-[1240px] px-[28px]">
          <div className="mk" data-page="real-estate">
            <div dangerouslySetInnerHTML={{ __html: dealStructuresSecHead(dealStructures) }} />
          </div>
          <Reveal>
            <ChecklistCards
              cards={dealStructures.models.map((m) => ({
                name: m.name,
                tagline: m.tagline,
                points: m.points,
                featured: m.featured,
                featureLabel: m.feature_label,
              }))}
            />
          </Reveal>
          {dealStructures.note ? (
            <p className="mx-auto mt-[34px] max-w-[80ch] text-center text-[13.5px] leading-[1.6] text-ink-soft">
              {dealStructures.note}
            </p>
          ) : null}
        </div>
      </section>
      {/*
       * "Why Portugal" (`#market`) — the `<section>`/`.wrap` shell is reproduced with the
       * exact mock metrics (`.mk section`'s `padding:clamp(72px,10vw,150px) 0;
       * scroll-margin-top:84px` and `.mk .wrap`'s `max-width:1240px;margin:0 auto;
       * padding:0 28px`), same technique as About's `#values` extraction. `sec-head` stays
       * raw markup in its own small `.mk[data-page="real-estate"]` wrapper (unlike About's
       * extraction, this one keeps the `data-page` attribute so `ScrollReveal`'s
       * `.mk[data-page="real-estate"] .pre-reveal` query still matches it — About's omitted
       * it, which silently opts that fragment out of the fade/slide-in; keeping it here
       * preserves the original behaviour exactly). The bento is `core/ui`'s `StatBento`,
       * wrapped in `Reveal` for the same once-on-scroll fade/slide-in the raw markup had
       * (`.market-bento`'s `reveal reveal-io pre-reveal` classes) — the original's per-cell
       * stagger (`.reveal-stagger`) isn't reproduced, same accepted trade-off as About's
       * `NumberedFeatureGrid` extraction.
       */}
      <section id="market" className="py-[clamp(72px,10vw,150px)] scroll-mt-[84px]">
        <div className="mx-auto max-w-[1240px] px-[28px]">
          <div className="mk" data-page="real-estate">
            <div dangerouslySetInnerHTML={{ __html: marketSecHead(market) }} />
          </div>
          <Reveal>
            <StatBento
              feature={{
                title: market.fundamentals.title,
                stats: market.stats,
                paragraphs: market.fundamentals.body,
              }}
              cells={[
                { kind: "text", title: market.regulatory.title, body: market.regulatory.body },
                { kind: "list", title: market.thesis.title, items: market.thesis.points },
              ]}
            />
          </Reveal>
        </div>
      </section>
      {/*
       * "Performance You Can Measure" (`#track-record`) — same shell technique as `#market`
       * above: the `<section>`/`.wrap` metrics reproduced exactly (`.mk section`'s
       * `padding:clamp(72px,10vw,150px) 0; scroll-margin-top:84px`, `.mk .wrap`'s
       * `max-width:1240px; padding:0 28px`) plus the original's `class="alt"` warm band
       * (`.mk .alt`'s `color-mix(in srgb, var(--line) 38%, var(--bg))`, same formula
       * `TwoColumnShowcase`/`StepGallery` use). The sec-head stays raw markup in its own
       * `.mk[data-page="real-estate"]` wrapper so `ScrollReveal` still fades it in. The tiles
       * are `core/ui`'s `StatTiles` in `Reveal` (the original `.tiles` was one
       * `reveal-io pre-reveal` unit — its `.reveal-stagger` delays landed on tiles with no
       * transition of their own, so they never actually staggered; one `Reveal` is equivalent).
       */}
      <section
        id="track-record"
        className="scroll-mt-[84px] bg-[color-mix(in_srgb,var(--color-line)_38%,var(--color-bg))] py-[clamp(72px,10vw,150px)]"
      >
        <div className="mx-auto max-w-[1240px] px-[28px]">
          <div className="mk" data-page="real-estate">
            <div dangerouslySetInnerHTML={{ __html: trackRecordSecHead(trackRecord) }} />
          </div>
          <Reveal>
            <StatTiles tiles={trackRecord.tiles} />
          </Reveal>
        </div>
      </section>
      <div className="mk" data-page="real-estate">
        <div dangerouslySetInnerHTML={{ __html: bodyTopB(content) }} />
      </div>
      {faqGroupKey ? (
        <div id="faq" style={{ scrollMarginTop: 130 }}>
          <FaqSection
            locale={locale}
            groupKey={faqGroupKey}
            title={t("realEstate.faqTitle")}
          />
        </div>
      ) : null}
      {/*
       * "Ready to Explore a Partnership?" (`#deal-enquiry`, SECTION 10) — real JSX, rendered
       * outside `.mk`: `DealEnquirySection` (core/ui's `EnquirySplit` + form-card primitives; the
       * section shell, 1240px/28px wrap and per-column reveal live in `EnquirySplit`). Replaced the
       * raw `BODY_BOTTOM` markup + its `.enquiry`/`.form-card`/`.ffield`/`.facc` CSS.
       */}
      <DealEnquirySection />
    </>
  );
}
