import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@core/db/columns";
import { MediaImage } from "@core/media";
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
import { getGlobals } from "@slices/settings/contract";
import { getGuestPage } from "../contract";
import { FaqSection } from "./components/faq-section";
import { FeaturedPortfolio } from "./components/featured-portfolio";
import { TestimonialsRow } from "./components/testimonials-row";

/**
 * Guests page: the guest-facing landing, built from `mock/guest.html` and now composed entirely
 * from `core/ui` and slice React components. No `.mk` wrapper, raw HTML strings or page
 * `<style>` remain. Every text value comes from the `guest` `page_content` row for the locale
 * (docs/specs/guest-page-db-wiring.md); nothing here is hard-coded copy. The header, footer and
 * i18n come from the app layout.
 *
 * Sections, top to bottom:
 * - Hero: `Hero` (compact, centred) with Buildings' listing-hero configuration, over Home's
 *   `<video>` background (the poster paints first).
 * - "Welcome to Central Hill": `IntroSplit` (copy split into paragraphs on blank lines, optional
 *   guarantee line, R2 `MediaImage` or the approved mock photo).
 * - "Why Book Directly" (warm `alt` band): a centred `SectionHead`, then `BenefitCards` + CTA.
 * - `#portfolio`: `FeaturedPortfolio` (cards from the buildings slice).
 * - Services teaser (`alt` band) and what-to-do teaser (plain, ghost CTA): a centred
 *   `SectionHead`, then `PhotoFeatureGrid` + CTA.
 * - `#testimonials`: `TestimonialsRow`, `audience='guest'`.
 * - `#faq`: the shared `FaqSection` island, picked by `faq_group_key` (only when set).
 * - Closing dual CTA: `SplitCtaPanels`, contact lines from company_settings (`getGlobals`).
 * The hand-written sections share the mock's shell (`clamp(72px,10vw,150px)` vertical padding,
 * 84px scroll margin, a 1240px/28px column).
 *
 * Composed from other slices at render time, so publishing there refreshes this page: buildings
 * (portfolio), testimonials, faq and settings (dual-CTA contact line).
 *
 * Entrance motion is `core/ui`'s `Reveal` throughout (call-site wrappers, one per head and one
 * per body). The `<noscript>` rule keeps every `[data-reveal]` visible with JS off, as Home does.
 * Where this page's mock differed from a sibling page using the same component, the user chose
 * cross-page consistency over mock fidelity; each component's docstring records those choices.
 *
 * Icons are Iconoir CSS classes from the admin-editable `icon_key`s (`iconClass`). The Iconoir
 * stylesheet is only loaded through `src/app/mock.css`'s `@import`, which is why the route file
 * still imports `mock.css` (no `.mk` markup on this page depends on it any more).
 */

// Media fallbacks = the approved mock assets, used 1:1 until a real R2 asset is set in the
// backoffice (`*_media_id` may be blank, or seeded to an id with no uploaded asset yet).
const HERO_FALLBACK_VIDEO =
  "https://videos.pexels.com/video-files/16592055/16592055-hd_1920_1080_60fps.mp4";
const HERO_FALLBACK_POSTER =
  "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1900&q=72";
