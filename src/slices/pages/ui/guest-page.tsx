import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@core/db/columns";
import { MediaImage } from "@core/media";
import { ButtonLink, Hero, IntroSplit, PhotoFeatureGrid, Reveal, SplitCtaPanels } from "@core/ui";
import { getGlobals } from "@slices/settings/contract";
import { getGuestPage, type GuestContent } from "../contract";
import { FaqSection } from "./components/faq-section";
import { FeaturedPortfolio } from "./components/featured-portfolio";
import { ScrollReveal } from "./components/scroll-reveal";
import { TestimonialsRow } from "./components/testimonials-row";

/**
 * Guests page — the approved `mock/guest.html` layout inside the live app shell, now fully
 * DB-driven (docs/specs/guest-page-db-wiring.md). The mock's body markup is rendered as a
 * scoped HTML string (page-only styles under `.mk`; the shared design system lives in
 * `src/app/mock.css`) with every text/image value interpolated from the `guest`
 * `page_content` row, resolved for the locale. Nothing on this page is hard-coded copy.
 *
 * Composed from other slices at render time, so publishing there refreshes this page:
 *   - featured portfolio cards → buildings (`FeaturedPortfolio`)
 *   - guest reviews → testimonials, `audience='guest'` (`TestimonialsRow`, /admin/testimonials)
 *   - optional FAQ accordion → faq, chosen per page via `faq_group_key`
 *   - dual-CTA contact line (phone / email / WhatsApp) → company_settings (`getGlobals`)
 * Those three React islands render OUTSIDE the `.mk` wrapper so `mock.css`'s bare-element
 * rules don't leak into their Tailwind markup; the static body is split around them.
 *
 * The hero is real JSX now — `core/ui`'s `<Hero compact align="center">`, rendered outside
 * (before) `.mk` — not raw `dangerouslySetInnerHTML` markup. It uses exactly the Buildings
 * listing / Real Estate hero configuration (centred copy, 1600px/40px wrap, 26ch h1, 60ch p,
 * `.5/.46/.88` scrim, default eyebrow, `ButtonLink` primary CTA) for cross-page consistency —
 * this page's former `.mk[data-page="guests"] .hero` overrides were the same compact/centred
 * treatment, differing only by a hair (`.46/.36/.8` scrim, the mock's eyebrow/lede type). The
 * background is Home's hero `<video>` element verbatim (autoplay/muted/loop/playsInline, the
 * poster attribute, `absolute inset-0 -z-10 h-full w-full object-cover`), so the poster still
 * paints first and loading is unchanged. Still DB-driven exactly as before (`hero.eyebrow`,
 * `headline`, `subheadline`, `cta` → `localizeUrl`, `video_media_id` → R2 url or the fallback
 * clip).
 *
 * The "Welcome to Central Hill" intro right under it is real JSX too: `core/ui`'s new
 * `IntroSplit` (headline + lede + paragraphs + optional inline guarantee line beside one cover
 * image — see its docstring for why `TwoColumnShowcase`, the nearest existing component, doesn't
 * fit structurally), ported 1:1 from the old `.welcome`/`.guarantee` CSS, with the same
 * section/wrap shell + single `Reveal` at the call site as the dual CTA below, rendered outside
 * (before) `.mk`. The old raw `<!-- WELCOME -->` block, its `PAGE_STYLE` rules, the
 * `paragraphs()` helper and the `mediaImgTag` string image are gone; the image is now a
 * `MediaImage` (R2 asset) or the lazy fallback `<img>`, same pattern as Real Estate's `#manage`.
 * `bodyTop` now starts at WHY BOOK DIRECTLY.
 *
 * The "Make the Most of Your Stay" services teaser is real JSX now: `core/ui`'s new
 * `PhotoFeatureGrid` (see that component's docstring for why it's neither `IconFeatureGrid`
 * nor `StepGallery`, and for the deliberate mock-vs-live-render chrome deviation it ports).
 * Its `sec-head` (eyebrow/headline/intro) stays raw markup — still DB-content, built through
 * the existing `secHead()` helper — in its own small `.mk[data-page="guests"]` wrapper (kept
 * `data-page`-scoped, not bare `.mk`, so it still picks up `<ScrollReveal page="guests">`'s
 * `document.querySelectorAll('.mk[data-page="guests"] .pre-reveal')` sweep and keeps its
 * scroll-fade-in, unlike About's bare-`.mk` precedent for the same split which loses it).
 *
 * The immediately adjacent "The Best of Portugal" what-to-do teaser is real JSX too, ported the
 * same way with the same `PhotoFeatureGrid` configuration (the old `bodyActivitiesTeaser()` HTML
 * string, its `.mk` wrapper and the `.feat-grid`/`.feat` `PAGE_STYLE` rules are gone): its
 * `sec-head` stays raw (`activitiesTeaserSecHead()`) in its own small `.mk[data-page="guests"]`
 * wrapper, grid + CTA in one `Reveal` outside `.mk`. Only two differences from the services call
 * site, both carried over from the original markup: no `.alt` tint on its `<section>`, and the
 * CTA is `variant: "ghost"` (the original `btn-ghost`).
 *
 * The closing guest/owner dual CTA is real JSX too: `core/ui`'s `SplitCtaPanels` (the old
 * `bodyBottom()` HTML string + its trailing `.mk` wrapper are gone), with its section/wrap
 * shell and single `Reveal` at the call site, outside `.mk`, same technique as the services
 * teaser. Its contact lines are still built here from company_settings (`dualCtaContactLines`).
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

// Escape admin-authored content before it is interpolated into the static body HTML string.
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s: string) => esc(s).replace(/"/g, "&quot;");

/**
 * Iconoir glyph class for a card's `icon_key`. The font is loaded globally by `mock.css`, so
 * a valid key renders directly. Unknown/legacy keys (e.g. the demo seed's `"spark"`) fall
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

type IconCard = { icon_key: string; title: string; description: string };
type Cta = { label: string; url: string; note?: string };

/**
 * The mock's `.bcard` icon card (Why book directly). The photo-backed `.feat` wrapper the two
 * teasers used to share is gone — both teasers are `core/ui`'s `PhotoFeatureGrid` now, whose
 * photos are passed per item (`SERVICES_TEASER_BG` / `ACTIVITIES_TEASER_BG`, by position).
 */
