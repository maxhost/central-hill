"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AdminButton, Field, Select } from "@slices/backoffice/contract";
import { FORM_LIMITS, rowsForStep } from "../layout";
import type { FieldType, FormBlueprint } from "../types";

const types: FieldType[] = ["text", "email", "tel", "textarea", "number", "select", "checkbox", "date", "file"];

function EmptyColumn({ columnId, rowNumber, columnNumber, disabled, onAdd }: {
  columnId: string; rowNumber: number; columnNumber: number; disabled: boolean;
  onAdd: (columnId: string, type: FieldType) => void;
}) {
  const t = useTranslations("forms");
  const [type, setType] = useState<FieldType>("text");
  const label = t("columnPosition", { row: rowNumber, column: columnNumber });
  return <div className="flex min-w-0 flex-col justify-center gap-3 rounded-md border border-dashed border-line p-3">
    <p className="text-sm text-ink-soft">{label}</p>
    <Field label={t("fieldType")} htmlFor={`add-type-${columnId}`}>
      <Select id={`add-type-${columnId}`} aria-label={t("columnFieldType", { row: rowNumber, column: columnNumber })} value={type} disabled={disabled} onChange={event => setType(event.target.value as FieldType)}>
        {types.map(value => <option key={value} value={value}>{t(`types.${value}`)}</option>)}
      </Select>
    </Field>
    <AdminButton disabled={disabled} aria-label={t("addFieldAt", { row: rowNumber, column: columnNumber })} onClick={() => onAdd(columnId, type)}>{t("addField")}</AdminButton>
  </div>;
}

export function FormLayoutCanvas({ definition, selected, activeStep, compact, sourceMode, onSelect, onAddField, onAddRow, onAddStep }: {
  definition: FormBlueprint; selected: string; activeStep: string; compact: boolean; sourceMode: boolean;
  onSelect: (id: string) => void; onAddField: (columnId: string, type: FieldType) => void;
  onAddRow: (columns: 1 | 2) => void; onAddStep: () => void;
}) {
  const t = useTranslations("forms");
  const [columns, setColumns] = useState<1 | 2>(1);
  const rows = rowsForStep(definition, activeStep);
  const fields = new Map(definition.fields.map(field => [field.id, field]));
  return <>
    <div className="space-y-4">
      {rows.map((row, rowIndex) => <div key={row.id} data-form-row={row.id} className={`min-w-0 rounded-md border p-3 ${selected === row.id ? "border-accent" : "border-line"}`}>
        <button type="button" id={`form-element-${row.id}`} aria-label={t("editRow", { number: rowIndex + 1 })} aria-pressed={selected === row.id} className="mb-3 w-full rounded text-left text-sm font-semibold text-ink-soft focus-visible:outline-2 focus-visible:outline-accent" onClick={() => onSelect(row.id)}>
          {t("rowSummary", { number: rowIndex + 1, columns: row.columns.length })}
        </button>
        <div className={`grid min-w-0 gap-3 ${!compact && row.columns.length === 2 ? "sm:grid-cols-2" : "grid-cols-1"}`}>
          {row.columns.map((column, columnIndex) => {
            const field = column.fieldId ? fields.get(column.fieldId) : undefined;
            if (!field) return sourceMode ? <EmptyColumn key={column.id} columnId={column.id} rowNumber={rowIndex + 1} columnNumber={columnIndex + 1} disabled={definition.fields.length >= FORM_LIMITS.fields} onAdd={onAddField} /> : null;
            return <button type="button" id={`form-element-${field.id}`} key={column.id} data-form-field={field.id} aria-pressed={selected === field.id} className={`min-w-0 rounded-md border p-3 text-left hover:border-accent focus-visible:outline-2 focus-visible:outline-accent ${!compact && row.columns.length === 2 && columnIndex === 1 ? "sm:col-start-2" : ""} ${selected === field.id ? "border-accent bg-accent/5 outline-1 outline-accent" : "border-line"}`} onClick={() => onSelect(field.id)}>
              <span className="block break-words text-sm font-medium text-ink">{field.label || t("newField")}{field.required ? " *" : ""}</span>
              <span className={`mt-2 block rounded border border-line bg-bg px-3 py-2 text-sm text-ink-soft ${field.type === "textarea" ? "min-h-20" : ""}`}>{field.type === "checkbox" ? t("checkboxPreview") : field.type === "date" ? t("datePreview") : field.type === "file" ? t("filePreview") : field.placeholder || t(`types.${field.type}`)}</span>
              {field.type === "file" && <span className="mt-2 block text-sm leading-relaxed text-ink-soft">{t("fileHint")}</span>}
              {field.help && <span className="mt-2 block break-words text-sm text-ink-soft">{field.help}</span>}
            </button>;
          })}
        </div>
      </div>)}
      {!rows.length && <p className="py-4 text-sm leading-relaxed text-ink-soft">{t("emptyRows")}</p>}
    </div>
    {sourceMode && <div className="mt-5 space-y-4 border-t border-line pt-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-40 flex-1"><Field label={t("newRowColumns")} htmlFor="new-row-columns"><Select id="new-row-columns" value={columns} onChange={event => setColumns(Number(event.target.value) as 1 | 2)}><option value={1}>{t("oneColumn")}</option><option value={2}>{t("twoColumns")}</option></Select></Field></div>
        <AdminButton disabled={definition.rows.length >= FORM_LIMITS.rows} onClick={() => onAddRow(columns)}>{t("addRow")}</AdminButton>
      </div>
      <AdminButton disabled={definition.steps.length >= FORM_LIMITS.steps} onClick={onAddStep}>{t("addStep")}</AdminButton>
    </div>}
  </>;
}
