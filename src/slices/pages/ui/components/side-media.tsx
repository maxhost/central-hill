import type { ReactNode } from "react";
import type { PageMedia } from "../../contract";
import { MediaContent } from "./media-content";

/** Existing 4:5 showcase facade; its image/video and Lottie roots stay unchanged. */
export const SIDE_MEDIA_CLASS = "aspect-[4/5] w-full rounded-sm object-cover";
const LOTTIE_FRAME_CLASS = "aspect-[4/5] w-full overflow-hidden rounded-sm";
export const SIDE_MEDIA_SIZES = "(max-width: 1024px) 100vw, 560px";

export function sideMedia(media: PageMedia): ReactNode {
  return MediaContent({
    media,
    className: SIDE_MEDIA_CLASS,
    lottieClassName: LOTTIE_FRAME_CLASS,
    sizes: SIDE_MEDIA_SIZES,
  });
}
