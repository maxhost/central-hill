import { IMAGE_MIMES, VIDEO_MIMES, LOTTIE_MIMES } from "@core/media/mime";
import { uuid } from "@core/validation/primitives";
import type { ServicesContent } from "../schemas/services";

/** Server-side reference checks: a forged payload must not use a video as OG/poster. */
export function servicesMediaReferences(content: ServicesContent, ogImage: string | null) {
  return [
    { path: "og_image_media_id", id: ogImage, animated: false },
    ...(["hero", "final_cta"] as const).flatMap((section) => [
      { path: `${section}.media_media_id`, id: content[section]?.media_media_id, animated: true },
      { path: `${section}.poster_media_id`, id: content[section]?.poster_media_id, animated: false },
    ]),
  ].filter((ref): ref is typeof ref & { id: string } => Boolean(ref.id));
}

export function servicesMediaErrors(
  content: ServicesContent,
  ogImage: string | null,
  assets: ReadonlyMap<string, { mime: string }>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const ref of servicesMediaReferences(content, ogImage)) {
    const mime = assets.get(ref.id)?.mime;
    const allowed: readonly string[] = ref.animated
      ? [...IMAGE_MIMES, ...VIDEO_MIMES, ...LOTTIE_MIMES] : IMAGE_MIMES;
    if (!uuid.safeParse(ref.id).success || !mime || !allowed.includes(mime)) {
      errors[ref.path] = ref.animated ? "Select an uploaded image, video or animation." : "Select an uploaded still image.";
    }
  }
  return errors;
}
