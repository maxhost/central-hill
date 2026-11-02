import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@core/db/columns";
import {
  BenefitCards,
  ButtonLink,
  Hero,
  IntroSplit,
  Reveal,
  SectionHead,
  SplitCtaPanels,
  splitCtaButtonClassName,
} from "@core/ui";
import { Icon } from "@core/ui/icon";
import { ContactDialog, getGlobals, SITE_ICON_DEFAULTS } from "@slices/settings/contract";
import { listServices } from "@slices/services/contract";
import { listGuideCityGroups } from "@slices/guides/contract";
import { getGuestPage, type GuestPage as GuestPageResult, type PageMedia } from "../contract";
import { FaqSection } from "./components/faq-section";
import { FeaturedPortfolio } from "./components/featured-portfolio";
import { GuestServiceCards } from "./components/guest-service-cards";
import { GuestGuideCards } from "./components/guest-guide-cards";
import { sideMedia } from "./components/side-media";
import { TestimonialsRow } from "./components/testimonials-row";
import { heroPosterSrc } from "./hero-poster";
import { orMessage } from "./or-message";

/**
 * Guests page: the guest-facing landing, built from `mock/guest.html` and now composed entirely
 * from `core/ui` and slice React components. No `.mk` wrapper, raw HTML strings or page
 * `<style>` remain. Every text value comes from the `guest` `page_content` row for the locale
 * (docs/specs/guest-page-db-wiring.md); nothing here is hard-coded copy. Button destinations
 * are fixed in code, per locale (`ctaRoutes`, spec guests-admin-editor): the stored CTA urls
 * are kept but hidden in the editor and not used here. The header, footer and
 * i18n come from the app layout.
 *
 * Sections, top to bottom:
 * - Hero: `Hero` (compact, centred) with Buildings' listing-hero configuration, over Home's
 *   `<video>` background (the poster paints first).
 * - "Welcome to Central Hill": `IntroSplit` (copy split into paragraphs on blank lines, optional
 *   guarantee line + icon, `sideMedia()` image / video / animated WebP / Lottie or the approved
 *   mock photo).
 * - "Why Book Directly" (warm `alt` band): a centred `SectionHead`, then `BenefitCards` + CTA.
 * - `#portfolio`: `FeaturedPortfolio` (cards from the buildings slice; the CTA note renders when set).
 * - Services teaser (`alt` band): published Services catalogue, in carousel groups of six
 *   linked photo cards. Names, descriptions, covers and slugs come from Services.
 * - What-to-do teaser: published Guides catalogue in the same six-card carousel,
 *   with translated guide/city slugs, title/intro/hero and Settings template icons.
 * - `#testimonials`: `TestimonialsRow`, `audience='guest'`; heading from `testimonials.*`
 *   (blank title → `pages.reviews.titleGuests`, no eyebrow).
 * - `#faq`: the shared `FaqSection` island, picked by `faq_group_key` (only when set); title
 *   from `faq.title` (blank → `pages.faqTitle`).
 * - Closing dual CTA: `SplitCtaPanels`, contact lines from company_settings (`getGlobals`); the
 *   owner button is the settings `ContactDialog` (`dual_cta.owner.contact`, blank → header texts).
 * Every section, including the shared slice ones (portfolio, testimonials, FAQ), uses the same
 * shell (70px top/bottom padding, 84px scroll margin, a 1240px/28px column)
 * and `core/ui`'s `SectionHead`.
 *
 * Composed from other slices at render time, so publishing there refreshes this page: buildings
 * (portfolio), testimonials, faq and settings (dual-CTA contact line).
 *
 * Entrance motion is `core/ui`'s `Reveal` throughout (call-site wrappers, one per head and one
 * per body). The `<noscript>` rule keeps every `[data-reveal]` visible with JS off, as Home does.
 * Where this page's mock differed from a sibling page using the same component, the user chose
 * cross-page consistency over mock fidelity; each component's docstring records those choices.
 *
 * Icons are `core/ui` `<Icon>` (inline Iconoir SVG, ADR 0034) from the admin-editable
 * `icon_key`s; an unknown key renders the `sparks` fallback.
 */

