import { z } from "zod";
import { locale, slug, uuid } from "@core/validation/primitives";
import type { BuildingEnvelope } from "../editorial-types";
import {
  BUILDING_SHARED_FIELDS,
  buildingValuesEqual,
} from "../admin/ui/property-editor-state";
export {
  buildingMediaIds,
  prepareBuildingTarget,
  emptyBuildingEnvelope,
  effectiveBuildingBooking,
} from "../admin/ui/property-editor-state";
const text = z.string().max(20000);
const nullable = text.nullable();
const url = z
  .string()
  .max(2048)
  .refine((v) => {
    if (!v) return true;
    try {
      return ["http:", "https:"].includes(new URL(v).protocol);
    } catch {
      return false;
    }
  }, "Use an HTTP or HTTPS URL.")
  .nullable();
const unique = (v: string[]) => new Set(v).size === v.length;
export const buildingEnvelopeSchema = z
  .object({
    schemaVersion: z.literal(1),
    localeMode: z.enum(["inherit", "custom"]).optional(),
    content: z
      .object({
        name: z.string().max(200),
        headline: text,
        teaser: z.string().max(1000),
        description_intro: text,
        description_neighbourhood: nullable,
        meta_title: z.string().max(200).nullable(),
        meta_description: z.string().max(1000).nullable(),
        position: z.number().int().min(0).max(1000000),
        is_new: z.boolean(),
        is_featured: z.boolean(),
        city_id: uuid.or(z.literal("")),
        neighbourhood_id: uuid.nullable(),
        street_address: z.string().max(1000).nullable(),
        latitude: z.number().min(-90).max(90).nullable(),
        longitude: z.number().min(-180).max(180).nullable(),
        cover_media_id: uuid.nullable(),
        og_image_media_id: uuid.nullable(),
        gallery: z.array(uuid).max(100).refine(unique, "Duplicate image."),
        amenity_ids: z
          .array(uuid)
          .max(100)
          .refine(unique, "Duplicate amenity."),
        faq: z
          .array(
            z
              .object({
                id: uuid,
                question: z.string().max(1000),
                answer: z.string().max(10000),
              })
              .strict(),
          )
          .max(100)
          .refine(
            (items) => unique(items.map((i) => i.id)),
            "Duplicate FAQ identity.",
          ),
        avantio_id: z.string().max(200).nullable(),
        default_booking_url: url,
        booking_url: url,
        booking_enabled: z.boolean(),
        booking_button: z.object({ label: z.string().max(80), link: url }).strict().optional(),
      })
      .strict(),
  })
  .strict();
export const saveBuildingRequest = z
  .object({
    id: uuid,
    locale,
    expectedRevision: z.number().int().nonnegative(),
    expectedSharedRevision: z.number().int().nonnegative().optional(),
    sharedChanged: z.boolean().optional(),
    templateRevision: z.number().int().nonnegative().nullable(),
    payload: z.unknown(),
    slug: slug.optional(),
  })
  .strict();
export const publishBuildingRequest = z
  .object({
    id: uuid,
    locale,
    expectedRevision: z.number().int().nonnegative(),
  })
  .strict();
export function issuesByField(
  issues: readonly { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  return Object.fromEntries(
    issues.map((i) => [i.path.map(String).join(".") || "_source", i.message]),
  );
}
export function checkBuildingEnvelope(
  raw: unknown,
  publish = false,
): { envelope?: BuildingEnvelope; errors: Record<string, string> } {
  try {
    if (new TextEncoder().encode(JSON.stringify(raw)).byteLength > 192 * 1024)
      return { errors: { _source: "Document is too large." } };
  } catch {
    return { errors: { _source: "Invalid document." } };
  }
  const result = buildingEnvelopeSchema.safeParse(raw);
  if (!result.success) return { errors: issuesByField(result.error.issues) };
  const errors: Record<string, string> = {};
  const c = result.data.content;
  if (publish) {
    if (c.booking_button?.link?.trim() && !c.booking_button.label.trim())
      errors["booking_button.label"] = "Button label is required when a link is set.";
    if (!c.name.trim()) errors.name = "Name is required.";
    if (!c.teaser.trim()) errors.teaser = "Teaser is required.";
    if (!c.street_address?.trim())
      errors.street_address = "Address is required.";
    if (!c.city_id) errors.city_id = "City is required.";
    for (const [i, f] of c.faq.entries()) {
      if (!f.question.trim() || !f.answer.trim())
        errors[`faq.${i}`] = "Question and answer are required.";
    }
  }
  return { envelope: result.data, errors };
}
export function sharedBuildingValuesMatch(
  a: BuildingEnvelope,
  b: BuildingEnvelope,
): boolean {
  return BUILDING_SHARED_FIELDS.every((key) =>
    buildingValuesEqual(a.content[key], b.content[key]),
  );
}
