"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AdminButton, AdminPageHeader, Field, TextInput, TextArea, Select, Checkbox, StateBadge, SpriteIcon } from "@slices/backoffice/contract";
import { approvedBlueprint, localizedBlueprint, newField, textFields } from "../domain";
import { saveForm, saveFormLocale, testForm } from "../server/actions";
import { FormRuntime } from "../ui/form-runtime";
import { FormLayoutCanvas } from "./form-layout-canvas";
import { FormFieldMoveControls, FormRowControls } from "./form-row-controls";
import { addFieldToColumn, addRow, addStep, fieldLocation, FormLayoutError, moveField, moveRow, removeField, removeRow, removeStep, rowsForStep, setRowColumns, setRowStep } from "../layout";
import type { FieldType, FormBlueprint, FormCopy, FormEditorModel, FormField, FormTranslations, TargetLocale } from "../types";

type Language = "en" | TargetLocale;
const languages: Language[] = ["en", "es", "pt", "fr"];
const types: FieldType[] = ["text", "email", "tel", "textarea", "number", "select", "checkbox", "date", "file"];
function move<T>(items: T[], index: number, delta: number): T[] {
  const next = [...items]; const destination = index + delta;
  if (destination < 0 || destination >= next.length) return items;
  [next[index], next[destination]] = [next[destination]!, next[index]!]; return next;
}

