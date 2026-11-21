import type { ReactNode } from "react";
import { MediaImage } from "@core/media";
import { isLottieMime } from "@core/media/mime";
import type { PageMedia } from "../../contract";
import { LoopVideo } from "./loop-video";
import { LottiePlayer } from "./lottie-player";

/** Select content without imposing a frame; the caller owns its geometry. */
export function MediaContent({
  media,
  className,
  lottieClassName = className,
  sizes,
}: {
  media: PageMedia;
  className?: string;
  lottieClassName?: string;
  sizes?: string;
}): ReactNode {
  const mime = media.mime ?? "image/";
  if (mime.startsWith("image/")) {
    // Local selections have provisional dimensions; never let those govern the frame.
    if (media.url.startsWith("blob:") || !(media.width > 0 && media.height > 0)) {
      return (
        // eslint-disable-next-line @next/next/no-img-element -- local blob or legacy image without intrinsic metadata
        <img key={media.url} src={media.url} alt={media.alt} className={className} loading="lazy" decoding="async" />
      );
    }
    return <MediaImage key={media.url} data={media} className={className} sizes={sizes} unoptimized={mime === "image/webp"} />;
  }
  if (mime.startsWith("video/")) return <LoopVideo key={media.url} src={media.url} className={className} />;
  if (isLottieMime(mime)) return <LottiePlayer key={media.url} src={media.url} label={media.alt} className={lottieClassName} />;
  return null;
}
