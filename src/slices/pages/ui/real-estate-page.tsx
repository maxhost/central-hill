import type { ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { MediaImage } from "@core/media";
import type { Locale } from "@core/db/columns";
import {
  ButtonLink,
  buttonClassName,
  ChecklistCards,
  EditorialSplit,
  Hero,
  Reveal,
  SectionHead,
  StatBento,
  StatTiles,
  StepGallery,
  TwoColumnShowcase,
} from "@core/ui";
import { Icon } from "@core/ui/icon";
import { getRealEstatePage, type PageMedia, type RealEstatePage as RealEstatePageResult } from "../contract";
import {
  defaultCapabilities,
  defaultDealStructures,
  defaultProcess,
  defaultTrackRecord,
} from "../schemas/real-estate";
import { DealEnquirySection } from "./components/deal-enquiry-section";
import { AssetTypeCards } from "./components/asset-type-cards";
import { realEstateAssetFallbackIndex, realEstateProcessFallbackIndex } from "../real-estate-content";
import { FaqSection } from "./components/faq-section";
import { SIDE_MEDIA_CLASS, sideMedia } from "./components/side-media";
import { capabilityStatementHref } from "./capability-statement";
import { orMessage } from "./or-message";

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
 * - `#partners`: `EditorialSplit` with Owners' `#why` configuration and internal `Reveal`s.
 * - `#process`: Owners' `StepGallery` with editable photos and an enquiry CTA underneath.
 * - `#capabilities` (`tone="alt"`, media left): `TwoColumnShowcase` with a single-column list.
 * - `#manage`: six AssetTypeCards with independently editable images, icons and copy.
 * - `#deal-structures` (centred head, warm `alt` band), `#market` and `#track-record` (`alt`
 *   band): `SectionHead` above `ChecklistCards` (plus the disclaimer note), `StatBento` and
 *   `StatTiles` respectively. Each sits in a hand-written section shell that keeps the mock's
 *   metrics (`clamp(72px,10vw,150px)` vertical padding, a 1240px/28px column, 84px scroll
 *   margin).
 * - `#faq`: the shared `FaqSection` island, picked by `faq_group_key`.
 * - `#deal-enquiry`: `DealEnquirySection` (`EnquirySplit` + form-card primitives). Its copy is
 *   `deal_enquiry` (blank → i18n), its form fields are fixed i18n and its contact lines come from
 *   Settings (spec S5). The form does not submit yet; wiring it to the leads slice is a separate
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
// Their alts (also used for an uploaded asset without alt text) are i18n since spec
// `real-estate-admin-editor` S2: `pages.realEstate.heroAlt` / `capabilitiesAlt` / `assetsAlt`.
const HERO_FALLBACK_IMG =
  "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&w=1900&q=70";
// Temporary illustrative images; each card's BO image overrides its own fallback.
const ASSET_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=72",
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=72",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=72",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=72",
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=72",
  "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=900&q=72",
];
const CAP_FALLBACK_IMG =
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=72";
// Illustrative stock photos, matching Owners' growth-path gallery until BO images are set.
const PROCESS_FALLBACK_PHOTOS = ["259962", "3182812", "210265", "271624", "313782"];

// `#capabilities`/`#manage`'s side media (spec real-estate-admin-editor S3): photo, animated WebP,
// MP4/WebM loop or Lottie in the fixed 4:5 frame via the shared `sideMedia()` — the element Home's
// guests pitch and Owners' `services`/`dashboard` use, sized as one of `TwoColumnShowcase`'s two
// `lg:` columns (`SIDE_MEDIA_SIZES`). An uploaded asset without alt text gets the section's i18n
// alt. No asset (or an image row without dimensions, as before S3) → the stock photo above.
function showcaseMedia(m: PageMedia | undefined, fallbackSrc: string, fallbackAlt: string) {
  const isImage = (m?.mime ?? "image/").startsWith("image/");
  const usable = m?.url && (!isImage || (m.width > 0 && m.height > 0));
  return (
    (usable ? sideMedia({ ...m, alt: m.alt || fallbackAlt }) : null) ?? (
      // eslint-disable-next-line @next/next/no-img-element -- external TEMP fallback, not an R2 asset
      <img
        src={m?.url || fallbackSrc}
        alt={m?.alt || fallbackAlt}
        className={SIDE_MEDIA_CLASS}
        loading="lazy"
        decoding="async"
      />
    )
  );
}

