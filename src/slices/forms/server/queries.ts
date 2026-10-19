import "server-only";
import { desc, eq } from "drizzle-orm";
import { requireStaff } from "@core/auth";
import { db } from "@core/db/client";
import { hashSource, loadTranslationRows } from "@core/i18n";
import { form_definition } from "../schema";
import { textFields } from "../domain";
import { formIdSchema } from "../validation";
import type { FormEditorModel, FormRecord, FormTranslations } from "../types";

export function record(row: typeof form_definition.$inferSelect): FormRecord {
  return { id: row.id, name: row.name, template: row.template, recipient: row.recipient,
    status: row.status, revision: row.revision, definition: row.definition, updatedAt: row.updated_at.toISOString() };
}
export async function listForms(): Promise<FormRecord[]> {
  await requireStaff();
  return (await db.select().from(form_definition).orderBy(desc(form_definition.updated_at))).map(record);
}
export async function getFormEditor(id: string): Promise<FormEditorModel | null> {
  await requireStaff();
  if (!formIdSchema.safeParse(id).success) return null;
  const [row] = await db.select().from(form_definition).where(eq(form_definition.id, id)).limit(1);
  if (!row) return null;
  const translations: FormTranslations = { es: {}, pt: {}, fr: {} };
  const sources = textFields(row.definition);
  for (const target of await loadTranslationRows({ type: "form_definition", id })) {
    if (target.locale === "en" || sources[target.field] === undefined) continue;
    translations[target.locale][target.field] = { value: target.value, state: target.state, stale: target.source_hash !== hashSource(sources[target.field] ?? "") };
  }
  return { form: record(row), translations };
}
