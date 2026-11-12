import type { FormBlueprint, FormColumn, FormField, FormRow, StoredFormBlueprint } from "./types";

export const FORM_LIMITS = { rows: 40, fields: 40, steps: 6 } as const;
export type LayoutErrorCode = "not_found" | "row_limit" | "field_limit" | "step_limit" | "last_step" | "occupied" | "invalid";
export class FormLayoutError extends Error {
  constructor(public readonly code: LayoutErrorCode) { super(code); this.name = "FormLayoutError"; }
}
export interface FieldLocation { row: FormRow; column: FormColumn; columnIndex: number; stepId: string }

export function rowsForStep(definition: FormBlueprint, stepId: string): FormRow[] {
  return definition.rows.filter(row => row.stepId === stepId);
}
export function fieldLocation(definition: FormBlueprint, fieldId: string): FieldLocation | undefined {
  for (const row of definition.rows) {
    const columnIndex = row.columns.findIndex(column => column.fieldId === fieldId);
    const column = row.columns[columnIndex];
    if (column) return { row, column, columnIndex, stepId: row.stepId };
  }
}
/** Single visual order for runtime, keyboard, validation and email; catalog order is irrelevant. */
export function orderedFields(definition: FormBlueprint): FormField[] {
  const fields = new Map(definition.fields.map(field => [field.id, field]));
  return definition.steps.flatMap(step => rowsForStep(definition, step.id).flatMap(row => row.columns.flatMap(column => {
    if (!column.fieldId) return [];
    const field = fields.get(column.fieldId);
    if (!field) throw new FormLayoutError("invalid");
    return [field];
  })));
}

/** Input must already pass its versioned schema. Legacy IDs are deterministic and namespaced. */
export function normalizeBlueprint(definition: StoredFormBlueprint): FormBlueprint {
  if (definition.schemaVersion === 2) return definition;
  const steps = new Set(definition.steps.map(step => step.id));
  if (definition.fields.some(field => !steps.has(field.stepId))) throw new FormLayoutError("invalid");
  const rows: FormRow[] = [];
  for (const step of definition.steps) {
    let pending: FormRow | undefined;
    for (const field of definition.fields.filter(item => item.stepId === step.id)) {
      if (definition.columns === 2 && field.width === 1 && pending) {
        pending.columns[1] = { ...pending.columns[1]!, fieldId: field.id };
        pending = undefined;
        continue;
      }
      const two = definition.columns === 2 && field.width === 1;
      const row: FormRow = {
        id: `legacy-row:${field.id}`, stepId: step.id,
        columns: Array.from({ length: two ? 2 : 1 }, (_, index) => ({ id: `legacy-column:${field.id}:${index}`, fieldId: index === 0 ? field.id : null })),
      };
      rows.push(row);
      pending = two ? row : undefined;
    }
  }
  return {
    schemaVersion: 2, steps: definition.steps.map(step => ({ ...step })), rows,
    fields: definition.fields.map(({ stepId, width, ...field }) => {
      void stepId; void width;
      return { ...field, options: field.options.map(option => ({ ...option })) };
    }),
    copy: { ...definition.copy }, replyToFieldId: definition.replyToFieldId,
  };
}

function requireStep(definition: FormBlueprint, stepId: string) {
  if (!definition.steps.some(step => step.id === stepId)) throw new FormLayoutError("not_found");
}
function requireRow(definition: FormBlueprint, rowId: string): FormRow {
  const row = definition.rows.find(item => item.id === rowId);
  if (!row) throw new FormLayoutError("not_found");
  return row;
}
function requireColumn(definition: FormBlueprint, columnId: string): FormColumn {
  for (const row of definition.rows) {
    const column = row.columns.find(item => item.id === columnId);
    if (column) return column;
  }
  throw new FormLayoutError("not_found");
}
function column(): FormColumn { return { id: crypto.randomUUID(), fieldId: null }; }

