import { IMAGE_MIMES, VIDEO_MIMES, LOTTIE_MIMES } from "@core/media/mime";
import { uuid } from "@core/validation/primitives";
import type { AboutContent } from "../schemas/about";
export function aboutMediaReferences(c: AboutContent, og: string | null) {
  return [
    { path: "og_image_media_id", id: og, mixed: false },
    ...(["hero", "story", "organisation", "community"] as const).map(section => ({ path: `${section}.image_media_id`, id: c[section].image_media_id, mixed: section !== "hero" })),
    ...c.serve.audiences.map((a, i) => ({ path: `serve.audiences.${i}.image_media_id`, id: a.image_media_id, mixed: false })),
    ...c.certifications.items.map((a, i) => ({ path: `certifications.items.${i}.logo_media_id`, id: a.logo_media_id, mixed: false })),
    ...c.contact.cards.map((card, i) => ({ path: `contact.cards.${i}.image_media_id`, id: card.image_media_id, mixed: false })),
  ].filter((r): r is typeof r & { id: string } => Boolean(r.id));
}
export function aboutMediaErrors(c: AboutContent, og: string | null, assets: ReadonlyMap<string, { mime: string }>) {
  const errors: Record<string, string> = {};
  for (const ref of aboutMediaReferences(c, og)) {
    const mime = assets.get(ref.id)?.mime;
    const allowed: readonly string[] = ref.mixed ? [...IMAGE_MIMES, ...VIDEO_MIMES, ...LOTTIE_MIMES] : IMAGE_MIMES;
    if (!uuid.safeParse(ref.id).success || !mime || !allowed.includes(mime)) errors[ref.path] = ref.mixed ? "Select an uploaded image, MP4/WebM or Lottie." : "Select an uploaded image.";
  }
  return errors;
}
