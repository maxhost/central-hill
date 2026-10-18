/**
 * Admin **save** schemas for slice `services` (S12) — the service-category and the
 * service editors. Mirrors the public `serviceInput`/`serviceCategoryInput` in the
 * editor's post shape: `id?`, nullable optionals (the client posts `null` for empty
 * controls), `min(1)` on required [T] text, gallery riding along. `price_from` is
 * integer cents (no floats). Category `slug` is a plain column (not the slug table).
 */
import { z } from "zod";
import { iconKey } from "@core/validation/icon-key";
import {
  cents,
  contentStatus,
  position,
  slug,
  tStr,
} from "@core/validation/primitives";
import {
  serviceDetailContent,
  parseDetail,
  type ServiceDetailContent,
} from "../detail";
import {
  MAX_SERVICE_CENTS,
  SERVICE_SECTION_KEYS,
  hasServiceSectionContent,
  parseServicePresentation,
  servicePresentationSchema,
  type ServicePresentation,
} from "../presentation";
import { serviceCopySchema } from "../copy";

export const serviceCategorySaveInput = z.object({
  id: z.uuid().optional(),
  slug,
  icon: iconKey,
  position,
  // [T] source value (en):
  name: tStr({ min: 1, max: 80 }),
});
export type ServiceCategorySaveInput = z.infer<typeof serviceCategorySaveInput>;

export const serviceSaveInput = z.object({
  id: z.uuid().optional(),
  slug,
  status: contentStatus,
  position,
  category_id: z.uuid(),
  cover_media_id: z.uuid(),
  og_image_media_id: z.uuid().nullable(),
  price_from: cents.max(MAX_SERVICE_CENTS).nullable(),
  presentation: servicePresentationSchema.nullable().optional(),
  copy: serviceCopySchema.optional(),
  /** Satisfaction score in tenths (0–50 → 0.0–5.0); null when unrated (ADR 0032). */
  rating_tenths: z.number().int().min(0).max(50).nullable(),
  booking_type: z.enum(["enquiry", "external", "none"]),
  cta_url: z.url().nullable(),
  // [T] source values (en):
  name: tStr({ min: 1, max: 160 }),
  excerpt: tStr({ min: 1, max: 400 }),
  body: tStr({ min: 1, max: 6000 }),
  duration_label: tStr({ max: 80 }).nullable(),
  /** Display suffix after the price, e.g. "/ person". */
  price_suffix: tStr({ max: 40 }).nullable(),
  cta_label: tStr({ max: 80 }).nullable(),
  meta_title: tStr({ max: 70 }).nullable(),
  meta_description: tStr({ max: 200 }).nullable(),
  /**
   * Rich detail sections — ONE [T] field stored as portable JSON (ADR 0013). Errors on
   * nested paths surface keyed by their dotted path (e.g. `detail.pricing.rows.0.cells`).
   */
  detail: serviceDetailContent,
  // Relation:
  gallery: z.array(z.uuid()),
});
export type ServiceSaveInput = z.infer<typeof serviceSaveInput>;

/** Validate against effective persisted presentation when older clients omit the field. */
export function servicePresentationErrors(
  input: {
    detail: ServiceDetailContent;
    price_from: number | null;
    booking_type: string;
    cta_url: string | null;
    cta_label: string | null;
  },
  presentation: ServicePresentation | null,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const fields = {
    included: "highlights",
    itinerary: "itinerary",
    options: "option_groups",
    pricing: "pricing",
    extras: "extras",
    partners: "partners",
    good_to_know: "good_to_know",
  };
  for (const key of SERVICE_SECTION_KEYS) {
    if (
      presentation?.sections?.[key] === true &&
      !hasServiceSectionContent(key, input.detail)
    )
      errors[`detail.${fields[key]}`] =
        "Add content before showing this section.";
  }
  if (presentation?.price_display === "from" && input.price_from === null)
    errors.price_from = "Enter a starting price.";
  if (input.booking_type === "external") {
    if (!input.cta_url || !/^https?:\/\//i.test(input.cta_url))
      errors.cta_url = "Enter an http(s) booking URL.";
    if (!input.cta_label?.trim())
      errors.cta_label = "Enter a booking button label.";
  }
  return errors;
}
export function serviceStoredContentValid(
  detailRaw: string | undefined,
  presentationRaw: unknown,
): boolean {
  return (
    (!detailRaw || parseDetail(detailRaw) !== null) &&
    (presentationRaw == null ||
      parseServicePresentation(presentationRaw) !== null)
  );
}
