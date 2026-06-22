import { ButtonLink } from "@core/ui";
import { Band, type CtaNote, type IconCard, altBg } from "./blocks";
import { Icon } from "./icon";

/**
 * Home "guests pitch" — **Image Showcase** (the chosen design; ADR 0022): a lifestyle image with a
 * floating reassurance badge beside the headline, compact benefit highlights and a single CTA. Sits
 * on the warm `altBg` band to keep the home's section rhythm. Purely presentational — `guests_pitch`
 * content is resolved upstream in `home-page.tsx`. Stays inside the S9 `pages` slice.
 */

// Fallback lifestyle image used when the editable `guests_pitch.image_media_id` has no
// resolved R2 URL yet (the section image is set in the Home editor; until an asset is
// uploaded this approved mock photo keeps the section from rendering empty).
const SHOWCASE_IMG =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=72";

type GuestsContent = {
  headline: string;
  subheadline?: string;
  benefits: IconCard[];
  image_media_id?: string;
  cta: CtaNote;
};

export function GuestsSection({
  content,
  imageUrl,
}: {
  content: GuestsContent;
  /** Resolved R2 URL for `image_media_id`; falls back to the approved mock photo. */
  imageUrl?: string | null;
}) {
  const showcase = imageUrl || SHOWCASE_IMG;
  return (
    <Band id="guests" className={altBg}>
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 className="font-serif text-3xl leading-tight text-ink md:text-4xl">{content.headline}</h2>
          {content.subheadline ? (
            <p className="mt-5 text-lg leading-relaxed text-ink-soft">{content.subheadline}</p>
          ) : null}
          <ul className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {content.benefits.slice(0, 4).map((b, i) => (
              <li key={i} className="flex gap-3">
                <Icon name={b.icon_key} className="mt-0.5 h-6 w-6 shrink-0 text-accent-deep" />
                <div>
                  <h3 className="font-medium text-ink">{b.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">{b.description}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-9">
            <ButtonLink href={content.cta.url}>{content.cta.label}</ButtonLink>
            {content.cta.note ? (
              <p className="mt-3 text-sm text-ink-soft">{content.cta.note}</p>
            ) : null}
          </div>
        </div>

        <div className="relative order-first lg:order-last">
          {/* eslint-disable-next-line @next/next/no-img-element -- external/R2 preview image */}
          <img
            src={showcase}
            alt=""
            loading="lazy"
            className="aspect-[4/5] w-full rounded-sm object-cover"
          />
          {content.cta.note ? (
            <div className="absolute -bottom-5 -left-4 hidden max-w-[15rem] items-start gap-2.5 rounded-sm border border-line bg-surface px-5 py-4 shadow-xl sm:flex">
              <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-accent-deep" />
              <span className="text-sm leading-snug text-ink">{content.cta.note}</span>
            </div>
          ) : null}
        </div>
      </div>
    </Band>
  );
}
