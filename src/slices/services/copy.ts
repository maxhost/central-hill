import { z } from "zod";

export const SERVICE_COPY_KEYS = [
  "aboutEyebrowService",
  "aboutEyebrowExperience",
  "includedEyebrow",
  "itineraryEyebrow",
  "itineraryTitle",
  "optionsEyebrow",
  "optionsTitle",
  "ratesEyebrow",
  "ratesTitle",
  "partnersEyebrow",
  "partnersTitle",
  "knowEyebrow",
  "knowTitle",
  "knowIncluded",
  "knowCancellation",
  "knowPractical",
  "from",
  "onRequest",
  "whatsappCta",
  "seePartners",
  "noPayment",
  "showAllPhotos",
  "allPhotos",
  "close",
  "guestFavourite",
  "relatedEyebrow",
  "relatedTitle",
  "enquiryEyebrow",
  "enquiryTitle",
  "enquiryIntro",
  "enquiryInfoTitle",
  "phone",
  "whatsapp",
  "email",
  "requestShort",
  "bookingLabel",
  "breadcrumbLabel",
  "home",
] as const;
export type ServiceCopyKey = (typeof SERVICE_COPY_KEYS)[number];
export type ServiceCopy = Partial<Record<ServiceCopyKey, string>>;

/** Retired public labels: keep stored overrides compatible, but expose no editor fields. */
export const SERVICE_HIDDEN_COPY_KEYS: readonly ServiceCopyKey[] = [
  "whatsappCta",
  "aboutEyebrowService",
  "aboutEyebrowExperience",
  "includedEyebrow",
  "optionsEyebrow",
  "ratesEyebrow",
  "partnersEyebrow",
  "knowEyebrow",
  "relatedEyebrow",
  "enquiryEyebrow",
];

export function serviceCopyLimit(key: ServiceCopyKey): number {
  if (key === "enquiryIntro") return 1200;
  if (key === "noPayment") return 400;
  if (key.endsWith("Title")) return 200;
  if (
    [
      "whatsappCta",
      "seePartners",
      "showAllPhotos",
      "close",
      "requestShort",
      "phone",
      "whatsapp",
      "email",
    ].includes(key)
  )
    return 80;
  if (key.includes("Eyebrow")) return 80;
  return 120;
}
export function serviceCopyValueSchema(key: ServiceCopyKey) {
  return z
    .string()
    .trim()
    .max(serviceCopyLimit(key))
    .refine((value) => {
      if (!value) return true;
      if (key === "enquiryTitle")
        return (
          (value.match(/\{name\}/g) ?? []).length === 1 &&
          !value.replace("{name}", "").match(/[{}]/)
        );
      return !/[{}]/.test(value);
    }, "Use {name} once for the enquiry title; other labels must be plain text.");
}
const copyShape = Object.fromEntries(
  SERVICE_COPY_KEYS.map((key) => [key, serviceCopyValueSchema(key).optional()]),
) as Record<
  ServiceCopyKey,
  z.ZodOptional<ReturnType<typeof serviceCopyValueSchema>>
>;
export const serviceCopySchema = z.object(copyShape).strict();

/** Validate each localized override independently; generic Translation can bypass our save schema. */
export function resolveServiceCopy(
  read: (field: string) => string | undefined,
  readSource?: (field: string) => string | undefined,
): ServiceCopy {
  const out: ServiceCopy = {};
  for (const key of SERVICE_COPY_KEYS) {
    const local = serviceCopyValueSchema(key).safeParse(read(`copy:${key}`));
    if (local.success && local.data) out[key] = local.data;
    else {
      const source = serviceCopyValueSchema(key).safeParse(
        readSource?.(`copy:${key}`),
      );
      if (source.success && source.data) out[key] = source.data;
    }
  }
  return out;
}
export function serviceCopySourceFields(
  copy: ServiceCopy,
): Record<string, string | null> {
  return Object.fromEntries(
    SERVICE_COPY_KEYS.map((key) => [`copy:${key}`, copy[key]?.trim() || null]),
  );
}
