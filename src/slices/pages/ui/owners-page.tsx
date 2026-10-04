import { Fragment } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { MediaImage, mediaImgTag, type MediaImageData } from "@core/media";
import type { Locale } from "@core/db/columns";
import { CalloutBand, EditorialSplit, Hero, PricingCards, Reveal, StatBand, TwoColumnShowcase } from "@core/ui";
import { ContactDialog } from "@slices/settings/contract";
import { getOwnersPage, type OwnersContent } from "../contract";
import { EstFormStepper } from "./components/est-form-stepper";
import { EstFormWizard } from "./components/est-form-wizard";
import { FaqSection } from "./components/faq-section";
import { Icon } from "./components/icon";
import { OwnerEstimateForm } from "./components/owner-estimate-form";
import { ScrollReveal } from "./components/scroll-reveal";
import { TestimonialsRow } from "./components/testimonials-row";

// `why.benefits`/`services.benefits` positional icons (locked design, not each benefit's own
// `icon_key` — matches the pre-existing behavior this replaces, see
// `src/slices/pages/ui/components/icon.tsx`).
const WHY_ICON_KEYS = ["chart", "trophy", "bell", "user", "map-pin", "search"] as const;
const SERVICES_ICON_KEYS = ["camera", "calendar", "wrench", "trending-up"] as const;
const SERVICES_BADGE = "Every detail handled — you stay free.";
const DASHBOARD_ICON_KEYS = ["dollar-circle", "calendar-lines", "bar-chart", "bell-alt"] as const;
const DASHBOARD_BADGE = "Real-time data, from anywhere.";

// Image fallbacks = the approved mock photos, used 1:1 until a real R2 asset is set in the
// backoffice (the seeded `*_media_id`s have no uploaded asset yet → resolved media is absent).
const HERO_FALLBACK_IMG =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1900&q=72";
const HERO_FALLBACK_ALT = "Bright, designer-furnished Lisbon apartment interior";

