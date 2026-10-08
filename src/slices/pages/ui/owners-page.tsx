import { Fragment } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { MediaImage } from "@core/media";
import type { Locale } from "@core/db/columns";
import {
  CalloutBand,
  EditorialSplit,
  FeatureCtaBand,
  Hero,
  PricingCards,
  Reveal,
  StatBand,
  StepGallery,
  TwoColumnShowcase,
} from "@core/ui";
import { Icon } from "@core/ui/icon";
import { ContactDialog } from "@slices/settings/contract";
import { getOwnersPage } from "../contract";
import { FaqSection } from "./components/faq-section";
import { OwnerEstimateForm } from "./components/owner-estimate-form";
import { TestimonialsRow } from "./components/testimonials-row";

// Benefit icons are each item's admin-editable `icon_key`, rendered by `core/ui` `<Icon>`
// (inline Iconoir SVG, ADR 0034).
const SERVICES_BADGE = "Every detail handled — you stay free.";
const DASHBOARD_BADGE = "Real-time data, from anywhere.";

// Image fallbacks = the approved mock photos, used 1:1 until a real R2 asset is set in the
// backoffice (the seeded `*_media_id`s have no uploaded asset yet → resolved media is absent).
const HERO_FALLBACK_IMG =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1900&q=72";
const HERO_FALLBACK_ALT = "Bright, designer-furnished Lisbon apartment interior";

/**
 * Owners page — a focused conversion landing, now composed entirely from `core/ui`/slice React
 * components (no more `.mk`/`dangerouslySetInnerHTML` raw-markup body — see `src/app/mock.css`
 * for the shared design system every section's Tailwind port was measured against). The static
 * body is split around shared React islands — the testimonials marquee and FAQ accordion — the
 * only pieces that read the DB beyond this page's own `page_content` row.
 *
 * Sections (owner direction): hero + earnings form, the animated "numbers" band, then the full
 * marketing flow — why / services / plans (up to 4 tiers) / journey (5 photo-card steps) /
 * technology / testimonials / faq / closing CTA. Per owner request the per-section *eyebrow*
 * labels were dropped (the big section titles stay); the "★ Earn +25%" badge sits inside the
 * form card (highlighted); `why` uses the home's Editorial-Split layout; `services` ("Everything
 * Handled") and `dashboard` ("Always in Sight") use the home's Image-Showcase layout (4 benefit
 * highlights + CTA beside a 4:5 image with a floating badge) — `dashboard` mirrored with the
 * image on the left; `journey` ("Your growth path") uses `core/ui`'s `StepGallery`; the closing
 * CTA ("Start Earning More Today") uses `core/ui`'s `FeatureCtaBand`, still fully hardcoded (no
 * schema field yet — a separate follow-up); `testimonials` is the shared <TestimonialsRow>
 * marquee (the home "Partners & Guests" carousel). Marketing sections are mirrored in the owners
 * schema (editor-ready, drizzle 0005→0007).
 */

const SERVICES_FALLBACK_IMG =
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=72";
const SERVICES_FALLBACK_ALT = "Designer-furnished Lisbon apartment, guest-ready";
const DASHBOARD_FALLBACK_IMG =
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=72";
const DASHBOARD_FALLBACK_ALT = "Owner dashboard showing live revenue and occupancy";

// `services`/`dashboard`'s showcase images: one of `TwoColumnShowcase`'s two `lg:` (1024px)
// columns — same value Home's `guests-section.tsx` uses for the same component.
const TWO_COL_SHOWCASE_SIZES = "(max-width: 1024px) 100vw, 560px";

// TEMP: Pexels placeholders (client direction — trying a photo-background treatment on the
// "growth path" cards; #core/media assets not uploaded yet) — swap for real R2 assets once
// the client picks final photography. One per step, positional.
const JOURNEY_FALLBACK_IMGS = [
  "https://images.pexels.com/photos/259962/pexels-photo-259962.jpeg?auto=compress&cs=tinysrgb&w=900",
  "https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=900",
  "https://images.pexels.com/photos/210265/pexels-photo-210265.jpeg?auto=compress&cs=tinysrgb&w=900",
  "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=900",
  "https://images.pexels.com/photos/313782/pexels-photo-313782.jpeg?auto=compress&cs=tinysrgb&w=900",
];
// `StepGallery`'s photo cards: one of its 5 (desktop)/2 (tablet)/1 (mobile) grid cells.
const JOURNEY_STEP_IMG_SIZES = "(max-width: 680px) 100vw, (max-width: 980px) 50vw, 20vw";

