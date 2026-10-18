import type { Locale } from "@core/db/columns";
import { isLottieMime, IMAGE_MIMES, VIDEO_MIMES } from "@core/media/mime";
import type { AboutContent } from "../schemas/about";

const CONTACT_PATHS = { buildings: "/buildings", owners: "/owners", real_estate: "/real-estate" } as const;

/** A normalized card carries its destination through moves and translations. */
export function aboutContactHref(card: AboutContent["contact"]["cards"][number], locale: Locale): string | undefined {
  return card.destination ? `/${locale}${CONTACT_PATHS[card.destination]}` : undefined;
}

/** Zero is handled by the caller; the shared StatBand supports at most five columns. */
export function aboutStatColumns(count: number): 1 | 2 | 3 | 4 | 5 {
  return Math.max(1, Math.min(5, count)) as 1 | 2 | 3 | 4 | 5;
}

/** Extra audience rows reuse the approved photos deterministically. */
export function aboutAudienceImage(url: string | undefined, index: number, fallbacks: readonly [string, ...string[]]): string {
  return url || fallbacks[index % fallbacks.length]!;
}

export function aboutMediaKind(mime: string | undefined): "image" | "video" | "lottie" | null {
  // Pre-multimedia cache entries did not include MIME and always contained images.
  if (!mime || (IMAGE_MIMES as readonly string[]).includes(mime)) return "image";
  if ((VIDEO_MIMES as readonly string[]).includes(mime)) return "video";
  return isLottieMime(mime) ? "lottie" : null;
}

export const ABOUT_SHOWCASE_MEDIA_CLASS = "aspect-[4/5] w-full rounded-sm object-cover";
/** IntroSplit's row stretches with its copy; positioned animated content cannot resize it. */
export const ABOUT_SPLIT_ANIMATION_CLASS = "relative min-h-[280px] overflow-hidden min-[881px]:min-h-[380px] [&_video]:absolute [&_video]:inset-0 [&_video]:h-full [&_video]:w-full [&_video]:object-cover [&_canvas]:absolute [&_canvas]:inset-0";
