import { z } from "zod";
import { iconKey } from "@core/validation/icon-key";
import type { ServiceDetailContent } from "./detail";

export const SERVICE_SECTION_KEYS = [
  "included",
  "itinerary",
  "options",
  "pricing",
  "extras",
  "partners",
  "good_to_know",
] as const;
export type ServiceSectionKey = (typeof SERVICE_SECTION_KEYS)[number];
export const SERVICE_ICON_SLOTS = [
  "service_photos",
  "service_badge",
  "service_included",
  "service_note",
  "know_included",
  "know_cancellation",
  "know_practical",
] as const;
export type ServiceIconSlot = (typeof SERVICE_ICON_SLOTS)[number];
export const SERVICE_PRICE_DISPLAYS = [
  "auto",
  "from",
  "on_request",
  "hidden",
] as const;
export type ServicePriceDisplay = (typeof SERVICE_PRICE_DISPLAYS)[number];
export const MAX_SERVICE_CENTS = 2_147_483_647;

const sections = z
  .object({
    included: z.boolean().optional(),
    itinerary: z.boolean().optional(),
    options: z.boolean().optional(),
    pricing: z.boolean().optional(),
    extras: z.boolean().optional(),
    partners: z.boolean().optional(),
    good_to_know: z.boolean().optional(),
  })
  .strict();
const icons = z
  .object({
    service_photos: iconKey.optional(),
    service_badge: iconKey.optional(),
    service_included: iconKey.optional(),
    service_note: iconKey.optional(),
    know_included: iconKey.optional(),
    know_cancellation: iconKey.optional(),
    know_practical: iconKey.optional(),
  })
  .strict();
export const servicePresentationSchema = z
  .object({
    version: z.literal(1),
    sections: sections.optional(),
    price_display: z.enum(SERVICE_PRICE_DISPLAYS).optional(),
    icons: icons.optional(),
  })
  .strict();
export type ServicePresentation = z.infer<typeof servicePresentationSchema>;

export function parseServicePresentation(
  value: unknown,
): ServicePresentation | null {
  const parsed = servicePresentationSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function hasServiceSectionContent(
  key: ServiceSectionKey,
  detail: ServiceDetailContent,
): boolean {
  switch (key) {
    case "included":
      return detail.highlights.length > 0;
    case "itinerary":
      return detail.itinerary.length > 0;
    case "options":
      return detail.option_groups.length > 0;
    case "pricing":
      return detail.pricing !== null;
    case "extras":
      return detail.extras.length > 0;
    case "partners":
      return detail.partners.length > 0;
    case "good_to_know":
      return (
        Object.values(detail.good_to_know).some((items) => items.length > 0) ||
        detail.notes.length > 0
      );
  }
}
export function isServiceSectionVisible(
  key: ServiceSectionKey,
  presentation: ServicePresentation | null | undefined,
  detail: ServiceDetailContent,
): boolean {
  return (
    presentation?.sections?.[key] !== false &&
    hasServiceSectionContent(key, detail)
  );
}
export function applyServicePresentation(
  detail: ServiceDetailContent,
  presentation: ServicePresentation | null | undefined,
): ServiceDetailContent {
  return {
    ...detail,
    highlights: isServiceSectionVisible("included", presentation, detail)
      ? detail.highlights
      : [],
    itinerary: isServiceSectionVisible("itinerary", presentation, detail)
      ? detail.itinerary
      : [],
    option_groups: isServiceSectionVisible("options", presentation, detail)
      ? detail.option_groups
      : [],
    pricing: isServiceSectionVisible("pricing", presentation, detail)
      ? detail.pricing
      : null,
    extras: isServiceSectionVisible("extras", presentation, detail)
      ? detail.extras
      : [],
    partners: isServiceSectionVisible("partners", presentation, detail)
      ? detail.partners
      : [],
    good_to_know: isServiceSectionVisible("good_to_know", presentation, detail)
      ? detail.good_to_know
      : { included: [], cancellation: [], practical: [] },
    notes: presentation?.sections?.good_to_know === false ? [] : detail.notes,
  };
}
export function resolveServicePriceDisplay(
  presentation: ServicePresentation | null | undefined,
  priceFrom: number | null,
): "from" | "on_request" | "hidden" {
  const mode = presentation?.price_display ?? "auto";
  if (mode === "hidden" || mode === "on_request") return mode;
  return priceFrom === null ? "on_request" : "from";
}
export function resolveServiceIcons(
  overrides: ServicePresentation["icons"],
  siteIcons: Record<ServiceIconSlot, string>,
): Record<ServiceIconSlot, string> {
  return Object.fromEntries(
    SERVICE_ICON_SLOTS.map((slot) => [
      slot,
      overrides?.[slot] ?? siteIcons[slot],
    ]),
  ) as Record<ServiceIconSlot, string>;
}
