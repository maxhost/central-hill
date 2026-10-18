import { IMAGE_MIMES } from "@core/media/mime";
export function guideMediaReferences(input: object): {id: string; path: string}[] {
  return Object.entries(input).filter(([key, value]) => (key === "media_id" || key.endsWith("_media_id")) && typeof value === "string" && value.length > 0).map(([path, id]) => ({ id: id as string, path }));
}
export function guideMediaErrors(input: object, assets: ReadonlyMap<string, { mime: string }>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const ref of guideMediaReferences(input)) {
    const mime = assets.get(ref.id)?.mime;
    if (!mime || !(IMAGE_MIMES as readonly string[]).includes(mime)) errors[ref.path] = "Select an uploaded JPEG, PNG, WebP or AVIF image.";
  }
  return errors;
}

/** Build one batch for a complete live tree, retaining exact error paths for each reference. */
export function guideTreeMediaReferences(page: import("./model").GuidePageEdit): {id: string; path: string}[] {
  return [
    ...guideMediaReferences(page),
    ...page.sections.flatMap(section => [
      ...guideMediaReferences(section).map(ref => ({...ref, path: `sections.${section.id}.${ref.path}`})),
      ...section.places.flatMap(place => guideMediaReferences(place).map(ref => ({...ref, path: `sections.${section.id}.places.${place.id}.${ref.path}`}))),
    ]),
  ];
}
export function guideTreeMediaErrors(page: import("./model").GuidePageEdit, assets: ReadonlyMap<string, { mime: string }>): Record<string, string> {
  return Object.fromEntries(guideTreeMediaReferences(page).filter(ref => {
    const mime = assets.get(ref.id)?.mime;
    return !mime || !(IMAGE_MIMES as readonly string[]).includes(mime);
  }).map(ref => [ref.path, "Select an uploaded JPEG, PNG, WebP or AVIF image."]));
}
