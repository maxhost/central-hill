import { getImageProps } from "next/image";
import type { MediaImageData } from "@core/media";

/**
 * One optimized URL for an uploaded image used where only a single URL fits — a `<video
 * poster>` (`heroPosterSrc`) or a CSS `background-image` (the Guests teaser cards, spec
 * guests-admin-editor S4).
 *
 * Asks `next/image`'s `getImageProps()` — the same optimizer + loader `MediaImage` /
 * `mediaImgTag` use — for one candidate and keeps its `src`. Without `sizes`, Next emits a
 * 1x/2x pair and `src` is the **2x** candidate, so pass the CSS size you want at 1x: a
 * 600×400 request yields a `w=1200` image. Quality is left to the repo's image config;
 * AVIF/WebP is negotiated per request via `images.formats`. The intrinsic size only shapes the
 * props we discard, so the box just needs the right aspect.
 *
 * Returns `null` when there is no resolved asset (→ the caller's stock image). If
 * `getImageProps` throws (R2 host missing from `images.remotePatterns`, i.e.
 * `R2_PUBLIC_BASE_URL` absent at build time) the raw asset URL is used — degrade, never 500,
 * exactly like `mediaImgTag`.
 */
export function optimizedSrc(
  asset: MediaImageData | null | undefined,
  cssWidth: number,
  cssHeight: number,
): string | null {
  if (!asset?.url) return null;
  try {
    const { props } = getImageProps({ src: asset.url, alt: "", width: cssWidth, height: cssHeight });
    return props.src || asset.url;
  } catch {
    return asset.url;
  }
}

/**
 * Makes a URL safe inside an **unquoted** CSS `url(...)` — `PhotoFeatureGrid` writes
 * `backgroundImage: url(${image})` without quotes. Whitespace, parentheses, quotes and
 * backslashes would end or break the token, so they are percent-encoded (`encodeURIComponent`
 * leaves `(`, `)` and `'` alone, so an optimizer URL can still carry them). Percent-encoding is
 * transparent to both the image optimizer's `url=` parameter and a direct R2 URL.
 */
export function cssUrlSafe(url: string): string {
  return url.replace(/[\s()'"\\]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`);
}

/**
 * Teaser card request box: 600×400 CSS px (3:2) → the 2x candidate is `w=1200`, the size the
 * uploader hint asks for. Cards measure ~377×260 at the desktop 3-column layout and up to
 * ~584×260 in the 1-column layout just below 641px, so 1200 px wide covers both at 2x.
 */
const CARD_CSS_WIDTH = 600;
const CARD_CSS_HEIGHT = 400;

/**
 * Background for one photo card: the uploaded asset, optimized and CSS-safe, else the stock
 * photo at that position (`undefined` only past the stock list's end). `optimize` is injectable so the fallback logic is testable without
 * Next's image config.
 */
export function cardBgSrc(
  asset: MediaImageData | null | undefined,
  fallback: string | undefined,
  optimize: (asset: MediaImageData | null | undefined) => string | null = (a) =>
    optimizedSrc(a, CARD_CSS_WIDTH, CARD_CSS_HEIGHT),
): string | undefined {
  const src = optimize(asset);
  return src ? cssUrlSafe(src) : fallback;
}
