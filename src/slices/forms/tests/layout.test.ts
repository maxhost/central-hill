import assert from "node:assert/strict";
import { test } from "node:test";
import { addFieldToColumn, addRow, addStep, fieldLocation, FormLayoutError, moveField, moveRow, normalizeBlueprint, orderedFields, removeField, removeRow, removeStep, rowsForStep, setRowColumns, setRowStep } from "../layout";
import type { FormBlueprint, FormField, LegacyFormBlueprint } from "../types";

const step = () => ({ id: crypto.randomUUID(), title: "Step" });
const field = (label: string): FormField => ({ id: crypto.randomUUID(), label, type: "text", placeholder: "", help: "", required: false, options: [], consent: false });
function blank(): FormBlueprint {
  return { schemaVersion: 2, steps: [step()], rows: [], fields: [], replyToFieldId: null, copy: { title: "Form", description: "", submit: "Send", next: "Next", back: "Back", cancel: "Cancel", successTitle: "Done", successMessage: "Done", errorMessage: "Error" } };
}
function populated() {
  let definition = blank();
  definition = addRow(definition, definition.steps[0]!.id, 2);
  definition = addFieldToColumn(definition, definition.rows[0]!.columns[0]!.id, field("Left"));
  definition = addFieldToColumn(definition, definition.rows[0]!.columns[1]!.id, field("Right"));
  return definition;
}
function legacy(widths: (1 | 2)[], columns: 1 | 2 = 2): LegacyFormBlueprint {
  const definition = blank();
  return { schemaVersion: 1, columns, steps: definition.steps, copy: definition.copy, replyToFieldId: null, fields: widths.map((width, index) => ({ ...field(String(index)), stepId: definition.steps[0]!.id, width })) };
}

