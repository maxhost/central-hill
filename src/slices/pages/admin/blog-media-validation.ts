import { IMAGE_MIMES } from "@core/media/mime";
import { uuid } from "@core/validation/primitives";
import type { BlogContent } from "../schemas/blog";
import type { EditorialMediaReference } from "../editorial-adapter-types";

export function blogMediaReferences(content: BlogContent, ogImage: string | null): EditorialMediaReference[] {
  const refs: EditorialMediaReference[] = [];
  if (ogImage) refs.push({ path: "og_image_media_id", id: ogImage, kind: "image" });
  if (content.hero?.image_media_id) refs.push({ path: "hero.image_media_id", id: content.hero.image_media_id, kind: "image" });
  return refs;
}

export function blogMediaErrors(content: BlogContent, ogImage: string | null, assets: ReadonlyMap<string, { mime: string }>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const ref of blogMediaReferences(content, ogImage)) {
    const mime = assets.get(ref.id)?.mime;
    if (!uuid.safeParse(ref.id).success || !mime || !(IMAGE_MIMES as readonly string[]).includes(mime)) {
      errors[ref.path] = "Select an uploaded image.";
    }
  }
  return errors;
}