const iconCards = (items: IconCard[]): string =>
  items
    .map(
      (c) =>
        `<div class="bcard"><i class="ico ${iconClass(c.icon_key)}" aria-hidden="true"></i>` +
        `<h3>${esc(c.title)}</h3><p>${esc(c.description)}</p></div>`,
    )
    .join("");

/** The mock's centred section header (eyebrow + title + lede); optional parts are omitted. */
const secHead = (opts: { eyebrow?: string; headline: string; intro?: string }): string =>
  `<div class="sec-head center reveal reveal-io pre-reveal">
      ${opts.eyebrow ? `<span class="eyebrow">${esc(opts.eyebrow)}</span>` : ""}
      <h2 class="section-title">${esc(opts.headline)}</h2>
      ${opts.intro ? `<p class="lede" style="margin:16px auto 0">${esc(opts.intro)}</p>` : ""}
    </div>`;

/** The mock's centred CTA row (accent button + optional helper note) — Why book directly only. */
const ctaRow = (cta: Cta, locale: Locale): string =>
  `<div class="cta-row reveal" style="justify-content:center">` +
  `<a class="btn btn-accent" href="${escAttr(localizeUrl(cta.url, locale))}">${esc(cta.label)} →</a>` +
  `${cta.note ? `<span class="cta-note">${esc(cta.note)}</span>` : ""}</div>`;