// Media fallbacks = the approved mock assets, used 1:1 until a real R2 asset is set in the
// backoffice (`*_media_id` may be blank, or seeded to an id with no uploaded asset yet).
const HERO_FALLBACK_VIDEO =
  "https://videos.pexels.com/video-files/16592055/16592055-hd_1920_1080_60fps.mp4";
const HERO_FALLBACK_POSTER =
  "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1900&q=72";
const WELCOME_FALLBACK_IMG =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=70";

// Shell shared by the hand-written sections: 70px vertical padding and 84px scroll
// margin, its 1240px/28px `.wrap` column, and its warm `.alt` band (the same `color-mix`
// formula Real Estate, `TwoColumnShowcase` and `StepGallery` use).
const SECTION_SHELL = "scroll-mt-[84px] py-[70px]";
const SECTION_WRAP = "mx-auto max-w-[1240px] px-[28px]";
const ALT_BAND = "bg-[color-mix(in_srgb,var(--color-line)_38%,var(--color-bg))]";

/**
 * Fixed, locale-relative button destinations (spec guests-admin-editor → "Destinos de los
 * botones", decision D1). Button URLs are not editable: the stored `cta.url`s stay in `data`
 * (hidden in the editor) but the render ignores them.
 */
function ctaRoutes(locale: Locale) {
  return {
    buildings: `/${locale}/buildings`,
    services: `/${locale}/services`,
    guides: `/${locale}/guides`,
  };
}

/**
 * The Welcome side media (spec guests-admin-editor S3): `sideMedia()` picks image / MP4-WebM
 * loop / animated WebP / Lottie by mime. `IntroSplit`'s cell forces its direct child to cover
 * the full-height cell, so the element sits in a wrapper that passes the same cover rule on
 * and drops `sideMedia`'s radius (this page's photo has always been square-cornered). An
 * image row without dimensions (not renderable by `next/image`) degrades to a plain `<img>`,
 * as before. `null` → the caller's stock photo.
 */
function welcomeSideMedia(asset: PageMedia | undefined, alt: string) {
  if (!asset?.url) return null;
  const isImage = (asset.mime ?? "image/").startsWith("image/");
  if (isImage && !(asset.width > 0 && asset.height > 0)) {
    // eslint-disable-next-line @next/next/no-img-element -- dimensionless asset, as before S3
    return <img src={asset.url} alt={alt} loading="lazy" decoding="async" />;
  }
  const node = sideMedia({ ...asset, alt });
  return node ? (
    <div className="*:h-full *:w-full *:rounded-none *:object-cover">{node}</div>
  ) : null;
}

/**
 * Closing guest/owner dual CTA's contact lines. Panel copy is admin-authored; the contact line
 * is built from the company_settings singleton (data-model.md → dual-CTA = company_settings), so
 * the phone, email and WhatsApp are edited once in /admin/settings and never duplicated per
 * page. An empty string (no settings row / all fields blank) makes `SplitCtaPanels` omit it.
 */
function dualCtaContactLines(globals: Awaited<ReturnType<typeof getGlobals>>): {
  guest: string;
  owner: string;
} {
  if (!globals) return { guest: "", owner: "" };
  return {
    guest: [globals.phone, globals.email].filter(Boolean).join(" · "),
    owner: [globals.phone, globals.email, globals.whatsapp ? `WhatsApp ${globals.whatsapp}` : null]
      .filter(Boolean)
      .join(" · "),
  };
}

