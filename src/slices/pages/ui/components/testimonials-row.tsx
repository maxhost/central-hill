import { getTranslations } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import { Container, Eyebrow } from "@core/ui";
import { type TestimonialAudience, listTestimonials } from "@slices/testimonials/contract";
import { altBg } from "./blocks";
import { type GridItem, TestimonialsMarquee } from "./testimonials-marquee";

/**
 * Testimonials section (Home mixes audiences; Owners/Guests filter to one). Reads the
 * audience-tagged read model from the testimonials slice; renders nothing when none are
 * published. Subscribes transitively to `testimonial-list`. Presentation is a full-bleed infinite
 * marquee on the light `.alt` band (up to `MAX_CARDS` unique cards, looped) — data is resolved
 * here, the `TestimonialsMarquee` is purely presentational.
 */
const MAX_CARDS = 10;

export async function TestimonialsRow({
  locale,
  audience,
  showEyebrow = true,
}: {
  locale: Locale;
  audience?: TestimonialAudience;
  showEyebrow?: boolean;
}) {
  const testimonials = await listTestimonials(locale, audience);
  if (testimonials.length === 0) return null;

  const t = await getTranslations("pages");

  const items: GridItem[] = testimonials.slice(0, MAX_CARDS).map((tm) => ({
    id: tm.id,
    roleLabel: t(tm.audience === "owner" ? "reviews.owner" : "reviews.guest"),
    rating: tm.rating,
    quote: tm.quote,
    authorName: tm.authorName,
    authorCountry: tm.authorCountry,
    propertyLocation: tm.propertyLocation,
  }));

  return (
    <section className={`${altBg} py-[clamp(64px,10vw,160px)]`}>
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          {showEyebrow ? <Eyebrow accent>{t("reviews.eyebrow")}</Eyebrow> : null}
          <h2 className="mt-3 whitespace-pre-line font-serif text-3xl leading-tight text-ink md:text-4xl">
            {t("reviews.title")}
          </h2>
        </div>
      </Container>
      {/* Full-bleed marquee (outside the Container) for the seamless infinite scroll. */}
      <TestimonialsMarquee items={items} />
    </section>
  );
}
