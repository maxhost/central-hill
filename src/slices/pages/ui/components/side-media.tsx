import type { ReactNode } from "react";
import { MediaImage } from "@core/media";
import { isLottieMime } from "@core/media/mime";
import type { PageMedia } from "../../contract";
import { LoopVideo } from "./loop-video";
import { LottiePlayer } from "./lottie-player";

/**
 * Shared 4:5 side-media element of the Image-Showcase sections (spec home-admin-editor S6,
 * extracted by spec owners-admin-editor S5). Used by Home's guests pitch and Owners'
 * `services` / `dashboard` showcases; every kind fills the same fixed 4:5 frame.
 */

/** The 4:5 frame for an image / video (also the stock-photo fallback's classes). */
export const SIDE_MEDIA_CLASS = "aspect-[4/5] w-full rounded-sm object-cover";
const LOTTIE_FRAME_CLASS = "aspect-[4/5] w-full overflow-hidden rounded-sm";
/** One of `TwoColumnShowcase`'s two equal columns from `lg`, full-width below. */
export const SIDE_MEDIA_SIZES = "(max-width: 1024px) 100vw, 560px";

/**
 * The side media element, chosen by the asset's `mime`. `null` → the caller's stock photo.
 *
 * - `image/*` → `MediaImage`. A WebP may be **animated**, and the deployed optimizer is
 *   Netlify's Image CDN (ADR 0003/0018), not Next's — Next's own optimizer detects an
 *   animated WebP and passes it through untouched, but nothing guarantees the CDN does.
 *   The row carries no "animated" flag, so a WebP in an animated-accepting field is served
 *   `unoptimized` (the original bytes; the hint caps a WebP at 500 KB still / 5 MB
 *   animated). JPG / PNG / AVIF stay optimized.
 * - `video/*` → `LoopVideo`: muted, looping, inline, no controls, decorative; a
 *   reduced-motion preference stops it on its first frame.
 * - Lottie (`application/json` / dotLottie) → the client island, whose player is only
 *   downloaded when a Lottie is actually rendered.
 * - Anything else → `null`.
 */
export function sideMedia(media: PageMedia): ReactNode {
  const mime = media.mime ?? "image/"; // a page cached before S6 carries no mime: an image
  if (mime.startsWith("image/")) {
    return (
      <MediaImage
        data={media}
        className={SIDE_MEDIA_CLASS}
        sizes={SIDE_MEDIA_SIZES}
        unoptimized={mime === "image/webp"}
      />
    );
  }
  if (mime.startsWith("video/")) {
    return <LoopVideo src={media.url} className={SIDE_MEDIA_CLASS} />;
  }
  if (isLottieMime(mime)) {
    return <LottiePlayer src={media.url} label={media.alt} className={LOTTIE_FRAME_CLASS} />;
  }
  return null;
}
