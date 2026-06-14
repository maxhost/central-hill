"use client";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import type { LeadStatus } from "../queries";
import { setLeadStatus } from "../actions";

/**
 * Inline status switcher for a lead (S12). Client island: changing the select
 * calls the `setLeadStatus` server action inside a transition; the action
 * `revalidatePath`s so the server screens re-render with the new value. Labels
 * come from the `leads` namespace (shared with the inbox filter chips).
 */
const STATUSES: LeadStatus[] = ["new", "in_progress", "closed"];

export function StatusControl({ id, current }: { id: string; current: LeadStatus }) {
  const t = useTranslations("leads");
  const [pending, startTransition] = useTransition();

  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="text-ink-soft">{t("admin.detail.status")}</span>
      <select
        value={current}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          startTransition(async () => {
            await setLeadStatus(id, next);
          });
        }}
        className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm text-ink disabled:opacity-60"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {t(`admin.status.${s}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
