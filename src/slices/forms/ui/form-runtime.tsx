"use client";

import { useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AdminButton, Field, TextInput, TextArea, Select, Checkbox } from "@slices/backoffice/contract";
import { FORM_FILE_ACCEPT, MAX_TOTAL_FILE_BYTES, fileSelectionError } from "../file-policy";
import type { FileSelectionError } from "../file-policy";
import type { FormBlueprint, FormInputValues } from "../types";
import { fieldLocation, orderedFields, rowsForStep } from "../layout";

type FileError = FileSelectionError | "filesTooLarge" | "fileSingleOnly";
export interface FormRuntimeProps {
  definition: FormBlueprint;
  compact?: boolean;
  onSubmit: (values: FormInputValues, files: FormData) => Promise<{ ok: boolean; error?: string }>;
}

/** Staff preview runtime. The caller supplies a saved definition and the gated test action. */
export function FormRuntime({ definition, compact = false, onSubmit }: FormRuntimeProps) {
  const t = useTranslations("forms");
  const prefix = useId();
  const form = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<FormInputValues>({});
  const [files, setFiles] = useState<Record<string, File>>({});
  const [fileErrors, setFileErrors] = useState<Record<string, FileError>>({});
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const current = definition.steps[step];
  const reset = () => {
    form.current?.reset();
    setValues({}); setFiles({}); setFileErrors({}); setStep(0); setError(""); setDone(false);
  };
  const change = (id: string, value: string | boolean) => setValues(previous => ({ ...previous, [id]: value }));
  if (done) return <section className="space-y-4" role="status"><h2 className="font-serif text-2xl">{definition.copy.successTitle}</h2><p className="text-sm text-ink-soft">{definition.copy.successMessage}</p><AdminButton onClick={reset}>{t("testAgain")}</AdminButton></section>;
  return <form ref={form} className="space-y-6" onSubmit={async event => {
    event.preventDefault(); setError("");
    const invalidField = orderedFields(definition).find(field => fileErrors[field.id] && (step === definition.steps.length - 1 || fieldLocation(definition, field.id)?.stepId === current?.id));
    if (invalidField) {
      setError(`${invalidField.label}: ${t(fileErrors[invalidField.id]!)}`);
      setStep(Math.max(0, definition.steps.findIndex(item => item.id === fieldLocation(definition, invalidField.id)?.stepId)));
      return;
    }
    if (step < definition.steps.length - 1) { setStep(step + 1); return; }
    setBusy(true);
    const attachments = new FormData();
    for (const [id, file] of Object.entries(files)) attachments.append(id, file);
    try { const result = await onSubmit(values, attachments); if (result.ok) setDone(true); else setError(result.error ? `${definition.copy.errorMessage} ${result.error}` : definition.copy.errorMessage); }
    catch { setError(definition.copy.errorMessage); }
    finally { setBusy(false); }
  }}>
    <div><h2 className="font-serif text-3xl text-ink">{definition.copy.title}</h2>{definition.copy.description && <p className="mt-3 text-sm leading-relaxed text-ink-soft">{definition.copy.description}</p>}</div>
    {definition.steps.length > 1 && <p className="text-sm font-medium text-ink-soft">{t("stepProgress", { current: step + 1, total: definition.steps.length })} · {current?.title}</p>}
    <div className="space-y-5">
      {definition.steps.flatMap(item => rowsForStep(definition, item.id)).filter(row => row.columns.some(column => column.fieldId)).map(row => <div key={row.id} data-form-row={row.id} hidden={row.stepId !== current?.id} className="min-w-0"><div className={`grid min-w-0 gap-5 ${!compact && row.columns.length === 2 ? "sm:grid-cols-2" : "grid-cols-1"}`}>
      {row.columns.map((column, columnIndex) => {
        const field = definition.fields.find(item => item.id === column.fieldId);
        if (!field) return null;
        const id = `${prefix}-${field.id}`;
        const active = row.stepId === current?.id;
        const fileError = fileErrors[field.id];
        const description = [field.help && `${id}-help`, field.type === "file" && `${id}-file-policy`, fileError && `${id}-error`].filter(Boolean).join(" ");
        const common = { id, name: field.id, required: field.required, disabled: busy || !active, "aria-describedby": description || undefined };
        // Keep inactive controls mounted so file inputs retain their native selection across steps.
        return <div key={column.id} className={`min-w-0 ${!compact && row.columns.length === 2 && columnIndex === 1 ? "sm:col-start-2" : ""}`}>
          {field.type === "checkbox" ? <Checkbox {...common} label={`${field.label}${field.required ? " *" : ""}`} checked={values[field.id] === true} onChange={event => change(field.id, event.target.checked)} /> : <Field label={field.label} htmlFor={id} required={field.required}>
            {field.type === "textarea" ? <TextArea {...common} maxLength={10000} placeholder={field.placeholder} value={String(values[field.id] ?? "")} onChange={event => change(field.id, event.target.value)} /> : field.type === "select" ? <Select {...common} value={String(values[field.id] ?? "")} onChange={event => change(field.id, event.target.value)}><option value="">{field.placeholder || t("chooseOption")}</option>{field.options.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</Select> : field.type === "file" ? <>
              <TextInput {...common} type="file" accept={FORM_FILE_ACCEPT} aria-invalid={Boolean(fileError)} className="min-w-0 file:mr-3 file:rounded file:border-0 file:bg-surface file:px-2 file:py-1 file:text-sm file:font-medium file:text-ink" onChange={event => {
                const selected = event.currentTarget.files;
                const file = selected?.[0];
                const next = { ...files }; delete next[field.id];
                let issue: FileError | null = selected && selected.length > 1 ? "fileSingleOnly" : file ? fileSelectionError(file) : null;
                if (!issue && file && Object.values(next).reduce((total, item) => total + item.size, file.size) > MAX_TOTAL_FILE_BYTES) issue = "filesTooLarge";
                if (file && !issue) next[field.id] = file;
                else event.currentTarget.value = "";
                setFiles(next);
                setFileErrors(previous => { const errors = { ...previous }; if (issue) errors[field.id] = issue; else delete errors[field.id]; return errors; });
                setError("");
              }} />
              <p id={`${id}-file-policy`} className="text-sm leading-relaxed text-ink-soft">{t("fileHint")}</p>
              {files[field.id] && <div className="flex flex-wrap items-center gap-x-3 gap-y-1"><span className="min-w-0 break-all text-sm text-ink">{files[field.id]!.name}</span><AdminButton disabled={busy} aria-label={t("removeFileNamed", { name: files[field.id]!.name })} onClick={() => {
                const input = form.current?.elements.namedItem(field.id);
                if (input instanceof HTMLInputElement) input.value = "";
                setFiles(previous => { const next = { ...previous }; delete next[field.id]; return next; });
                setFileErrors(previous => { const next = { ...previous }; delete next[field.id]; return next; });
                setError("");
              }}>{t("removeFile")}</AdminButton></div>}
            </> : <TextInput {...common} type={field.type} min={field.type === "date" ? "0001-01-01" : field.min} max={field.type === "date" ? "9999-12-31" : field.max} step={field.type === "number" ? "any" : undefined} maxLength={field.type === "number" || field.type === "date" ? undefined : field.type === "email" ? 254 : 1000} placeholder={field.type === "date" ? undefined : field.placeholder} value={String(values[field.id] ?? "")} onChange={event => change(field.id, event.target.value)} />}
          </Field>}
          {fileError && <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-red-700">{t(fileError)}</p>}
          {field.help && <p id={`${id}-help`} className="mt-1.5 text-sm text-ink-soft">{field.help}</p>}
        </div>;
      })}
      </div></div>)}
    </div>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
      {step > 0 && <AdminButton disabled={busy} onClick={() => { setError(""); setStep(step - 1); }}>{definition.copy.back}</AdminButton>}
      <AdminButton type="submit" variant="primary" disabled={busy}>{busy ? t("sending") : step < definition.steps.length - 1 ? definition.copy.next : definition.copy.submit}</AdminButton>
      <AdminButton disabled={busy} onClick={reset}>{definition.copy.cancel}</AdminButton>
    </div>
  </form>;
}
