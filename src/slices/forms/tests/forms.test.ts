import assert from "node:assert/strict";
import { test } from "node:test";
import { approvedBlueprint, createBlueprint, localizedBlueprint, textFields } from "../domain";
import { blueprintSchema, saveFormSchema, validateValues } from "../validation";
import { testNotification } from "../server/notification";
import type { FormBlueprint, FormTranslations, FormValues } from "../types";

function answers(definition: FormBlueprint): FormValues {
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
  assert.ok(owner.fields.some(field => field.type === "email" && field.stepId === owner.steps[1]?.id));
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
    (value: FormBlueprint) => { if (value.fields[0]) value.fields[0].stepId = crypto.randomUUID(); },
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
