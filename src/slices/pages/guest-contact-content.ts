import type { GuestContent } from "./schemas/guest";

/** EN owns this structural reference; localized snapshots never decide placement. */
export function guestContactFormId(content: unknown): string | null | undefined {
  if (!content || typeof content !== "object") return undefined;
  const dual = (content as Record<string, unknown>).dual_cta;
  if (!dual || typeof dual !== "object") return undefined;
  const owner = (dual as Record<string, unknown>).owner;
  if (!owner || typeof owner !== "object") return undefined;
  const contact = (owner as Record<string, unknown>).contact;
  if (!contact || typeof contact !== "object") return undefined;
  const id = (contact as Record<string, unknown>).form_id;
  return typeof id === "string" || id === null ? id : undefined;
}
/** Older EN payloads omit this key; target saves cannot alter the shared choice. */
export function preserveGuestContactAssignment(content: GuestContent, previous: GuestContent, locale: string): GuestContent {
  if (locale === "en" && content.dual_cta.owner.contact && Object.hasOwn(content.dual_cta.owner.contact, "form_id")) return content;
  const result = structuredClone(content);
  const before = previous.dual_cta.owner.contact;
  if (before && Object.hasOwn(before, "form_id")) {
    result.dual_cta.owner.contact ??= {};
    result.dual_cta.owner.contact.form_id = before.form_id;
  } else if (result.dual_cta.owner.contact) delete result.dual_cta.owner.contact.form_id;
  return result;
}
/** Public rendering resolves assignment separately; ignore corrupt manual reference JSON only. */
export function withoutGuestContactAssignment(content: unknown): unknown {
  const result = structuredClone(content);
  if (!result || typeof result !== "object") return result;
  const dual = (result as Record<string, unknown>).dual_cta;
  if (!dual || typeof dual !== "object") return result;
  const owner = (dual as Record<string, unknown>).owner;
  if (!owner || typeof owner !== "object") return result;
  const contact = (owner as Record<string, unknown>).contact;
  if (contact && typeof contact === "object") delete (contact as Record<string, unknown>).form_id;
  return result;
}
