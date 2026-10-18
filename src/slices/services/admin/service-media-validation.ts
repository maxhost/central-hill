import { IMAGE_MIMES } from "@core/media/mime";
import type { ServiceDetailContent } from "../detail";

export function serviceMediaReferences(input: {
  cover_media_id: string;
  og_image_media_id: string | null;
  gallery: string[];
  detail: ServiceDetailContent;
}) {
  return [
    { id: input.cover_media_id, path: "cover_media_id" },
    { id: input.og_image_media_id, path: "og_image_media_id" },
    ...input.gallery.map((id, i) => ({ id, path: `gallery.${i}` })),
    ...input.detail.itinerary.map((step, i) => ({
      id: step.media_id,
      path: `detail.itinerary.${i}.media_id`,
    })),
  ].filter((ref): ref is { id: string; path: string } => Boolean(ref.id));
}
export function serviceMediaErrors(
  input: Parameters<typeof serviceMediaReferences>[0],
  assets: ReadonlyMap<string, { mime: string }>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const ref of serviceMediaReferences(input)) {
    const mime = assets.get(ref.id)?.mime;
    if (!mime || !(IMAGE_MIMES as readonly string[]).includes(mime))
      errors[ref.path] = "Select an uploaded JPEG, PNG, WebP or AVIF image.";
  }
  return errors;
}
