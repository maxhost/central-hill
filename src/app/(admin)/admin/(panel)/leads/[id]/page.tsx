import { requireStaff } from "@core/auth";
import { LeadDetail } from "@slices/leads/admin/ui/lead-detail";

/**
 * Lead detail / audit route (`/admin/leads/[id]`). Gated by `(panel)`; passes the
 * staff member's id so the detail screen can show whether the lead is assigned to
 * them. The screen `notFound()`s on a missing/invalid id.
 */
export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff();
  const { id } = await params;
  return <LeadDetail id={id} currentUserId={staff.userId} />;
}
