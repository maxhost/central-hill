import { Fragment, type ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { MediaImage } from "@core/media";
import type { Locale } from "@core/db/columns";
import {
  EditorialSplit,
  FeatureCtaBand,
  Hero,
  Reveal,
  StatBand,
  StepGallery,
  TwoColumnShowcase,
} from "@core/ui";
import { Icon } from "@core/ui/icon";
import { ContactDialog, getGlobals } from "@slices/settings/contract";
import { getOwnersPage, type OwnersPage as OwnersPageResult } from "../contract";
import { ownersFallbackIndex } from "../owners-content";
import { FaqSection } from "./components/faq-section";
import { ownersFinalContactLine } from "./contact-line";
import { OwnerEstimateForm } from "./components/owner-estimate-form";
import { OwnersPlanPicker } from "./components/owners-plan-picker";
import { sideMedia } from "./components/side-media";
import { TestimonialsRow } from "./components/testimonials-row";
import { orMessage, orNamedMessage } from "./or-message";
import { statBandColumns, statFigureCells } from "./stat-figure-value";
import { planPercentage } from "./plan-percentage";

// Benefit icons are each item's admin-editable `icon_key`, rendered by `core/ui` `<Icon>`
// (inline Iconoir SVG, ADR 0034).

/** A showcase badge's optional icon (blank → `TwoColumnShowcase`'s default), as Home's pitch. */
function badgeIcon(iconKey: string | undefined) {
  return iconKey ? <Icon name={iconKey} size={20} /> : undefined;
}

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
 * CTA ("Ready to Make Your Property Work for You?") uses `core/ui`'s `FeatureCtaBand`, editable via `final_cta`
 * (spec owners-admin-editor S6); `testimonials` is the shared <TestimonialsRow>
 * marquee (the home "Partners & Guests" carousel). Marketing sections are mirrored in the owners
 * schema (editor-ready, drizzle 0005→0007).
 */

const SERVICES_FALLBACK_IMG =
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=72";
const SERVICES_FALLBACK_ALT = "Designer-furnished Lisbon apartment, guest-ready";
const DASHBOARD_FALLBACK_IMG =
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=72";
const DASHBOARD_FALLBACK_ALT = "Owner dashboard showing live revenue and occupancy";

// `services`/`dashboard`'s showcase media come from `sideMedia()` (spec owners-admin-editor S5,
// shared with Home's guests pitch): photo / animated WebP / video / Lottie in the 4:5 frame,
// sized as one of `TwoColumnShowcase`'s two `lg:` columns. No asset → the fallback photo below.

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

// TEMP: Pexels placeholder for the closing CTA band's photo column, used until an asset is set
// in `final_cta.image_media_id` (spec owners-admin-editor S6).
const CTA_FALLBACK_IMG =
  "https://images.pexels.com/photos/1732414/pexels-photo-1732414.jpeg?auto=compress&cs=tinysrgb&w=1200";
const CTA_FALLBACK_ALT = "A Central Hill managed property at golden hour, overlooking the coast";
// The band's photo column: one of `FeatureCtaBand`'s two columns from 981px (≤ ~570px inside the
// 7xl container), full width below.
const CTA_IMG_SIZES = "(max-width: 980px) 100vw, 600px";

/** Only the private renderer adds annotation wrappers; public DOM remains unchanged. */
function PreviewBinding({ preview, id, children }: { preview: boolean; id: string; children: ReactNode }) {
  return preview ? <div data-editor-binding={id}>{children}</div> : <>{children}</>;
}

export async function OwnersPage({ locale, preview = false, page: injectedPage }: {
  locale: Locale;
  preview?: boolean;
  page?: OwnersPageResult | null;
}) {
  setRequestLocale(locale);
  const [page, t, globals] = await Promise.all([
    injectedPage === undefined ? getOwnersPage(locale) : Promise.resolve(injectedPage),
    getTranslations("pages"),
    getGlobals(locale),
  ]);
  if (!page) notFound();

  const { content, media } = page;
  const binding = (id: string) => preview ? { "data-editor-binding": id } : {};
  const { hero, earnings_form, stats, why, services, plans, journey, dashboard } = content;
  const estimateFormCopy = {
    badge: earnings_form.badge,
    headline: earnings_form.headline,
    subheadline: earnings_form.subheadline,
    ctaLabel: earnings_form.cta_label,
    note: earnings_form.note,
    contactTitle: earnings_form.contact_step?.title,
    contactLede: earnings_form.contact_step?.lede,
    submitLabel: earnings_form.contact_step?.submit_label,
    backLabel: earnings_form.contact_step?.back_label,
    doneTitle: earnings_form.done_step?.title,
    doneBody: earnings_form.done_step?.body,
  };
  const faqGroupKey = content.faq_group_key ?? "";
  // Optional copy overrides (spec owners-admin-editor S2): blank / absent → today's i18n message.
  const contact = hero.contact;
  const testimonialsTitle = content.testimonials?.title;
  // Closing band (spec owners-admin-editor S6): each field or its i18n default.
  const finalCta = content.final_cta;
  const finalMedia = media[finalCta?.image_media_id ?? ""];
  const finalContactLine = ownersFinalContactLine(finalCta?.contact_line, globals, (phone) =>
    t("owners.finalCall", { phone }),
  );

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
          src={JOURNEY_FALLBACK_IMGS[ownersFallbackIndex(content, i) % JOURNEY_FALLBACK_IMGS.length]}
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

  const heroHeadline = heroHeadlineLines.map((line, i) => (
    <Fragment key={i}>{i > 0 ? <br /> : null}{line}</Fragment>
  ));

  // This page's own per-page figures (`content.stats`, drizzle 0009) — NOT the company-wide
  // `company_settings` ones. Same derivation the old raw-HTML band used, now the helper the
  // Home band shares (spec S5): prefix + (optionally grouped) `to` + suffix, e.g.
  // "400000"+group+"+" → "400,000+".
  const statCells = statFigureCells(stats);

  return (
    <>
      {/* Page hook for the header's `body:has([data-page="owners"])` rule (settings `site-header.tsx`),
          which pins the Owners mega-menu open as the section sub-nav once the header is scrolled. */}
      <span hidden data-page="owners" />
      {/* JS-off fallback: `Reveal` renders hidden until it scrolls into view (as Home/Guests do). */}
      <noscript>
        <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <PreviewBinding preview={preview} id="hero"><Hero
        editorBindings={preview ? { background: "hero.image_media_id", eyebrow: "hero", subtitle: "hero.copy" } : undefined}
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
        headline={preview ? <span {...binding("hero.headline")}>{heroHeadline}</span> : heroHeadline}
        subtitle={hero.copy}
        actions={
          <PreviewBinding preview={preview} id="hero.contact.label"><ContactDialog
            variant="light"
            label={orMessage(contact?.label, t("owners.contactLabel"))}
            title={orMessage(contact?.title, t("owners.contactTitle"))}
            intro={orMessage(contact?.intro, t("owners.contactIntro"))}
            source="owners-hero"
          /></PreviewBinding>
        }
        aside={
          <PreviewBinding preview={preview} id="earnings_form"><OwnerEstimateForm
            {...estimateFormCopy}
          /></PreviewBinding>
        }
      /></PreviewBinding>
      {/*
       * "Numbers that speak for themselves" — the same reusable, count-up band component Home
       * uses (`core/ui`'s presentational `StatBand` + `CountUp`), fed this page's own
       * `content.stats` (`statCells` above) rather than the company-wide settings figures.
       * Like Home (spec owners-admin-editor S4): 0–8 editable rows, desktop columns follow the
       * row count (`statBandColumns`; 4 rows → 4, the `StatBand` default, so today's band is
       * unchanged), mobile stays 2-up. No rows → no band, but the `#numbers` anchor div stays
       * (the header's Owners menu links to it). The optional editable title falls back to
       * localized copy, using the same heading treatment as Home.
       */}
      <div {...binding("stats")} id="numbers" className="[&_section]:py-[70px]" style={{ scrollMarginTop: 130 }}>
        {statCells.length > 0 ? (
          <Reveal label="owners-stats">
            <StatBand
              title={orMessage(content.stats_title, t("owners.statsTitle"))}
              cells={statCells}
              columns={statBandColumns(statCells.length)}
            />
          </Reveal>
        ) : null}
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
      <div {...binding("why")} id="why" className="[&_section]:py-[70px]" style={{ scrollMarginTop: 130 }}>
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
      <div {...binding("services")} id="services" className="[&_section]:py-[70px]" style={{ scrollMarginTop: 130 }}>
        <Reveal label="owners-services">
          <TwoColumnShowcase
            headline={services.headline}
            body={services.subheadline}
            bullets={servicesBullets}
            cta={{ href: "#worth", label: `${services.cta.label} →`, note: services.cta.note }}
            badge={orMessage(services.badge?.label, t("owners.servicesBadge"))}
            badgeIcon={badgeIcon(services.badge?.icon_key)}
            tone="alt"
            imagePosition="right"
            image={
              (servicesMedia ? sideMedia(servicesMedia) : null) ?? (
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
       * "A management plan built around your goals" — PricingCards with a live fee summary
       * summing the percentages displayed on the selected cards.
       * Choose buttons select one of the first two base plans and independently toggle
       * the remaining extras. The summary CTA opens the hero wizard in a package-aware modal.
       */}
      <div {...binding("plans")} id="plans" className="[&_section]:py-[70px]" style={{ scrollMarginTop: 130 }}>
        <Reveal label="owners-plans">
          <OwnersPlanPicker
            form={estimateFormCopy}
            headline={plans.headline}
            body={plans.subheadline}
            popularLabel={orMessage(plans.popular_label, t("owners.popular"))}
            tiers={plans.tiers.map((tier, index) => ({
              name: tier.name,
              tag: tier.tag,
              cornerBadge: tier.corner_badge,
              isPopular: tier.is_popular,
              separatorBefore: index >= 2 ? <Icon name="plus" size={24} /> : undefined,
              selectionMode: index < 2 ? "single" : "multiple",
              feePercent: planPercentage(tier.corner_badge),
              features: tier.features,
              cta: {
                href: "#",
                label: orNamedMessage(plans.choose_label, tier.name, (name) =>
                  t("owners.choosePlan", { name }),
                ),
              },
            }))}
            summary={{
              title: t("owners.planTotal"),
              description: t("owners.planServiceFee"),
              emptyLabel: t("owners.planSelectPackages"),
              unavailableLabel: t("owners.planFeeUnavailable"),
              locale,
              cta: {
                href: "#worth",
                label: plans.helpers[0]?.cta?.label?.trim() || t("owners.plansCta"),
              },
            }}
          />
        </Reveal>
      </div>
      {/*
       * "Your growth path" — `core/ui`'s new `StepGallery` (a numbered photo-card grid), ported
       * 1:1 from the old `.mk`-scoped CSS (`.steps`/`.step`/`.step-img`/`.step-scrim`/`.snum`,
       * now deleted along with the rest of `OWNERS_STYLE`/the `.mk` wrapper/`ScrollReveal`).
       */}
      <div {...binding("journey")} id="journey" className="[&_section]:py-[70px]" style={{ scrollMarginTop: 130 }}>
        <Reveal label="owners-journey">
          <StepGallery headline={journey.headline} body={journey.subheadline} items={journeyItems} tone="alt" />
        </Reveal>
      </div>
      {/*
       * "Your property, always in sight" — the same `TwoColumnShowcase` as `#services` above,
       * mirrored (`imagePosition="left"`). This was the last `.owner-showcase` raw-HTML user,
       * so that CSS block is gone from `OWNERS_STYLE` entirely now.
       */}
      <div {...binding("dashboard")} id="technology" className="[&_section]:py-[70px]" style={{ scrollMarginTop: 130 }}>
        <Reveal label="owners-dashboard">
          <TwoColumnShowcase
            headline={dashboard.headline}
            body={dashboard.subheadline}
            bullets={dashboardBullets}
            cta={{ href: "#worth", label: `${dashboard.cta.label} →`, note: dashboard.cta.note }}
            badge={orMessage(dashboard.badge?.label, t("owners.dashboardBadge"))}
            badgeIcon={badgeIcon(dashboard.badge?.icon_key)}
            imagePosition="left"
            image={
              (dashboardMedia ? sideMedia(dashboardMedia) : null) ?? (
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
      <div {...binding("testimonials")} id="testimonials" className="[&_section]:py-[70px]" style={{ scrollMarginTop: 130 }}>
        <TestimonialsRow
          locale={locale}
          showEyebrow={false}
          title={testimonialsTitle?.trim() ? testimonialsTitle : undefined}
        />
      </div>
      {faqGroupKey ? (
        <div {...binding("faq")} id="faq" className="[&_section]:py-[70px]" style={{ scrollMarginTop: 130 }}>
          <FaqSection
            locale={locale}
            groupKey={faqGroupKey}
            title={orMessage(content.faq?.title, t("owners.faqTitle"))}
          />
        </div>
      ) : null}
      {/*
       * Closing band — `core/ui`'s `FeatureCtaBand` (ported 1:1 from the old `.mk`-scoped
       * `.cta-band`/`.cta-wrap` CSS; see its docstring for why it isn't `TwoColumnShowcase`).
       * Editable via `final_cta` (spec owners-admin-editor S6): blank headline / body /
       * button → `pages.owners.finalTitle` / `finalCopy` / `finalCta` (the
       * " →" is added here; the button always targets `#worth`); blank contact line → built
       * from Settings ("Call {phone} · email · WhatsApp …"); no image asset → the Pexels photo.
       */}
      <div {...binding("final_cta")} id="start" className="[&_section]:py-[70px]" style={{ scrollMarginTop: 130 }}>
        <Reveal label="owners-cta">
          <FeatureCtaBand
            headline={orMessage(finalCta?.headline, t("owners.finalTitle"))}
            body={orMessage(finalCta?.body, t("owners.finalCopy"))}
            cta={{ href: "#worth", label: `${orMessage(finalCta?.cta_label, t("owners.finalCta"))} →` }}
            contactLine={finalContactLine}
            image={
              finalMedia ? (
                <MediaImage
                  data={finalMedia.alt ? finalMedia : { ...finalMedia, alt: CTA_FALLBACK_ALT }}
                  className="aspect-[4/5] w-full rounded-sm object-cover"
                  sizes={CTA_IMG_SIZES}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- external TEMP fallback, not an R2 asset
                <img
                  src={CTA_FALLBACK_IMG}
                  alt={CTA_FALLBACK_ALT}
                  className="aspect-[4/5] w-full rounded-sm object-cover"
                />
              )
            }
          />
        </Reveal>
      </div>
    </>
  );
}