export function addRow(definition: FormBlueprint, stepId: string, count: 1 | 2): FormBlueprint {
  requireStep(definition, stepId);
  if (count !== 1 && count !== 2) throw new FormLayoutError("invalid");
  if (definition.rows.length >= FORM_LIMITS.rows) throw new FormLayoutError("row_limit");
  return { ...definition, rows: [...definition.rows, { id: crypto.randomUUID(), stepId, columns: Array.from({ length: count }, column) }] };
}
export function addFieldToColumn(definition: FormBlueprint, columnId: string, field: FormField): FormBlueprint {
  const target = requireColumn(definition, columnId);
  if (target.fieldId) throw new FormLayoutError("occupied");
  if (definition.fields.some(item => item.id === field.id)) throw new FormLayoutError("invalid");
  if (definition.fields.length >= FORM_LIMITS.fields) throw new FormLayoutError("field_limit");
  return {
    ...definition, fields: [...definition.fields, field],
    rows: definition.rows.map(row => ({ ...row, columns: row.columns.map(item => item.id === columnId ? { ...item, fieldId: field.id } : item) })),
  };
}
export function removeField(definition: FormBlueprint, fieldId: string): FormBlueprint {
  if (!fieldLocation(definition, fieldId)) throw new FormLayoutError("not_found");
  return {
    ...definition, fields: definition.fields.filter(field => field.id !== fieldId),
    replyToFieldId: definition.replyToFieldId === fieldId ? null : definition.replyToFieldId,
    rows: definition.rows.map(row => ({ ...row, columns: row.columns.map(item => item.fieldId === fieldId ? { ...item, fieldId: null } : item) })),
  };
}
/** UI confirms removal of populated rows before calling this atomic operation. */
export function removeRow(definition: FormBlueprint, rowId: string): FormBlueprint {
  const row = requireRow(definition, rowId);
  const removed = new Set(row.columns.map(item => item.fieldId).filter(Boolean));
  return {
    ...definition, rows: definition.rows.filter(item => item.id !== rowId),
    fields: definition.fields.filter(field => !removed.has(field.id)),
    replyToFieldId: removed.has(definition.replyToFieldId) ? null : definition.replyToFieldId,
  };
}
export function setRowColumns(definition: FormBlueprint, rowId: string, count: 1 | 2): FormBlueprint {
  const row = requireRow(definition, rowId);
  if (count !== 1 && count !== 2) throw new FormLayoutError("invalid");
  if (row.columns.length === count) return definition;
  if (count === 2) return { ...definition, rows: definition.rows.map(item => item.id === rowId ? { ...item, columns: [item.columns[0]!, column()] } : item) };
  const occupied = row.columns.filter(item => item.fieldId);
  if (occupied.length === 2 && definition.rows.length >= FORM_LIMITS.rows) throw new FormLayoutError("row_limit");
  const replacements: FormRow[] = [{ ...row, columns: [occupied[0] ?? row.columns[0]!] }];
  if (occupied[1]) replacements.push({ id: crypto.randomUUID(), stepId: row.stepId, columns: [occupied[1]] });
  return { ...definition, rows: definition.rows.flatMap(item => item.id === rowId ? replacements : [item]) };
}
export function moveRow(definition: FormBlueprint, rowId: string, direction: -1 | 1): FormBlueprint {
  const row = requireRow(definition, rowId);
  const siblings = rowsForStep(definition, row.stepId);
  const target = siblings[siblings.findIndex(item => item.id === rowId) + direction];
  if (!target) return definition;
  return { ...definition, rows: definition.rows.map(item => item.id === rowId ? target : item.id === target.id ? row : item) };
}
export function setRowStep(definition: FormBlueprint, rowId: string, stepId: string): FormBlueprint {
  const row = requireRow(definition, rowId);
  requireStep(definition, stepId);
  if (row.stepId === stepId) return definition;
  return { ...definition, rows: [...definition.rows.filter(item => item.id !== rowId), { ...row, stepId }] };
}
/** Occupied targets require explicit swap=true; neither field is ever overwritten. */
export function moveField(definition: FormBlueprint, fieldId: string, columnId: string, swap = false): FormBlueprint {
  const source = fieldLocation(definition, fieldId);
  if (!source) throw new FormLayoutError("not_found");
  const target = requireColumn(definition, columnId);
  if (source.column.id === target.id) return definition;
  if (target.fieldId && !swap) throw new FormLayoutError("occupied");
  return { ...definition, rows: definition.rows.map(row => ({ ...row, columns: row.columns.map(item => item.id === source.column.id ? { ...item, fieldId: target.fieldId } : item.id === target.id ? { ...item, fieldId } : item) })) };
}
export function addStep(definition: FormBlueprint, title: string): FormBlueprint {
  if (definition.steps.length >= FORM_LIMITS.steps) throw new FormLayoutError("step_limit");
  return { ...definition, steps: [...definition.steps, { id: crypto.randomUUID(), title }] };
}
export function removeStep(definition: FormBlueprint, stepId: string): FormBlueprint {
  requireStep(definition, stepId);
  if (definition.steps.length === 1) throw new FormLayoutError("last_step");
  const steps = definition.steps.filter(step => step.id !== stepId);
  return {
    ...definition, steps,
    rows: [...definition.rows.filter(row => row.stepId !== stepId), ...definition.rows.filter(row => row.stepId === stepId).map(row => ({ ...row, stepId: steps[0]!.id }))],
  };
}
