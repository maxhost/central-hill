import { IMAGE_MIMES, VIDEO_MIMES } from "@core/media/mime";
import { uuid } from "@core/validation/primitives";
import type { GuidesContent } from "../schemas/guides";

export function guidesMediaReferences(content: GuidesContent, ogImage: string | null) {
  return [
    { path: "og_image_media_id", id: ogImage, video: false },
    { path: "hero.video_media_id", id: content.hero?.video_media_id, video: true },
    { path: "hero.poster_media_id", id: content.hero?.poster_media_id, video: false },
    { path: "guide_aside.image_media_id", id: content.guide_aside.image_media_id, video: false },
  ].filter((ref): ref is typeof ref & { id: string } => Boolean(ref.id));
}
export function guidesMediaErrors(content: GuidesContent, ogImage: string | null, assets: ReadonlyMap<string, { mime: string }>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const ref of guidesMediaReferences(content, ogImage)) {
    const mime = assets.get(ref.id)?.mime;
    const allowed: readonly string[] = ref.video ? VIDEO_MIMES : IMAGE_MIMES;
    if (!uuid.safeParse(ref.id).success || !mime || !allowed.includes(mime)) {
      errors[ref.path] = ref.video ? "Select an uploaded MP4 or WebM video." : "Select an uploaded image.";
    }
  }
  return errors;
}
