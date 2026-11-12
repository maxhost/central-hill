import assert from "node:assert/strict";
import { test } from "node:test";
import { approvedBlueprint, createBlueprint, localizedBlueprint, newField, textFields } from "../domain";
import { blueprintSchema, legacyBlueprintSchema, readStoredBlueprint, saveFormSchema, storedBlueprintSchema, testFormSchema, validateValues } from "../validation";
import { testNotification } from "../server/notification";
import { addFieldToColumn, addRow, fieldLocation, moveRow, normalizeBlueprint, orderedFields } from "../layout";
import type { FormBlueprint, FormInputValues, FormTranslations, LegacyFormBlueprint } from "../types";

function answers(definition: FormBlueprint): FormInputValues {
  return Object.fromEntries(definition.fields.map(field => [field.id,
    field.type === "checkbox" ? true : field.type === "email" ? "guest@example.test" : field.type === "select" ? field.options[0]?.id ?? "" : field.type === "number" ? "1" : "Test answer"]));
}

test("all three independent templates validate; Owner includes Studio and contact details", () => {
  for (const template of ["contact", "newsletter", "owner-estimate"] as const) {
    const first = createBlueprint(template);
    const second = createBlueprint(template);
    assert.equal(blueprintSchema.safeParse(first).success, true);
    assert.notEqual(first.fields[0]?.id, second.fields[0]?.id);
    assert.deepEqual(validateValues(first, answers(first)).fieldErrors, {});
  }
  const owner = createBlueprint("owner-estimate");
  assert.equal(owner.steps.length, 2);
  assert.ok(owner.fields.some(field => field.options.some(option => option.label === "Studio")));
  assert.ok(owner.fields.some(field => field.type === "email" && fieldLocation(owner, field.id)?.stepId === owner.steps[1]?.id));
});

test("Date and File definitions validate without becoming reply-to fields", () => {
  let definition = createBlueprint("contact");
  for (const type of ["date", "file"] as const) {
    definition = addRow(definition, definition.steps[0]!.id, 1);
    definition = addFieldToColumn(definition, definition.rows.at(-1)!.columns[0]!.id, { ...newField(type), label: type });
  }
  assert.equal(blueprintSchema.safeParse(definition).success, true);
  definition.replyToFieldId = definition.fields.at(-1)!.id;
  assert.equal(blueprintSchema.safeParse(definition).success, false);
});

test("Date validates Gregorian days and keeps dates without timezone conversion", () => {
  const definition = createBlueprint("contact");
  const field = definition.fields[0]!;
  field.type = "date";
  const input = answers(definition);
  for (const valid of ["2026-11-11", "2024-02-29", "2000-02-29", "0001-01-01", "9999-12-31"]) {
    input[field.id] = valid;
    const checked = validateValues(definition, input);
    assert.deepEqual(checked.fieldErrors, {}, valid);
    assert.equal(checked.values[field.id], valid);
  }
  for (const invalid of ["2026-02-29", "1900-02-29", "2026-04-31", "2026-00-01", "2026-13-01", "2026-01-00", "0000-01-01", "2026-1-1", "11/11/2026", "2026-11-11T00:00:00Z", ""]) {
    input[field.id] = invalid;
    assert.ok(validateValues(definition, input).fieldErrors[field.id], invalid);
  }
  field.required = false;
  delete input[field.id];
  assert.equal(validateValues(definition, input).values[field.id], "");
  assert.deepEqual(validateValues(definition, input).fieldErrors, {});
});

