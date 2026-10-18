import { MediaImage } from "@core/media";
import type { PageMedia } from "../../contract";
import { aboutMediaKind, ABOUT_SHOWCASE_MEDIA_CLASS, ABOUT_SPLIT_ANIMATION_CLASS } from "../about-presentation";
import { LoopVideo } from "./loop-video";
import { LottiePlayer } from "./lottie-player";

/** About's mixed slots share Home's players while retaining their existing two frame shapes. */
export function AboutMedia({ media, fallback, alt, frame = "split" }: {
  media?: PageMedia;
  fallback: string;
  alt: string;
  frame?: "split" | "showcase";
}) {
  const kind = media?.url ? aboutMediaKind(media.mime) : null;
  const showcase = frame === "showcase";
  const imageClass = showcase ? ABOUT_SHOWCASE_MEDIA_CLASS : undefined;
  const animationClass = showcase ? "aspect-[4/5] w-full overflow-hidden rounded-sm" : ABOUT_SPLIT_ANIMATION_CLASS;

  if (media && kind === "video") {
    return showcase ? <LoopVideo src={media.url} className={ABOUT_SHOWCASE_MEDIA_CLASS} /> : (
      <div className={animationClass}><LoopVideo src={media.url} /></div>
    );
  }
  if (media && kind === "lottie") {
    return <LottiePlayer src={media.url} label={alt} className={animationClass} />;
  }
  if (media && kind === "image" && media.width > 0 && media.height > 0) {
    return <MediaImage
      data={{ ...media, alt }}
      className={imageClass}
      sizes={showcase ? "(max-width: 1024px) 100vw, 560px" : "(max-width: 1024px) 100vw, 600px"}
      unoptimized={media.mime === "image/webp"}
    />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- approved external fallback or legacy image without dimensions
    <img src={kind === "image" ? media?.url || fallback : fallback} alt={alt} className={imageClass} loading="lazy" decoding="async" />
  );
}
