import type { MediaImageData } from "@core/media";
import { optimizedSrc } from "./optimized-src";

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
 * Returns `null` when there is no resolved asset (→ the caller's stock poster); degrades to
 * the raw asset URL if the optimizer throws. The mechanics live in `optimizedSrc`
 * (`./optimized-src`), shared with the Guests teaser cards.
 */
const POSTER_CSS_WIDTH = 960; // → 2x candidate = 1920 px
const POSTER_CSS_HEIGHT = 540;

export function heroPosterSrc(asset: MediaImageData | null | undefined): string | null {
  return optimizedSrc(asset, POSTER_CSS_WIDTH, POSTER_CSS_HEIGHT);
}
