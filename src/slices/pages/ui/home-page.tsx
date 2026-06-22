import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@core/db/columns";
import { ButtonLink } from "@core/ui";
import { getHomePage } from "../contract";
import { DualCta } from "./components/dual-cta";
import { FaqSection } from "./components/faq-section";
import { FeaturedPortfolio } from "./components/featured-portfolio";
import { GuestsSection } from "./components/guests-section";
import { PageHero } from "./components/hero";
import { OwnersSection } from "./components/owners-section";
import { StatsBand } from "./components/stats-band";
import { TestimonialsRow } from "./components/testimonials-row";

// TEMP: external hotlinks (the `mock/home.html` clip + poster) used only until a real hero
// video is uploaded to R2 and set on the home page in the backoffice — then the resolved
// media URL below takes over automatically and these are no longer hit.
const HERO_FALLBACK_VIDEO =
  "https://videos.pexels.com/video-files/16592055/16592055-hd_1920_1080_60fps.mp4";
const HERO_FALLBACK_POSTER =
  "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=2000&q=72";

/**
 * Home page (content-briefs.md → 0 · Home) — restored to the approved `mock/home.html`
 * (Warm Editorial). Composes, in order: video hero · company stats (settings, dark band) ·
 * owners pitch (Editorial Split) · guests pitch (Image Showcase) · featured portfolio (buildings) ·
 * mixed testimonials (infinite marquee) · owner/guest dual CTA (settings). Static (ISR).
 * (The "our story" band was removed per owner direction.)
 */
export async function HomePage({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const [page, t] = await Promise.all([getHomePage(locale), getTranslations("pages")]);
  if (!page) notFound();

  const { content, media } = page;
  const { hero, owners_pitch, guests_pitch, dual_cta } = content;
  const faqGroupKey = content.faq_group_key ?? "";

  return (
    <main>
      <PageHero
        image={null}
        videoUrl={media[hero.video_media_id]?.url ?? HERO_FALLBACK_VIDEO}
        posterUrl={HERO_FALLBACK_POSTER}
        eyebrow={t("home.heroEyebrow")}
        headline={hero.headline}
        subtitle={hero.subtitle}
        actions={
          <>
            <ButtonLink href={hero.cta_primary.url}>{hero.cta_primary.label}</ButtonLink>
            <ButtonLink href={hero.cta_secondary.url} variant="light">
              {hero.cta_secondary.label}
            </ButtonLink>
          </>
        }
      />

      <StatsBand locale={locale} keys={["bookings", "years", "guests", "revenue"]} />

      <OwnersSection content={owners_pitch} />

      <GuestsSection
        content={guests_pitch}
        imageUrl={media[guests_pitch.image_media_id ?? ""]?.url ?? null}
      />

      <FeaturedPortfolio locale={locale} showEyebrow={false} />

      <TestimonialsRow locale={locale} showEyebrow={false} />

      {faqGroupKey ? (
        <FaqSection
          locale={locale}
          groupKey={faqGroupKey}
          eyebrow={t("faqEyebrow")}
          title={t("faqTitle")}
        />
      ) : null}

      <DualCta locale={locale} content={dual_cta} media={media} />
    </main>
  );
}
