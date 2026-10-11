import { getImageProps } from "next/image";
import type { MediaImageData } from "@core/media";

/**
 * Optimized URL for the hero `<video poster>` (spec home-admin-editor S4).
 *
 * `poster` takes a single URL (no `srcset`), so we ask `next/image`'s `getImageProps()` — the
 * same optimizer + loader `MediaImage` / `mediaImgTag` use — for one candidate and keep its
 * `src`. Without `sizes`, Next emits a 1x/2x pair and `src` is the **2x** candidate, so a
 * 960 CSS-px request yields a `w=1920` image: the full-bleed hero size the uploader hint asks
 * for. Quality is left to the repo's image config (Next default `qualities: [75]`; AVIF/WebP
 * is negotiated per request via `images.formats`). The intrinsic size only shapes the props
 * we discard, so a fixed 16:9 box is enough.
 *
 * Returns `null` when there is no resolved asset (→ the caller's stock poster). If
 * `getImageProps` throws (R2 host missing from `images.remotePatterns`, i.e.
 * `R2_PUBLIC_BASE_URL` absent at build time) the raw asset URL is used — degrade, never 500,
 * exactly like `mediaImgTag`.
 */
const POSTER_CSS_WIDTH = 960; // → 2x candidate = 1920 px
const POSTER_CSS_HEIGHT = 540;

export function heroPosterSrc(asset: MediaImageData | null | undefined): string | null {
  if (!asset?.url) return null;
  try {
    const { props } = getImageProps({
      src: asset.url,
      alt: "",
      width: POSTER_CSS_WIDTH,
      height: POSTER_CSS_HEIGHT,
    });
    return props.src || asset.url;
  } catch {
    return asset.url;
  }
}
