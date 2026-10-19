"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { AdminButton, Field, TextInput, TextArea, Select, Checkbox } from "@slices/backoffice/contract";
import type { FormBlueprint, FormValues } from "../types";

export interface FormRuntimeProps {
  definition: FormBlueprint;
  compact?: boolean;
  onSubmit: (values: FormValues) => Promise<{ ok: boolean; error?: string }>;
}

/** Staff preview runtime. The caller supplies a saved definition and the gated test action. */
export function FormRuntime({ definition, compact = false, onSubmit }: FormRuntimeProps) {
  const t = useTranslations("forms");
  const prefix = useId();
  const [values, setValues] = useState<FormValues>({});
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const current = definition.steps[step];
  const reset = () => { setValues({}); setStep(0); setError(""); setDone(false); };
  const change = (id: string, value: string | boolean) => setValues(previous => ({ ...previous, [id]: value }));
  if (done) return <section className="space-y-4" role="status"><h2 className="font-serif text-2xl">{definition.copy.successTitle}</h2><p className="text-sm text-ink-soft">{definition.copy.successMessage}</p><AdminButton onClick={reset}>{t("testAgain")}</AdminButton></section>;
  return <form className="space-y-6" onSubmit={async event => {
    event.preventDefault(); setError("");
    if (step < definition.steps.length - 1) { setStep(step + 1); return; }
    setBusy(true);
    try { const result = await onSubmit(values); if (result.ok) setDone(true); else setError(result.error ? `${definition.copy.errorMessage} ${result.error}` : definition.copy.errorMessage); }
    catch { setError(definition.copy.errorMessage); }
    finally { setBusy(false); }
  }}>
    <div><h2 className="font-serif text-3xl text-ink">{definition.copy.title}</h2>{definition.copy.description && <p className="mt-3 text-sm leading-relaxed text-ink-soft">{definition.copy.description}</p>}</div>
    {definition.steps.length > 1 && <p className="text-sm font-medium text-ink-soft">{t("stepProgress", { current: step + 1, total: definition.steps.length })} · {current?.title}</p>}
    <div className={`grid gap-5 ${!compact && definition.columns === 2 ? "sm:grid-cols-2" : "grid-cols-1"}`}>
      {definition.fields.filter(field => field.stepId === current?.id).map(field => {
        const id = `${prefix}-${field.id}`;
        const common = { id, name: field.id, required: field.required, disabled: busy, "aria-describedby": field.help ? `${id}-help` : undefined };
        return <div key={field.id} className={field.width === 2 && !compact && definition.columns === 2 ? "sm:col-span-2" : ""}>
          {field.type === "checkbox" ? <Checkbox {...common} label={`${field.label}${field.required ? " *" : ""}`} checked={values[field.id] === true} onChange={event => change(field.id, event.target.checked)} /> : <Field label={field.label} htmlFor={id} required={field.required}>
            {field.type === "textarea" ? <TextArea {...common} maxLength={10000} placeholder={field.placeholder} value={String(values[field.id] ?? "")} onChange={event => change(field.id, event.target.value)} /> : field.type === "select" ? <Select {...common} value={String(values[field.id] ?? "")} onChange={event => change(field.id, event.target.value)}><option value="">{field.placeholder || t("chooseOption")}</option>{field.options.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</Select> : <TextInput {...common} type={field.type} min={field.min} max={field.max} step={field.type === "number" ? "any" : undefined} maxLength={field.type === "number" ? undefined : field.type === "email" ? 254 : 1000} placeholder={field.placeholder} value={String(values[field.id] ?? "")} onChange={event => change(field.id, event.target.value)} />}
          </Field>}
          {field.help && <p id={`${id}-help`} className="mt-1.5 text-sm text-ink-soft">{field.help}</p>}
        </div>;
      })}
    </div>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
      {step > 0 && <AdminButton disabled={busy} onClick={() => { setError(""); setStep(step - 1); }}>{definition.copy.back}</AdminButton>}
      <AdminButton type="submit" variant="primary" disabled={busy}>{busy ? t("sending") : step < definition.steps.length - 1 ? definition.copy.next : definition.copy.submit}</AdminButton>
      <AdminButton disabled={busy} onClick={reset}>{definition.copy.cancel}</AdminButton>
    </div>
  </form>;
}
