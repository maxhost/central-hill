import "server-only";
import { createHash } from "node:crypto";
import { eq, desc, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@core/auth";
import { db } from "@core/db/client";
import type { Locale } from "@core/db/columns";
import { loadTranslationRows, hashSource } from "@core/i18n";
import { getGlobals } from "@slices/settings/contract";
import { readAboutContactAssignment, readGuestContactAssignment, readRealEstateEnquiryAssignment } from "@slices/pages/server-contract";
import { readServiceEnquiryAssignment, serviceEnquiryAssignmentGuard } from "@slices/services/server-contract";
import { form_definition } from "../schema";
import { approvedBlueprint, textFields } from "../domain";
import { readStoredBlueprint, formIdSchema } from "../validation";
import type { FormTranslations } from "../types";
import type { HeaderFormOption, PublicFormModel } from "../public-types";
import { FORMS_PUBLIC_TAGS } from "../public-types";
import { record } from "./queries";

export async function listHeaderContactFormOptions(): Promise<HeaderFormOption[]> {
  await requireStaff(["admin"]);
  return (await db.select().from(form_definition).orderBy(desc(form_definition.updated_at))).map(row => {
    let reason: HeaderFormOption["reason"] = row.status === "archived" ? "archived" : !z.email().max(254).safeParse(row.recipient).success ? "recipient" : null;
    try { readStoredBlueprint(row.definition); } catch { reason = "definition"; }
    return { id: row.id, name: row.name, available: reason === null, reason };
  });
}
export async function getAssignableHeaderForm(id: string): Promise<{ id: string; revision: number } | null> {
  if (!formIdSchema.safeParse(id).success) return null;
  const [row] = await db.select().from(form_definition).where(eq(form_definition.id,id)).limit(1);
  if (!row || row.status !== "draft" || !z.email().max(254).safeParse(row.recipient).success) return null;
  try { readStoredBlueprint(row.definition); } catch { return null; }
  return { id: row.id, revision: row.revision };
}
export function assignableHeaderFormGuard(id: string, revision: number) {
  return sql`exists(select 1 from ${form_definition} where ${form_definition.id}=${id}::uuid and ${form_definition.revision}=${revision} and ${form_definition.status}='draft')`;
}
/** Server-only fresh source for submission. Recipient never enters the public model. */
export async function readPublicFormSource(id: string, locale: Locale) {
  if (!formIdSchema.safeParse(id).success) return null;
  const [row] = await db.select().from(form_definition).where(eq(form_definition.id,id)).limit(1);
  if (!row || row.status !== "draft" || !z.email().max(254).safeParse(row.recipient).success) return null;
  let form;try { form = record(row); } catch { return null; }
  const translations: FormTranslations = { es: {}, pt: {}, fr: {} };
  const source = textFields(form.definition);
  for (const target of await loadTranslationRows({ type: "form_definition", id })) {
    if (target.locale === "en" || source[target.field] === undefined) continue;
    translations[target.locale][target.field] = { value: target.value, state: target.state, stale: target.source_hash !== hashSource(source[target.field] ?? "") };
  }
  const definition = approvedBlueprint(form.definition,translations,locale);
  const fingerprint = createHash("sha256").update(JSON.stringify({ id, revision: form.revision, locale, definition })).digest("hex");
  return { form, definition, fingerprint };
}
export async function readHeaderContactForm(locale: Locale): Promise<PublicFormModel | null> {
  const id = (await getGlobals(locale))?.headerContactFormId;
  if (!id) return null;
  return unstable_cache(async () => {
    const source = await readPublicFormSource(id,locale);
    return source ? { id, revision: source.form.revision, locale, fingerprint: source.fingerprint, definition: source.definition } : null;
  }, ["header-contact-form",id,locale,"v1"], { tags: [FORMS_PUBLIC_TAGS.all,FORMS_PUBLIC_TAGS.form(id)] })();
}

/** One published EN assignment serves all About languages. An explicit override
 * is private preview state and must never become public assignment authority. */
export async function readAboutContactForm(locale: Locale, override?: string | null): Promise<PublicFormModel | null> {
  if (override !== undefined) {
    await requireStaff();
    if (!override) return null;
    const source = await readPublicFormSource(override, locale);
    return source ? { id: override, revision: source.form.revision, locale, fingerprint: source.fingerprint, definition: source.definition, placement: "about-contact" } : null;
  }
  const assignment = await readAboutContactAssignment();
  if (!assignment) return null;
  const { formId: id, identity } = assignment;
  return unstable_cache(async () => {
    const source = await readPublicFormSource(id, locale);
    return source ? { id, revision: source.form.revision, locale, fingerprint: source.fingerprint, definition: source.definition, placement: "about-contact" as const, assignmentIdentity: identity } : null;
  }, ["about-contact-form", id, locale, identity, "v1"], { tags: [FORMS_PUBLIC_TAGS.all, FORMS_PUBLIC_TAGS.form(id)] })();
}

/** Guest owner dialog: one published EN choice, with a staff-only fresh preview override. */
export async function readGuestContactForm(locale: Locale, override?: string | null): Promise<PublicFormModel | null> {
  if (override !== undefined) {
    await requireStaff();
    if (!override) return null;
    const source = await readPublicFormSource(override, locale);
    return source ? { id: override, revision: source.form.revision, locale, fingerprint: source.fingerprint, definition: source.definition, placement: "guests-dual-cta" } : null;
  }
  const assignment = await readGuestContactAssignment();
  if (!assignment) return null;
  const { formId: id, identity } = assignment;
  return unstable_cache(async () => {
    const source = await readPublicFormSource(id, locale);
    return source ? { id, revision: source.form.revision, locale, fingerprint: source.fingerprint, definition: source.definition, placement: "guests-dual-cta" as const, assignmentIdentity: identity } : null;
  }, ["guest-contact-form", id, locale, identity, "v1"], { tags: [FORMS_PUBLIC_TAGS.all, FORMS_PUBLIC_TAGS.form(id)] })();
}

/** Real Estate institutional enquiries: published EN authority or private staff override. */
export async function readRealEstateEnquiryForm(locale: Locale, override?: string | null): Promise<PublicFormModel | null> {
  if (override !== undefined) {
    await requireStaff();
    if (!override) return null;
    const source = await readPublicFormSource(override, locale);
    return source ? { id: override, revision: source.form.revision, locale, fingerprint: source.fingerprint, definition: source.definition, placement: "real-estate-enquiry" } : null;
  }
  const assignment = await readRealEstateEnquiryAssignment();
  if (!assignment) return null;
  const { formId: id, identity } = assignment;
  return unstable_cache(async () => {
    const source = await readPublicFormSource(id, locale);
    return source ? { id, revision: source.form.revision, locale, fingerprint: source.fingerprint, definition: source.definition, placement: "real-estate-enquiry" as const, assignmentIdentity: identity } : null;
  }, ["real-estate-enquiry-form", id, locale, identity, "v1"], { tags: [FORMS_PUBLIC_TAGS.all, FORMS_PUBLIC_TAGS.form(id)] })();
}

/** Services resolve their own published EN selection; every locale must remain public. */
export async function readServiceEnquiryForm(serviceId: string, locale: Locale): Promise<PublicFormModel | null> {
  if (!formIdSchema.safeParse(serviceId).success) return null;
  const canonicalServiceId = serviceId.toLowerCase();
  const assignment = await readServiceEnquiryAssignment(canonicalServiceId);
  if (!assignment) return null;
  const { formId: id, identity } = assignment;
  const current = await db.execute(sql`select ${serviceEnquiryAssignmentGuard(canonicalServiceId, locale, id, identity)} as assigned`);
  if (current.rows[0]?.assigned !== true) return null;
  return unstable_cache(async () => {
    const source = await readPublicFormSource(id, locale);
    return source ? { id, revision: source.form.revision, locale, fingerprint: source.fingerprint, definition: source.definition, placement: "service-enquiry" as const, assignmentIdentity: identity, serviceId: canonicalServiceId } : null;
  }, ["service-enquiry-form", canonicalServiceId, id, locale, identity, "v1"], { tags: [FORMS_PUBLIC_TAGS.all, FORMS_PUBLIC_TAGS.form(id)] })();
}
