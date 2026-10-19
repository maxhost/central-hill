"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AdminButton, AdminPageHeader, Field, TextInput, Select, StateBadge } from "@slices/backoffice/contract";
import { createForm, archiveForm } from "../server/actions";
import type { FormRecord, FormTemplate } from "../types";

export function FormCatalog({ forms }: { forms: FormRecord[] }) {
  const t = useTranslations("forms");
  const router = useRouter();
  const [name, setName] = useState("");
  const [template, setTemplate] = useState<FormTemplate>("contact");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <div className="space-y-6">
    <AdminPageHeader title={t("catalogTitle")} description={t("catalogDescription")} />
    <form className="grid items-end gap-4 rounded-lg border border-line bg-surface p-5 md:grid-cols-[1fr_1fr_auto]" onSubmit={async event => {
      event.preventDefault(); setBusy(true); setError("");
      try { const result = await createForm(template, name); if (result.ok) router.push(`/admin/forms/${result.data.id}`); else setError(result.error); }
      catch { setError(t("requestError")); }
      finally { setBusy(false); }
    }}>
      <Field label={t("internalName")} htmlFor="new-form-name"><TextInput id="new-form-name" required maxLength={150} value={name} onChange={event => setName(event.target.value)} /></Field>
      <Field label={t("template")} htmlFor="new-form-template"><Select id="new-form-template" value={template} onChange={event => setTemplate(event.target.value as FormTemplate)}>{(["contact", "newsletter", "owner-estimate"] as const).map(value => <option key={value} value={value}>{t(`templates.${value}`)}</option>)}</Select></Field>
      <AdminButton type="submit" variant="primary" disabled={busy}>{busy ? t("working") : t("create")}</AdminButton>
    </form>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {!forms.length ? <div className="border-y border-line py-12"><h2 className="font-serif text-xl">{t("emptyTitle")}</h2><p className="mt-2 text-sm text-ink-soft">{t("emptyHint")}</p></div> : <ul className="divide-y divide-line border-y border-line">{forms.map(form => <li key={form.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
      <div className="min-w-0"><Link className="break-words font-semibold text-ink underline-offset-4 hover:underline" href={`/admin/forms/${form.id}`}>{form.name}</Link><p className="mt-1 text-sm text-ink-soft">{t(`templates.${form.template}`)} · {form.recipient || t("recipientMissing")}</p></div>
      <div className="flex flex-wrap items-center gap-3"><StateBadge label={t(form.status)} /><Link href={`/admin/forms/${form.id}`} className="text-sm font-medium text-accent-deep underline underline-offset-4">{t("edit")}</Link><AdminButton disabled={busy} onClick={async () => {
        setBusy(true); setError(""); try { const result = await archiveForm(form.id, form.revision, form.status !== "archived"); if (result.ok) router.refresh(); else setError(result.error); } catch { setError(t("requestError")); } finally { setBusy(false); }
      }}>{t(form.status === "archived" ? "restore" : "archive")}</AdminButton></div>
    </li>)}</ul>}
    <p className="max-w-3xl text-sm leading-relaxed text-ink-soft">{t("placementLater")}</p>
  </div>;
}