const PAGE_STYLE = `
/* hero + welcome — now real JSX (core/ui's Hero / IntroSplit, rendered outside .mk before
   it), so no hero or .welcome/.guarantee CSS is left here. */

.mk .ico{font-size:30px;line-height:1;color:var(--accent-deep);display:inline-block;margin-bottom:18px}
.mk[data-page="guests"] .bcard{transition:transform .35s var(--ease),box-shadow .35s var(--ease)}
.mk[data-page="guests"] .bcard:hover{transform:translateY(-4px);box-shadow:0 16px 28px -20px rgba(0,0,0,.35)}
.mk[data-page="guests"] .bcard .ico{transition:transform .35s var(--ease),color .35s var(--ease)}
.mk[data-page="guests"] .bcard:hover .ico{transform:translateY(-3px) scale(1.1);color:var(--accent)}

/* Page-wide entrance motion (immediate on load for above-the-fold content, on scroll for
   the rest, via <ScrollReveal page="guests">/scroll-reveal.tsx) + hover motion — same
   pattern already applied to the About page. The hidden state is baked straight into the
   server-rendered markup (.pre-reveal, applied via secHead()/the sections below) so
   there's no flash of visible-then-hidden; the <noscript> rule keeps content visible with
   JS off. Scoped to [data-page="guests"] so it never touches the shared, neutralised
   .reveal rule in mock.css or any other page. */
.mk[data-page="guests"] .reveal-io{transition:opacity .7s var(--ease),transform .7s var(--ease)}
.mk[data-page="guests"] .reveal-io.pre-reveal{opacity:0;transform:translateY(18px)}
`;

/**
 * Why book directly — above the featured-portfolio island. (The hero and the Welcome intro above
 * it are real JSX now, rendered by `GuestPage` before the `.mk` wrapper.)
 */
function bodyTop(content: GuestContent, locale: Locale): string {
  const { why } = content;

  return `
<!-- WHY BOOK DIRECTLY -->
<section class="alt">
  <div class="wrap">
    ${secHead({ eyebrow: why.eyebrow, headline: why.headline, intro: why.intro })}
    <div class="grid-3 reveal reveal-io reveal-stagger pre-reveal" style="grid-template-columns:repeat(4,1fr)">
      ${iconCards(why.benefits)}
    </div>
    ${ctaRow(why.cta, locale)}
  </div>
</section>
`;
}

/**
 * Services teaser's `sec-head` only (eyebrow/headline/intro) — the grid + CTA are real JSX now
 * (`core/ui`'s `PhotoFeatureGrid`, wired at the `GuestPage` call site). Still raw markup, given
 * its own small `.mk[data-page="guests"]` wrapper there — see `GuestPage`'s own doc comment for
 * why it keeps the `data-page` scope (unlike About's bare-`.mk` precedent for the same kind of
 * split) rather than going bare.
 */
function servicesTeaserSecHead(content: GuestContent): string {
  const { services_teaser: services } = content;
  return secHead({ eyebrow: services.eyebrow, headline: services.headline, intro: services.intro });
}

/**
 * What-to-do teaser's `sec-head` only (eyebrow/headline/intro) — the grid + CTA are real JSX now
 * (`core/ui`'s `PhotoFeatureGrid`, wired at the `GuestPage` call site), exactly the same split as
 * `servicesTeaserSecHead` above: still raw markup in its own small `.mk[data-page="guests"]`
 * wrapper so it keeps `<ScrollReveal page="guests">`'s scroll fade-in.
 */
