import { requireStaff } from "@core/auth";
import { LeadsInbox } from "@slices/leads/admin/ui/inbox";
import type { LeadListFilters } from "@slices/leads/admin/queries";
import { leadKind, leadStatus } from "@slices/leads/contract";

/**
 * Leads inbox route (`/admin/leads`). Inside the gated `(panel)` group, but the
 * action/query layer re-gates too. Status/kind come from the URL and are parsed
 * against the leads enums (unknown values are ignored → unfiltered).
 */
export default async function LeadsInboxPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaff();
  const sp = await searchParams;

  const filters: LeadListFilters = {};
  const status = leadStatus.safeParse(sp.status);
  if (status.success) filters.status = status.data;
  const kind = leadKind.safeParse(sp.kind);
  if (kind.success) filters.kind = kind.data;

  return <LeadsInbox filters={filters} />;
}
