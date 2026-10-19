import { IMAGE_MIMES, VIDEO_MIMES, LOTTIE_MIMES } from "@core/media/mime";
import { uuid } from "@core/validation/primitives";
import type { GuestContent } from "../schemas/guest";
import type { EditorialMediaReference } from "../editorial-adapter-types";
export function guestMediaReferences(
  content: GuestContent,
  og: string | null,
): EditorialMediaReference[] {
  return [
    { path: "og_image_media_id", id: og, kind: "image" },
    {
      path: "hero.video_media_id",
      id: content.hero.video_media_id,
      kind: "video",
    },
    {
      path: "hero.poster_media_id",
      id: content.hero.poster_media_id,
      kind: "image",
    },
    {
      path: "welcome.image_media_id",
      id: content.welcome.image_media_id,
      kind: "mixed",
    },
    ...content.services_teaser.items.map((item, index) => ({
      path: `services_teaser.items.${index}.image_media_id`,
      id: item.image_media_id,
      kind: "image",
    })),
    ...content.activities_teaser.items.map((item, index) => ({
      path: `activities_teaser.items.${index}.image_media_id`,
      id: item.image_media_id,
      kind: "image",
    })),
  ].filter((ref) => Boolean(ref.id)) as EditorialMediaReference[];
}
export function guestMediaErrors(
  content: GuestContent,
  og: string | null,
  assets: ReadonlyMap<string, { mime: string }>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const ref of guestMediaReferences(content, og)) {
    const allowed: readonly string[] =
      ref.kind === "video"
        ? VIDEO_MIMES
        : ref.kind === "mixed"
          ? [...IMAGE_MIMES, ...VIDEO_MIMES, ...LOTTIE_MIMES]
          : IMAGE_MIMES;
    if (
      !uuid.safeParse(ref.id).success ||
      !allowed.includes(assets.get(ref.id)?.mime ?? "")
    )
      errors[ref.path] = "Select an uploaded file of the supported type.";
  }
  return errors;
}
