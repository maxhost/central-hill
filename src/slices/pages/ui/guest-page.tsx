import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@core/db/columns";
import {
  BenefitCards,
  ButtonLink,
  Hero,
  IntroSplit,
  PhotoFeatureGrid,
  Reveal,
  SectionHead,
  SplitCtaPanels,
} from "@core/ui";
import { Icon } from "@core/ui/icon";
import { getGlobals } from "@slices/settings/contract";
import { getGuestPage, type PageMedia } from "../contract";
import { FaqSection } from "./components/faq-section";
import { FeaturedPortfolio } from "./components/featured-portfolio";
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
 * - Services teaser (`alt` band) and what-to-do teaser (plain, ghost CTA): a centred
 *   `SectionHead`, then `PhotoFeatureGrid` + CTA.
 * - `#testimonials`: `TestimonialsRow`, `audience='guest'`; heading from `testimonials.*`
 *   (blank → `pages.reviews.eyebrow` / `titleGuests`, no intro).
 * - `#faq`: the shared `FaqSection` island, picked by `faq_group_key` (only when set); title
 *   from `faq.title` (blank → `pages.faqTitle`).
 * - Closing dual CTA: `SplitCtaPanels`, contact lines from company_settings (`getGlobals`).
 * Every section, including the shared slice ones (portfolio, testimonials, FAQ), uses the same
 * shell (`clamp(72px,10vw,150px)` vertical padding, 84px scroll margin, a 1240px/28px column)
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

// Shell shared by the hand-written sections: the mock's `section` padding and 84px scroll
// margin, its 1240px/28px `.wrap` column, and its warm `.alt` band (the same `color-mix`
// formula Real Estate, `TwoColumnShowcase` and `StepGallery` use).
const SECTION_SHELL = "scroll-mt-[84px] py-[clamp(72px,10vw,150px)]";
const SECTION_WRAP = "mx-auto max-w-[1240px] px-[28px]";
const ALT_BAND = "bg-[color-mix(in_srgb,var(--color-line)_38%,var(--color-bg))]";

// Premium photo backgrounds for the Services/What-to-do teaser cards (Pexels stock, by
// position — placeholder until these cards get their own admin-managed image field).
const SERVICES_TEASER_BG = [
  "https://images.pexels.com/photos/29112731/pexels-photo-29112731.jpeg?auto=compress&cs=tinysrgb&w=1200", // Private Transfers
  "https://images.pexels.com/photos/19627783/pexels-photo-19627783.jpeg?auto=compress&cs=tinysrgb&w=1200", // Day Tours
  "https://images.pexels.com/photos/4581314/pexels-photo-4581314.jpeg?auto=compress&cs=tinysrgb&w=1200", // Boat Trips
  "https://images.pexels.com/photos/21706254/pexels-photo-21706254.jpeg?auto=compress&cs=tinysrgb&w=1200", // Surf Experience
  "https://images.pexels.com/photos/18337050/pexels-photo-18337050.jpeg?auto=compress&cs=tinysrgb&w=1200", // Chef at Home
  "https://images.pexels.com/photos/34629931/pexels-photo-34629931.jpeg?auto=compress&cs=tinysrgb&w=1200", // Luggage Storage
];
const ACTIVITIES_TEASER_BG = [
  "https://images.pexels.com/photos/31630076/pexels-photo-31630076.jpeg?auto=compress&cs=tinysrgb&w=1200", // Historic Districts
  "https://images.pexels.com/photos/8163130/pexels-photo-8163130.jpeg?auto=compress&cs=tinysrgb&w=1200", // UNESCO Sites
  "https://images.pexels.com/photos/35554378/pexels-photo-35554378.jpeg?auto=compress&cs=tinysrgb&w=1200", // Food & Wine
  "https://images.pexels.com/photos/20715202/pexels-photo-20715202.jpeg?auto=compress&cs=tinysrgb&w=1200", // Beaches
  "https://images.pexels.com/photos/25016471/pexels-photo-25016471.jpeg?auto=compress&cs=tinysrgb&w=1200", // Music & Festivals
  "https://images.pexels.com/photos/16382447/pexels-photo-16382447.jpeg?auto=compress&cs=tinysrgb&w=1200", // Day Trips & Hidden Gems
];

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
    // S5 turns the owner panel's button into the contact dialog; until then it opens Owners.
    owners: `/${locale}/owners`,
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

