import { IMAGE_MIMES, VIDEO_MIMES, LOTTIE_MIMES } from "@core/media/mime";
import { uuid } from "@core/validation/primitives";
import type { OwnersContent } from "../schemas/owners";
import type { EditorialMediaReference } from "../editorial-adapter-types";
export function ownersMediaReferences(
  content: OwnersContent,
  og: string | null,
): EditorialMediaReference[] {
  const refs = [
    { path: "og_image_media_id", id: og, kind: "image" },
    {
      path: "hero.image_media_id",
      id: content.hero.image_media_id,
      kind: "image",
    },
    {
      path: "services.image_media_id",
      id: content.services.image_media_id,
      kind: "mixed",
    },
    {
      path: "dashboard.image_media_id",
      id: content.dashboard.image_media_id,
      kind: "mixed",
    },
    ...content.journey.steps.map((step, index) => ({
      path: `journey.steps.${index}.image_media_id`,
      id: step.image_media_id,
      kind: "image",
    })),
    {
      path: "final_cta.image_media_id",
      id: content.final_cta?.image_media_id,
      kind: "image",
    },
  ];
  return refs.filter((ref) => Boolean(ref.id)) as EditorialMediaReference[];
}
export function ownersMediaErrors(
  content: OwnersContent,
  og: string | null,
  assets: ReadonlyMap<string, { mime: string }>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const ref of ownersMediaReferences(content, og)) {
    const allowed: readonly string[] =
      ref.kind === "mixed"
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
