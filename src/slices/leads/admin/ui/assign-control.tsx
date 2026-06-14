"use client";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { assignLeadToMe, unassignLead } from "../actions";

/**
 * Assignment control for a lead (S12). Pragmatic claim/release model: a staff
 * member assigns a lead to themselves or releases it — no staff directory lookup
 * (that would cross into `core/auth` user data). `mine` is computed server-side
 * (assigned_to === current user) and drives which action the button fires.
 */
export function AssignControl({ id, mine }: { id: string; mine: boolean }) {
  const t = useTranslations("leads");
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await (mine ? unassignLead(id) : assignLeadToMe(id));
        });
      }}
      className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-ink disabled:opacity-60"
    >
      {mine ? t("admin.detail.unassign") : t("admin.detail.assignToMe")}
    </button>
  );
}
