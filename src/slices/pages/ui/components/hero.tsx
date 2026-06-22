import type { ReactNode } from "react";
import { type MediaImageData, MediaImage } from "@core/media";
import { Container, cn } from "@core/ui";

/**
 * Page hero (S9). A full-width media band with an overlaid editorial headline. Supports
 * a looping muted background **video** (home/guest) or a still **image** (owners/about/
 * real-estate). Media is resolved upstream into `MediaImageData`; the video reads `.url`.
 *
 * Two layouts: the default single-column editorial hero, or — when `aside` is provided
 * (Owners earnings-estimate card, mirroring `mock/owners.html`) — a two-column band with
 * the copy on the left and the slotted card bottom-aligned on the right. `compact` lowers
 * the minimum height for these form-bearing heroes so the page below stays close.
 *
 * Background precedence: `videoUrl` → `image` (R2 `MediaImageData`, optimised via next/image)
 * → `imageUrl` (a plain external hotlink). `imageUrl` is the escape hatch for the approved
 * mock art while the real asset hasn't been uploaded to R2 yet (the seeded `image_media_id`
 * is a placeholder that resolves to nothing); mark such usages TEMP at the call site.
 * `eyebrowPill` renders the eyebrow as the mock's solid accent badge ("★ …").
 */
export function PageHero({
  image,
  imageUrl,
  videoUrl,
  posterUrl,
  eyebrow,
  eyebrowPill,
  headline,
  subtitle,
  actions,
  aside,
  compact,
}: {
  image: MediaImageData | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  posterUrl?: string | null;
  eyebrow?: string;
  eyebrowPill?: boolean;
  headline: string;
  subtitle?: string;
  actions?: ReactNode;
  aside?: ReactNode;
  compact?: boolean;
}) {
  const copy = (
    <div className="text-surface">
      {eyebrow ? (
        eyebrowPill ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-surface">
            <span aria-hidden>★</span>
            {eyebrow}
          </span>
        ) : (
          <span className="text-xs font-medium uppercase tracking-[0.16em] text-feature-accent">
            {eyebrow}
          </span>
        )
      ) : null}
      <h1
        className={cn(
          "mt-4 max-w-[15ch] font-serif font-medium leading-[1.05]",
          compact
            ? "text-[clamp(2.4rem,5.4vw,4.25rem)]"
            : "text-[clamp(2.75rem,7vw,5.5rem)]",
        )}
      >
        {headline}
      </h1>
      {subtitle ? (
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-surface/85">{subtitle}</p>
      ) : null}
      {actions ? <div className="mt-8 flex flex-wrap items-center gap-4">{actions}</div> : null}
    </div>
  );

  return (
    <section
      data-hero
      className={cn(
        "relative isolate flex items-end overflow-hidden bg-feature",
        // `compact` keeps the headline smaller for form-bearing heroes (the aside card
        // shares the row) but still fills the viewport like the mock.
        "min-h-[92vh]",
      )}
    >
      {videoUrl ? (
        <video
          className="absolute inset-0 -z-10 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster={posterUrl ?? image?.url}
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      ) : image ? (
        <MediaImage
          data={image}
          priority
          className="absolute inset-0 -z-10 h-full w-full object-cover"
          sizes="100vw"
        />
      ) : imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- TEMP external hotlink (mock art → R2)
        <img
          src={imageUrl}
          alt=""
          aria-hidden
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
      ) : null}

      <div
        className={cn(
          "absolute inset-0 -z-10",
          "bg-gradient-to-t from-black/70 via-black/30 to-black/20",
        )}
        aria-hidden
      />

      <Container className="pb-[clamp(56px,9vh,104px)] pt-32">
        {aside ? (
          <div className="grid items-end gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
            <div className="max-w-xl">{copy}</div>
            {aside}
          </div>
        ) : (
          <div className="max-w-3xl">{copy}</div>
        )}
      </Container>
    </section>
  );
}
