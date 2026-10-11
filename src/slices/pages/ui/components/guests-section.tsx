import { TwoColumnShowcase } from "@core/ui";
import type { PageMedia } from "../../contract";
import type { CtaNote, IconCard } from "./blocks";
import { Icon } from "@core/ui/icon";
import { SIDE_MEDIA_CLASS, sideMedia } from "./side-media";

/**
 * Home "guests pitch" — **Image Showcase** (the chosen design; ADR 0022): a lifestyle image with a
 * floating reassurance badge beside the headline, compact benefit highlights and a single CTA. Sits
 * on the warm `altBg` band to keep the home's section rhythm. Purely presentational — `guests_pitch`
 * content is resolved upstream in `home-page.tsx`. Stays inside the S9 `pages` slice.
 *
 * Thin composer over the generalized `core/ui` `TwoColumnShowcase` (ADR 0033,
 * `docs/specs/home-component-library/05-two-column-showcase.md`): resolves the image fallback
 * and maps `GuestsContent`'s field names onto the shared component's generic prop names. The
 * -10% `compact` rhythm and the `altBg` tone are passed straight through — see that component
 * for why `compact` is an inline-style override rather than a competing Tailwind class.
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
  /** Floating image badge (spec S3). Blank label → `cta.note`; blank icon → `check`. */
  badge?: { label?: string; icon_key?: string };
};

export function GuestsSection({
  content,
  image,
}: {
  content: GuestsContent;
  /**
   * Resolved asset for `image_media_id` — photo, animated WebP, video or Lottie (S6);
   * missing or of an unknown type → the approved mock photo.
   */
  image?: PageMedia | null;
}) {
  const imageEl = (image ? sideMedia(image) : null) ?? (
    /* eslint-disable-next-line @next/next/no-img-element -- approved mock photo,
       already sized by Unsplash's own CDN (ADR 0027) */
    <img src={SHOWCASE_IMG} alt="" loading="lazy" className={SIDE_MEDIA_CLASS} />
  );

  return (
    <TwoColumnShowcase
      id="guests"
      tone="alt"
      compact
      // Today's image sits on the right at `lg` (`order-last`) — the shared component's
      // default — and stacks above the copy on mobile regardless (CSS-only, unchanged).
      imagePosition="right"
      headline={content.headline}
      body={content.subheadline}
      bullets={content.benefits.slice(0, 4).map((b) => ({
        icon: <Icon name={b.icon_key} size={24} className="mt-0.5 shrink-0 text-accent-deep" />,
        title: b.title,
        description: b.description,
      }))}
      cta={{ href: content.cta.url, label: content.cta.label, note: content.cta.note }}
      badge={content.badge?.label?.trim() ? content.badge.label : undefined}
      badgeIcon={
        content.badge?.icon_key ? (
          <Icon name={content.badge.icon_key} size={20} />
        ) : undefined
      }
      image={imageEl}
    />
  );
}