// TEMP: Pexels placeholder for the closing CTA band's photo column (no schema field for this
// section yet — the whole band is still hardcoded, same as before this port).
const CTA_FALLBACK_IMG =
  "https://images.pexels.com/photos/1732414/pexels-photo-1732414.jpeg?auto=compress&cs=tinysrgb&w=1200";
const CTA_FALLBACK_ALT = "A Central Hill managed property at golden hour, overlooking the coast";

export async function OwnersPage({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const [page, t] = await Promise.all([getOwnersPage(locale), getTranslations("pages")]);
  if (!page) notFound();

  const { content, media } = page;
  const { hero, earnings_form, stats, why, services, plans, journey, dashboard } = content;
  const faqGroupKey = content.faq_group_key ?? "";

  const whyItems = why.benefits.map((b) => ({
    icon: <Icon name={b.icon_key} size={28} className="mt-0.5 flex-none text-accent-deep" />,
    title: b.title,
    description: b.description,
  }));

  const servicesBullets = services.benefits.map((b) => ({
    icon: <Icon name={b.icon_key} size={26} className="mt-0.5 flex-none text-accent-deep" />,
    title: b.title,
    description: b.description,
  }));
  const servicesMedia = media[services.image_media_id ?? ""];

  const dashboardBullets = dashboard.benefits.map((b) => ({
    icon: <Icon name={b.icon_key} size={26} className="mt-0.5 flex-none text-accent-deep" />,
    title: b.title,
    description: b.description,
  }));
  const dashboardMedia = media[dashboard.image_media_id ?? ""];

  const journeyItems = journey.steps.map((s, i) => {
    const stepMedia = media[s.image_media_id ?? ""];
    return {
      title: s.title,
      description: s.description,
      image: stepMedia ? (
        <MediaImage
          data={stepMedia}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-[1.06]"
          sizes={JOURNEY_STEP_IMG_SIZES}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- external TEMP fallback, not an R2 asset
        <img
          src={JOURNEY_FALLBACK_IMGS[i % JOURNEY_FALLBACK_IMGS.length]}
          alt={s.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-[1.06]"
        />
      ),
    };
  });

  const heroMedia = media[hero.image_media_id];
  // Authored with `;` between phrases so the design's stacked hero title ("Your Property" /
  // "Our Expertise" / "Maximum Returns") renders one phrase per line via `<br/>`. A headline
  // with no `;` renders as a single line, unchanged.
  const heroHeadlineLines = hero.headline
    .split(";")
    .map((line) => line.trim())
    .filter(Boolean);

  // This page's own per-page figures (`content.stats`, drizzle 0009) — NOT the company-wide
  // `company_settings` ones `StatsBand`/Home read. Same derivation the old raw-HTML band used:
  // prefix + (optionally grouped) `to` + suffix, e.g. "400000"+group+"+" → "400,000+".
  const statCells = stats.map((s) => ({
    value: `${s.prefix ?? ""}${s.group ? Number(s.to).toLocaleString("en-US") : s.to}${s.suffix ?? ""}`,
    label: s.label,
  }));

  return (
    <>
      {/* Page hook for the header's `body:has([data-page="owners"])` rule (settings `site-header.tsx`),
          which pins the Owners mega-menu open as the section sub-nav once the header is scrolled. */}
      <span hidden data-page="owners" />
      <Hero
        id="worth"
        background={
          heroMedia ? (
            <MediaImage
              data={heroMedia}
              className="absolute inset-0 -z-10 h-full w-full object-cover"
              sizes="100vw"
              priority
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- external TEMP fallback, not an R2 asset
            <img
              src={HERO_FALLBACK_IMG}
              alt={HERO_FALLBACK_ALT}
              className="absolute inset-0 -z-10 h-full w-full object-cover"
            />
          )
        }
        compact
        copyClassName="max-w-none"
        actionsClassName="mt-7"
        headline={heroHeadlineLines.map((line, i) => (
          <Fragment key={i}>
            {i > 0 ? <br /> : null}
            {line}
          </Fragment>
        ))}
        subtitle={hero.copy}
        actions={
          <ContactDialog
            variant="light"
            label="Contact Us"
            title="Contact us"
            intro="Send us a message and our team will get back to you shortly."
            source="owners-hero"
          />
        }
        aside={
          <OwnerEstimateForm
            badge={earnings_form.badge}
            headline={earnings_form.headline}
            subheadline={earnings_form.subheadline}
            ctaLabel={earnings_form.cta_label}
            note={earnings_form.note}
          />
        }
      />
      {/*
       * "Numbers that speak for themselves" — the same reusable, count-up band component Home
       * uses (`core/ui`'s presentational `StatBand` + `CountUp`), fed this page's own
       * `content.stats` (`statCells` above) rather than the company-wide settings figures
       * `StatsBand`/Home read — the two happen to differ (e.g. 400,000+ bookings here vs.
       * Home's live count), so this page keeps its own numbers, just the shared widget. No
       * `title` → the bare proof band the locked design uses here (Home passes a heading).
       */}
      <div id="numbers" style={{ scrollMarginTop: 130 }}>
        <Reveal label="owners-stats">
          <StatBand cells={statCells} />
        </Reveal>
      </div>
      {/*
       * "Why property owners trust us" — `core/ui`'s `EditorialSplit` (new; built for this
       * section, ported 1:1 from the old `.mk`-scoped `.owner-pitch` CSS, including its own
       * `Reveal`-based entrance animation — see that component's docstring for why the
       * animation lives inside it rather than at this call site, unlike `StatBand` above).
       * `id`/`scrollMarginTop` done the same way as the other sections now outside `.mk`
       * (`#numbers`/`#testimonials`/`#faq`) rather than the component's own generic anchor,
       * to match this page's 130px fixed-nav offset.
       */}
      <div id="why" style={{ scrollMarginTop: 130 }}>
        <EditorialSplit
          headline={why.headline}
          body={why.subheadline}
          items={whyItems}
          primaryCta={{ href: "#worth", label: `${why.cta_primary.label} →` }}
          secondaryCta={{ href: "#start", label: why.cta_secondary.label }}
          note={why.cta_primary.note}
        />
      </div>
      {/*
       * "Everything handled. Nothing overlooked." — `core/ui`'s existing `TwoColumnShowcase`
       * (the same "Image Showcase" component Home's guests pitch uses), not a new component:
       * its `imagePosition` prop already supports mirroring, which `dashboard`/#technology
       * (still the old raw-HTML embed, a separate follow-up) will reuse with
       * `imagePosition="left"`. Wrapped in `<Reveal>` at this call site, same as Home wraps
       * `<GuestsSection>` — unlike `EditorialSplit`, nothing here needs `position:sticky`, so
       * there's no reason to wire the animation inside the component itself.
       */}
      <div id="services" style={{ scrollMarginTop: 130 }}>
        <Reveal label="owners-services">
          <TwoColumnShowcase
            headline={services.headline}
            body={services.subheadline}
            bullets={servicesBullets}
            cta={{ href: "#worth", label: `${services.cta.label} →`, note: services.cta.note }}
            badge={SERVICES_BADGE}
            tone="alt"
            imagePosition="right"
            image={
              servicesMedia ? (
                <MediaImage
                  data={servicesMedia}
                  className="aspect-[4/5] w-full rounded-sm object-cover"
                  sizes={TWO_COL_SHOWCASE_SIZES}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- external TEMP fallback, not an R2 asset
                <img
                  src={SERVICES_FALLBACK_IMG}
                  alt={SERVICES_FALLBACK_ALT}
                  className="aspect-[4/5] w-full rounded-sm object-cover"
                />
              )
            }
          />
        </Reveal>
      </div>
      {/*
       * "A management plan built around your goals" — `core/ui`'s new `PricingCards`, with
       * the "Not sure which plan fits?" band slotted into its `footer` prop so it keeps the
       * original's tight `mt-20` coupling (both sit inside `PricingCards`' own Section —
       * see that component's docstring for why `CalloutBand` itself stays un-sectioned).
       * The "Choose <plan>"/helper CTA `href`s are `#`, matching the original markup exactly
       * (the schema's `planHelper.cta.url` field exists but was never actually wired to the
       * href there either — preserved as-is, not silently fixed).
       */}
      <div id="plans" style={{ scrollMarginTop: 130 }}>
        <Reveal label="owners-plans">
          <PricingCards
            headline={plans.headline}
            body={plans.subheadline}
            tiers={plans.tiers.map((t) => ({
              name: t.name,
              tag: t.tag,
              cornerBadge: t.corner_badge,
              isPopular: t.is_popular,
              features: t.features,
              cta: { href: "#", label: `Choose ${t.name}` },
            }))}
            footer={plans.helpers.map((h, i) =>
              h.cta ? (
                <CalloutBand key={i} title={h.title} body={h.copy} cta={{ href: "#", label: `${h.cta.label} →` }} />
              ) : null,
            )}
          />
        </Reveal>
      </div>
      {/*
       * "Your growth path" — `core/ui`'s new `StepGallery` (a numbered photo-card grid), ported
       * 1:1 from the old `.mk`-scoped CSS (`.steps`/`.step`/`.step-img`/`.step-scrim`/`.snum`,
       * now deleted along with the rest of `OWNERS_STYLE`/the `.mk` wrapper/`ScrollReveal`).
       */}
      <div id="journey" style={{ scrollMarginTop: 130 }}>
        <Reveal label="owners-journey">
          <StepGallery headline={journey.headline} body={journey.subheadline} items={journeyItems} tone="alt" />
        </Reveal>
      </div>
      {/*
       * "Your property, always in sight" — the same `TwoColumnShowcase` as `#services` above,
       * mirrored (`imagePosition="left"`). This was the last `.owner-showcase` raw-HTML user,
       * so that CSS block is gone from `OWNERS_STYLE` entirely now.
       */}
      <div id="technology" style={{ scrollMarginTop: 130 }}>
        <Reveal label="owners-dashboard">
          <TwoColumnShowcase
            headline={dashboard.headline}
            body={dashboard.subheadline}
            bullets={dashboardBullets}
            cta={{ href: "#worth", label: `${dashboard.cta.label} →`, note: dashboard.cta.note }}
            badge={DASHBOARD_BADGE}
            imagePosition="left"
            image={
              dashboardMedia ? (
                <MediaImage
                  data={dashboardMedia}
                  className="aspect-[4/5] w-full rounded-sm object-cover"
                  sizes={TWO_COL_SHOWCASE_SIZES}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- external TEMP fallback, not an R2 asset
                <img
                  src={DASHBOARD_FALLBACK_IMG}
                  alt={DASHBOARD_FALLBACK_ALT}
                  className="aspect-[4/5] w-full rounded-sm object-cover"
                />
              )
            }
          />
        </Reveal>
      </div>
      {/*
       * Shared testimonials marquee + FAQ accordion (same components/visuals as the home
       * "Partners & Guests" carousel and the marketing FAQ). Each wrapper carries the `#…`
       * anchor + scroll offset the header's Owners section menu links to. The FAQ group is
       * editable per page (`faq_group_key`); blank/empty → nothing renders.
       */}
      <div id="testimonials" style={{ scrollMarginTop: 130 }}>
        <TestimonialsRow locale={locale} showEyebrow={false} />
      </div>
      {faqGroupKey ? (
        <div id="faq" style={{ scrollMarginTop: 130 }}>
          <FaqSection
            locale={locale}
            groupKey={faqGroupKey}
            title={t("owners.faqTitle")}
          />
        </div>
      ) : null}
      {/*
       * "Start Earning More Today" / "Ready to Make Your Property Work for You?" — `core/ui`'s
       * new `FeatureCtaBand`, ported 1:1 from the old `.mk`-scoped `.cta-band`/`.cta-wrap` CSS
       * (the last raw-HTML content on this page — see that component's docstring for why it
       * isn't built on `TwoColumnShowcase`). Still fully hardcoded, same as before this port:
       * no schema field exists for this section yet (a separate follow-up), so the image is
       * always the Pexels fallback and every string is a literal below, not `content.*`.
       */}
      <div id="start" style={{ scrollMarginTop: 130 }}>
        <Reveal label="owners-cta">
          <FeatureCtaBand
            eyebrow="Start Earning More Today"
            headline="Ready to Make Your Property Work for You?"
            body="Join the growing number of property owners across Portugal who trust Central Hill Apartments to deliver exceptional results. Start with a free, no-obligation profitability analysis."
            cta={{ href: "#worth", label: "Get Your Free Earnings Estimate →" }}
            contactLine="Call +351 910 075 725 · info@centralhill.pt · WhatsApp +351 910 075 725"
            image={
              // eslint-disable-next-line @next/next/no-img-element -- external TEMP fallback, not an R2 asset
              <img
                src={CTA_FALLBACK_IMG}
                alt={CTA_FALLBACK_ALT}
                className="aspect-[4/5] w-full rounded-sm object-cover"
              />
            }
          />
        </Reveal>
      </div>
    </>
  );
}
