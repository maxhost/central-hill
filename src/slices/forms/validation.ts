import { z } from "zod";
import type { FormBlueprint, FormFileValue, FormInputValues, FormValues, StoredFormBlueprint } from "./types";
import { normalizeBlueprint, orderedFields } from "./layout";

export const formTemplateSchema = z.enum(["contact", "newsletter", "owner-estimate"]);
export const formIdSchema = z.uuid();
export const revisionSchema = z.number().int().min(1).max(2147483646);
const short = z.string().max(300);
const requiredShort = short.refine(value => Boolean(value.trim()), "Enter nonblank text.");
const copySchema = z.object({
  title: requiredShort, description: z.string().max(2000), submit: requiredShort,
  next: requiredShort, back: requiredShort, cancel: requiredShort, successTitle: requiredShort,
  successMessage: z.string().max(2000).refine(value => Boolean(value.trim()), "Enter nonblank text."), errorMessage: z.string().max(2000).refine(value => Boolean(value.trim()), "Enter nonblank text."),
}).strict();
const fieldSchema = z.object({
  id: formIdSchema, type: z.enum(["text", "email", "tel", "textarea", "number", "select", "checkbox", "date", "file"]),
  label: requiredShort, placeholder: short, help: z.string().max(1000), required: z.boolean(),
  options: z.array(z.object({ id: formIdSchema, label: requiredShort }).strict()).max(30),
  min: z.number().finite().min(-1e12).max(1e12).optional(), max: z.number().finite().min(-1e12).max(1e12).optional(),
  consent: z.boolean(),
}).strict();
const commonShape = {
  steps: z.array(z.object({ id: formIdSchema, title: requiredShort }).strict()).min(1).max(6),
  copy: copySchema, replyToFieldId: formIdSchema.nullable(),
};
/** Shared field semantics and identity checks; row/column ownership is version-specific. */
function commonIssues(value: Pick<FormBlueprint, "steps" | "fields" | "replyToFieldId">, ctx: z.RefinementCtx): Set<string> {
  const ids = new Set<string>();
  const unique = (id: string, path: (string | number)[]) => {
    if (ids.has(id)) ctx.addIssue({ code: "custom", path, message: "IDs must be unique." });
    ids.add(id);
  };
  value.steps.forEach((step, index) => unique(step.id, ["steps", index, "id"]));
  value.fields.forEach((field, index) => {
    unique(field.id, ["fields", index, "id"]);
    field.options.forEach((option, optionIndex) => unique(option.id, ["fields", index, "options", optionIndex, "id"]));
    if (field.type === "select" && !field.options.length) ctx.addIssue({ code: "custom", path: ["fields", index, "options"], message: "Add at least one option." });
    if (field.type !== "select" && field.options.length) ctx.addIssue({ code: "custom", path: ["fields", index, "options"], message: "Only select fields can have options." });
    if (field.consent && field.type !== "checkbox") ctx.addIssue({ code: "custom", path: ["fields", index, "consent"], message: "Consent requires a checkbox." });
    if ((field.min !== undefined || field.max !== undefined) && field.type !== "number") ctx.addIssue({ code: "custom", path: ["fields", index, "min"], message: "Limits require a number field." });
    if (field.min !== undefined && field.max !== undefined && field.min > field.max) ctx.addIssue({ code: "custom", path: ["fields", index, "max"], message: "Maximum must be at least minimum." });
  });
  if (value.replyToFieldId && !value.fields.some(field => field.id === value.replyToFieldId && field.type === "email")) ctx.addIssue({ code: "custom", path: ["replyToFieldId"], message: "Reply-to must reference an email field." });
  return ids;
}
export const legacyBlueprintSchema = z.object({
  schemaVersion: z.literal(1), columns: z.union([z.literal(1), z.literal(2)]), ...commonShape,
  fields: z.array(fieldSchema.extend({ stepId: formIdSchema, width: z.union([z.literal(1), z.literal(2)]) }).strict()).min(1).max(40),
}).strict().superRefine((value, ctx) => {
  commonIssues(value, ctx);
  const steps = new Set(value.steps.map(step => step.id));
  value.fields.forEach((field, index) => {
    if (!steps.has(field.stepId)) ctx.addIssue({ code: "custom", path: ["fields", index, "stepId"], message: "Choose an existing step." });
  });
});
const rowIdSchema = z.string().max(80).refine(id => formIdSchema.safeParse(id).success || (id.startsWith("legacy-row:") && formIdSchema.safeParse(id.slice(11)).success), "Choose a valid row ID.");
const columnIdSchema = z.string().max(80).refine(id => {
  if (formIdSchema.safeParse(id).success) return true;
  const match = id.match(/^legacy-column:(.+):[01]$/);
  return Boolean(match && formIdSchema.safeParse(match[1]).success);
}, "Choose a valid column ID.");
export const blueprintSchema = z.object({
  schemaVersion: z.literal(2), ...commonShape,
  fields: z.array(fieldSchema).min(1).max(40),
  rows: z.array(z.object({
    id: rowIdSchema, stepId: formIdSchema,
    columns: z.array(z.object({ id: columnIdSchema, fieldId: formIdSchema.nullable() }).strict()).min(1).max(2),
  }).strict()).min(1).max(40),
}).strict().superRefine((value, ctx) => {
  const ids = commonIssues(value, ctx);
  const steps = new Set(value.steps.map(step => step.id));
  const fields = new Set(value.fields.map(field => field.id));
  const references = new Set<string>();
  const unique = (id: string, path: (string | number)[]) => {
    if (ids.has(id)) ctx.addIssue({ code: "custom", path, message: "IDs must be unique." });
    ids.add(id);
  };
  value.rows.forEach((row, rowIndex) => {
    unique(row.id, ["rows", rowIndex, "id"]);
    if (!steps.has(row.stepId)) ctx.addIssue({ code: "custom", path: ["rows", rowIndex, "stepId"], message: "Choose an existing step." });
    row.columns.forEach((column, columnIndex) => {
      unique(column.id, ["rows", rowIndex, "columns", columnIndex, "id"]);
      if (column.fieldId === null) return;
      const path = ["rows", rowIndex, "columns", columnIndex, "fieldId"];
      if (!fields.has(column.fieldId)) ctx.addIssue({ code: "custom", path, message: "Choose an existing field." });
      if (references.has(column.fieldId)) ctx.addIssue({ code: "custom", path, message: "A field can occupy only one column." });
      references.add(column.fieldId);
    });
  });
  value.fields.forEach((field, index) => {
    if (!references.has(field.id)) ctx.addIssue({ code: "custom", path: ["fields", index, "id"], message: "Place this field in a column." });
  });
});
export const storedBlueprintSchema = z.union([legacyBlueprintSchema, blueprintSchema]);
/** No repair, filtering, database write or regenerated IDs while reading stored definitions. */
export function readStoredBlueprint(input: unknown): FormBlueprint {
  const parsed = storedBlueprintSchema.safeParse(input);
  if (!parsed.success) throw new Error("This saved form has an invalid definition. Reload or contact an administrator; no fields were changed.");
  // Parsing validates shape; keep authored strings exactly as stored when opening a form.
  return normalizeBlueprint(input as StoredFormBlueprint);
}
export const saveFormSchema = z.object({ id: formIdSchema, expectedRevision: revisionSchema, name: z.string().trim().min(1).max(150), recipient: z.email().max(254), definition: blueprintSchema }).strict();
export const saveLocaleSchema = z.object({ id: formIdSchema, expectedRevision: revisionSchema, locale: z.enum(["pt", "es", "fr"]), values: z.record(z.string().max(300), z.string().trim().max(2000)).refine(values => Object.keys(values).length <= 1500), approve: z.boolean() }).strict();
export const testFormSchema = z.object({ id: formIdSchema, expectedRevision: revisionSchema, locale: z.enum(["en", "pt", "es", "fr"]), values: z.record(formIdSchema, z.union([z.string().max(10000), z.boolean()])).refine(values => Object.keys(values).length <= 40) }).strict();
export function issueFields(issues: readonly { path: PropertyKey[]; message: string }[]): Record<string, string> {
  return Object.fromEntries(issues.map(issue => [issue.path.map(String).join("."), issue.message]));
}
/** All steps are validated server-side; absent optional answers are normalized. */
export function validateValues(definition: FormBlueprint, input: FormInputValues, files: Record<string, FormFileValue> = {}): { values: FormValues; fieldErrors: Record<string, string> } {
  const values: FormValues = {};
  const fieldErrors: Record<string, string> = {};
  const known = new Set(definition.fields.map(field => field.id));
  for (const key of Object.keys(input)) if (!known.has(key)) fieldErrors[key] = "Unexpected field.";
  for (const field of orderedFields(definition)) {
    const raw = input[field.id];
    if (field.type === "file") {
      // JSON answers never stand in for verified multipart files, even a filename.
      if (raw !== undefined) fieldErrors[field.id] = "Choose an attached file instead of a text answer.";
      const file = files[field.id];
      values[field.id] = file ?? "";
      if (field.required && !file) fieldErrors[field.id] = "This field is required.";
      continue;
    }
    if (field.type === "checkbox") {
      if (raw !== undefined && typeof raw !== "boolean") fieldErrors[field.id] = "Choose a valid checkbox value.";
      values[field.id] = raw === true;
      if (field.required && raw !== true) fieldErrors[field.id] = "This field is required.";
      continue;
    }
    if (raw !== undefined && typeof raw !== "string") { fieldErrors[field.id] = "Enter a valid value."; continue; }
    const value = typeof raw === "string" ? raw.trim() : "";
    values[field.id] = value;
    if (!value) { if (field.required) fieldErrors[field.id] = "This field is required."; continue; }
    if (value.length > (field.type === "textarea" ? 10000 : 1000)) fieldErrors[field.id] = "This value is too long.";
    if (field.type === "email" && !z.email().max(254).safeParse(value).success) fieldErrors[field.id] = "Enter a valid email address.";
    if (field.type === "select" && !field.options.some(option => option.id === value)) fieldErrors[field.id] = "Choose a valid option.";
    if (field.type === "date" && !isCalendarDate(value)) fieldErrors[field.id] = "Choose a valid date (YYYY-MM-DD).";
    if (field.type === "number") {
      const number = Number(value);
      if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value) || !Number.isFinite(number) || Math.abs(number) > 1e12) fieldErrors[field.id] = "Enter a valid number.";
      else if ((field.min !== undefined && number < field.min) || (field.max !== undefined && number > field.max)) fieldErrors[field.id] = "Number is outside the allowed range.";
    }
  }
  return { values, fieldErrors };
}

/** A calendar date, not an instant: preserve YYYY-MM-DD without timezone conversion. */
function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year = 0, month = 0, day = 0] = value.split("-").map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= (days[month - 1] ?? 0);
}
