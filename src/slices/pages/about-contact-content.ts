import type { AboutContent } from "./schemas/about";

/** This single structural reference belongs to EN; target snapshots are never authority. */
export function aboutContactFormId(content: unknown): string | null | undefined {
  if (!content || typeof content !== "object") return undefined;
  const contact = (content as Record<string, unknown>).contact;
  if (!contact || typeof contact !== "object") return undefined;
  const form = (contact as Record<string, unknown>).form;
  if (!form || typeof form !== "object") return undefined;
  const id = (form as Record<string, unknown>).form_id;
  return typeof id === "string" || id === null ? id : undefined;
}
/** Old EN clients omit the key; target clients cannot replace their shared reference. */
export function preserveAboutContactAssignment(content: AboutContent, previous: AboutContent, locale: string): AboutContent {
  if (locale === "en" && Object.hasOwn(content.contact.form, "form_id")) return content;
  const result = structuredClone(content);
  if (Object.hasOwn(previous.contact.form, "form_id")) result.contact.form.form_id = previous.contact.form.form_id;
  else delete result.contact.form.form_id;
  return result;
}

/** The assignment is resolved separately; corrupt manual JSON cannot discard About text. */
export function withoutAboutContactAssignment(content: unknown): unknown {
  const result = structuredClone(content);
  if (!result || typeof result !== "object") return result;
  const contact = (result as Record<string, unknown>).contact;
  if (!contact || typeof contact !== "object") return result;
  const form = (contact as Record<string, unknown>).form;
  if (form && typeof form === "object") delete (form as Record<string, unknown>).form_id;
  return result;
}
