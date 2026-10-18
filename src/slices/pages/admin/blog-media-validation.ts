import { IMAGE_MIMES } from "@core/media/mime";
import { uuid } from "@core/validation/primitives";

export function blogMediaReferences(ogImage: string | null) {
  return ogImage ? [{ path: "og_image_media_id", id: ogImage }] : [];
}

export function blogMediaErrors(ogImage: string | null, assets: ReadonlyMap<string, { mime: string }>): Record<string, string> {
  if (!ogImage) return {};
  const mime = assets.get(ogImage)?.mime;
  return uuid.safeParse(ogImage).success && mime && (IMAGE_MIMES as readonly string[]).includes(mime)
    ? {} : { og_image_media_id: "Select an uploaded image." };
}