test("File answers require verified multipart metadata and cannot be spoofed through JSON", () => {
  const definition = createBlueprint("contact");
  const field = definition.fields[0]!;
  field.type = "file";
  const input = answers(definition);
  delete input[field.id];
  assert.ok(validateValues(definition, input).fieldErrors[field.id]);
  const metadata = { kind: "file" as const, name: "document.pdf", type: "application/pdf", size: 1024 };
  const accepted = validateValues(definition, input, { [field.id]: metadata });
  assert.deepEqual(accepted.fieldErrors, {});
  assert.deepEqual(accepted.values[field.id], metadata);
  input[field.id] = "document.pdf";
  assert.ok(validateValues(definition, input, { [field.id]: metadata }).fieldErrors[field.id]);
  assert.equal(testFormSchema.safeParse({ id: crypto.randomUUID(), expectedRevision: 1, locale: "en", values: { [field.id]: metadata } }).success, false);
  field.required = false;
  delete input[field.id];
  assert.deepEqual(validateValues(definition, input).fieldErrors, {});
  assert.equal(validateValues(definition, input).values[field.id], "");
});

test("field text paths retain identity across reorder and localization", () => {
  const definition = createBlueprint("contact");
  const key = `block:fields.${definition.fields[0]?.id}.label`;
  const source = textFields(definition);
  const reversed = { ...definition, fields: [...definition.fields].reverse() };
  assert.equal(textFields(reversed)[key], source[key]);
  const translated = localizedBlueprint(reversed, { [key]: "Nombre" });
  assert.equal(translated.fields.find(field => field.id === definition.fields[0]?.id)?.label, "Nombre");
  assert.equal(definition.fields[0]?.label, "Name");
  const targets: FormTranslations = { pt: {}, es: { [key]: { value: "Nombre", state: "needs_review", stale: false } }, fr: {} };
  assert.equal(approvedBlueprint(definition, targets, "es").fields[0]?.label, "Name");
  const row = targets.es[key];
  assert.ok(row);
  row.state = "approved"; row.stale = true;
  assert.equal(approvedBlueprint(definition, targets, "es").fields[0]?.label, "Nombre");
});

test("definition rejects duplicate IDs, dangling steps, invalid reply-to and reversed limits", () => {
  const original = createBlueprint("owner-estimate");
  for (const mutate of [
    (value: FormBlueprint) => { if (value.fields[0] && value.fields[1]) value.fields[1].id = value.fields[0].id; },
    (value: FormBlueprint) => { if (value.rows[0]) value.rows[0].stepId = crypto.randomUUID(); },
    (value: FormBlueprint) => { value.replyToFieldId = value.fields[0]?.id ?? null; },
    (value: FormBlueprint) => { const field = value.fields.find(item => item.type === "number"); if (field) { field.min = 5; field.max = 1; } },
    (value: FormBlueprint) => { value.steps = Array.from({ length: 7 }, () => ({ id: crypto.randomUUID(), title: "Step" })); },
  ]) {
    const value = structuredClone(original); mutate(value);
    assert.equal(blueprintSchema.safeParse(value).success, false);
  }
  assert.equal(saveFormSchema.safeParse({ id: crypto.randomUUID(), expectedRevision: 1, name: "Test", recipient: "not-an-email", definition: original }).success, false);
});

test("all-step server validation rejects missing consent, bad select IDs, invalid email and unexpected fields", () => {
  const definition = createBlueprint("owner-estimate");
  const values = answers(definition);
  const requiredConsent = definition.fields.find(field => field.consent && field.required);
  const email = definition.fields.find(field => field.type === "email");
  const select = definition.fields.find(field => field.type === "select");
  const number = definition.fields.find(field => field.type === "number");
  assert.ok(requiredConsent && email && select && number);
  values[requiredConsent.id] = false;
  values[email.id] = "wrong";
  values[select.id] = "Studio";
  values[number.id] = "0";
  const extra = crypto.randomUUID(); values[extra] = "Injected";
  const result = validateValues(definition, values);
  for (const id of [requiredConsent.id, email.id, select.id, number.id, extra]) assert.ok(result.fieldErrors[id]);
});