// Shell shared by `#deal-structures`/`#market`/`#track-record`: the mock's `section` padding and
// 84px scroll margin, its 1240px/28px `.wrap` column, and its warm `.alt` band (the same
// `color-mix` formula `TwoColumnShowcase`/`StepGallery` use).
const SECTION_SHELL = "scroll-mt-[84px] py-[70px]";
const SECTION_WRAP = "mx-auto max-w-[1240px] px-[28px]";
const ALT_BAND = "bg-[color-mix(in_srgb,var(--color-line)_38%,var(--color-bg))]";

// Bullet icons for both `TwoColumnShowcase` sections (`#capabilities`, `#manage`) — Owners'
// exact `TwoColumnShowcase` bullet-icon config (26px, `mt-0.5`, accent-deep). Like every benefit
// list on this page, the glyph is the item's admin-editable `icon_key` (`core/ui` `<Icon>`,
// inline Iconoir SVG, ADR 0034).
const showcaseIcon = (iconKey: string) => (
  <Icon name={iconKey} size={26} className="mt-0.5 flex-none text-accent-deep" />
);

/** Public calls keep their existing DOM; annotation wrappers exist only in private preview. */
function PreviewBinding({ preview, id, children }: { preview: boolean; id: string; children: ReactNode }) {
  return preview ? <div data-editor-binding={id}>{children}</div> : <>{children}</>;
}

