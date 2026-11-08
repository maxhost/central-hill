import { MediaImage } from "@core/media";
import { isLottieMime } from "@core/media/mime";
import type { PageMedia } from "../../contract";
import { ServicesLoopMedia, ServicesLottieMedia } from "./services-loop-media";

export const SERVICES_HERO_IMAGE =
  "https://images.unsplash.com/photo-1469022563428-aa04fef9f5a2?auto=format&fit=crop&w=1900&q=70";
export const SERVICES_CTA_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=70";

/** Poster must be a still-capable image; unresolved/unsupported media retains the stock photo. */
export function servicesPosterUrl(
  poster: PageMedia | undefined,
  fallback: string,
): string {
  return poster && (!poster.mime || poster.mime.startsWith("image/"))
    ? poster.url
    : fallback;
}

export function ServicesMedia({
  media,
  poster,
  fallback,
  alt,
  hero = false,
}: {
  media?: PageMedia;
  poster?: PageMedia;
  fallback: string;
  alt: string;
  hero?: boolean;
}) {
  const frame = hero
    ? "absolute inset-0 -z-10 h-full w-full overflow-hidden"
    : "relative aspect-[4/5] w-full overflow-hidden rounded-sm";
  const fill = "h-full w-full object-cover";
  const mime = media?.mime ?? "image/";
  const still = servicesPosterUrl(poster, fallback);
  let visual;
  if (media && mime.startsWith("video/")) {
    visual = (
      <ServicesLoopMedia
        src={media.url}
        poster={still}
        className={fill}
        eager={hero}
      />
    );
  } else if (media && isLottieMime(mime)) {
    visual = (
      <ServicesLottieMedia
        src={media.url}
        poster={still}
        alt={alt}
        className={fill}
        eager={hero}
      />
    );
  } else if (media && mime === "image/webp") {
    // A picture selects the still poster before fetching an animated original with reduced motion.
    visual = (
      <picture>
        <source media="(prefers-reduced-motion: reduce)" srcSet={still} />
        <img
          src={media.url}
          alt={alt}
          loading={hero ? "eager" : "lazy"}
          fetchPriority={hero ? "high" : undefined}
          className={fill}
        />
      </picture>
    );
  } else if (media && mime.startsWith("image/")) {
    visual = (
      <MediaImage
        data={{ ...media, alt }}
        className={fill}
        sizes={hero ? "100vw" : "(max-width: 1024px) 100vw, 560px"}
        priority={hero}
      />
    );
  } else {
    visual = (
      // eslint-disable-next-line @next/next/no-img-element -- established stock fallback
      <img
        src={fallback}
        alt={alt}
        loading={hero ? "eager" : "lazy"}
        fetchPriority={hero ? "high" : undefined}
        className={fill}
      />
    );
  }
  return <div className={frame}>{visual}</div>;
}
