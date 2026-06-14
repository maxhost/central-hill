import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@core/db/columns";
import { MediaImage } from "@core/media";
import { ButtonLink } from "@core/ui";
import { getGuestPage } from "../contract";
import { Band, CtaRow, FeatureGrid, Prose, SectionHeading } from "./components/blocks";
import { DualCta } from "./components/dual-cta";
import { FeaturedPortfolio } from "./components/featured-portfolio";
import { PageHero } from "./components/hero";
import { TestimonialsRow } from "./components/testimonials-row";

/**
 * Guest landing page (content-briefs.md → 4 · Guest). Video hero · welcome · why book
 * with us · services teaser · activities teaser · featured portfolio (buildings) · guest
 * testimonials · dual CTA. Static (ISR).
 */
export async function GuestPage({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const page = await getGuestPage(locale);
  if (!page) notFound();

  const { content, media } = page;
  const { hero, welcome, why, services_teaser, activities_teaser } = content;
  const t = await getTranslations("pages");

  return (
    <main>
      <PageHero
        image={null}
        videoUrl={media[hero.video_media_id]?.url ?? null}
        eyebrow={hero.eyebrow}
        headline={hero.headline}
        subtitle={hero.subheadline}
        actions={<ButtonLink href={hero.cta.url}>{hero.cta.label}</ButtonLink>}
      />

      <Band>
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">
          {media[welcome.image_media_id] ? (
            <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-surface">
              <MediaImage
                data={media[welcome.image_media_id]!}
                className="h-full w-full object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ) : null}
          <div>
            <h2 className="font-serif text-3xl leading-tight text-ink md:text-4xl">
              {welcome.headline}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">{welcome.lede}</p>
            <Prose className="mt-4" text={welcome.copy} />
            {welcome.guarantee_label ? (
              <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
                {welcome.guarantee_label}
              </p>
            ) : null}
          </div>
        </div>
      </Band>

      <Band className="bg-surface">
        <SectionHeading
          center
          eyebrow={t("guests.whyEyebrow")}
          title={why.headline}
          intro={why.intro}
        />
        <FeatureGrid className="mt-12" items={why.benefits} columns={2} />
        <CtaRow className="mt-12" center primary={why.cta} />
      </Band>

      <FeaturedPortfolio locale={locale} />

      <Band className="bg-surface">
        <SectionHeading
          eyebrow={t("guests.servicesEyebrow")}
          title={services_teaser.headline}
          intro={services_teaser.intro}
        />
        <FeatureGrid className="mt-12" items={services_teaser.items} />
        <CtaRow className="mt-12" primary={services_teaser.cta} />
      </Band>

      <Band>
        <SectionHeading
          eyebrow={t("guests.activitiesEyebrow")}
          title={activities_teaser.headline}
          intro={activities_teaser.intro}
        />
        <FeatureGrid className="mt-12" items={activities_teaser.items} />
        <CtaRow className="mt-12" primary={activities_teaser.cta} />
      </Band>

      <TestimonialsRow locale={locale} audience="guest" />

      <DualCta locale={locale} />
    </main>
  );
}
