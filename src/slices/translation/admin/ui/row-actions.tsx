"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { AdminButton, TextArea } from "@slices/backoffice/contract";
import type { CellStatus } from "../derive";
import { approveField, clearField, resetField, saveField } from "../actions";

/**
 * Per-cell review actions (S14) — one client island per (field × target-locale).
 * Edit reveals a textarea (seeded with the current value); Save persists through
 * `saveField` inside a transition, the action `revalidatePath`s so the server
 * screen re-renders. Approve/Reset/Clear are one-tap. Strings: `translation` ns.
 */
export function TranslationRowActions({
  type,
  id,
  field,
  locale,
  status,
  value,
}: {
  type: string;
  id: string;
  field: string;
  locale: string;
  status: CellStatus;
  value?: string;
}) {
  const t = useTranslations("translation");
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  const run = (fn: () => Promise<unknown>) => startTransition(async () => void (await fn()));

  if (editing) {
    return (
      <div className="w-full space-y-2 md:col-span-4">
        <TextArea
          value={draft}
          rows={3}
          disabled={pending}
          onChange={(e) => setDraft(e.target.value)}
          aria-label={t("actions.editLabel", { field })}
        />
        <div className="flex flex-wrap gap-2">
          <AdminButton
            variant="primary"
            disabled={pending}
            onClick={() =>
              run(async () => {
                await saveField(type, id, field, locale, draft);
                setEditing(false);
              })
            }
          >
            {t("actions.save")}
          </AdminButton>
          <AdminButton
            disabled={pending}
            onClick={() => {
              setDraft(value ?? "");
              setEditing(false);
            }}
          >
            {t("actions.cancel")}
          </AdminButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {(status === "needs_review" || status === "stale") ? (
        <AdminButton
          variant="primary"
          disabled={pending}
          onClick={() => run(() => approveField(type, id, field, locale))}
        >
          {t("actions.approve")}
        </AdminButton>
      ) : null}
      {status === "approved" ? (
        <AdminButton disabled={pending} onClick={() => run(() => resetField(type, id, field, locale))}>
          {t("actions.reset")}
        </AdminButton>
      ) : null}
      <AdminButton disabled={pending} onClick={() => { setDraft(value ?? ""); setEditing(true); }}>
        {status === "missing" ? t("actions.add") : t("actions.edit")}
      </AdminButton>
      {status !== "missing" ? (
        <AdminButton
          variant="danger"
          disabled={pending}
          onClick={() => run(() => clearField(type, id, field, locale))}
        >
          {t("actions.clear")}
        </AdminButton>
      ) : null}
    </div>
  );
}
