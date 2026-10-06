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
  SectionHead,
  StatBento,
  StatTiles,
  TwoColumnShowcase,
} from "@core/ui";
import { getRealEstatePage } from "../contract";
import {
  defaultCapabilities,
  defaultDealStructures,
  defaultProcess,
  defaultTrackRecord,
} from "../schemas/real-estate";
import { DealEnquirySection } from "./components/deal-enquiry-section";
import { FaqSection } from "./components/faq-section";
import { Icon } from "./components/icon";

/**
 * Real Estate page: the institutional-partnerships landing, built from `mock/real-estate.html`
 * and now composed entirely from `core/ui` and slice React components. No `.mk` wrapper, raw
 * HTML strings, page `<style>` or `mock.css` remain. Every section reads the `real_estate`
 * `page_content` row for the locale. Newer sections fall back to the approved default copy in
 * `../schemas/real-estate`. The header, footer and i18n come from the app layout.
 *
 * Sections, top to bottom:
 * - `#top`: `Hero` (compact, centred) with Buildings' listing-hero configuration. The hero image
 *   is the LCP element.
 * - `#partners` and `#process`: `EditorialSplit` with Owners' `#why` configuration. It has its
 *   own internal `Reveal`s. `#process` passes zero-padded step numbers through the items' `icon`
 *   slot.
 * - `#capabilities` (`tone="alt"`, image left) and `#manage`: `TwoColumnShowcase` with Owners'
 *   `#technology`/`#services` configuration.
 * - `#deal-structures` (centred head, warm `alt` band), `#market` and `#track-record` (`alt`
 *   band): `SectionHead` above `ChecklistCards` (plus the disclaimer note), `StatBento` and
 *   `StatTiles` respectively. Each sits in a hand-written section shell that keeps the mock's
 *   metrics (`clamp(72px,10vw,150px)` vertical padding, a 1240px/28px column, 84px scroll
 *   margin).
 * - `#faq`: the shared `FaqSection` island, picked by `faq_group_key`.
 * - `#deal-enquiry`: `DealEnquirySection` (`EnquirySplit` + form-card primitives). Its form does
 *   not submit yet and its copy is hardcoded English; wiring it to the leads slice is a separate
 *   task.
 *
 * Entrance motion is `core/ui`'s `Reveal` throughout: call-site wrappers, plus
 * `EditorialSplit`/`EnquirySplit`'s internal ones. The `<noscript>` rule keeps every
 * `[data-reveal]` visible with JS off, as Home does. Where this page's own mock differed from a
 * sibling page that uses the same component, the user chose cross-page consistency over mock
 * fidelity. Each component's docstring records those choices.
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

// Shell shared by `#deal-structures`/`#market`/`#track-record`: the mock's `section` padding and
// 84px scroll margin, its 1240px/28px `.wrap` column, and its warm `.alt` band (the same
// `color-mix` formula `TwoColumnShowcase`/`StepGallery` use).
const SECTION_SHELL = "scroll-mt-[84px] py-[clamp(72px,10vw,150px)]";
const SECTION_WRAP = "mx-auto max-w-[1240px] px-[28px]";
const ALT_BAND = "bg-[color-mix(in_srgb,var(--color-line)_38%,var(--color-bg))]";

// Positional per-partner icon keys from the locked design — paired by index with the fixed
// four-item benefit list (funds / developers / operators / corporate). Only the benefit
// *text* is data-driven; the glyphs never change. Rendered through the slice's `<Icon>`
// registry (`./components/icon.tsx`), exactly like Owners' `WHY_ICON_KEYS`.
const PARTNER_ICON_KEYS = ["landmark", "trowel", "buildings", "send"] as const;

// `#process`'s step-number marker, passed through `EditorialSplit`'s `items[].icon` slot in
// place of an icon: the old `.mk .process-split .pitch-list .snum` (`flex:0 0 auto; width:44px;
// font-family:var(--serif); font-size:30px; line-height:1; color:var(--accent); opacity:.9;
// margin-top:-2px`) in theme tokens only.
const STEP_NUMBER_CLASS = "-mt-0.5 w-11 flex-none font-serif text-3xl leading-none text-accent opacity-90";

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
  // Same default-copy fallback `#process` always had (`content.process ?? defaultProcess`).
  const howItWorks = content.process ?? defaultProcess;
  const processItems = howItWorks.steps.map((s, i) => ({
    icon: (
      <span className={STEP_NUMBER_CLASS} aria-hidden>
        {String(i + 1).padStart(2, "0")}
      </span>
    ),
    title: s.title,
    description: s.description,
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
       * 1240px/28px `.wrap`. The entrance animation is `EditorialSplit`'s own internal `Reveal`s (sticky-safe), so no call-site `Reveal`.
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
       * Every `Reveal` (call-site and inside `EditorialSplit`/`EnquirySplit`) renders hidden on
       * the server and only un-hides via JS, so this keeps all of them visible with JS off — the
       * same rule as Home's.
       */}
      <noscript>
        <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      {/*
       * "Institutional-Grade Management" (`#capabilities`, SECTION 3): the same `TwoColumnShowcase` as `#manage` below, mirrored exactly like
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
       * "Asset Types" (`#manage`, SECTION 4): `core/ui`'s
       * existing `TwoColumnShowcase` with Owners' exact `#services` configuration (same role,
       * and the old `.asset-showcase` CSS was byte-identical to Owners' `.owner-showcase`) — the
       * user's call: consistency with Owners over 1:1 fidelity to this page's mock. Wrapped in
       * `Reveal` at the call site, same as Owners. Still DB-driven (`asset_management`); the CTA
       * keeps the original hard-wired `#deal-enquiry` anchor, renders only with a label, and the
       * floating badge is the CTA note (shown only when there is one), exactly as before. The
       * wrapper keeps the `id` the header's "What We Manage" link targets, with this page's own
       * 84px scroll offset (the mock `section`'s `scroll-margin-top`). Its icons share
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
       * "Deal Structures" (`#deal-structures`, partnership models): the shared section shell on
       * the warm `alt` band, a centred `SectionHead`, then `core/ui`'s `ChecklistCards`. The
       * head and the cards each have their own `Reveal`, as the raw markup had separate reveal
       * units. The original `.reveal-stagger` on the cards never produced a visible entrance
       * stagger, so it is not reproduced. The disclaimer note had no reveal, so it sits outside
       * `Reveal` (`.model-note`'s metrics in Tailwind). The `id` is the partners section's
       * secondary-CTA target.
       */}
      <section id="deal-structures" className={`${SECTION_SHELL} ${ALT_BAND}`}>
        <div className={SECTION_WRAP}>
          <Reveal>
            <SectionHead
              align="center"
              headline={dealStructures.headline}
              intro={dealStructures.subheadline || undefined}
            />
          </Reveal>
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
       * "Why Portugal" (`#market`): the shared section shell, a `SectionHead`, then `core/ui`'s
       * `StatBento`, each in its own `Reveal`. The original's per-cell stagger is not
       * reproduced, the same accepted trade-off as About's `NumberedFeatureGrid`.
       */}
      <section id="market" className={SECTION_SHELL}>
        <div className={SECTION_WRAP}>
          <Reveal>
            <SectionHead headline={market.headline} intro={market.subheadline || undefined} />
          </Reveal>
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
       * "Performance You Can Measure" (`#track-record`): the shared section shell on the warm
       * `alt` band, a `SectionHead`, then `core/ui`'s `StatTiles`, which count up on scroll-in.
       * The head and the tiles each have their own `Reveal`.
       */}
      <section id="track-record" className={`${SECTION_SHELL} ${ALT_BAND}`}>
        <div className={SECTION_WRAP}>
          <Reveal>
            <SectionHead
              headline={trackRecord.headline}
              intro={trackRecord.subheadline || undefined}
            />
          </Reveal>
          <Reveal>
            <StatTiles tiles={trackRecord.tiles} />
          </Reveal>
        </div>
      </section>
      {/*
       * "How it works" (`#process`, SECTION 8 — "A Structured Path…") — `core/ui`'s
       * `EditorialSplit`, configured exactly like `#partners` above (wrapper `id` with this
       * page's `scroll-mt-[84px]`, headline/body/items, `→`-suffixed primary CTA →
       * `#deal-enquiry`); `process` has no secondary CTA or note. The zero-padded step numbers
       * are the items' `icon` (`STEP_NUMBER_CLASS`). The entrance animation is `EditorialSplit`'s own internal `Reveal`s (sticky-safe), so no call-site
       * `Reveal`.
       */}
      <div id="process" className="scroll-mt-[84px]">
        <EditorialSplit
          headline={howItWorks.headline}
          body={howItWorks.subheadline}
          items={processItems}
          primaryCta={{ href: "#deal-enquiry", label: `${howItWorks.cta.label} →` }}
        />
      </div>
      {/*
       * The institutional FAQ (former SECTION 9) — the shared, editable `<FaqSection>` island
       * chosen per page via `faq_group_key`.
       */}
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
       * "Ready to Explore a Partnership?" (`#deal-enquiry`, SECTION 10):
       * `DealEnquirySection` (core/ui's `EnquirySplit` + form-card primitives; the
       * section shell, 1240px/28px wrap and per-column reveal live in `EnquirySplit`). Replaced the
       * raw `BODY_BOTTOM` markup + its `.enquiry`/`.form-card`/`.ffield`/`.facc` CSS.
       */}
      <DealEnquirySection />
    </>
  );
}
