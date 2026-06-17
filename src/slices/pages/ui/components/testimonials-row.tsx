import { getTranslations } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import { Container } from "@core/ui";
import { type TestimonialAudience, listTestimonials } from "@slices/testimonials/contract";

/**
 * Testimonials section (Home mixes audiences; Owners/Guests filter to one). Reads the
 * audience-tagged read model from the testimonials slice; renders nothing when none are
 * published. Subscribes transitively to `testimonial-list`.
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

  return (
    <section className="bg-feature py-[clamp(64px,10vw,160px)] text-surface">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="whitespace-pre-line font-serif text-3xl leading-tight md:text-4xl">
            {t("reviews.title")}
          </h2>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((tm) => (
            <figure
              key={tm.id}
              className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-7"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.14em] text-surface/70">
                  {t(tm.audience === "owner" ? "reviews.owner" : "reviews.guest")}
                </span>
                <span className="text-accent" aria-label={`${tm.rating} / 5`}>
                  {"★".repeat(tm.rating)}
                </span>
              </div>
              <blockquote className="mt-4 grow leading-relaxed text-surface/90">
                “{tm.quote}”
              </blockquote>
              <figcaption className="mt-5 text-sm text-surface/80">
                <span className="font-medium text-surface">{tm.authorName}</span>
                {" · "}
                {tm.authorCountry}
                {tm.propertyLocation ? (
                  <span className="block text-surface/60">{tm.propertyLocation}</span>
                ) : null}
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
