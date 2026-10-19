"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@core/auth";
import { db } from "@core/db/client";
import { sendEmail } from "@core/email";
import { sourceSnapshotCtes, targetSnapshotCtes } from "@core/i18n";
import { approvedBlueprint, createBlueprint, textFields } from "../domain";
import { form_definition, form_test_submission } from "../schema";
import type { DeliveryState, FormResult, FormTemplate, SaveFormInput, SaveFormLocaleInput, TestFormInput } from "../types";
import { formIdSchema, formTemplateSchema, issueFields, revisionSchema, saveFormSchema, saveLocaleSchema, testFormSchema, validateValues } from "../validation";
import { getFormEditor } from "./queries";
import { testNotification } from "./notification";

const conflict = (): FormResult<never> => ({ ok: false, code: "conflict", error: "The saved form has changed or is archived. Reload before continuing." });
const missing = (): FormResult<never> => ({ ok: false, code: "not_found", error: "Form not found." });
const invalid = (fieldErrors?: Record<string, string>): FormResult<never> => ({ ok: false, code: "validation", error: "Check the form fields.", ...(fieldErrors ? { fieldErrors } : {}) });
function failed(error: unknown): FormResult<never> {
  console.error("[forms] operation failed", error instanceof Error ? error.message : "unknown error");
  return { ok: false, code: "server", error: "The operation could not be completed. Please try again." };
}
function refresh(id?: string) {
  revalidatePath("/admin/forms");
  if (id) revalidatePath(`/admin/forms/${id}`);
}

export async function createForm(template: FormTemplate, name: string): Promise<FormResult<{ id: string }>> {
  const staff = await requireStaff();
  const parsed = z.object({ template: formTemplateSchema, name: z.string().trim().min(1).max(150) }).safeParse({ template, name });
  if (!parsed.success) return invalid(issueFields(parsed.error.issues));
  const definition = createBlueprint(parsed.data.template);
  try {
    const snapshot = sourceSnapshotCtes("form_definition", sql`select id from saved`, textFields(definition), staff.userId);
    const result = await db.execute(sql`with saved as (
      insert into form_definition(name,template,definition) values(${parsed.data.name},${parsed.data.template},${JSON.stringify(definition)}::jsonb) returning id
    ), ${snapshot} select id from saved`);
    const id = result.rows[0]?.id;
    if (typeof id !== "string") throw new Error("Create returned no form");
    refresh();
    return { ok: true, data: { id } };
  } catch (error) { return failed(error); }
}

export async function saveForm(input: SaveFormInput): Promise<FormResult<{ revision: number }>> {
  const staff = await requireStaff();
  const parsed = saveFormSchema.safeParse(input);
  if (!parsed.success) return invalid(issueFields(parsed.error.issues));
  const value = parsed.data;
  try {
    const snapshot = sourceSnapshotCtes("form_definition", sql`select id from saved`, textFields(value.definition), staff.userId);
    const result = await db.execute(sql`with saved as (
      update form_definition set name=${value.name},recipient=${value.recipient},definition=${JSON.stringify(value.definition)}::jsonb,
      revision=revision+1,updated_at=now() where id=${value.id}::uuid and revision=${value.expectedRevision} and status='draft' returning id,revision
    ), ${snapshot} select revision from saved`);
    const revision = result.rows[0]?.revision;
    if (typeof revision !== "number") return conflict();
    refresh(value.id);
    return { ok: true, data: { revision } };
  } catch (error) { return failed(error); }
}