// Escape admin-authored content before it is interpolated into the static body HTML string.
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

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
.mk .steps{display:grid;grid-template-columns:repeat(5,1fr);gap:2px;background:var(--line);border:1px solid var(--line)}
.mk .step{position:relative;overflow:hidden;display:flex;min-height:360px;padding:26px 22px}
.mk .step-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .5s var(--ease)}
.mk .step:hover .step-img{transform:scale(1.06)}
.mk .step-scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(23,18,14,0) 38%,rgba(23,18,14,.9) 100%)}
.mk .step-body{position:relative;z-index:2;margin-top:auto}
.mk .step .snum{font-family:var(--serif);font-size:36px;line-height:1;color:#fff;opacity:.92;margin-bottom:12px}
.mk .step h3{font-size:18.5px;margin-bottom:7px;color:#fff}
.mk .step p{font-size:13.5px;line-height:1.5;color:rgba(255,255,255,.82)}
.mk .faq{max-width:820px;margin:0 auto;border-top:1px solid var(--line)}
.mk .faq details{border-bottom:1px solid var(--line)}
.mk .faq summary{list-style:none;cursor:pointer;padding:24px 44px 24px 4px;position:relative;font-family:var(--serif);font-size:20px;color:var(--ink);transition:color .2s}
.mk .faq summary::-webkit-details-marker{display:none}
.mk .faq summary:hover{color:var(--accent-deep)}
.mk .faq summary::after{content:"+";position:absolute;right:6px;top:22px;font-family:var(--sans);font-size:24px;color:var(--accent);transition:transform .25s var(--ease)}
.mk .faq details[open] summary::after{transform:rotate(45deg)}
.mk .faq .faq-a{padding:0 44px 26px 4px;font-size:15.5px;color:var(--ink-soft);max-width:70ch}
.mk .cta-band .cta-wrap{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;text-align:left;max-width:var(--max)}
.mk .cta-band .cta-media img{width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:3px;display:block}
@media(max-width:980px){.mk .steps{grid-template-columns:1fr 1fr}.mk .cta-band .cta-wrap{grid-template-columns:1fr;gap:34px;text-align:center}.mk .cta-band .cta-copy p{margin-left:auto;margin-right:auto}}
@media(max-width:680px){.mk .steps{grid-template-columns:1fr}}

/* Page-wide entrance motion (immediate on load for above-the-fold content, on scroll for
   the rest, via <ScrollReveal page="owners">/scroll-reveal.tsx) — same pattern already
   applied to About/Guests/Real Estate/Buildings. This page's card hover states (.plan,
   .step) already existed and are left as-is — only the scroll-in entrance was missing.
   The hero + earnings form are left untouched, matching every other page. The hidden
   state is baked straight into the server-rendered markup (.pre-reveal, applied on the
   elements below) so there's no flash of visible-then-hidden; the <noscript> rule keeps
   content visible with JS off. Scoped to [data-page="owners"] so it never touches the
   shared, neutralised .reveal rule in mock.css or any other page. */
.mk[data-page="owners"] .reveal-io{transition:opacity .7s var(--ease),transform .7s var(--ease)}
.mk[data-page="owners"] .reveal-io.pre-reveal{opacity:0;transform:translateY(18px)}
`;

const SERVICES_FALLBACK_IMG =
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=72";
const SERVICES_FALLBACK_ALT = "Designer-furnished Lisbon apartment, guest-ready";
const DASHBOARD_FALLBACK_IMG =
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=72";
const DASHBOARD_FALLBACK_ALT = "Owner dashboard showing live revenue and occupancy";

// The closing CTA band's image (still the raw-HTML `.cta-band` embed, `980px` breakpoint).
const SHOWCASE_SIZES = "(max-width: 980px) 100vw, 560px";
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
const STEP_IMG_SIZES = "(max-width: 680px) 50vw, (max-width: 980px) 33vw, 20vw";

// TEMP: Pexels placeholder for the closing CTA band's new photo column.
const CTA_FALLBACK_IMG =
  "https://images.pexels.com/photos/1732414/pexels-photo-1732414.jpeg?auto=compress&cs=tinysrgb&w=1200";
const CTA_FALLBACK_ALT = "A Central Hill managed property at golden hour, overlooking the coast";

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
  const { journey } = content;

  return `
<section id="journey" class="alt">
  <div class="wrap">
    <div class="sec-head center reveal reveal-io pre-reveal">
      <h2 class="section-title">${esc(journey.headline)}</h2>
      ${journey.subheadline ? `<p class="lede" style="margin:16px auto 0">${esc(journey.subheadline)}</p>` : ""}
    </div>
    <div class="steps reveal reveal-io reveal-stagger pre-reveal">${journey.steps
      .map((s, i) => {
        const stepImg = mediaImgTag({
          data: media[s.image_media_id ?? ""],
          fallbackSrc: JOURNEY_FALLBACK_IMGS[i % JOURNEY_FALLBACK_IMGS.length],
          fallbackAlt: s.title,
          sizes: STEP_IMG_SIZES,
          className: "step-img",
        });
        return `
      <div class="step">
        ${stepImg}
        <div class="step-scrim"></div>
        <div class="step-body">
          <div class="snum">${String(i + 1).padStart(2, "0")}</div>
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.description)}</p>
        </div>
      </div>`;
      })
      .join("")}
    </div>
  </div>
</section>

`;
}

// The "What our owners say" testimonials AND the FAQ are rendered by shared React islands
// (TestimonialsRow + FaqSection) outside the `.mk` wrapper, so the static body is split here:
// top sections above the carousel, only the closing CTA below it. The FAQ is now editable —
// its group is chosen per page via `faq_group_key` (see OwnersPage below). Two-column CTA
// (client direction): photo on the left, the existing copy/CTA/contact line on the right —
// the image is a Pexels placeholder (no schema field; this whole band is still hardcoded).
function ownersBodyBottom(): string {
  const ctaImg = mediaImgTag({
    fallbackSrc: CTA_FALLBACK_IMG,
    fallbackAlt: CTA_FALLBACK_ALT,
    sizes: SHOWCASE_SIZES,
  });
  return `
<section id="start" class="stats cta-band" style="padding:var(--section-y) 0">
  <div class="wrap cta-wrap">
    <div class="cta-media reveal reveal-io pre-reveal">${ctaImg}</div>
    <div class="cta-copy reveal reveal-io pre-reveal">
      <span class="eyebrow" style="color:var(--feature-accent)">Start Earning More Today</span>
      <h2 class="section-title" style="color:#fff;margin-top:14px">Ready to Make Your Property Work for You?</h2>
      <p style="color:var(--on-feature-soft);font-size:18px;margin:18px 0 0;max-width:48ch">Join the growing number of property owners across Portugal who trust Central Hill Apartments to deliver exceptional results. Start with a free, no-obligation profitability analysis.</p>
      <div style="margin-top:34px">
        <a class="btn btn-accent" href="#worth">Get Your Free Earnings Estimate →</a>
      </div>
      <p style="color:var(--on-feature-soft);font-size:14px;letter-spacing:.03em;margin-top:26px">
        Call +351 910 075 725 &nbsp;·&nbsp; info@centralhill.pt &nbsp;·&nbsp; WhatsApp +351 910 075 725
      </p>
    </div>
  </div>
</section>
`;
}

export async function OwnersPage({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const [page, t] = await Promise.all([getOwnersPage(locale), getTranslations("pages")]);
  if (!page) notFound();

  const { content, media } = page;
  const { hero, earnings_form, stats, why, services, dashboard, plans } = content;
  const faqGroupKey = content.faq_group_key ?? "";

  const whyItems = why.benefits.map((b, i) => ({
    icon: <Icon name={WHY_ICON_KEYS[i]} className="mt-0.5 h-7 w-7 flex-none text-accent-deep" />,
    title: b.title,
    description: b.description,
  }));

  const servicesBullets = services.benefits.map((b, i) => ({
    icon: <Icon name={SERVICES_ICON_KEYS[i]} className="mt-0.5 h-[26px] w-[26px] flex-none text-accent-deep" />,
    title: b.title,
    description: b.description,
  }));
  const servicesMedia = media[services.image_media_id ?? ""];

  const dashboardBullets = dashboard.benefits.map((b, i) => ({
    icon: <Icon name={DASHBOARD_ICON_KEYS[i]} className="mt-0.5 h-[26px] w-[26px] flex-none text-accent-deep" />,
    title: b.title,
    description: b.description,
  }));
  const dashboardMedia = media[dashboard.image_media_id ?? ""];

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
      <EstFormStepper />
      <EstFormWizard />
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
      <div className="mk" data-page="owners">
        <style dangerouslySetInnerHTML={{ __html: OWNERS_STYLE }} />
        <noscript>
          <style
            dangerouslySetInnerHTML={{
              __html: `.mk[data-page="owners"] .pre-reveal{opacity:1!important;transform:none!important}`,
            }}
          />
        </noscript>
        <ScrollReveal page="owners" />
        <div dangerouslySetInnerHTML={{ __html: ownersBodyTop(content, media) }} />
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
            title={t("owners.faqTitle")}
          />
        </div>
      ) : null}
      <div className="mk" data-page="owners">
        <div dangerouslySetInnerHTML={{ __html: ownersBodyBottom() }} />
      </div>
    </>
  );
}
