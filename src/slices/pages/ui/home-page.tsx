import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@core/db/columns";
import { ButtonLink } from "@core/ui";
import { getHomePage } from "../contract";
import { Band, CtaRow, FeatureGrid, SectionHeading } from "./components/blocks";
import { DualCta } from "./components/dual-cta";
import { FeaturedPortfolio } from "./components/featured-portfolio";
import { PageHero } from "./components/hero";
import { StatsBand } from "./components/stats-band";
import { TestimonialsRow } from "./components/testimonials-row";

/**
 * Home page (content-briefs.md → 0 · Home). Composes: video hero · company stats
 * (settings) · owners pitch · guests pitch · featured portfolio (buildings) · mixed
 * testimonials · owner/guest dual CTA (settings). Static (ISR).
 */
export async function HomePage({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const page = await getHomePage(locale);
  if (!page) notFound();

  const { content, media } = page;
  const { hero, owners_pitch, guests_pitch } = content;

  return (
    <main>
      <PageHero
        image={null}
        videoUrl={media[hero.video_media_id]?.url ?? null}
        headline={hero.headline}
        subtitle={hero.subtitle}
        actions={
          <>
            <ButtonLink href={hero.cta_primary.url}>{hero.cta_primary.label}</ButtonLink>
            <ButtonLink href={hero.cta_secondary.url} variant="outline">
              {hero.cta_secondary.label}
            </ButtonLink>
          </>
        }
      />

      <StatsBand locale={locale} keys={["bookings", "years", "guests", "revenue"]} />

      <Band id="owners">
        <SectionHeading title={owners_pitch.headline} intro={owners_pitch.subheadline} />
        <FeatureGrid className="mt-12" items={owners_pitch.benefits} />
        <CtaRow
          className="mt-12"
          primary={owners_pitch.cta_primary}
          secondary={owners_pitch.cta_secondary}
        />
      </Band>

      <Band id="guests" className="bg-surface">
        <SectionHeading title={guests_pitch.headline} intro={guests_pitch.subheadline} />
        <FeatureGrid className="mt-12" items={guests_pitch.benefits} />
        <CtaRow className="mt-12" primary={guests_pitch.cta} />
      </Band>

      <FeaturedPortfolio locale={locale} />

      <TestimonialsRow locale={locale} />

      <DualCta locale={locale} />
    </main>
  );
}
