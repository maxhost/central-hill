import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@core/db/columns";
import { MediaImage } from "@core/media";
import { ButtonLink, Eyebrow } from "@core/ui";
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
 * testimonials · founding story · owner/guest dual CTA (settings). Static (ISR).
 */
export async function HomePage({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const page = await getHomePage(locale);
  if (!page) notFound();

  const { content, media } = page;
  const { hero, owners_pitch, guests_pitch, story } = content;
  const t = await getTranslations("pages");

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
        <SectionHeading
          eyebrow={t("home.ownersEyebrow")}
          title={owners_pitch.headline}
          intro={owners_pitch.subheadline}
        />
        <FeatureGrid className="mt-12" items={owners_pitch.benefits} />
        <CtaRow
          className="mt-12"
          primary={owners_pitch.cta_primary}
          secondary={owners_pitch.cta_secondary}
        />
      </Band>

      <Band id="guests" className="bg-surface">
        <SectionHeading
          eyebrow={t("home.guestsEyebrow")}
          title={guests_pitch.headline}
          intro={guests_pitch.subheadline}
        />
        <FeatureGrid className="mt-12" items={guests_pitch.benefits} />
        <CtaRow className="mt-12" primary={guests_pitch.cta} />
      </Band>

      <FeaturedPortfolio locale={locale} />

      <TestimonialsRow locale={locale} />

      <Band>
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">
          {media[story.image_media_id] ? (
            <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-surface">
              <MediaImage
                data={media[story.image_media_id]!}
                className="h-full w-full object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ) : null}
          <div>
            <Eyebrow accent>{t("home.storyEyebrow")}</Eyebrow>
            <h2 className="mt-3 font-serif text-3xl leading-tight text-ink md:text-4xl">
              {story.headline}
            </h2>
            <div className="mt-5 space-y-4 leading-relaxed text-ink-soft">
              {story.copy
                .split(/\n{2,}/)
                .map((p) => p.trim())
                .filter(Boolean)
                .map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
            </div>
            <div className="mt-7">
              <ButtonLink href={story.cta.url} variant="outline">
                {story.cta.label}
              </ButtonLink>
            </div>
          </div>
        </div>
      </Band>

      <DualCta locale={locale} />
    </main>
  );
}
