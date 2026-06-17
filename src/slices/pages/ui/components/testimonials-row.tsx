import { getTranslations } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import { Container } from "@core/ui";
import { type TestimonialAudience, listTestimonials } from "@slices/testimonials/contract";
import { countryFlag } from "./country-flag";
import { TestimonialsCarousel, type CarouselItem } from "./testimonials-carousel";

/**
 * Testimonials section (Home mixes audiences; Owners/Guests filter to one). Reads the
 * audience-tagged read model from the testimonials slice; renders nothing when none are
 * published. Subscribes transitively to `testimonial-list`. Presentation is a rotating
 * carousel with larger stars + country flags (client feedback B4) — data is resolved
 * here, motion happens in the `TestimonialsCarousel` island.
 */
export async function TestimonialsRow({
  locale,
  audience,
}: {
  locale: Locale;
  audience?: TestimonialAudience;
}) {
  const testimonials = await listTestimonials(locale, audience);
  if (testimonials.length === 0) return null;

  const t = await getTranslations("pages");

  const items: CarouselItem[] = testimonials.map((tm) => ({
    id: tm.id,
    roleLabel: t(tm.audience === "owner" ? "reviews.owner" : "reviews.guest"),
    rating: tm.rating,
    quote: tm.quote,
    authorName: tm.authorName,
    authorCountry: tm.authorCountry,
    flag: countryFlag(tm.authorCountry),
    propertyLocation: tm.propertyLocation,
  }));

  return (
    <section className="bg-feature py-[clamp(64px,10vw,160px)] text-surface">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="whitespace-pre-line font-serif text-3xl leading-tight md:text-4xl">
            {t("reviews.title")}
          </h2>
        </div>
        <TestimonialsCarousel
          items={items}
          prevLabel={t("reviews.prev")}
          nextLabel={t("reviews.next")}
        />
      </Container>
    </section>
  );
}
