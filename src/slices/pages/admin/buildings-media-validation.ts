import { IMAGE_MIMES, VIDEO_MIMES, LOTTIE_MIMES } from "@core/media/mime";
import { uuid } from "@core/validation/primitives";
import type { BuildingsContent } from "../schemas/buildings";
import type { EditorialMediaReference } from "../editorial-adapter-types";
export function buildingsMediaReferences(
  content: BuildingsContent,
  og: string | null,
): EditorialMediaReference[] {
  return [
    { path: "og_image_media_id", id: og, kind: "image" },
    {
      path: "hero.image_media_id",
      id: content.hero?.image_media_id,
      kind: "image",
    },
    {
      path: "calculator.media_media_id",
      id: content.calculator?.media_media_id,
      kind: "mixed",
    },
  ].filter((ref) => Boolean(ref.id)) as EditorialMediaReference[];
}
export function buildingsMediaErrors(
  content: BuildingsContent,
  og: string | null,
  assets: ReadonlyMap<string, { mime: string }>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const ref of buildingsMediaReferences(content, og)) {
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