test("test notification preserves translated option and consent labels with valid reply-to", () => {
  const definition = createBlueprint("owner-estimate");
  const consent = definition.fields.find(field => field.consent && field.required);
  const select = definition.fields.find(field => field.type === "select");
  assert.ok(consent && select);
  consent.label = "Acepto la política exacta";
  const values = answers(definition);
  const message = testNotification("Owner study", "staff@example.test", definition, values, "test-id");
  assert.equal(message.to, "staff@example.test");
  assert.equal(message.replyTo, "guest@example.test");
  assert.ok(message.text.includes("Acepto la política exacta [consent]: Yes"));
  assert.ok(message.text.includes(`${select.label}: Studio`));
  assert.ok(!message.text.includes(String(values[select.id])));
});


test("v2 rejects orphan/duplicate/missing placements, bad layout identities, limits and legacy properties", () => {
  const original = createBlueprint("contact");
  for (const mutate of [
    (value: FormBlueprint) => { value.rows[0]!.columns[0]!.fieldId = null; },
    (value: FormBlueprint) => { value.rows[0]!.columns[1]!.fieldId = value.rows[0]!.columns[0]!.fieldId; },
    (value: FormBlueprint) => { value.rows[0]!.columns[0]!.fieldId = crypto.randomUUID(); },
    (value: FormBlueprint) => { value.rows[0]!.columns[0]!.id = value.fields[0]!.id; },
    (value: FormBlueprint) => { value.rows[0]!.id = value.steps[0]!.id; },
    (value: FormBlueprint) => { value.rows[0]!.columns = []; },
    (value: FormBlueprint) => { value.rows[0]!.columns.push({ id: crypto.randomUUID(), fieldId: null }); },
    (value: FormBlueprint) => { value.rows = Array.from({ length: 41 }, () => ({ id: crypto.randomUUID(), stepId: value.steps[0]!.id, columns: [{ id: crypto.randomUUID(), fieldId: null }] })); },
    (value: FormBlueprint) => { Object.assign(value.fields[0]!, { width: 1 }); },
    (value: FormBlueprint) => { Object.assign(value, { columns: 2 }); },
  ]) {
    const value = structuredClone(original); mutate(value);
    assert.equal(blueprintSchema.safeParse(value).success, false);
  }
});

test("validated legacy reads normalize without mutation and unsupported/malformed versions fail legibly", () => {
  const current = createBlueprint("contact");
  const legacy: LegacyFormBlueprint = {
    schemaVersion: 1, columns: 2, copy: current.copy, steps: current.steps,
    replyToFieldId: current.replyToFieldId,
    fields: current.fields.map(field => ({ ...field, stepId: current.steps[0]!.id, width: field.label === "Name" || field.type === "email" ? 1 : 2 })),
  };
  const before = JSON.stringify(legacy);
  assert.equal(legacyBlueprintSchema.safeParse(legacy).success, true);
  assert.equal(storedBlueprintSchema.safeParse(legacy).success, true);
  assert.deepEqual(readStoredBlueprint(legacy), normalizeBlueprint(legacy));
  assert.equal(JSON.stringify(legacy), before);
  assert.equal(blueprintSchema.safeParse(legacy).success, false);
  assert.equal(storedBlueprintSchema.safeParse({ ...legacy, schemaVersion: 3 }).success, false);
  const invalid = structuredClone(legacy); invalid.fields[0]!.stepId = crypto.randomUUID();
  assert.throws(() => readStoredBlueprint(invalid), /invalid definition.*no fields were changed/);
});

test("row-only changes retain exact source paths/values and email follows visual order", () => {
  const original = createBlueprint("contact");
  const next = moveRow(original, original.rows.at(-1)!.id, -1);
  assert.deepEqual(textFields(next), textFields(original));
  const reversedCatalog = { ...next, fields: [...next.fields].reverse() };
  const notification = testNotification("Form", "staff@example.test", reversedCatalog, answers(next), "test");
  const visual = orderedFields(next);
  assert.ok(notification.text.indexOf(visual[0]!.label+":") < notification.text.indexOf(visual[1]!.label+":"));
  assert.deepEqual(validateValues(next, answers(next)).fieldErrors, {});
});