export async function saveFormLocale(input: SaveFormLocaleInput): Promise<FormResult<{ revision: number }>> {
  const staff = await requireStaff();
  const parsed = saveLocaleSchema.safeParse(input);
  if (!parsed.success) return invalid(issueFields(parsed.error.issues));
  const value = parsed.data;
  try {
    const [row] = await db.select().from(form_definition).where(eq(form_definition.id, value.id)).limit(1);
    if (!row) return missing();
    if (row.status !== "draft" || row.revision !== value.expectedRevision) return conflict();
    const source = textFields(row.definition);
    const fields: Record<string, { value: string; sourceValue: string }> = {};
    for (const [key, translated] of Object.entries(value.values)) {
      if (!Object.hasOwn(source, key)) return invalid({ [key]: "This text no longer exists." });
      const limit = key.startsWith("block:copy.") && ["description", "successMessage", "errorMessage"].some(suffix => key.endsWith(`.${suffix}`)) ? 2000 : key.endsWith(".help") ? 1000 : 300;
      if (translated.length > limit) return invalid({ [key]: `Use at most ${limit} characters.` });
      fields[key] = { value: translated, sourceValue: source[key] ?? "" };
    }
    const snapshot = targetSnapshotCtes("form_definition", sql`select id from saved`, value.locale, fields, value.approve ? "approved" : "needs_review", staff.userId);
    const result = await db.execute(sql`with saved as (
      update form_definition set revision=revision+1,updated_at=now() where id=${value.id}::uuid and revision=${value.expectedRevision} and status='draft' returning id,revision
    ), ${snapshot} select revision from saved`);
    const revision = result.rows[0]?.revision;
    if (typeof revision !== "number") return conflict();
    refresh(value.id);
    return { ok: true, data: { revision } };
  } catch (error) { return failed(error); }
}

export async function archiveForm(id: string, expectedRevision: number, archived: boolean): Promise<FormResult<{ revision: number }>> {
  await requireStaff();
  if (!formIdSchema.safeParse(id).success || !revisionSchema.safeParse(expectedRevision).success || typeof archived !== "boolean") return invalid();
  try {
    const result = await db.execute(sql`update form_definition set status=${archived ? "archived" : "draft"},revision=revision+1,updated_at=now()
      where id=${id}::uuid and revision=${expectedRevision} returning revision`);
    const revision = result.rows[0]?.revision;
    if (typeof revision !== "number") return conflict();
    refresh(id);
    return { ok: true, data: { revision } };
  } catch (error) { return failed(error); }
}

export async function testForm(input: TestFormInput): Promise<FormResult<{ submissionId: string; delivery: DeliveryState }>> {
  const staff = await requireStaff();
  const parsed = testFormSchema.safeParse(input);
  if (!parsed.success) return invalid(issueFields(parsed.error.issues));
  const value = parsed.data;
  try {
    const model = await getFormEditor(value.id);
    if (!model) return missing();
    if (model.form.status !== "draft" || model.form.revision !== value.expectedRevision) return conflict();
    if (!z.email().max(254).safeParse(model.form.recipient).success) return invalid({ recipient: "Save a valid recipient before testing." });
    const definition = approvedBlueprint(model.form.definition, model.translations, value.locale);
    const checked = validateValues(definition, value.values);
    if (Object.keys(checked.fieldErrors).length) return invalid(checked.fieldErrors);
    const captured = await db.execute(sql`insert into form_test_submission(form_id,revision,locale,recipient,definition_snapshot,"values",created_by,delivery)
      select id,revision,${value.locale},recipient,${JSON.stringify(definition)}::jsonb,${JSON.stringify(checked.values)}::jsonb,${staff.userId},'skipped'
      from form_definition where id=${value.id}::uuid and revision=${value.expectedRevision} and status='draft' returning id`);
    const submissionId = captured.rows[0]?.id;
    if (typeof submissionId !== "string") return conflict();
    const result = await sendEmail(testNotification(model.form.name, model.form.recipient, definition, checked.values, submissionId));
    const delivery: DeliveryState = !result.ok ? "failed" : result.skipped ? "skipped" : result.id === "console" ? "logged" : "accepted";
    await db.update(form_test_submission).set({ delivery, provider_id: result.id ?? null, delivery_error: result.error?.slice(0, 1000) ?? null, updated_at: new Date() }).where(eq(form_test_submission.id, submissionId));
    return { ok: true, data: { submissionId, delivery } };
  } catch (error) { return failed(error); }
}
