import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { preload } from "react-dom";
import type { Locale } from "@core/db/columns";
import { ButtonLink, Hero, Reveal, ScrollDebugProbe, StatBand } from "@core/ui";
import { AvantioSearchBar } from "@slices/settings/contract";
import { getHomePage } from "../contract";
import { heroPosterSrc } from "./hero-poster";
import { orMessage } from "./or-message";
import { DualCta } from "./components/dual-cta";
import { FaqSection } from "./components/faq-section";
import { FeaturedPortfolio } from "./components/featured-portfolio";
import { GuestsSection } from "./components/guests-section";
import { ServicesCarousel } from "./components/services-carousel";
import { statBandColumns, statFigureCells } from "./stat-figure-value";

// TEMP: external hotlinks (the `mock/home.html` clip + poster) used only until a real hero
// video is uploaded to R2 and set on the home page in the backoffice — then the resolved
// media URL below takes over automatically and these are no longer hit.
const HERO_FALLBACK_VIDEO =
  "https://videos.pexels.com/video-files/16592055/16592055-hd_1920_1080_60fps.mp4";
const HERO_FALLBACK_POSTER =
  "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=2000&q=72";

/**
 * Home page (content-briefs.md → 0 · Home). Composes, in order: video hero · Avantio
 * availability search (settings) · figures band (page rows, dark band) · guests pitch
 * (Image Showcase) · featured portfolio (buildings) · services & partners carousel
 * (services slice) · optional FAQ group · owner/guest dual CTA. Static (ISR).
 *
 * **Reduced to a guest-facing funnel by owner direction (ADR 0031)**, which amended the
 * approved-mockup composition of ADR 0022 by removing the owners pitch, the featured
 * portfolio, the testimonials row and the owner/guest dual-CTA band.
 *
 * **The services & partners carousel was added back under the stats band (ADR 0032)**, on
 * owner direction: its copy is editable in the Home editor, its cards come from the
 * `services` catalogue. It disappears on its own while that catalogue is empty.
 *
 * **The featured portfolio and the dual-CTA band were restored (client direction)** — the
 * owners pitch and testimonials stay out. The portfolio composes straight from `buildings`
 * (no Home content of its own); the dual-CTA band's copy/images are editable in the Home
 * editor (`dual_cta`), with the owner panel's target still hardcoded to `/owners` (not
 * CMS-editable — same reasoning as the hero's secondary CTA above).
 */