test("legacy normalization is deterministic, immutable and preserves field data/identity", () => {
  const source = legacy([1, 1, 2, 1]);
  source.fields[0]!.type = "date";
  source.fields[1]!.type = "file";
  source.replyToFieldId = source.fields[0]!.id;
  const before = JSON.stringify(source);
  const normalized = normalizeBlueprint(source);
  assert.deepEqual(normalized, normalizeBlueprint(source));
  assert.equal(JSON.stringify(source), before);
  assert.deepEqual(normalized.rows.map(row => row.columns.length), [2, 1, 2]);
  assert.deepEqual(orderedFields(normalized).map(item => item.id), source.fields.map(item => item.id));
  assert.equal(normalized.replyToFieldId, source.replyToFieldId);
  assert.equal(normalized.fields[0]!.type, "date");
  assert.equal(normalized.fields[1]!.type, "file");
  assert.equal("width" in normalized.fields[0]!, false);
  assert.equal("stepId" in normalized.fields[0]!, false);
  assert.strictEqual(normalizeBlueprint(normalized), normalized);
});
test("legacy sparse grid never pairs across full-width fields", () => {
  const source = legacy([1, 2, 1, 1, 1]);
  const normalized = normalizeBlueprint(source);
  assert.deepEqual(normalized.rows.map(row => row.columns.map(item => item.fieldId)), [
    [source.fields[0]!.id, null], [source.fields[1]!.id], [source.fields[2]!.id, source.fields[3]!.id], [source.fields[4]!.id, null],
  ]);
  assert.deepEqual(normalizeBlueprint(legacy([1, 2, 1], 1)).rows.map(row => row.columns.length), [1, 1, 1]);
});
test("legacy conversion groups by step and refuses dangling step ownership", () => {
  const source = legacy([1, 1]);
  source.steps.push(step()); source.fields[1]!.stepId = source.steps[1]!.id;
  assert.deepEqual(normalizeBlueprint(source).rows.map(row => row.columns[1]!.fieldId), [null, null]);
  source.fields[0]!.stepId = "missing";
  assert.throws(() => normalizeBlueprint(source), FormLayoutError);
});
test("two occupied columns become consecutive single rows without changing field or column IDs", () => {
  const original = populated();
  const next = setRowColumns(original, original.rows[0]!.id, 1);
  assert.equal(next.rows.length, 2);
  assert.deepEqual(next.rows.map(row => row.columns[0]!.id), original.rows[0]!.columns.map(item => item.id));
  assert.deepEqual(orderedFields(next), orderedFields(original));
  assert.equal(original.rows.length, 1);
  assert.equal(next.rows[0]!.id, original.rows[0]!.id);
});
test("collapse right-only/empty rows and expand preserve the surviving field", () => {
  const original = populated();
  const next = removeField(original, original.fields[0]!.id);
  const collapsed = setRowColumns(next, next.rows[0]!.id, 1);
  assert.equal(collapsed.rows[0]!.columns[0]!.fieldId, original.fields[1]!.id);
  const expanded = setRowColumns(collapsed, collapsed.rows[0]!.id, 2);
  assert.equal(expanded.rows[0]!.columns[1]!.fieldId, null);
  assert.equal(expanded.fields.length, 1);
  const empty = removeField(expanded, expanded.fields[0]!.id);
  assert.equal(setRowColumns(empty, empty.rows[0]!.id, 1).rows[0]!.columns[0]!.fieldId, null);
});
test("move field requires explicit swap and preserves both IDs across steps", () => {
  let definition = addStep(populated(), "Second");
  definition = addRow(definition, definition.steps[1]!.id, 1);
  const source = definition.fields[0]!.id;
  const occupied = definition.rows[0]!.columns[1]!.id;
  assert.throws(() => moveField(definition, source, occupied), (error: unknown) => error instanceof FormLayoutError && error.code === "occupied");
  const swapped = moveField(definition, source, occupied, true);
  assert.deepEqual(orderedFields(swapped).map(item => item.label), ["Right", "Left"]);
  const moved = moveField(swapped, source, swapped.rows[1]!.columns[0]!.id);
  assert.equal(fieldLocation(moved, source)!.stepId, definition.steps[1]!.id);
  assert.deepEqual(moved.fields, definition.fields);
});
test("row moves, transfers and step removal preserve visual order and all fields", () => {
  let definition = populated();
  definition = addRow(definition, definition.steps[0]!.id, 1);
  definition = addFieldToColumn(definition, definition.rows[1]!.columns[0]!.id, field("Last"));
  const moved = moveRow(definition, definition.rows[1]!.id, -1);
  assert.deepEqual(orderedFields(moved).map(item => item.label), ["Last", "Left", "Right"]);
  const twoSteps = addStep(moved, "Next");
  const transferred = setRowStep(twoSteps, twoSteps.rows[0]!.id, twoSteps.steps[1]!.id);
  const removed = removeStep(transferred, transferred.steps[1]!.id);
  assert.deepEqual(orderedFields(removed).map(item => item.label), ["Left", "Right", "Last"]);
  assert.equal(rowsForStep(removed, removed.steps[0]!.id).length, 2);
  assert.equal(removed.fields.length, 3);
  assert.throws(() => removeStep(removed, removed.steps[0]!.id), FormLayoutError);
});
test("removing rows/fields clears only the matching reply-to and keeps empty slots", () => {
  const definition = populated(); definition.replyToFieldId = definition.fields[0]!.id;
  assert.equal(removeField(definition, definition.fields[1]!.id).replyToFieldId, definition.replyToFieldId);
  const one = removeField(definition, definition.fields[0]!.id);
  assert.equal(one.replyToFieldId, null);
  assert.equal(one.rows[0]!.columns[0]!.fieldId, null);
  const none = removeRow(definition, definition.rows[0]!.id);
  assert.deepEqual(none.fields, []); assert.deepEqual(none.rows, []); assert.equal(none.replyToFieldId, null);
});
test("row limits reject collapse/add atomically and catalog order never controls visual order", () => {
  let definition = populated();
  while (definition.rows.length < 40) definition = addRow(definition, definition.steps[0]!.id, 1);
  const before = JSON.stringify(definition);
  assert.throws(() => setRowColumns(definition, definition.rows[0]!.id, 1), FormLayoutError);
  assert.throws(() => addRow(definition, definition.steps[0]!.id, 1), FormLayoutError);
  assert.equal(JSON.stringify(definition), before);
  assert.deepEqual(orderedFields({ ...definition, fields: [...definition.fields].reverse() }), orderedFields(definition));
});