export async function GuestPage({ locale, preview = false, page: injectedPage }: { locale: Locale; preview?: boolean; page?: GuestPageResult | null }) {
  setRequestLocale(locale);
  const [page, globals, t, tSettings, services, guideGroups] = await Promise.all([
    injectedPage === undefined ? getGuestPage(locale) : Promise.resolve(injectedPage),
    getGlobals(locale),
    getTranslations("pages"),
    // The owner dual-CTA button opens the header's contact dialog; blank copy → its texts.
    getTranslations("settings"),
    listServices(locale),
    listGuideCityGroups(locale),
  ]);
  if (!page) notFound();

  const { content, media } = page;
  const binding = (id: string) => preview ? { "data-editor-binding": id } : {};
  const { hero, welcome, portfolio } = content;
  const welcomeMedia = media[welcome.image_media_id ?? ""];
  // Alt (spec S3): the field → the asset's alt → `pages.guests.welcomeAlt`.
  const welcomeAlt = orMessage(welcome.image_alt, orMessage(welcomeMedia?.alt, t("guests.welcomeAlt")));
  // Hero (spec S3): the uploaded poster, optimized like Home's; blank → the stock poster.
  // The `<source type>` follows the uploaded video's mime (MP4/WebM), as Home does.
  const heroVideo = media[hero.video_media_id ?? ""];
  const heroPoster = heroPosterSrc(media[hero.poster_media_id ?? ""]) ?? HERO_FALLBACK_POSTER;
  const faqGroupKey = content.faq_group_key ?? "";
  const dualCta = content.dual_cta;
  const contactLines = dualCtaContactLines(globals);
  const routes = ctaRoutes(locale);
  const guides = guideGroups.flatMap((group) => group.guides).filter((guide) => guide.slug && guide.city.slug);

  const whyItems = content.why.benefits.map((item) => ({
    icon: <Icon name={item.icon_key} size={30} className="block" />,
    title: item.title,
    description: item.description,
  }));

  const heroNode = (
      <Hero
        editorBindings={preview ? {background:"hero.video_media_id",eyebrow:"hero.eyebrow",subtitle:"hero.subheadline"} : undefined}
        background={
          <video
            className="absolute inset-0 -z-10 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster={heroPoster}
          >
            <source src={heroVideo?.url ?? HERO_FALLBACK_VIDEO} type={heroVideo?.mime ?? "video/mp4"} />
          </video>
        }
        compact
        align="center"
        overlayClassName="bg-[linear-gradient(180deg,rgba(18,16,13,0.5)_0%,rgba(18,16,13,0.46)_45%,rgba(18,16,13,0.88)_100%)]"
        wrapClassName="mx-auto max-w-[1600px] px-10 pb-10 pt-[60px]"
        copyClassName="max-w-none"
        headlineClassName="w-[26ch] max-w-full text-[clamp(2.5rem,5.4vw,4.25rem)]"
        subtitleClassName="mt-5 max-w-[60ch] text-lg"
        actionsClassName="mt-2"
        eyebrow={hero.eyebrow || undefined}
        headline={<span {...binding("hero.headline")} className="block max-w-[20ch] text-balance">{hero.headline}</span>}
        subtitle={hero.subheadline || undefined}
        actions={
          <ButtonLink href="https://www.centralhill.pt/en/rentals/holidays-rentals-rentals-d0/">{tSettings("ctaBook")}</ButtonLink>
        }
      />
  );

  return (
    <>
      {/*
       * Hero — real JSX, `core/ui`'s `<Hero compact align="center">`, with exactly the same
       * configuration as Buildings' listing hero (`buildings-listing.tsx`) and Real Estate's
       * hero, so the compact page heroes stay consistent — the user's call over 1:1 fidelity to
       * this page's own mock overrides (`.46/.36/.8` scrim, `#ecdcc2` 600/.18em eyebrow, 1.08 h1
       * leading, 19px `#f1ece2` lede). The `<video>` background is copied verbatim from Home's
       * hero (same attributes, poster and classes). CTA is a `ButtonLink` primary.
       */}
      {preview ? <div {...binding("hero")}>{heroNode}</div> : heroNode}
      {/*
       * "Welcome to Central Hill": `core/ui`'s `IntroSplit` (see its docstring for why
       * `TwoColumnShowcase` doesn't fit) in the plain section shell, one `Reveal`. The guarantee
       * line renders only when set (icon = `guarantee_icon_key` or `percentage-circle`); the media
       * is `welcomeSideMedia()` or the approved mock photo (lazy), sized by the component to
       * cover its full-height cell. Alt = `image_alt` → asset alt → `pages.guests.welcomeAlt`.
       */}
      <section {...binding("welcome")} className={SECTION_SHELL}>
        <div className={SECTION_WRAP}>
          <Reveal label="guests-welcome">
            <IntroSplit
              headline={welcome.headline}
              lede={welcome.lede || undefined}
              paragraphs={welcome.copy
                .split(/\n{2,}/)
                .map((block) => block.trim())
                .filter(Boolean)}
              badge={
                welcome.guarantee_label
                  ? {
                      icon: (
                        <Icon name={welcome.guarantee_icon_key || "percentage-circle"} size={22} />
                      ),
                      label: welcome.guarantee_label,
                    }
                  : undefined
              }
              image={
                welcomeSideMedia(welcomeMedia, welcomeAlt) ?? (
                  // eslint-disable-next-line @next/next/no-img-element -- external TEMP fallback, not an R2 asset
                  <img
                    src={WELCOME_FALLBACK_IMG}
                    alt={welcomeAlt}
                    loading="lazy"
                    decoding="async"
                  />
                )
              }
            />
          </Reveal>
        </div>
      </section>
      {/*
       * Every `Reveal` renders hidden on the server and only un-hides via JS, so this keeps all
       * of them visible with JS off — the same rule as Home's.
       */}
      <noscript>
        <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
      </noscript>

      {/*
       * "Why Book Directly With Us?": the section shell on the warm `alt` band, a centred
       * `SectionHead`, then `core/ui`'s `BenefitCards` + CTA (see its docstring for why
       * `NumberedFeatureGrid`/`IconFeatureGrid`/`PhotoFeatureGrid` don't fit). The head and the
       * cards each have their own `Reveal`; the original per-card `.reveal-stagger` becomes one
       * fade. Icons come from `why.benefits`' `icon_key`s; an empty `cta.note` is omitted.
       */}
      <section {...binding("why")} className={`${SECTION_SHELL} ${ALT_BAND}`}>
        <div className={SECTION_WRAP}>
          <Reveal>
            <SectionHead
              align="center"
              headline={content.why.headline}
              intro={content.why.intro || undefined}
            />
          </Reveal>
          <Reveal label="guests-why">
            <BenefitCards
              items={whyItems}
              cta={{
                href: routes.buildings,
                label: `${content.why.cta.label} →`,
                note: content.why.cta.note,
              }}
            />
          </Reveal>
        </div>
      </section>

      {/* Featured properties — cards from the buildings slice, headings from `guest.portfolio`. */}
      <div {...binding("portfolio")} id="portfolio" className="scroll-mt-[84px] [&_section]:py-[70px]">
        <FeaturedPortfolio
          locale={locale}
          showEyebrow={false}
          title={portfolio.headline}
          intro={portfolio.intro}
          ctaLabel={portfolio.cta.label}
          ctaNote={portfolio.cta.note || undefined}
          ctaHref={routes.buildings}
        />
      </div>

      {/*
       * "Make the Most of Your Stay" services teaser: the section shell on the `alt` band, a
       * centred `SectionHead`, then `core/ui`'s `PhotoFeatureGrid` + CTA (see its docstring for
       * the `IconFeatureGrid`/`StepGallery` comparison). The head and the grid each have their
       * own `Reveal`. The shell keeps the mock's metrics rather than `core/ui`'s generic
       * `Section`/`Container`, so its edges line up with the neighbouring sections.
       */}
      {services.some((service) => service.slug) || preview ? <section {...binding("services_teaser")} className={`${SECTION_SHELL} ${ALT_BAND}`}>
        <div className={SECTION_WRAP}>
          <Reveal>
            <SectionHead
              align="center"
              headline={content.services_teaser.headline}
              intro={content.services_teaser.intro || undefined}
            />
          </Reveal>
          <Reveal label="guests-services-teaser">
            <GuestServiceCards
              services={services}
              locale={locale}
              prevLabel={t("servicesCarousel.prev")}
              nextLabel={t("servicesCarousel.next")}
              cta={{
                href: routes.services,
                label: `${content.services_teaser.cta.label} →`,
                note: content.services_teaser.cta.note,
              }}
            />
          </Reveal>
        </div>
      </section> : null}

      {/* The published Guides catalogue, with the same card carousel as Services. */}
      {guides.length > 0 || preview ? <section {...binding("activities_teaser")} className={SECTION_SHELL}>
        <div className={SECTION_WRAP}>
          <Reveal>
            <SectionHead
              align="center"
              headline={content.activities_teaser.headline}
              intro={content.activities_teaser.intro || undefined}
            />
          </Reveal>
          <Reveal label="guests-activities-teaser">
            <GuestGuideCards
              guides={guides}
              locale={locale}
              icons={globals?.icons ?? SITE_ICON_DEFAULTS}
              prevLabel={t("guidesCarousel.prev")}
              nextLabel={t("guidesCarousel.next")}
              cta={{
                href: routes.guides,
                label: `${content.activities_teaser.cta.label} →`,
                note: content.activities_teaser.cta.note,
              }}
            />
          </Reveal>
        </div>
      </section> : null}

      {/* Guest reviews — the same shared marquee as Home/Owners, filtered to `audience='guest'`. */}
      <div {...binding("testimonials")} id="testimonials" className="scroll-mt-[84px] [&_section]:py-[70px]">
        <TestimonialsRow
          locale={locale}
          audience="guest"
          showEyebrow={false}
          title={orMessage(content.testimonials?.title, t("reviews.titleGuests"))}
          intro={content.testimonials?.intro}
        />
      </div>

      {faqGroupKey ? (
        <div {...binding("faq")} id="faq" className="scroll-mt-[84px] [&_section]:py-[70px]">
          <FaqSection
            locale={locale}
            groupKey={faqGroupKey}
            title={orMessage(content.faq?.title, t("faqTitle"))}
          />
        </div>
      ) : null}

      {/*
       * Closing guest/owner dual CTA: `core/ui`'s `SplitCtaPanels` (see its docstring for why
       * it's neither `DualCtaPanels` nor `FeaturePanel`) in the plain section shell, one `Reveal`.
       * React escapes the admin copy; the guest button opens Buildings (fixed route, `ctaRoutes`)
       * and the owner button is the settings `ContactDialog` (the header's dialog, same texts
       * unless overridden), styled with the dark panel's own button class and "→" so it looks
       * identical; an empty contact line is omitted by the component.
       */}
      <section {...binding("dual_cta")} className={SECTION_SHELL}>
        <div className={SECTION_WRAP}>
          <Reveal label="guests-dual-cta">
            <SplitCtaPanels
              panels={[
                {
                  tone: "light",
                  title: dualCta.guest.title,
                  body: dualCta.guest.body,
                  cta: { href: routes.buildings, label: dualCta.guest.cta.label },
                  contactLine: contactLines.guest,
                },
                {
                  tone: "dark",
                  title: dualCta.owner.title,
                  body: dualCta.owner.body,
                  action: (
                    <ContactDialog
                      label={`${dualCta.owner.cta.label} →`}
                      title={orMessage(dualCta.owner.contact?.title, tSettings("contactDialog.title"))}
                      intro={orMessage(dualCta.owner.contact?.intro, tSettings("contactDialog.intro"))}
                      source="guests-dual-cta"
                      triggerClassName={splitCtaButtonClassName("dark")}
                    />
                  ),
                  contactLine: contactLines.owner,
                },
              ]}
            />
          </Reveal>
        </div>
      </section>
    </>
  );
}
