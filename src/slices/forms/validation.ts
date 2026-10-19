import { z } from "zod";
import type { FormBlueprint, FormValues } from "./types";

export const formTemplateSchema = z.enum(["contact", "newsletter", "owner-estimate"]);
export const formIdSchema = z.uuid();
export const revisionSchema = z.number().int().min(1).max(2147483646);
const short = z.string().trim().max(300);
const copySchema = z.object({
  title: short.min(1), description: z.string().trim().max(2000), submit: short.min(1),
  next: short.min(1), back: short.min(1), cancel: short.min(1), successTitle: short.min(1),
  successMessage: z.string().trim().min(1).max(2000), errorMessage: z.string().trim().min(1).max(2000),
}).strict();
export const blueprintSchema = z.object({
  schemaVersion: z.literal(1), columns: z.union([z.literal(1), z.literal(2)]),
  steps: z.array(z.object({ id: formIdSchema, title: short.min(1) }).strict()).min(1).max(6),
  fields: z.array(z.object({
    id: formIdSchema, stepId: formIdSchema, type: z.enum(["text", "email", "tel", "textarea", "number", "select", "checkbox"]),
    label: short.min(1), placeholder: short, help: z.string().trim().max(1000), required: z.boolean(),
    width: z.union([z.literal(1), z.literal(2)]),
    options: z.array(z.object({ id: formIdSchema, label: short.min(1) }).strict()).max(30),
    min: z.number().finite().min(-1e12).max(1e12).optional(), max: z.number().finite().min(-1e12).max(1e12).optional(),
    consent: z.boolean(),
  }).strict()).min(1).max(40),
  copy: copySchema, replyToFieldId: formIdSchema.nullable(),
}).strict().superRefine((value, ctx) => {
  const ids = new Set<string>();
  const unique = (id: string, path: (string | number)[]) => {
    if (ids.has(id)) ctx.addIssue({ code: "custom", path, message: "IDs must be unique." });
    ids.add(id);
  };
  value.steps.forEach((step, index) => unique(step.id, ["steps", index, "id"]));
  const steps = new Set(value.steps.map(step => step.id));
  value.fields.forEach((field, index) => {
    unique(field.id, ["fields", index, "id"]);
    if (!steps.has(field.stepId)) ctx.addIssue({ code: "custom", path: ["fields", index, "stepId"], message: "Choose an existing step." });
    field.options.forEach((option, optionIndex) => unique(option.id, ["fields", index, "options", optionIndex, "id"]));
    if (field.type === "select" && !field.options.length) ctx.addIssue({ code: "custom", path: ["fields", index, "options"], message: "Add at least one option." });
    if (field.type !== "select" && field.options.length) ctx.addIssue({ code: "custom", path: ["fields", index, "options"], message: "Only select fields can have options." });
    if (field.consent && field.type !== "checkbox") ctx.addIssue({ code: "custom", path: ["fields", index, "consent"], message: "Consent requires a checkbox." });
    if ((field.min !== undefined || field.max !== undefined) && field.type !== "number") ctx.addIssue({ code: "custom", path: ["fields", index, "min"], message: "Limits require a number field." });
    if (field.min !== undefined && field.max !== undefined && field.min > field.max) ctx.addIssue({ code: "custom", path: ["fields", index, "max"], message: "Maximum must be at least minimum." });
  });
  if (value.replyToFieldId && !value.fields.some(field => field.id === value.replyToFieldId && field.type === "email")) ctx.addIssue({ code: "custom", path: ["replyToFieldId"], message: "Reply-to must reference an email field." });
});
export const saveFormSchema = z.object({ id: formIdSchema, expectedRevision: revisionSchema, name: z.string().trim().min(1).max(150), recipient: z.email().max(254), definition: blueprintSchema }).strict();
export const saveLocaleSchema = z.object({ id: formIdSchema, expectedRevision: revisionSchema, locale: z.enum(["pt", "es", "fr"]), values: z.record(z.string().max(300), z.string().trim().max(2000)).refine(values => Object.keys(values).length <= 1500), approve: z.boolean() }).strict();
export const testFormSchema = z.object({ id: formIdSchema, expectedRevision: revisionSchema, locale: z.enum(["en", "pt", "es", "fr"]), values: z.record(formIdSchema, z.union([z.string().max(10000), z.boolean()])).refine(values => Object.keys(values).length <= 40) }).strict();
export function issueFields(issues: readonly { path: PropertyKey[]; message: string }[]): Record<string, string> {
  return Object.fromEntries(issues.map(issue => [issue.path.map(String).join("."), issue.message]));
}
/** All steps are validated server-side; absent optional answers are normalized. */
export function validateValues(definition: FormBlueprint, input: FormValues): { values: FormValues; fieldErrors: Record<string, string> } {
  const values: FormValues = {};
  const fieldErrors: Record<string, string> = {};
  const known = new Set(definition.fields.map(field => field.id));
  for (const key of Object.keys(input)) if (!known.has(key)) fieldErrors[key] = "Unexpected field.";
  for (const field of definition.fields) {
    const raw = input[field.id];
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
    if (field.type === "number") {
      const number = Number(value);
      if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value) || !Number.isFinite(number) || Math.abs(number) > 1e12) fieldErrors[field.id] = "Enter a valid number.";
      else if ((field.min !== undefined && number < field.min) || (field.max !== undefined && number > field.max)) fieldErrors[field.id] = "Number is outside the allowed range.";
    }
  }
  return { values, fieldErrors };
}