function activitiesTeaserSecHead(content: GuestContent): string {
  const { activities_teaser: activities } = content;
  return secHead({ eyebrow: activities.eyebrow, headline: activities.headline, intro: activities.intro });
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
       * "Welcome to Central Hill" — real JSX now, `core/ui`'s new `IntroSplit` (see its docstring
       * for why `TwoColumnShowcase` doesn't fit: one `body` string, floating check badge). Same
       * shell technique as the dual CTA below: the original plain `<section>` (`.mk section` →
       * `padding:clamp(72px,10vw,150px) 0; scroll-margin-top:84px`, no tint) + `.wrap`
       * (1240px/28px) at the exact mock metrics, and the original single
       * `.welcome.reveal-io.pre-reveal` fade-in → one `Reveal`. Rendered outside `.mk`
       * (Lesson 1). Still DB-driven: `welcome.copy` is split into paragraphs on blank lines
       * (the old `paragraphs()` rule), the guarantee line renders only when set, and the image is
       * the R2 asset via `MediaImage` or the approved mock photo (lazy), like Real Estate's
       * `#manage`. The component sizes the image to cover its full-height cell.
       */}
      <section className="scroll-mt-[84px] py-[clamp(72px,10vw,150px)]">
        <div className="mx-auto max-w-[1240px] px-[28px]">
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
      <div className="mk" data-page="guests">
        <style dangerouslySetInnerHTML={{ __html: PAGE_STYLE }} />
        <noscript>
          <style
            dangerouslySetInnerHTML={{
              // `[data-reveal]` too: the `Reveal`-wrapped welcome, teaser grids and dual CTA
              // render hidden server-side and only un-hide via JS (same fix as Real Estate).
              __html: `.mk[data-page="guests"] .pre-reveal,[data-reveal]{opacity:1!important;transform:none!important}`,
            }}
          />
        </noscript>
        <ScrollReveal page="guests" />
        <div dangerouslySetInnerHTML={{ __html: bodyTop(content, locale) }} />
      </div>

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
       * "Make the Most of Your Stay" services teaser — real JSX now, `core/ui`'s new
       * `PhotoFeatureGrid` (see its docstring + `GuestPage`'s top doc comment for the
       * IconFeatureGrid/StepGallery comparison and the mock-vs-live deviation it ports).
       * Section/wrap chrome is reproduced here at the exact mock metrics (`max-width:1240px;
       * padding:0 28px`, `padding:clamp(72px,10vw,150px) 0`, the `.alt` tint) rather than
       * `core/ui`'s generic `Section`/`Container` (different values — would misalign this
       * section's edges against its still-raw `.wrap`-based neighbours above/below), same
       * reasoning `NumberedFeatureGrid`'s About call site documents for the identical choice.
       * `sec-head` stays raw markup (still DB content) in its own small, `data-page`-scoped
       * `.mk` wrapper so it keeps its scroll-reveal; the grid+CTA render outside `.mk` entirely
       * (Lesson 1 — `.mk *{margin:0;padding:0}` would silently zero their Tailwind spacing).
       */}
      <section
        className="scroll-mt-[84px] bg-[color-mix(in_srgb,var(--color-line)_38%,var(--color-bg))] py-[clamp(72px,10vw,150px)]"
      >
        <div className="mx-auto max-w-[1240px] px-[28px]">
          <div className="mk" data-page="guests">
            <div dangerouslySetInnerHTML={{ __html: servicesTeaserSecHead(content) }} />
          </div>
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
       * "The Best of Portugal" what-to-do teaser — real JSX now, the same `PhotoFeatureGrid`
       * configuration as the services teaser above: same section/wrap shell at the mock metrics,
       * raw `sec-head` in its own `data-page`-scoped `.mk` wrapper, one `Reveal` around grid+CTA,
       * all outside `.mk` (Lesson 1). Two differences, both carried over from the original
       * markup: the `<section>` has no `.alt` tint (the original was a plain `<section>`, so the
       * page's alternating bands are kept), and the CTA is `variant: "ghost"` (`btn-ghost`).
       */}
      <section className="scroll-mt-[84px] py-[clamp(72px,10vw,150px)]">
        <div className="mx-auto max-w-[1240px] px-[28px]">
          <div className="mk" data-page="guests">
            <div dangerouslySetInnerHTML={{ __html: activitiesTeaserSecHead(content) }} />
          </div>
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
       * Closing guest/owner dual CTA — real JSX now, `core/ui`'s `SplitCtaPanels` (see its
       * docstring for why it's neither `DualCtaPanels` nor `FeaturePanel`). Same shell technique
       * as the services teaser above: the original `<section>` (`.mk section` →
       * `padding:clamp(72px,10vw,150px) 0; scroll-margin-top:84px`, no tint) and `.wrap`
       * (1240px/28px) reproduced at their exact mock metrics, and the original single
       * `.dual.reveal-io.pre-reveal` scroll fade-in → one `Reveal` around the grid. Rendered
       * outside `.mk` entirely (Lesson 1). React escapes the admin copy; CTA urls still go
       * through `localizeUrl`; an empty contact line is omitted by the component.
       */}
      <section className="scroll-mt-[84px] py-[clamp(72px,10vw,150px)]">
        <div className="mx-auto max-w-[1240px] px-[28px]">
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