const WELCOME_FALLBACK_IMG =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=70";
const WELCOME_FALLBACK_ALT = "Bright, design-led Central Hill apartment interior";
// The welcome photo is the narrower of two columns in the 1240px `.wrap` (.95fr of
// 1.05fr/.95fr with a 56px gap) and goes full-width at ≤880px — see `core/ui`'s `IntroSplit`.
const WELCOME_SIZES = "(max-width: 880px) 100vw, 540px";

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
 * Iconoir glyph class for a card's `icon_key`. The Iconoir stylesheet is loaded by `mock.css`'s
 * `@import` (the route still imports it for that alone), so a valid key renders directly. Unknown/legacy keys (e.g. the demo seed's `"spark"`) fall
 * back to the decorative `sparks` glyph rather than rendering an empty box.
 */
const ICON_FALLBACK = "iconoir-sparks";
const iconClass = (key: string): string =>
  key.length > 0 && key.length <= 64 && /^[a-z0-9-]+$/.test(key)
    ? `iconoir-${key}`
    : ICON_FALLBACK;

/**
 * Rewrite an own-site `/en/…` CTA link to the active locale. Stored CTA urls must be absolute
 * (`cta.url` is `z.url()`, so a relative path cannot be saved) and are authored in English, so
 * without this a Portuguese visitor would be sent to the English route. External links and
 * anything unparseable pass through untouched.
 */
function localizeUrl(raw: string, locale: Locale): string {
  try {
    const u = new URL(raw);
    if (!/(^|\.)centralhill\.pt$/.test(u.hostname)) return raw;
    u.pathname = u.pathname.replace(/^\/(en|pt|es|fr)(?=\/|$)/, `/${locale}`);
    return u.toString();
  } catch {
    return raw;
  }
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
  const faqGroupKey = content.faq_group_key ?? "";
  const dualCta = content.dual_cta;
  const contactLines = dualCtaContactLines(globals);

  const whyItems = content.why.benefits.map((item) => ({
    icon: <i className={iconClass(item.icon_key)} aria-hidden="true" />,
    title: item.title,
    description: item.description,
  }));
  const servicesTeaserItems = content.services_teaser.items.map((item, i) => ({
    icon: <i className={iconClass(item.icon_key)} aria-hidden="true" />,
    title: item.title,
    description: item.description,
    image: SERVICES_TEASER_BG[i],
  }));
  const activitiesTeaserItems = content.activities_teaser.items.map((item, i) => ({
    icon: <i className={iconClass(item.icon_key)} aria-hidden="true" />,
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
            poster={HERO_FALLBACK_POSTER}
          >
            <source
              src={media[hero.video_media_id ?? ""]?.url ?? HERO_FALLBACK_VIDEO}
              type="video/mp4"
            />
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
          <ButtonLink href={localizeUrl(hero.cta.url, locale)}>{`${hero.cta.label} →`}</ButtonLink>
        }
      />
      {/*
       * "Welcome to Central Hill": `core/ui`'s `IntroSplit` (see its docstring for why
       * `TwoColumnShowcase` doesn't fit) in the plain section shell, one `Reveal`. The guarantee
       * line renders only when set; the image is the R2 asset via `MediaImage` or the approved
       * mock photo (lazy), sized by the component to cover its full-height cell.
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
                        <i className="iconoir-percentage-circle text-[22px]" aria-hidden="true" />
                      ),
                      label: welcome.guarantee_label,
                    }
                  : undefined
              }
              image={
                welcomeMedia?.url && welcomeMedia.width > 0 && welcomeMedia.height > 0 ? (
                  <MediaImage
                    data={{ ...welcomeMedia, alt: welcomeMedia.alt || WELCOME_FALLBACK_ALT }}
                    sizes={WELCOME_SIZES}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- external TEMP fallback, not an R2 asset
                  <img
                    src={welcomeMedia?.url || WELCOME_FALLBACK_IMG}
                    alt={welcomeMedia?.alt || WELCOME_FALLBACK_ALT}
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
       * fade. Icons come from `why.benefits` via `iconClass`; an empty `cta.note` is omitted.
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
                href: localizeUrl(content.why.cta.url, locale),
                label: `${content.why.cta.label} →`,
                note: content.why.cta.note,
              }}
            />
          </Reveal>
        </div>
      </section>

      {/* Featured properties — cards from the buildings slice, headings from `guest.portfolio`. */}
      <div id="portfolio" style={{ scrollMarginTop: 130 }}>
        <FeaturedPortfolio
          locale={locale}
          eyebrow={portfolio.eyebrow}
          title={portfolio.headline}
          intro={portfolio.intro}
          ctaLabel={portfolio.cta.label}
          ctaHref={localizeUrl(portfolio.cta.url, locale)}
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
                href: localizeUrl(content.services_teaser.cta.url, locale),
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
                href: localizeUrl(content.activities_teaser.cta.url, locale),
                label: `${content.activities_teaser.cta.label} →`,
                note: content.activities_teaser.cta.note,
                variant: "ghost",
              }}
            />
          </Reveal>
        </div>
      </section>

      {/* Guest reviews — the same shared marquee as Home/Owners, filtered to `audience='guest'`. */}
      <div id="testimonials" style={{ scrollMarginTop: 130 }}>
        <TestimonialsRow locale={locale} audience="guest" title={t("reviews.titleGuests")} />
      </div>

      {faqGroupKey ? (
        <div id="faq" style={{ scrollMarginTop: 130 }}>
          <FaqSection
            locale={locale}
            groupKey={faqGroupKey}
            title={t("faqTitle")}
          />
        </div>
      ) : null}

      {/*
       * Closing guest/owner dual CTA: `core/ui`'s `SplitCtaPanels` (see its docstring for why
       * it's neither `DualCtaPanels` nor `FeaturePanel`) in the plain section shell, one `Reveal`.
       * React escapes the admin copy; CTA urls go through `localizeUrl`; an empty contact line
       * is omitted by the component.
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
                  cta: { href: localizeUrl(dualCta.guest.cta.url, locale), label: dualCta.guest.cta.label },
                  contactLine: contactLines.guest,
                },
                {
                  tone: "dark",
                  eyebrow: dualCta.owner.eyebrow,
                  title: dualCta.owner.title,
                  body: dualCta.owner.body,
                  cta: { href: localizeUrl(dualCta.owner.cta.url, locale), label: dualCta.owner.cta.label },
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
