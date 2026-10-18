import { IMAGE_MIMES } from "@core/media/mime";
export function guideMediaReferences(input: object): {id: string; path: string}[] {
  return Object.entries(input).filter(([key, value]) => key.endsWith("_media_id") && typeof value === "string" && value.length > 0).map(([path, id]) => ({ id: id as string, path }));
}
export function guideMediaErrors(input: object, assets: ReadonlyMap<string, { mime: string }>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const ref of guideMediaReferences(input)) {
    const mime = assets.get(ref.id)?.mime;
    if (!mime || !(IMAGE_MIMES as readonly string[]).includes(mime)) errors[ref.path] = "Select an uploaded JPEG, PNG, WebP or AVIF image.";
  }
  return errors;
}
