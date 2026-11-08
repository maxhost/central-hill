import { z } from "zod";
import { mediaAltsSchema } from "@core/media/alt";
import {
  serviceSaveInput,
  servicePresentationErrors,
} from "../admin/validation";
import type { ServiceEnvelope } from "../editorial-types";
import { iconKey } from "@core/validation/icon-key";

const url = z
  .string()
  .max(2048)
  .refine((value) => {
    try {
      return ["http:", "https:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, "Enter an http(s) booking URL.")
  .nullable();
export const serviceDraftContentSchema = serviceSaveInput
  .omit({ id: true, slug: true, status: true })
  .extend({
    name: z.string().trim().max(160),
    excerpt: z.string().trim().max(400),
    body: z.string().trim().max(6000),
    cover_media_id: z.uuid().nullable(),
    cta_url: url,
    media_alts: mediaAltsSchema.optional(),
  });
export const serviceSharedSchema = serviceDraftContentSchema
  .pick({
    position: true,
    category_id: true,
    cover_media_id: true,
    og_image_media_id: true,
    price_from: true,
    rating_tenths: true,
    booking_type: true,
    presentation: true,
    gallery: true,
  })
  .extend({
    factIcons: z
      .record(z.string().min(1).max(100), iconKey)
      .refine((value) => Object.keys(value).length <= 500),
    itineraryMedia: z
      .record(z.string().min(1).max(100), z.uuid().nullable())
      .refine((value) => Object.keys(value).length <= 500),
  })
  .strict();
export const serviceEnvelopeSchema = z
  .object({
    schemaVersion: z.literal(1),
    localeMode: z.enum(["inherit", "custom"]),
    content: serviceDraftContentSchema,
  })
  .strict();
export const saveServiceRequestSchema = z
  .object({
    serviceId: z.uuid(),
    locale: z.enum(["en", "es", "pt", "fr"]),
    expectedRevision: z.number().int().nonnegative(),
    templateRevision: z.number().int().nonnegative().nullable(),
    expectedSharedRevision: z.number().int().nonnegative(),
    payload: z.unknown(),
    shared: serviceSharedSchema.optional(),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(200)
      .optional(),
  })
  .strict();
export const publishServiceRequestSchema = z
  .object({
    serviceId: z.uuid(),
    locale: z.enum(["en", "es", "pt", "fr"]),
    expectedRevision: z.number().int().nonnegative(),
  })
  .strict();
export function serviceFieldErrors(
  issues: readonly { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  return Object.fromEntries(
    issues.map((issue) => [
      issue.path
        .map(String)
        .join(".")
        .replace(/^content\./, ""),
      issue.message,
    ]),
  );
}
export function checkServiceEnvelope(
  raw: unknown,
  publish = false,
): { envelope?: ServiceEnvelope; errors: Record<string, string> } {
  let size: number;
  try {
    size = new TextEncoder().encode(JSON.stringify(raw)).byteLength;
  } catch {
    return { errors: { _source: "Invalid service content." } };
  }
  if (size > 256 * 1024)
    return { errors: { _source: "Service content is too large." } };
  const parsed = serviceEnvelopeSchema.safeParse(raw);
  if (!parsed.success)
    return { errors: serviceFieldErrors(parsed.error.issues) };
  const c = parsed.data.content;
  const errors: Record<string, string> = {};
  for (const key of ["facts", "itinerary"] as const) {
    const ids = c.detail[key].map((row) => row.id);
    if (ids.some((id) => !id) || new Set(ids).size !== ids.length)
      errors[`detail.${key}`] = "Each row needs a unique stable identity.";
  }
  if (publish) {
    const strict = serviceSaveInput.safeParse({
      ...c,
      slug: "validation-only",
      status: "published",
    });
    if (!strict.success)
      Object.assign(errors, serviceFieldErrors(strict.error.issues));
    Object.assign(errors, servicePresentationErrors(c, c.presentation ?? null));
  }
  return { envelope: parsed.data, errors };
}
