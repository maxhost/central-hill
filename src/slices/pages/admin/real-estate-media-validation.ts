import {
  IMAGE_MIMES,
  VIDEO_MIMES,
  LOTTIE_MIMES,
  DOCUMENT_MIMES,
} from "@core/media/mime";
import { uuid } from "@core/validation/primitives";
import type { RealEstateContent } from "../schemas/real-estate";
import type { EditorialMediaReference } from "../editorial-adapter-types";

export function realEstateMediaReferences(
  content: RealEstateContent,
  og: string | null,
): EditorialMediaReference[] {
  const refs: {
    path: string;
    id: string | null | undefined;
    kind: EditorialMediaReference["kind"];
  }[] = [
    { path: "og_image_media_id", id: og, kind: "image" },
    {
      path: "hero.image_media_id",
      id: content.hero.image_media_id,
      kind: "image",
    },
    {
      path: "hero.capability_statement_media_id",
      id: content.hero.capability_statement_media_id,
      kind: "pdf",
    },
    {
      path: "capabilities.image_media_id",
      id: content.capabilities.image_media_id,
      kind: "mixed",
    },
    {
      path: "asset_management.image_media_id",
      id: content.asset_management.image_media_id,
      kind: "mixed",
    },
    ...content.asset_management.benefits.map((item, index) => ({
      path: `asset_management.benefits.${index}.image_media_id`,
      id: item.image_media_id,
      kind: "image" as const,
    })),
    {
      path: "market.fundamentals.image_left_media_id",
      id: content.market.fundamentals.image_left_media_id,
      kind: "image",
    },
    {
      path: "market.fundamentals.image_right_media_id",
      id: content.market.fundamentals.image_right_media_id,
      kind: "image",
    },
    ...content.process.steps.map((item, index) => ({
      path: `process.steps.${index}.image_media_id`,
      id: item.image_media_id,
      kind: "image" as const,
    })),
  ];
  return refs.filter((ref): ref is EditorialMediaReference => Boolean(ref.id));
}
export function realEstateMediaErrors(
  content: RealEstateContent,
  og: string | null,
  assets: ReadonlyMap<string, { mime: string }>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const ref of realEstateMediaReferences(content, og)) {
    const allowed: readonly string[] =
      ref.kind === "pdf"
        ? DOCUMENT_MIMES
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
