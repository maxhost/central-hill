import { z } from "zod";
import { mediaAltsSchema } from "@core/media/alt";
import { position, slug } from "@core/validation/primitives";
import { guideTemplate, guideLayout } from "../validation";
import {
  pageSource,
  sectionSource,
  placeSource,
  placeColumns,
  sectionColumns,
} from "../admin/validation";
import { guideSectionPresentation } from "../presentation";
import { GUIDE_EDITOR_LOCALES, type GuideEnvelope } from "../editorial-types";
const nullableId = z.uuid().nullable();
const place = z.strictObject({
  ...placeColumns.shape,
  ...placeSource.shape,
  name: z.string().max(160),
  id: z.uuid(),
  guide_section_id: z.uuid(),
});
const section = z.strictObject({
  ...sectionColumns.shape,
  ...sectionSource.shape,
  title: z.string().max(200),
  id: z.uuid(),
  guide_page_id: z.uuid(),
  layout: guideLayout,
  places: z.array(place).max(256),
});
export const guideEnvelopeSchema = z.strictObject({
  schemaVersion: z.literal(1),
  localeMode: z.enum(["inherit", "custom"]),
  content: z.strictObject({
    ...pageSource.shape,
    title: z.string().max(200),
    city_id: z.uuid(),
    template: guideTemplate,
    position,
    hero_media_id: nullableId,
    og_image_media_id: nullableId,
    sections: z.array(section).max(64),
    media_alts: mediaAltsSchema.optional(),
  }),
});
const sectionShared = z.strictObject({
  header_media_id: nullableId,
  layout: guideLayout,
  presentation: guideSectionPresentation.nullable(),
});
const placeShared = z.strictObject({
  media_id: nullableId,
  address: placeColumns.shape.address,
  phone: placeColumns.shape.phone,
  price_tier: placeColumns.shape.price_tier,
  latitude: placeColumns.shape.latitude,
  longitude: placeColumns.shape.longitude,
  section_id: z.uuid(),
  recommendation_type: z.enum(["restaurant", "viewpoint", "beach"]).nullable(),
});
export const guideSharedSchema = z
  .strictObject({
    city_id: z.uuid(),
    template: guideTemplate,
    position,
    hero_media_id: nullableId,
    og_image_media_id: nullableId,
    sections: z.record(z.uuid(), sectionShared),
    places: z.record(z.uuid(), placeShared),
  })
  .superRefine((s, ctx) => {
    if (
      Object.keys(s.sections).length + Object.keys(s.places).length > 1024 ||
      Buffer.byteLength(JSON.stringify(s), "utf8") > 524288
    )
      ctx.addIssue({ code: "custom", message: "Shared history is too large." });
    for (const p of Object.values(s.places))
      if (!s.sections[p.section_id])
        ctx.addIssue({ code: "custom", message: "Unknown shared section." });
  });
export const saveGuideRequestSchema = z.strictObject({
  guideId: z.uuid(),
  locale: z.enum(GUIDE_EDITOR_LOCALES),
  expectedRevision: z.number().int().nonnegative(),
  templateRevision: z.number().int().nonnegative().nullable(),
  expectedSharedRevision: z.number().int().nonnegative(),
  payload: guideEnvelopeSchema,
  shared: guideSharedSchema.optional(),
  slug: slug.optional(),
});
export const publishGuideRequestSchema = z.strictObject({
  guideId: z.uuid(),
  locale: z.enum(GUIDE_EDITOR_LOCALES),
  expectedRevision: z.number().int().nonnegative(),
});
export function guideLocaleFieldErrors(
  issues: readonly { path: PropertyKey[]; message: string }[],
) {
  return Object.fromEntries(
    issues.map((i) => [
      i.path
        .map(String)
        .join(".")
        .replace(/^(payload\.)?content\./, "")
        .replace(/^payload\./, ""),
      i.message,
    ]),
  );
}
export function checkGuideEnvelope(
  raw: unknown,
  guideId?: string,
): { envelope?: GuideEnvelope; errors: Record<string, string> } {
  const parsed = guideEnvelopeSchema.safeParse(raw);
  if (!parsed.success)
    return { errors: guideLocaleFieldErrors(parsed.error.issues) };
  const envelope = parsed.data as GuideEnvelope,
    errors: Record<string, string> = {};
  const ids = new Set<string>(guideId ? [guideId] : []);
  let count = 0;
  if (Buffer.byteLength(JSON.stringify(envelope), "utf8") > 524288)
    errors._form = "Guide is too large.";
  for (const s of envelope.content.sections) {
    if (ids.has(s.id)) errors.sections = "Duplicate guide identity.";
    ids.add(s.id);
    if (guideId && s.guide_page_id !== guideId)
      errors.sections = "Section belongs to another guide.";
    for (const p of s.places) {
      count++;
      if (ids.has(p.id)) errors.sections = "Duplicate guide identity.";
      ids.add(p.id);
      if (p.guide_section_id !== s.id)
        errors.sections = "Place parent does not match its section.";
    }
  }
  if (count > 256) errors.sections = "Keep at most 256 places.";
  return { envelope, errors };
}