export function FormEditor({ model }: { model: FormEditorModel }) {
  const t = useTranslations("forms");
  const router = useRouter();
  const [saved, setSaved] = useState(model.form);
  const [translations, setTranslations] = useState<FormTranslations>(model.translations);
  const [definition, setDefinition] = useState<FormBlueprint>(model.form.definition);
  const [name, setName] = useState(model.form.name);
  const [recipient, setRecipient] = useState(model.form.recipient);
  const [language, setLanguage] = useState<Language>("en");
  const [targets, setTargets] = useState<Record<TargetLocale, Record<string, string>>>(() => Object.fromEntries((["es", "pt", "fr"] as const).map(locale => [locale, Object.fromEntries(Object.entries(model.translations[locale]).map(([key, row]) => [key, row.value]))])) as Record<TargetLocale, Record<string, string>>);
  const [selected, setSelected] = useState("form");
  const [activeStep, setActiveStep] = useState(model.form.definition.steps[0]?.id ?? "");
  const [compact, setCompact] = useState(false);
  const [testing, setTesting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [targetDirty, setTargetDirty] = useState<Record<TargetLocale, boolean>>({ es: false, pt: false, fr: false });
  const source = textFields(definition);
  const rendered = language === "en" ? definition : localizedBlueprint(definition, targets[language]);
  const selectedField = definition.fields.find(field => field.id === selected);
  const selectedStep = definition.steps.find(step => step.id === selected);
  const selectedRow = definition.rows.find(row => row.id === selected);
  const selectedLocation = selectedField ? fieldLocation(definition, selectedField.id) : undefined;
  const sourceMode = language === "en";
  const changeDefinition = (next: FormBlueprint) => { setDefinition(next); setDirty(true); setNotice(""); };
  const changeField = (patch: Partial<FormField>) => { if (selectedField) changeDefinition({ ...definition, fields: definition.fields.map(field => field.id === selectedField.id ? { ...field, ...patch } : field) }); };
  const applyLayout = (operation: () => FormBlueprint, nextSelection?: (next: FormBlueprint) => string) => {
    try {
      const next = operation();
      if (next === definition) return;
      const id = nextSelection?.(next) ?? selected;
      const row = next.rows.find(item => item.id === id);
      const location = fieldLocation(next, id);
      const stepId = location?.stepId ?? row?.stepId ?? (next.steps.some(item => item.id === id) ? id : next.steps.some(item => item.id === activeStep) ? activeStep : next.steps[0]?.id ?? "");
      const exists = id === "form" || next.fields.some(item => item.id === id) || next.rows.some(item => item.id === id) || next.steps.some(item => item.id === id);
      const selection = exists ? id : stepId;
      changeDefinition(next); setSelected(selection); setActiveStep(stepId); setError("");
      requestAnimationFrame(() => document.getElementById(`form-element-${selection}`)?.focus());
    } catch (issue) {
      setError(issue instanceof FormLayoutError ? t(`layoutErrors.${issue.code}`) : t("requestError"));
    }
  };
  const validationMessage = (result: { error: string; fieldErrors?: Record<string, string> }, selectError = false) => {
    const issues = Object.entries(result.fieldErrors ?? {});
    if (!issues.length) return result.error;
    return issues.map(([rawPath, message], index) => {
      const path = rawPath.replace(/^values\./, "");
      let label = t("formSettings");
      let element = "form";
      let stepId: string | undefined;
      if (path === "name") label = t("internalName");
      else if (path === "recipient") label = t("recipient");
      else if (path === "definition.replyToFieldId") label = t("replyTo");
      else if (path.startsWith("definition.rows")) {
        const rowIndex = path.match(/^definition\.rows\.(\d+)/)?.[1];
        const row = rowIndex === undefined ? undefined : definition.rows[Number(rowIndex)];
        label = t("rowLayout");
        if (row) { element = row.id; stepId = row.stepId; }
      }
      else {
        const copyKey = path.match(/^(?:definition\.copy\.|block:copy\.)([^.]+)$/)?.[1];
        const fieldIndex = path.match(/^definition\.fields\.(\d+)/)?.[1];
        const stepIndex = path.match(/^definition\.steps\.(\d+)/)?.[1];
        const stableFieldId = path.match(/^block:fields\.([^.]+)/)?.[1];
        const stableStepId = path.match(/^block:steps\.([^.]+)/)?.[1];
        const field = fieldIndex !== undefined ? definition.fields[Number(fieldIndex)] : definition.fields.find(item => item.id === stableFieldId || item.id === path);
        const step = stepIndex !== undefined ? definition.steps[Number(stepIndex)] : definition.steps.find(item => item.id === stableStepId);
        if (copyKey && copyKey in definition.copy) label = t(`copy.${copyKey as keyof FormCopy}`);
        else if (field) {
          element = field.id; stepId = fieldLocation(definition, field.id)?.stepId;
          const suffix = path.split(".").at(-1);
          const detail = suffix === "label" ? t("label") : suffix === "help" ? t("help") : suffix === "placeholder" ? t("placeholder") : suffix === "min" ? t("min") : suffix === "max" ? t("max") : path.includes("options") ? t("options") : t("fieldType");
          label = `${field.label || t("newField")} · ${detail}`;
        } else if (step) { element = step.id; stepId = step.id; label = `${step.title || t("newStep")} · ${t("stepTitle")}`; }
      }
      if (selectError && index === 0) { setSelected(element); if (stepId) setActiveStep(stepId); setTesting(false); }
      return `${label}: ${message}`;
    }).join(" · ");
  };
  const save = async (approve = false) => {
    setBusy(true); setError(""); setNotice("");
    try {
      if (language === "en") {
        const result = await saveForm({ id: saved.id, expectedRevision: saved.revision, name, recipient, definition });
        if (!result.ok) { setError(result.code === "conflict" ? t("conflict") : validationMessage(result, true)); return; }
        setSaved({ ...saved, name, recipient, definition, revision: result.data.revision });
        setTranslations(previous => Object.fromEntries(Object.entries(previous).map(([locale, rows]) => [locale, Object.fromEntries(Object.entries(rows).map(([key, row]) => [key, { ...row, stale: row.stale || source[key] !== textFields(saved.definition)[key] }]))])) as FormTranslations);
        setDirty(false);
      } else {
        if (dirty) { setError(t("saveSourceFirst")); return; }
        const result = await saveFormLocale({ id: saved.id, expectedRevision: saved.revision, locale: language, values: Object.fromEntries(Object.entries(targets[language]).filter(([key]) => key in source)), approve });
        if (!result.ok) { setError(result.code === "conflict" ? t("conflict") : validationMessage(result, true)); return; }
        setSaved({ ...saved, revision: result.data.revision });
        setTranslations(previous => ({ ...previous, [language]: Object.fromEntries(Object.entries(targets[language]).filter(([, value]) => value.trim()).map(([key, value]) => [key, { value, stale: false, state: approve ? "approved" : "needs_review" }])) }));
        setTargetDirty(previous => ({ ...previous, [language]: false }));
      }
      setNotice(t(approve ? "approvedNotice" : "savedNotice")); router.refresh();
    } catch { setError(t("requestError")); } finally { setBusy(false); }
  };
  const textControl = (path: string, label: string, multiline = false) => {
    const value = language === "en" ? source[path] ?? "" : targets[language][path] ?? "";
    const row = language === "en" ? undefined : translations[language][path];
    const update = (value: string) => {
      if (language !== "en") { setTargets(previous => ({ ...previous, [language]: { ...previous[language], [path]: value } })); setTargetDirty(previous => ({ ...previous, [language]: true })); return; }
      if (path.startsWith("block:copy.")) changeDefinition({ ...definition, copy: { ...definition.copy, [path.slice(11)]: value } });
      else if (selectedField) {
        const option = selectedField.options.find(option => path === `block:fields.${selectedField.id}.options.${option.id}`);
        if (option) changeField({ options: selectedField.options.map(item => item.id === option.id ? { ...item, label: value } : item) });
        else { const key = path.split(".").at(-1)!; changeField({ [key]: value }); }
      } else if (selectedStep) changeDefinition({ ...definition, steps: definition.steps.map(step => step.id === selectedStep.id ? { ...step, title: value } : step) });
    };
    const id = `edit-${path}`;
    return <Field key={path} label={label} htmlFor={id}>
      {!sourceMode && <p className="mb-1 whitespace-pre-wrap break-words text-sm text-ink-soft">EN: {source[path] || t("emptySource")}</p>}
      {multiline ? <TextArea id={id} maxLength={path.startsWith("block:copy.") && ["description", "successMessage", "errorMessage"].some(key => path.endsWith(`.${key}`)) ? 2000 : path.endsWith(".help") ? 1000 : 300} value={value} onChange={event => update(event.target.value)} /> : <TextInput id={id} maxLength={300} value={value} onChange={event => update(event.target.value)} />}
      {!sourceMode && <div className="flex flex-wrap gap-2 text-xs text-ink-soft"><span>{!value.trim() ? t("fallback") : row && row.value === value ? t(row.state) : t("unsaved")}</span>{row?.stale && <StateBadge label={t("stale")} tone="review" />}</div>}
    </Field>;
  };
  return <div className="space-y-5">
    <AdminPageHeader title={name || t("editorTitle")} description={t("editorDescription")} actions={<Link href="/admin/forms" className="inline-flex items-center gap-2 text-sm text-accent-deep underline underline-offset-4"><SpriteIcon name="arrow-left" size={18} />{t("backToCatalog")}</Link>} />
    {saved.status === "archived" && <p className="text-sm text-ink-soft">{t("archivedHint")}</p>}
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
      <div className="flex flex-wrap gap-1" aria-label={t("language")}>
        {languages.map(locale => <AdminButton key={locale} disabled={busy} aria-pressed={language === locale} variant={language === locale ? "primary" : "ghost"} onClick={() => { setLanguage(locale); setNotice(""); setError(""); }}>{locale.toUpperCase()}{locale === "en" ? ` · ${t("source")}` : ""}</AdminButton>)}
      </div>
      <div className="flex flex-wrap items-center gap-2"><AdminButton disabled={busy || saved.status === "archived" || !saved.recipient} onClick={() => setTesting(!testing)}>{t(testing ? "returnToEditor" : "testSaved")}</AdminButton><AdminButton variant="primary" disabled={busy || saved.status === "archived"} onClick={() => void save()}>{t(busy ? "working" : sourceMode ? "saveSource" : "saveReview")}</AdminButton>{!sourceMode && <AdminButton disabled={busy || dirty || saved.status === "archived"} onClick={() => void save(true)}>{t("approve")}</AdminButton>}</div>
    </div>
    <div aria-live="polite">{error && <p role="alert" className="text-sm text-red-700">{error}</p>}{notice && <p className="text-sm text-ink-soft">{notice}</p>}{(dirty || Object.values(targetDirty).some(Boolean)) && <p className="mt-1 text-sm text-accent-deep">{t("unsavedHint")}</p>}</div>
    <div className="flex flex-wrap items-center gap-2"><span className="mr-2 text-sm text-ink-soft">{t("previewSize")}</span><AdminButton aria-pressed={!compact} onClick={() => setCompact(false)}>{t("desktop")}</AdminButton><AdminButton aria-pressed={compact} onClick={() => setCompact(true)}>{t("mobile")}</AdminButton><span className="text-sm text-ink-soft">{t("revision", { revision: saved.revision })}</span></div>
    {testing ? <section className="space-y-5 rounded-lg border border-line bg-bg p-4 sm:p-7"><p className="max-w-3xl text-sm leading-relaxed text-ink-soft">{t("savedTestHint", { recipient: saved.recipient, revision: saved.revision })}</p><div className="mx-auto w-full rounded-lg border border-line bg-surface p-5 sm:p-7" style={{ maxWidth: compact ? 390 : 760 }}><FormRuntime key={`${saved.revision}-${language}`} compact={compact} definition={approvedBlueprint(saved.definition, translations, language)} onSubmit={async (values, files) => {
      const result = await testForm({ id: saved.id, expectedRevision: saved.revision, locale: language, values }, files);
      if (!result.ok) return { ok: false, error: result.code === "conflict" ? t("conflict") : validationMessage(result) };
      setNotice(t(`delivery.${result.data.delivery}`)); return result.data.delivery === "failed" ? { ok: false, error: t("delivery.failed") } : { ok: true };
    }} /></div></section> : <fieldset disabled={busy} className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="min-w-0 rounded-lg border border-line bg-bg p-4 sm:p-6" aria-label={t("canvas")}>
        <p className="mb-5 text-sm text-ink-soft">{t(sourceMode ? "canvasHint" : "targetHint")}</p>
        <div className="mx-auto w-full rounded-lg border border-line bg-surface p-4 sm:p-6" style={{ maxWidth: compact ? 390 : 760 }}>
          <button type="button" id="form-element-form" aria-pressed={selected === "form"} className={`w-full rounded-md p-3 text-left hover:bg-bg focus-visible:outline-2 focus-visible:outline-accent ${selected === "form" ? "outline-2 outline-accent" : ""}`} onClick={() => setSelected("form")}><h2 className="font-serif text-3xl leading-tight text-ink">{rendered.copy.title || t("title")}</h2><p className="mt-2 text-sm leading-relaxed text-ink-soft">{rendered.copy.description}</p></button>
          <div className="my-5 flex flex-wrap gap-2">{rendered.steps.map((step, index) => <AdminButton id={`form-element-${step.id}`} key={step.id} variant={step.id === activeStep ? "primary" : "ghost"} onClick={() => { setActiveStep(step.id); setSelected(step.id); }}>{index + 1}. {step.title}</AdminButton>)}</div>
          <FormLayoutCanvas definition={rendered} selected={selected} activeStep={activeStep} compact={compact} sourceMode={sourceMode}
            onSelect={setSelected}
            onAddRow={count => applyLayout(() => addRow(definition, activeStep, count), next => next.rows.at(-1)!.id)}
            onAddStep={() => applyLayout(() => addStep(definition, t("newStep")), next => next.steps.at(-1)!.id)}
            onAddField={(columnId, type) => {
              const field = { ...newField(type), label: t(`types.${type}`), options: type === "select" ? [{ id: crypto.randomUUID(), label: t("newOption") }] : [] };
              applyLayout(() => addFieldToColumn(definition, columnId, field), () => field.id);
            }} />
          <button type="button" className="mt-6 w-full rounded-md border border-accent bg-accent px-4 py-3 text-sm font-medium text-white" onClick={() => setSelected("form")}>{rendered.copy.submit}</button>
        </div>
      </section>
      <aside className="min-w-0 space-y-5 rounded-lg border border-line bg-surface p-5" aria-label={t("inspector")}>
        <h2 className="border-b border-line pb-3 text-base font-semibold text-ink">{selectedField ? selectedField.label : selectedRow ? t("rowNumber", { number: rowsForStep(definition, selectedRow.stepId).findIndex(row => row.id === selectedRow.id) + 1 }) : selectedStep ? selectedStep.title : t("formSettings")}</h2>
        {!sourceMode && <p className="text-sm leading-relaxed text-ink-soft">{t("targetHint")}</p>}
        {selectedField ? <>
          {textControl(`block:fields.${selectedField.id}.label`, t("label"))}
          {selectedField.type !== "file" && selectedField.type !== "date" && textControl(`block:fields.${selectedField.id}.placeholder`, t("placeholder"))}
          {selectedField.type === "file" && <p className="text-sm leading-relaxed text-ink-soft">{t("fileHint")}</p>}
          {textControl(`block:fields.${selectedField.id}.help`, t("help"), true)}
          {sourceMode && <>
            <Field label={t("fieldType")} htmlFor="field-type"><Select id="field-type" value={selectedField.type} onChange={event => { const type = event.target.value as FieldType; changeDefinition({ ...definition, replyToFieldId: definition.replyToFieldId === selectedField.id && type !== "email" ? null : definition.replyToFieldId, fields: definition.fields.map(field => field.id === selectedField.id ? { ...field, type, options: type === "select" ? field.options.length ? field.options : [{ id: crypto.randomUUID(), label: t("newOption") }] : [], min: type === "number" ? field.min : undefined, max: type === "number" ? field.max : undefined, consent: type === "checkbox" ? field.consent : false } : field) }); }}>{types.map(type => <option key={type} value={type}>{t(`types.${type}`)}</option>)}</Select></Field>
            <Checkbox label={t("required")} checked={selectedField.required} onChange={event => changeField({ required: event.target.checked })} />
            {selectedField.type === "checkbox" && <Checkbox label={t("consent")} checked={selectedField.consent} onChange={event => changeField({ consent: event.target.checked })} />}
            {selectedField.type === "number" && <div className="grid grid-cols-2 gap-3">{(["min", "max"] as const).map(key => <Field key={key} label={t(key)} htmlFor={`field-${key}`}><TextInput id={`field-${key}`} type="number" value={selectedField[key] ?? ""} onChange={event => changeField({ [key]: event.target.value === "" ? undefined : Number(event.target.value) })} /></Field>)}</div>}
          </>}
          {selectedField.type === "select" && <div className="space-y-3"><h3 className="text-sm font-semibold">{t("options")}</h3>{selectedField.options.map((option, index) => <div key={option.id} className="space-y-2 border-b border-line pb-3">{textControl(`block:fields.${selectedField.id}.options.${option.id}`, t("optionLabel", { number: index + 1 }))}{sourceMode && <div className="flex flex-wrap gap-2"><AdminButton aria-label={t("moveOptionUp", { label: option.label })} disabled={index === 0} onClick={() => changeField({ options: move(selectedField.options, index, -1) })}>{t("up")}</AdminButton><AdminButton aria-label={t("moveOptionDown", { label: option.label })} disabled={index === selectedField.options.length - 1} onClick={() => changeField({ options: move(selectedField.options, index, 1) })}>{t("down")}</AdminButton><AdminButton variant="danger" onClick={() => changeField({ options: selectedField.options.filter(item => item.id !== option.id) })}>{t("remove")}</AdminButton></div>}</div>)}{sourceMode && <AdminButton disabled={selectedField.options.length >= 30} onClick={() => changeField({ options: [...selectedField.options, { id: crypto.randomUUID(), label: t("newOption") }] })}>{t("addOption")}</AdminButton>}</div>}
          {sourceMode && <>
            <FormFieldMoveControls key={`${selectedField.id}-${selectedLocation?.column.id}`} definition={definition} field={selectedField} onMove={(columnId, swap) => applyLayout(() => moveField(definition, selectedField.id, columnId, swap))} />
            <div className="border-t border-line pt-4"><AdminButton variant="danger" onClick={() => applyLayout(() => removeField(definition, selectedField.id), () => selectedLocation?.row.id ?? "form")}>{t("removeField")}</AdminButton></div>
          </>}
        </> : selectedRow ? <>
          {sourceMode ? <FormRowControls key={selectedRow.id} definition={definition} row={selectedRow}
            onColumns={count => applyLayout(() => setRowColumns(definition, selectedRow.id, count))}
            onStep={stepId => applyLayout(() => setRowStep(definition, selectedRow.id, stepId))}
            onMove={direction => applyLayout(() => moveRow(definition, selectedRow.id, direction))}
            onRemove={() => applyLayout(() => removeRow(definition, selectedRow.id), () => selectedRow.stepId)} /> : <p className="text-sm text-ink-soft">{t("rowSharedHint")}</p>}
        </> : selectedStep ? <>
          {textControl(`block:steps.${selectedStep.id}.title`, t("stepTitle"))}
          {sourceMode && <div className="flex flex-wrap gap-2"><AdminButton disabled={definition.steps.findIndex(step => step.id === selected) === 0} onClick={() => changeDefinition({ ...definition, steps: move(definition.steps, definition.steps.findIndex(step => step.id === selected), -1) })}>{t("up")}</AdminButton><AdminButton disabled={definition.steps.findIndex(step => step.id === selected) === definition.steps.length - 1} onClick={() => changeDefinition({ ...definition, steps: move(definition.steps, definition.steps.findIndex(step => step.id === selected), 1) })}>{t("down")}</AdminButton><AdminButton variant="danger" disabled={definition.steps.length === 1} onClick={() => applyLayout(() => removeStep(definition, selected), next => next.steps[0]!.id)}>{t("removeStep")}</AdminButton><p className="text-sm text-ink-soft">{t("removeStepHint")}</p></div>}
        </> : <>
          {sourceMode && <>
            <Field label={t("internalName")} htmlFor="form-name"><TextInput id="form-name" maxLength={150} value={name} onChange={event => { setName(event.target.value); setDirty(true); }} /></Field>
            <Field label={t("recipient")} htmlFor="form-recipient" hint={t("recipientHint")}><TextInput id="form-recipient" type="email" maxLength={254} value={recipient} onChange={event => { setRecipient(event.target.value); setDirty(true); }} /></Field>
            <Field label={t("replyTo")} htmlFor="reply-to"><Select id="reply-to" value={definition.replyToFieldId ?? ""} onChange={event => changeDefinition({ ...definition, replyToFieldId: event.target.value || null })}><option value="">{t("none")}</option>{definition.fields.filter(field => field.type === "email").map(field => <option key={field.id} value={field.id}>{field.label}</option>)}</Select></Field>
          </>}
          {(Object.keys(definition.copy) as (keyof FormCopy)[]).map(key => textControl(`block:copy.${key}`, t(`copy.${key}`), ["description", "successMessage", "errorMessage"].includes(key)))}
        </>}
      </aside>
    </fieldset>}
  </div>;
}
