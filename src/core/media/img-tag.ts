import { getImageProps } from "next/image";
import { blurDataUrl } from "./blur";
import type { MediaImageData } from "./image";

/**
 * Optimised `<img>` **as an HTML string** (kernel — `core/media`, ADR 0027).
 *
 * Nine public pages are 1:1 embeds of `mock/*.html`: their bodies are built as strings and
 * injected with `dangerouslySetInnerHTML`, so they cannot use `<MediaImage>`. Until now their
 * images were raw `<img src="${url}">` — meaning every photo the client uploads for the
 * portfolio was served as the raw original: no `srcset`, no AVIF/WebP, no `width`/`height`
 * (→ CLS), no blurhash, no loading control. Rewriting those pages into JSX would be large,
 * risky and invisible to the user; this helper fixes the `<img>` line instead.
 *
 * Built on `next/image`'s `getImageProps()` — the official API for exactly this case — so the
 * optimizer's `src`/`srcSet`/`sizes` come from Next itself and we never hand-assemble
 * `/_next/image` URLs or couple to that format.
 *
 * Two deliberate escape hatches:
 * - **External fallbacks pass through untouched.** The mock's Unsplash/Pexels URLs already
 *   arrive pre-sized (`?auto=format&w=…&q=70`) from their own CDN; re-optimising them costs
 *   money and gains nothing.
 * - **If `getImageProps` throws, we emit the plain tag.** It throws when the asset's host is
 *   not in `next.config.ts` `images.remotePatterns` — which happens when `R2_PUBLIC_BASE_URL`
 *   is missing at build time. That must degrade to an unoptimised photo, never take a page down.
 */

/** Used when there is neither an asset nor a caller-supplied fallback. */
const EMPTY_SRC = "/placeholders/building.svg";

/** React prop → HTML attribute, for the names that differ. */
const ATTR_NAME: Record<string, string> = {
  srcSet: "srcset",
  fetchPriority: "fetchpriority",
  className: "class",
  crossOrigin: "crossorigin",
  referrerPolicy: "referrerpolicy",
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s: string) => esc(s).replace(/"/g, "&quot;");

function styleString(style: Record<string, string | number>): string {
  return Object.entries(style)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}:${v}`)
    .join(";");
}

function attrsToHtml(props: Record<string, unknown>): string {
  const out: string[] = [];
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === "style") {
      const s = styleString(value as Record<string, string | number>);
      if (s) out.push(`style="${escAttr(s)}"`);
      continue;
    }
    const name = ATTR_NAME[key] ?? key.toLowerCase();
    if (value === true) {
      out.push(name);
      continue;
    }
    out.push(`${name}="${escAttr(String(value))}"`);
  }
  return out.join(" ");
}

export interface MediaImgTagOptions {
  /** The resolved asset, when the backoffice has one set. */
  data?: MediaImageData | null;
  /** Mock/external photo used until a real asset is uploaded. Emitted verbatim. */
  fallbackSrc?: string | null;
  /** Alt for the fallback (the asset's own `alt` wins when there is an asset). */
  fallbackAlt?: string | null;
  /** Responsive `sizes` — drives which `srcset` candidate the browser picks. */
  sizes?: string;
  /** `class` attribute on the emitted `<img>`. */
  className?: string;
  /** LCP candidate: `loading="eager"` + `fetchpriority="high"`. Wins over `loading`. */
  priority?: boolean;
  /** `"eager"` for an above-the-fold image that is not the LCP. Default `"lazy"`. */
  loading?: "lazy" | "eager";
  /** Intrinsic size for the fallback branch (the asset's own dimensions always win). */
  width?: number;
  height?: number;
}

export function mediaImgTag({
  data,
  fallbackSrc,
  fallbackAlt,
  sizes = "100vw",
  className,
  priority = false,
  loading = "lazy",
  width,
  height,
}: MediaImgTagOptions): string {
  const alt = data?.alt || fallbackAlt || "";
  const loadingAttrs = priority
    ? { loading: "eager" as const, fetchPriority: "high" as const }
    : { loading };

  if (data?.url && data.width > 0 && data.height > 0) {
    const blur = blurDataUrl(data.blurhash, data.width, data.height);
    try {
      const { props } = getImageProps({
        src: data.url,
        alt,
        width: data.width,
        height: data.height,
        sizes,
        ...loadingAttrs,
        ...(priority ? { priority: true } : {}),
        ...(blur ? { placeholder: "blur" as const, blurDataURL: blur } : {}),
        ...(className ? { className } : {}),
      });
      return `<img ${attrsToHtml(props as Record<string, unknown>)}>`;
    } catch {
      // Host not allowed by `images.remotePatterns` — serve it unoptimised rather than 500.
    }
  }

  const src = data?.url || fallbackSrc || EMPTY_SRC;
  return `<img ${attrsToHtml({
    src,
    alt,
    ...(className ? { class: className } : {}),
    ...loadingAttrs,
    decoding: "async",
    ...(data?.width && data.width > 0 ? { width: data.width, height: data.height } : {}),
    ...(!data?.url && width && height ? { width, height } : {}),
  })}>`;
}