export async function GuestPage({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const [page, globals, t] = await Promise.all([
    getGuestPage(locale),
    getGlobals(locale),
    getTranslations("pages"),
  ]);
  if (!page) notFound();

  const { content, media } = page;
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

  const whyItems = content.why.benefits.map((item) => ({
    icon: <Icon name={item.icon_key} size={30} className="block" />,
    title: item.title,
    description: item.description,
  }));
  const servicesTeaserItems = content.services_teaser.items.map((item, i) => ({
    icon: <Icon name={item.icon_key} size={30} className="block" />,
    title: item.title,
    description: item.description,
    image: SERVICES_TEASER_BG[i],
  }));
  const activitiesTeaserItems = content.activities_teaser.items.map((item, i) => ({
    icon: <Icon name={item.icon_key} size={30} className="block" />,
    title: item.title,
    description: item.description,
    image: ACTIVITIES_TEASER_BG[i],
  }));

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
      <Hero
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
        wrapClassName="mx-auto max-w-[1600px] p-10"
        copyClassName="max-w-none"
        headlineClassName="max-w-[26ch] text-[clamp(2.5rem,5.4vw,4.25rem)]"
        subtitleClassName="mt-5 max-w-[60ch] text-lg"
        actionsClassName="mt-2"
        eyebrow={hero.eyebrow || undefined}
        headline={hero.headline}
        subtitle={hero.subheadline || undefined}
        actions={
          <ButtonLink href={routes.buildings}>{`${hero.cta.label} →`}</ButtonLink>
        }
      />
      {/*
       * "Welcome to Central Hill": `core/ui`'s `IntroSplit` (see its docstring for why
       * `TwoColumnShowcase` doesn't fit) in the plain section shell, one `Reveal`. The guarantee
       * line renders only when set (icon = `guarantee_icon_key` or `percentage-circle`); the media
       * is `welcomeSideMedia()` or the approved mock photo (lazy), sized by the component to
       * cover its full-height cell. Alt = `image_alt` → asset alt → `pages.guests.welcomeAlt`.
       */}
      <section className={SECTION_SHELL}>
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
      <section className={`${SECTION_SHELL} ${ALT_BAND}`}>
        <div className={SECTION_WRAP}>
          <Reveal>
            <SectionHead
              align="center"
              eyebrow={content.why.eyebrow || undefined}
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
      <div id="portfolio" className="scroll-mt-[84px]">
        <FeaturedPortfolio
          locale={locale}
          eyebrow={portfolio.eyebrow}
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
      <section className={`${SECTION_SHELL} ${ALT_BAND}`}>
        <div className={SECTION_WRAP}>
          <Reveal>
            <SectionHead
              align="center"
              eyebrow={content.services_teaser.eyebrow || undefined}
              headline={content.services_teaser.headline}
              intro={content.services_teaser.intro || undefined}
            />
          </Reveal>
          <Reveal label="guests-services-teaser">
            <PhotoFeatureGrid
              items={servicesTeaserItems}
              cta={{
                href: routes.services,
                label: `${content.services_teaser.cta.label} →`,
                note: content.services_teaser.cta.note,
              }}
            />
          </Reveal>
        </div>
      </section>

      {/*
       * "The Best of Portugal" what-to-do teaser: the services teaser's configuration, with two
       * differences carried over from the original markup: no `alt` tint (the page's
       * alternating bands are kept) and a ghost CTA (`btn-ghost`).
       */}
      <section className={SECTION_SHELL}>
        <div className={SECTION_WRAP}>
          <Reveal>
            <SectionHead
              align="center"
              eyebrow={content.activities_teaser.eyebrow || undefined}
              headline={content.activities_teaser.headline}
              intro={content.activities_teaser.intro || undefined}
            />
          </Reveal>
          <Reveal label="guests-activities-teaser">
            <PhotoFeatureGrid
              items={activitiesTeaserItems}
              cta={{
                href: routes.guides,
                label: `${content.activities_teaser.cta.label} →`,
                note: content.activities_teaser.cta.note,
                variant: "ghost",
              }}
            />
          </Reveal>
        </div>
      </section>

      {/* Guest reviews — the same shared marquee as Home/Owners, filtered to `audience='guest'`. */}
      <div id="testimonials" className="scroll-mt-[84px]">
        <TestimonialsRow
          locale={locale}
          audience="guest"
          eyebrow={orMessage(content.testimonials?.eyebrow, t("reviews.eyebrow"))}
          title={orMessage(content.testimonials?.title, t("reviews.titleGuests"))}
          intro={content.testimonials?.intro}
        />
      </div>

      {faqGroupKey ? (
        <div id="faq" className="scroll-mt-[84px]">
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
       * React escapes the admin copy; the guest button opens Buildings and the owner button
       * Owners (fixed routes, `ctaRoutes`); an empty contact line is omitted by the component.
       */}
      <section className={SECTION_SHELL}>
        <div className={SECTION_WRAP}>
          <Reveal label="guests-dual-cta">
            <SplitCtaPanels
              panels={[
                {
                  tone: "light",
                  eyebrow: dualCta.guest.eyebrow,
                  title: dualCta.guest.title,
                  body: dualCta.guest.body,
                  cta: { href: routes.buildings, label: dualCta.guest.cta.label },
                  contactLine: contactLines.guest,
                },
                {
                  tone: "dark",
                  eyebrow: dualCta.owner.eyebrow,
                  title: dualCta.owner.title,
                  body: dualCta.owner.body,
                  cta: { href: routes.owners, label: dualCta.owner.cta.label },
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