export async function HomePage({ locale, preview = false, page: injectedPage }: { locale: Locale; preview?: boolean; page?: Awaited<ReturnType<typeof getHomePage>> }) {
  setRequestLocale(locale);
  const [page, t] = await Promise.all([injectedPage === undefined ? getHomePage(locale) : Promise.resolve(injectedPage), getTranslations("pages")]);
  if (!page) notFound();

  const { content, media } = page;
  const { hero, guests_pitch, services_carousel, dual_cta } = content;
  // Optional copy overrides (spec S3, rule D1): blank / absent → today's i18n message.
  const portfolio = content.portfolio;
  const faqGroupKey = content.faq_group_key ?? "";
  const statCells = statFigureCells(content.stats?.figures ?? []);
  // Hero poster (spec S4): the uploaded still, optimized (w=1920) through the same Next image
  // optimizer as `MediaImage`; blank / unresolved → the stock poster. It is the hero's first
  // paint (the LCP candidate), so an uploaded one is preloaded at high priority — the same
  // `react-dom` preload `next/image` emits for `priority`. The stock fallback is left as is.
  const uploadedPoster = heroPosterSrc(media[hero.poster_media_id ?? ""]);
  if (uploadedPoster) preload(uploadedPoster, { as: "image", fetchPriority: "high" });

  const binding = (id: string) => preview ? { "data-editor-binding": id } : {};
  return (
    <main>
      <ScrollDebugProbe page="home" />
      <div {...binding("hero")}><Hero
        editorBindings={preview ? { background: "hero.video_media_id", eyebrow: "hero.eyebrow", subtitle: "hero.subtitle" } : undefined}
        background={
          <video
            {...binding("hero.video_media_id")}
            className="absolute inset-0 -z-10 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster={uploadedPoster ?? HERO_FALLBACK_POSTER}
          >
            <source
              src={media[hero.video_media_id]?.url ?? HERO_FALLBACK_VIDEO}
              // The picker takes MP4 or WebM — declare the uploaded asset's real type.
              type={media[hero.video_media_id]?.mime ?? "video/mp4"}
            />
          </video>
        }
        eyebrow={orMessage(hero.eyebrow, t("home.heroEyebrow"))}
        headline={preview ? <span {...binding("hero.headline")}>{hero.headline}</span> : hero.headline}
        headlineClassName="max-w-[15ch] text-[clamp(2.2rem,5.6vw,4.4rem)]"
        subtitle={hero.subtitle}
        actions={
          <>
            <ButtonLink href={hero.cta_primary.url}>{preview ? <span {...binding("hero.cta_primary.label")}>{hero.cta_primary.label}</span> : hero.cta_primary.label}</ButtonLink>
            {/*
             * Always our own internal Owners route — hardcoded, not CMS-editable, so it can
             * never be pinned to a stale locale/domain the way a free-text CMS url would be
             * (client feedback). Staff only edit the label.
             */}
            <ButtonLink href={`/${locale}/owners`} variant="light">
              {preview ? <span {...binding("hero.cta_secondary.label")}>{hero.cta_secondary.label}</span> : hero.cta_secondary.label}
            </ButtonLink>
          </>
        }
      /></div>

      {/* Avantio availability search, directly under the hero (client request). */}
      {preview ? <div {...binding("avantio")} className="border-y border-line bg-surface px-6 py-8 text-center text-sm text-ink-soft">Avantio · External booking integration</div> : <AvantioSearchBar locale={locale} />}

      {/*
       * Scroll-reveal from here down (client feedback: bring Home in line with the other
       * pages' entrance motion). Each section is wrapped at this call site, not edited
       * internally — `FeaturedPortfolio` is also rendered by the Guest page, so animating
       * it here must not change its behaviour there. Hero/search stay unanimated, matching
       * every other page. <noscript> below keeps content visible with JS off.
       */}
      <noscript>
        <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
      </noscript>

      {/*
       * Figures band (spec S5): the page's own editable rows, no longer the company figures
       * from Settings. No rows → no band at all (heading included). Desktop columns follow
       * the row count (`statBandColumns`); mobile stays 2-up.
       */}
      {statCells.length > 0 ? (
        <div {...binding("stats")} className="[&_section]:pb-[70px]"><Reveal label="stats">
          <StatBand
            title={orMessage(content.stats?.title, t("stats.title"))}
            cells={statCells}
            columns={statBandColumns(statCells.length)}
          />
        </Reveal></div>
      ) : null}

      {/* Guests pitch now sits directly under stats, ahead of the carousel (client feedback). */}
      <div {...binding("guests_pitch")} className="[&_section]:py-[70px]!"><Reveal label="guests-pitch">
        <GuestsSection
          content={guests_pitch}
          image={media[guests_pitch.image_media_id ?? ""] ?? null}
        />
      </Reveal></div>

      {/*
       * Featured portfolio (restored, client direction) — composes from `buildings`, ahead
       * of the services carousel. No intro copy under the title (client feedback).
       */}
      <div {...binding("portfolio")} className="[&_section]:pt-[70px]"><Reveal label="featured-portfolio">
        <FeaturedPortfolio
          locale={locale}
          showEyebrow={false}
          intro=""
          tightBottom
          title={orMessage(portfolio?.title, t("portfolio.title"))}
          ctaLabel={orMessage(portfolio?.cta_label, t("portfolio.viewAll"))}
          viewLabel={orMessage(portfolio?.card_view_label, t("portfolio.view"))}
        />
      </Reveal></div>

      {/* Services & partners (ADR 0032) — copy from the page, cards from `services`. */}
      <div {...binding("services_carousel")} className="[&_section]:py-[70px]"><Reveal label="services-carousel">
        <ServicesCarousel locale={locale} content={services_carousel} />
      </Reveal></div>

      {faqGroupKey ? (
        <div {...binding("faq")}><FaqSection
          locale={locale}
          groupKey={faqGroupKey}
          title={orMessage(content.faq?.title, t("faqTitle"))}
        /></div>
      ) : null}

      {/* Closing owner/guest dual CTA (restored, client direction) — sits right before the footer. */}
      <div {...binding("dual_cta")} className="[&_section]:py-[70px]"><Reveal label="dual-cta">
        <DualCta locale={locale} content={dual_cta} media={media} />
      </Reveal></div>
    </main>
  );
}
