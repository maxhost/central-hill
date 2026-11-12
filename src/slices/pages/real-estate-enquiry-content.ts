import type { RealEstateContent } from "./schemas/real-estate";

/** EN owns the structural assignment; localized snapshots are never public authority. */
export function realEstateEnquiryFormId(content: unknown): string | null | undefined {
  if (!content || typeof content !== "object") return undefined;
  const enquiry = (content as Record<string, unknown>).deal_enquiry;
  if (!enquiry || typeof enquiry !== "object") return undefined;
  const id = (enquiry as Record<string, unknown>).form_id;
  return typeof id === "string" || id === null ? id : undefined;
}
/** Older EN payloads omit this key; target saves cannot replace the shared selection. */
export function preserveRealEstateEnquiryAssignment(content: RealEstateContent, previous: RealEstateContent, locale: string): RealEstateContent {
  if (locale === "en" && content.deal_enquiry && Object.hasOwn(content.deal_enquiry, "form_id")) return content;
  const result = structuredClone(content);
  if (previous.deal_enquiry && Object.hasOwn(previous.deal_enquiry, "form_id")) {
    result.deal_enquiry ??= {};
    result.deal_enquiry.form_id = previous.deal_enquiry.form_id;
  } else if (result.deal_enquiry) delete result.deal_enquiry.form_id;
  return result;
}
/** Resolve assignment separately so malformed manual references never discard public text. */
export function withoutRealEstateEnquiryAssignment(content: unknown): unknown {
  const result = structuredClone(content);
  if (!result || typeof result !== "object") return result;
  const enquiry = (result as Record<string, unknown>).deal_enquiry;
  if (enquiry && typeof enquiry === "object") delete (enquiry as Record<string, unknown>).form_id;
  return result;
}
