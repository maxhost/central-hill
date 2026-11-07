import { z } from "zod";
import { locale, uuid } from "@core/validation/primitives";
import {
  APARTMENT_SHARED_KEYS,
  type ApartmentEnvelope,
  type ApartmentSharedContent,
} from "../editorial-types";
const nullableText = (max: number) => z.string().max(max).nullable();
const bookingUrl = z
  .string()
  .max(2048)
  .nullable()
  .refine((value) => {
    if (!value?.trim()) return true;
    try {
      return ["http:", "https:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, "Use an HTTP or HTTPS URL.");
export const apartmentEnvelopeSchema = z
  .object({
    schemaVersion: z.literal(1),
    localeMode: z.enum(["inherit", "custom"]).optional(),
    content: z
      .object({
        name: z.string().max(200),
        badge: nullableText(200),
        description: z.string().max(50000),
        meta_title: nullableText(500),
        meta_description: nullableText(2000),
        bedrooms: z.number().int().min(0).max(100),
        bathrooms: z.number().int().min(0).max(100),
        max_guests: z.number().int().min(0).max(1000),
        beds_count: z.number().int().min(0).max(1000),
        size_m2: z.number().int().min(0).max(100000).nullable(),
        floor: z.number().int().min(-100).max(1000).nullable(),
        cover_media_id: uuid.nullable(),
        og_image_media_id: uuid.nullable(),
        gallery: z.array(uuid).max(200),
        avantio_id: nullableText(200),
        default_booking_url: bookingUrl,
        booking_url: bookingUrl,
      })
      .strict(),
  })
  .strict();
export const saveApartmentRequest = z
  .object({
    id: uuid,
    parentId: uuid,
    locale,
    expectedRevision: z.number().int().nonnegative(),
    expectedSharedRevision: z.number().int().nonnegative().optional(),
    sharedChanged: z.boolean().optional(),
    templateRevision: z.number().int().nonnegative().nullable(),
    payload: z.unknown(),
  })
  .strict();
export const publishApartmentRequest = z
  .object({
    id: uuid,
    parentId: uuid,
    locale,
    expectedRevision: z.number().int().nonnegative(),
  })
  .strict();
export function issuesByField(
  issues: readonly { path: PropertyKey[]; message: string }[],
) {
  return Object.fromEntries(
    issues.map((issue) => [
      issue.path.map(String).join(".") || "_source",
      issue.message,
    ]),
  );
}
export function checkApartmentEnvelope(
  raw: unknown,
  publish = false,
): { envelope?: ApartmentEnvelope; errors: Record<string, string> } {
  try {
    if (new TextEncoder().encode(JSON.stringify(raw)).byteLength > 192 * 1024)
      return { errors: { _source: "Document is too large." } };
  } catch {
    return { errors: { _source: "Invalid document." } };
  }
  const parsed = apartmentEnvelopeSchema.safeParse(raw);
  if (!parsed.success) return { errors: issuesByField(parsed.error.issues) };
  const errors: Record<string, string> = {};
  if (publish) {
    if (!parsed.data.content.name.trim()) errors.name = "Name is required.";
    if (parsed.data.content.max_guests < 1)
      errors.max_guests = "Guest capacity must be positive.";
  }
  return { envelope: parsed.data, errors };
}
/** Common values have one identity-level source, including retained legacy fields. */
export const apartmentSharedFields = APARTMENT_SHARED_KEYS;
export function semanticEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) || Array.isArray(b))
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((v, i) => semanticEqual(v, b[i]))
    );
  const left = a as Record<string, unknown>,
    right = b as Record<string, unknown>;
  const keys = Object.keys(left);
  return (
    keys.length === Object.keys(right).length &&
    keys.every(
      (key) =>
        Object.hasOwn(right, key) && semanticEqual(left[key], right[key]),
    )
  );
}
export function apartmentSharedContent(
  envelope: ApartmentEnvelope,
): ApartmentSharedContent {
  return Object.fromEntries(
    APARTMENT_SHARED_KEYS.map((key) => [
      key,
      structuredClone(envelope.content[key]),
    ]),
  ) as ApartmentSharedContent;
}
export function apartmentLocalizedContent(envelope: ApartmentEnvelope) {
  return Object.fromEntries(
    Object.entries(envelope.content).filter(
      ([key]) => !(APARTMENT_SHARED_KEYS as readonly string[]).includes(key),
    ),
  );
}
export function overlayApartmentShared(
  envelope: ApartmentEnvelope,
  content: Partial<ApartmentSharedContent>,
): ApartmentEnvelope {
  return { ...envelope, content: { ...envelope.content, ...content } };
}
export function prepareApartmentTarget(
  source: ApartmentEnvelope,
  own: ApartmentEnvelope | null,
): ApartmentEnvelope {
  return own?.localeMode === "custom" || (own && own.localeMode !== "inherit")
    ? overlayApartmentShared(
        { ...structuredClone(own), localeMode: "custom" },
        apartmentSharedContent(source),
      )
    : { ...structuredClone(source), localeMode: "inherit" };
}
export function sharedApartmentValuesMatch(
  candidate: ApartmentEnvelope,
  source: ApartmentEnvelope,
) {
  return semanticEqual(
    apartmentSharedContent(candidate),
    apartmentSharedContent(source),
  );
}
export function apartmentMediaIds(envelope: ApartmentEnvelope): string[] {
  return [
    ...new Set(
      [
        envelope.content.cover_media_id,
        envelope.content.og_image_media_id,
        ...envelope.content.gallery,
      ].filter((id): id is string => Boolean(id)),
    ),
  ];
}
export function resolveApartmentBooking(
  envelope: ApartmentEnvelope,
): string | null {
  return (
    envelope.content.booking_url?.trim() ||
    envelope.content.default_booking_url?.trim() ||
    null
  );
}
export function emptyApartmentEnvelope(): ApartmentEnvelope {
  return {
    schemaVersion: 1,
    content: {
      name: "",
      badge: null,
      description: "",
      meta_title: null,
      meta_description: null,
      bedrooms: 0,
      bathrooms: 0,
      max_guests: 0,
      beds_count: 0,
      size_m2: null,
      floor: null,
      cover_media_id: null,
      og_image_media_id: null,
      gallery: [],
      avantio_id: null,
      default_booking_url: null,
      booking_url: null,
    },
  };
}
