"use client";
import { useEffect, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { AdminButton } from "@slices/backoffice/contract";
import type { HeaderFormOption } from "@slices/forms/contract";
import { listServiceEnquiryForms } from "../enquiry-form-actions";

export function ServiceEnquirySelector({ value, onChange, readOnly, onEnglish, error, disabled }: {
  value: string | null | undefined; onChange(value: string | null): void;
  readOnly: boolean; onEnglish(): void; error?: string; disabled: boolean;
}) {
  const t = useTranslations("services.admin.enquiryForm");
  const id = useId();
  const [options, setOptions] = useState<HeaderFormOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  async function refresh() {
    setLoading(true); setFailed(false);
    try { setOptions(await listServiceEnquiryForms()); } catch { setFailed(true); }
    finally { setLoading(false); }
  }
  useEffect(() => { let active = true; listServiceEnquiryForms().then(rows => { if (active) setOptions(rows); }).catch(() => { if (active) setFailed(true); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  const selected = options.find(option => option.id.toLowerCase() === value?.toLowerCase());
  const unavailable = !!value && !loading && !failed && (!selected || !selected.available);
  return <div className="space-y-2" data-service-enquiry-selector>
    <label className="block text-sm font-medium text-ink" htmlFor={id}>{t("label")}</label>
    <select id={id} data-service-path="enquiry_form_id" value={selected?.id ?? value ?? ""} disabled={disabled || readOnly || loading} aria-describedby={`${id}-help${error || unavailable ? ` ${id}-error` : ""}`} aria-invalid={!!error || unavailable}
      className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60"
      onChange={event => onChange(event.target.value || null)}>
      <option value="">{t("original")}</option>
      {value && !selected ? <option value={value}>{t(loading ? "loadingSelection" : "missing")}</option> : null}
      {options.map(option => <option key={option.id} value={option.id} disabled={!option.available}>{option.name}{!option.available ? ` · ${t(`reason.${option.reason ?? "definition"}`)}` : ""}</option>)}
    </select>
    <p id={`${id}-help`} className="text-xs leading-relaxed text-ink-soft">{t("help")}</p>
    {readOnly ? <p className="text-xs text-ink-soft">{t("shared")} <button type="button" className="underline underline-offset-2" onClick={onEnglish} disabled={disabled}>{t("editEnglish")}</button></p> : null}
    {error || unavailable ? <p id={`${id}-error`} role="alert" className="text-sm text-ink">{error ? t("invalid") : t("unavailable")}</p> : null}
    {failed ? <p role="alert" className="text-sm text-ink">{t("loadError")}</p> : null}
    {!loading && !failed && !options.some(option => option.available) ? <p className="text-xs text-ink-soft">{t("empty")}</p> : null}
    <div className="flex flex-wrap items-center gap-3 text-xs text-ink">
      <a href="/admin/forms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{t("create")}</a>
      {value ? <a href={`/admin/forms/${encodeURIComponent(value)}`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{t("edit")}</a> : null}
      <AdminButton disabled={loading || disabled} onClick={() => void refresh()}>{t(loading ? "loading" : "refresh")}</AdminButton>
    </div>
  </div>;
}
