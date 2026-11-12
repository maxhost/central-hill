"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AdminButton, Field, Select } from "@slices/backoffice/contract";
import { fieldLocation, rowsForStep } from "../layout";
import type { FormBlueprint, FormField, FormRow } from "../types";

export function FormRowControls({ definition, row, onColumns, onStep, onMove, onRemove }: {
  definition: FormBlueprint; row: FormRow; onColumns: (columns: 1 | 2) => void;
  onStep: (stepId: string) => void; onMove: (direction: -1 | 1) => void; onRemove: () => void;
}) {
  const t = useTranslations("forms");
  const [confirm, setConfirm] = useState(false);
  const siblings = rowsForStep(definition, row.stepId);
  const index = siblings.findIndex(item => item.id === row.id);
  const labels = row.columns.flatMap(column => {
    const field = definition.fields.find(item => item.id === column.fieldId);
    return field ? [field.label || t("newField")] : [];
  });
  return <>
    <Field label={t("rowColumns")} htmlFor="row-columns"><Select id="row-columns" value={row.columns.length} onChange={event => onColumns(Number(event.target.value) as 1 | 2)}><option value={1}>{t("oneColumn")}</option><option value={2}>{t("twoColumns")}</option></Select></Field>
    {row.columns.length === 2 && <p className="text-sm leading-relaxed text-ink-soft">{t("collapseRowHint")}</p>}
    <Field label={t("rowStep")} htmlFor="row-step"><Select id="row-step" value={row.stepId} onChange={event => onStep(event.target.value)}>{definition.steps.map(step => <option key={step.id} value={step.id}>{step.title}</option>)}</Select></Field>
    <div className="flex flex-wrap gap-2 border-t border-line pt-4">
      <AdminButton disabled={index === 0} onClick={() => onMove(-1)}>{t("up")}</AdminButton>
      <AdminButton disabled={index === siblings.length - 1} onClick={() => onMove(1)}>{t("down")}</AdminButton>
      <AdminButton variant="danger" onClick={() => labels.length ? setConfirm(true) : onRemove()}>{t("removeRow")}</AdminButton>
    </div>
    {confirm && <div className="space-y-3 border-t border-line pt-4" role="group" aria-label={t("confirmRemoveRow")}>
      <p className="break-words text-sm leading-relaxed text-ink">{t("removeRowWarning", { fields: labels.join(", ") })}</p>
      <div className="flex flex-wrap gap-2"><AdminButton variant="danger" onClick={onRemove}>{t("confirmRemoveRow")}</AdminButton><AdminButton onClick={() => setConfirm(false)}>{t("keepRow")}</AdminButton></div>
    </div>}
  </>;
}

export function FormFieldMoveControls({ definition, field, onMove }: {
  definition: FormBlueprint; field: FormField; onMove: (columnId: string, swap: boolean) => void;
}) {
  const t = useTranslations("forms");
  const location = fieldLocation(definition, field.id);
  const [stepId, setStepId] = useState(location?.stepId ?? "");
  const [rowId, setRowId] = useState(location?.row.id ?? "");
  const [columnId, setColumnId] = useState(location?.column.id ?? "");
  const [confirm, setConfirm] = useState(false);
  const rows = rowsForStep(definition, stepId);
  const row = rows.find(item => item.id === rowId);
  const column = row?.columns.find(item => item.id === columnId);
  const occupied = definition.fields.find(item => item.id === column?.fieldId);
  const same = column?.id === location?.column.id;
  return <div className="space-y-3 border-t border-line pt-4">
    <h3 className="text-sm font-semibold text-ink">{t("moveField")}</h3>
    <Field label={t("destinationStep")} htmlFor="destination-step"><Select id="destination-step" value={stepId} onChange={event => {
      const next = rowsForStep(definition, event.target.value)[0];
      setStepId(event.target.value); setRowId(next?.id ?? ""); setColumnId(next?.columns[0]?.id ?? ""); setConfirm(false);
    }}>{definition.steps.map(step => <option key={step.id} value={step.id}>{step.title}</option>)}</Select></Field>
    <Field label={t("destinationRow")} htmlFor="destination-row"><Select id="destination-row" value={rowId} disabled={!rows.length} onChange={event => {
      const next = rows.find(item => item.id === event.target.value);
      setRowId(event.target.value); setColumnId(next?.columns[0]?.id ?? ""); setConfirm(false);
    }}>{!rows.length && <option value="">{t("noDestinationRows")}</option>}{rows.map((item, index) => <option key={item.id} value={item.id}>{t("rowNumber", { number: index + 1 })}</option>)}</Select></Field>
    <Field label={t("destinationColumn")} htmlFor="destination-column"><Select id="destination-column" value={columnId} disabled={!row} onChange={event => { setColumnId(event.target.value); setConfirm(false); }}>{row?.columns.map((item, index) => <option key={item.id} value={item.id}>{t("columnDestination", { number: index + 1, field: definition.fields.find(candidate => candidate.id === item.fieldId)?.label || t("emptyColumn") })}</option>)}</Select></Field>
    <AdminButton disabled={!column || same} onClick={() => occupied ? setConfirm(true) : onMove(columnId, false)}>{t(occupied && !same ? "swapFields" : "moveField")}</AdminButton>
    {confirm && occupied && !same && <div role="group" aria-label={t("confirmSwap")} className="space-y-3">
      <p className="break-words text-sm leading-relaxed text-ink">{t("swapWarning", { source: field.label, target: occupied.label })}</p>
      <div className="flex flex-wrap gap-2"><AdminButton onClick={() => onMove(columnId, true)}>{t("confirmSwap")}</AdminButton><AdminButton onClick={() => setConfirm(false)}>{t("cancelMove")}</AdminButton></div>
    </div>}
  </div>;
}
