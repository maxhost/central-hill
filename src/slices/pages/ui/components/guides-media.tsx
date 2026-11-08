import { MediaImage } from "@core/media";
import type { PageMedia } from "../../contract";
import { ServicesLoopMedia } from "./services-loop-media";

export const GUIDES_HERO_IMAGE = "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&w=1900&q=70";
export function guidesPosterUrl(poster: PageMedia | undefined): string {
  return poster && (!poster.mime || poster.mime.startsWith("image/")) ? poster.url : GUIDES_HERO_IMAGE;
}
/** Decorative hero: image is both the still background and the video's reduced-motion poster. */
export function GuidesMedia({ video, poster }: { video?: PageMedia; poster?: PageMedia }) {
  const className = "h-full w-full object-cover";
  return <div className="absolute inset-0 -z-10 h-full w-full overflow-hidden">
    {video && (video.mime === "video/mp4" || video.mime === "video/webm") ? (
      <ServicesLoopMedia src={video.url} poster={guidesPosterUrl(poster)} className={className} eager />
    ) : poster && (!poster.mime || poster.mime.startsWith("image/")) ? (
      <MediaImage data={poster} sizes="100vw" priority className={className} />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element -- preserved stock background until media is authored
      <img src={GUIDES_HERO_IMAGE} alt="" className={className} fetchPriority="high" loading="eager" />
    )}
  </div>;
}
