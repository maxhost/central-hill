import type { ReactNode } from "react";
import { requireStaff } from "@core/auth";
import { AdminShell, composeAdminNav } from "@slices/backoffice/contract";
import { buildingsAdminScreens } from "@slices/buildings/contract";
import { leadsAdminScreens } from "@slices/leads/contract";

/**
 * Gated backoffice shell. `requireStaff()` redirects to `/admin/login` when
 * there is no staff session, so everything under `(panel)` is protected (the
 * login/forbidden screens sit outside this group). The sidebar is composed from
 * the core screens plus each slice's contributed `AdminScreen[]` (leads inbox so
 * far); more get spread into `composeAdminNav` here as they land.
 */
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const staff = await requireStaff();
  const nav = composeAdminNav([...buildingsAdminScreens, ...leadsAdminScreens], staff.role);
  return (
    <AdminShell staff={staff} nav={nav}>
      {children}
    </AdminShell>
  );
}
