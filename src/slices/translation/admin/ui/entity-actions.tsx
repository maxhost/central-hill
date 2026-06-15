"use client";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { AdminButton } from "@slices/backoffice/contract";
import { approveEntity, generateEntityDrafts } from "../actions";

/**
 * Entity-level review actions (S14) — the header bar on the per-entity review
 * screen. "Generate" fills missing/stale target drafts through the provider seam;
 * "Generate (all)" re-drafts every cell; "Approve all" approves every existing
 * target row. Each runs in a transition; the action `revalidatePath`s so the
 * screen re-renders. Strings: `translation` namespace.
 */
export function EntityActions({ type, id }: { type: string; id: string }) {
  const t = useTranslations("translation");
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<unknown>) => startTransition(async () => void (await fn()));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <AdminButton disabled={pending} onClick={() => run(() => generateEntityDrafts(type, id, false))}>
        {t("actions.generate")}
      </AdminButton>
      <AdminButton disabled={pending} onClick={() => run(() => generateEntityDrafts(type, id, true))}>
        {t("actions.generateAll")}
      </AdminButton>
      <AdminButton variant="primary" disabled={pending} onClick={() => run(() => approveEntity(type, id))}>
        {t("actions.approveAll")}
      </AdminButton>
    </div>
  );
}