export async function RealEstatePage({ locale, preview = false, page: injectedPage }: {
  locale: Locale; preview?: boolean; page?: RealEstatePageResult | null;
}) {
  setRequestLocale(locale);
  const [page, t] = await Promise.all([injectedPage === undefined ? getRealEstatePage(locale) : Promise.resolve(injectedPage), getTranslations("pages")]);
  if (!page) notFound();

  const { content, media } = page;
  const binding = (id: string) => preview ? { "data-editor-binding": id } : {};
  const heroFallbackAlt = t("realEstate.heroAlt");
  const capFallbackAlt = t("realEstate.capabilitiesAlt");
  const faqGroupKey = content.faq_group_key ?? "";
  const market = content.market;
  const marketImages = (
    <div className="grid grid-cols-2 gap-3">
      {([ ["left", "6391897", "marketImageLeftAlt"], ["right", "16343720", "marketImageRightAlt"] ] as const).map(([side, photo, altKey]) => {
        const path = `market.fundamentals.image_${side}_media_id`;
        const image = media[market.fundamentals[`image_${side}_media_id`] ?? ""];
        const isImage = image && (image.mime ?? "image/").startsWith("image/");
        const alt = market.fundamentals[`image_${side}_alt`]?.trim() || image?.alt || (isImage ? market.fundamentals.title : t(`realEstate.${altKey}`));
        return (
          <div key={side} {...binding(path)} className="h-[110px] overflow-hidden rounded-[6px] min-[681px]:h-[130px]">
            {isImage && image.width > 0 && image.height > 0 ? (
              <MediaImage
                data={{ ...image, alt }}
                className="h-full w-full object-cover"
                sizes="(max-width: 980px) 50vw, 320px"
                unoptimized={image.mime === "image/webp"}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- temporary Pexels photo or dimensionless asset
              <img
                src={(isImage ? image.url : undefined) || `https://images.pexels.com/photos/${photo}/pexels-photo-${photo}.jpeg?auto=compress&cs=tinysrgb&w=640&h=320&fit=crop`}
                alt={alt}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            )}
          </div>
        );
      })}
    </div>
  );
  const trackRecord = content.track_record ?? defaultTrackRecord;
  const dealStructures = content.deal_structures ?? defaultDealStructures;
  const hero = content.hero;
  const heroMedia = media[hero.image_media_id];
  // Optional capability-statement PDF behind the hero's secondary CTA (spec S4). Only a PDF
  // becomes the link (new tab); otherwise the button keeps the design's in-page anchor.
  const capStmtPdf = capabilityStatementHref(media[hero.capability_statement_media_id ?? ""]);
  const partners = content.partners;
  const partnerItems = partners.benefits.map((b) => ({
    icon: <Icon name={b.icon_key} size={28} className="mt-0.5 flex-none text-accent-deep" />,
    title: b.title,
    description: b.description,
  }));
  // Same default-copy fallback `#process` always had (`content.process ?? defaultProcess`).
  const howItWorks = content.process ?? defaultProcess;
  const processItems = howItWorks.steps.map((step, index) => {
    const image = media[step.image_media_id ?? ""];
    const isImage = image && (image.mime ?? "image/").startsWith("image/");
    const alt = step.image_alt?.trim() || image?.alt || step.title;
    const photo = PROCESS_FALLBACK_PHOTOS[realEstateProcessFallbackIndex(content, index) % PROCESS_FALLBACK_PHOTOS.length];
    const imageClass = "absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-in-out motion-safe:group-hover:scale-[1.06]";
    return {
      title: step.title,
      description: step.description,
      image: isImage && image.width > 0 && image.height > 0 ? (
        <MediaImage
          data={{ ...image, alt }}
          className={imageClass}
          sizes="(max-width: 680px) 100vw, (max-width: 980px) 50vw, 20vw"
          unoptimized={image.mime === "image/webp"}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- same temporary stock photos as Owners, or dimensionless uploaded image
        <img
          src={(isImage ? image.url : undefined) || `https://images.pexels.com/photos/${photo}/pexels-photo-${photo}.jpeg?auto=compress&cs=tinysrgb&w=900`}
          alt={alt}
          className={imageClass}
          loading="lazy"
          decoding="async"
        />
      ),
    };
  });
  // `capabilities` is newer than the original seed — fall back to the approved default copy
  // so a `real_estate` row authored before this section existed still renders correctly.
  const capabilities = content.capabilities ?? defaultCapabilities;
  const capMedia = media[capabilities.image_media_id ?? ""];
  const assets = content.asset_management;
  const assetCards = assets.benefits.map((item, index) => {
    const image = media[item.image_media_id ?? ""];
    const isImage = image && (image.mime ?? "image/").startsWith("image/");
    const imageClass = "absolute inset-0 -z-20 h-full w-full object-cover";
    const alt = item.image_alt?.trim() || image?.alt || item.title;
    return {
      id: content._list_ids?.["asset_management.benefits"]?.[index] ?? `legacy_${index}`,
      title: item.title,
      description: item.description,
      icon: <Icon name={item.icon_key} size={28} />,
      image: isImage && image.width > 0 && image.height > 0 ? (
        <MediaImage
          data={{ ...image, alt }}
          className={imageClass}
          sizes="(max-width: 680px) 100vw, (max-width: 980px) 50vw, 400px"
          unoptimized={image.mime === "image/webp"}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- temporary external photo or dimensionless asset
        <img
          src={(isImage ? image.url : undefined) || ASSET_FALLBACK_IMAGES[realEstateAssetFallbackIndex(content, index)] || ASSET_FALLBACK_IMAGES[0]}
          alt={alt}
          loading="lazy"
          className={imageClass}
        />
      ),
    };
  });

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
      <PreviewBinding preview={preview} id="hero"><Hero
        editorBindings={preview ? { background: "hero.image_media_id", eyebrow: "hero.subheadline", subtitle: "hero.positioning" } : undefined}
        id="top"
        background={
          heroMedia?.url && heroMedia.width > 0 && heroMedia.height > 0 ? (
            <MediaImage
              data={{ ...heroMedia, alt: heroMedia.alt || heroFallbackAlt }}
              className="absolute inset-0 -z-10 h-full w-full object-cover"
              sizes="100vw"
              priority // full-bleed hero — the LCP element on this page
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- external TEMP fallback, not an R2 asset
            <img
              src={heroMedia?.url || HERO_FALLBACK_IMG}
              alt={heroMedia?.alt || heroFallbackAlt}
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
        wrapClassName="mx-auto max-w-[1600px] px-10 pb-10 pt-[60px]"
        copyClassName="max-w-none"
        headlineClassName="max-w-[26ch] text-[clamp(2.5rem,5.4vw,4.25rem)]"
        subtitleClassName="mt-5 max-w-[60ch] text-lg"
        actionsClassName="mt-2"
        eyebrow={hero.subheadline || undefined}
        headline={preview ? <span {...binding("hero.headline")}>{hero.headline}</span> : hero.headline}
        subtitle={hero.positioning}
        actions={
          <>
            <ButtonLink href="#deal-enquiry">{preview ? <span {...binding("hero.cta_primary.label")}>{`${hero.cta_primary.label} →`}</span> : `${hero.cta_primary.label} →`}</ButtonLink>
            {capStmtPdf ? (
              // A plain `<a>`: a download target, not a route — no prefetch, and a new tab even
              // for the dev fallback's relative URL (`ButtonLink` only does that for http(s)).
              <a
                {...binding("hero.capability_statement_media_id")}
                href={capStmtPdf}
                target="_blank"
                rel="noopener"
                className={buttonClassName("light")}
              >
                {`${hero.cta_secondary.label} →`}
              </a>
            ) : (
              <ButtonLink href="#deal-enquiry" variant="light">
                {`${hero.cta_secondary.label} →`}
              </ButtonLink>
            )}
          </>
        }
      /></PreviewBinding>
      {/*
       * "Built for Institutional Partners" (`#partners`, SECTION 2) — `core/ui`'s
       * `EditorialSplit`, configured exactly like Owners' `#why` (same wrapper `id` — but
       * this page's `scroll-mt-[84px]` like its other JSX sections, same props, same `→` on the primary CTA, same icon size/colour)
       * for cross-page consistency, accepting its Container width/spacing over this page's
       * 1240px/28px `.wrap`. The entrance animation is `EditorialSplit`'s own internal `Reveal`s (sticky-safe), so no call-site `Reveal`.
       * `#deal-structures` below is the secondary CTA's target.
       */}
      <div {...binding("partners")} id="partners" className="scroll-mt-[84px] [&_section]:py-[70px]">
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
      <div {...binding("capabilities")} id="capabilities" className="scroll-mt-[84px] [&_ul]:grid-cols-1 [&_section]:py-[70px]">
        <Reveal label="real-estate-capabilities">
          <TwoColumnShowcase
            headline={capabilities.headline}
            body={capabilities.subheadline || undefined}
            bullets={capabilities.benefits.map((b) => ({
              icon: showcaseIcon(b.icon_key),
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
            image={showcaseMedia(capMedia, CAP_FALLBACK_IMG, capFallbackAlt)}
          />
        </Reveal>
      </div>
      {/* Six asset-type cards with independently editable background, icon and copy. */}
      <div {...binding("asset_management")} id="manage" className="scroll-mt-[84px]">
        <Reveal label="real-estate-manage">
          <AssetTypeCards headline={assets.headline} body={assets.subheadline || undefined} items={assetCards} cta={assets.cta} preview={preview} />
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
      <section {...binding("deal_structures")} id="deal-structures" className={`${SECTION_SHELL} ${ALT_BAND}`}>
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
                // Spec real-estate-admin-editor S2: a featured card with no badge text gets the
                // i18n "Recommended" badge; a non-featured card never shows one.
                featureLabel: m.feature_label || (m.featured ? t("realEstate.featuredModel") : ""),
              }))}
            />
          </Reveal>
          {dealStructures.note ? (
            <p {...binding("deal_structures.note")} className="mx-auto mt-[34px] max-w-[80ch] text-center text-[13.5px] leading-[1.6] text-ink-soft">
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
      <section {...binding("market")} id="market" className={SECTION_SHELL}>
        <div className={SECTION_WRAP}>
          <Reveal>
            <SectionHead headline={market.headline} intro={market.subheadline || undefined} />
          </Reveal>
          <Reveal>
            <StatBento
              feature={{
                media: marketImages,
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
      <section {...binding("track_record")} id="track-record" className={`${SECTION_SHELL} ${ALT_BAND}`}>
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
      {/* Same photo-card gallery as Owners; existing process copy and enquiry CTA remain editable. */}
      <div {...binding("process")} id="process" className={`scroll-mt-[84px] [&_section]:pt-[70px] [&_section]:pb-10 ${ALT_BAND}`}>
        <StepGallery
          headline={howItWorks.headline}
          body={howItWorks.subheadline}
          items={processItems}
          tone="alt"
        />
        <div className={`${SECTION_WRAP} pb-[70px] text-center`}>
          <ButtonLink href="#deal-enquiry">{howItWorks.cta.label} →</ButtonLink>
        </div>
      </div>
      {/*
       * The institutional FAQ (former SECTION 9) — the shared, editable `<FaqSection>` island
       * chosen per page via `faq_group_key`. Its heading is `faq.title` (blank → the i18n
       * `realEstate.faqTitle`, spec real-estate-admin-editor S2).
       */}
      {faqGroupKey ? (
        <div {...binding("faq")} id="faq" className="[&_section]:py-[70px]" style={{ scrollMarginTop: 130 }}>
          <FaqSection
            locale={locale}
            groupKey={faqGroupKey}
            title={orMessage(content.faq?.title, t("realEstate.faqTitle"))}
          />
        </div>
      ) : null}
      {/*
       * "Ready to Explore a Partnership?" (`#deal-enquiry`, SECTION 10):
       * `DealEnquirySection` (core/ui's `EnquirySplit` + form-card primitives; the
       * section shell, 1240px/28px wrap and per-column reveal live in `EnquirySplit`). Replaced the
       * raw `BODY_BOTTOM` markup + its `.enquiry`/`.form-card`/`.ffield`/`.facc` CSS. Copy from
       * `content.deal_enquiry` (blank → i18n), contact lines from Settings (spec S5).
       */}
      <div {...binding("deal_enquiry")} className="[&_section]:py-[70px]"><DealEnquirySection locale={locale} content={content.deal_enquiry} /></div>
    </>
  );
}
