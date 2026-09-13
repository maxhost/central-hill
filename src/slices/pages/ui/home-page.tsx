import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@core/db/columns";
import { ButtonLink } from "@core/ui";
import { AvantioSearchBar } from "@slices/settings/contract";
import { getHomePage } from "../contract";
import { FaqSection } from "./components/faq-section";
import { GuestsSection } from "./components/guests-section";
import { PageHero } from "./components/hero";
import { ServicesCarousel } from "./components/services-carousel";
import { StatsBand } from "./components/stats-band";

// TEMP: external hotlinks (the `mock/home.html` clip + poster) used only until a real hero
// video is uploaded to R2 and set on the home page in the backoffice — then the resolved
// media URL below takes over automatically and these are no longer hit.
const HERO_FALLBACK_VIDEO =
  "https://videos.pexels.com/video-files/16592055/16592055-hd_1920_1080_60fps.mp4";
const HERO_FALLBACK_POSTER =
  "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=2000&q=72";

/**
 * Home page (content-briefs.md → 0 · Home). Composes, in order: video hero · Avantio
 * availability search (settings) · company stats (settings, dark band) · services &
 * partners carousel (services slice) · guests pitch (Image Showcase) · optional FAQ
 * group. Static (ISR).
 *
 * **Reduced to a guest-facing funnel by owner direction (ADR 0031)**, which amends the
 * approved-mockup composition of ADR 0022. Removed: the owners pitch, the featured
 * portfolio, the testimonials row and the owner/guest dual-CTA band. The portfolio and
 * testimonials components still live in this slice and still render on the owners and
 * guest pages — they are only no longer composed here.
 *
 * **The services & partners carousel was added back under the stats band (ADR 0032)**, on
 * owner direction: its copy is editable in the Home editor, its cards come from the
 * `services` catalogue. It disappears on its own while that catalogue is empty.
 */
export async function HomePage({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const [page, t] = await Promise.all([getHomePage(locale), getTranslations("pages")]);
  if (!page) notFound();

  const { content, media } = page;
  const { hero, guests_pitch, services_carousel } = content;
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

      {/* Avantio availability search, directly under the hero (client request). */}
      <AvantioSearchBar locale={locale} />

      <StatsBand locale={locale} keys={["bookings", "years", "guests", "revenue"]} />

      {/* Services & partners (ADR 0032) — copy from the page, cards from `services`. */}
      <ServicesCarousel locale={locale} content={services_carousel} />

      <GuestsSection
        content={guests_pitch}
        image={media[guests_pitch.image_media_id ?? ""] ?? null}
      />

      {faqGroupKey ? (
        <FaqSection
          locale={locale}
          groupKey={faqGroupKey}
          eyebrow={t("faqEyebrow")}
          title={t("faqTitle")}
        />
      ) : null}
    </main>
  );
}
