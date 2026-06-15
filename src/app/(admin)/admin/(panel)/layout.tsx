import type { ReactNode } from "react";
import { requireStaff } from "@core/auth";
import { AdminShell, composeAdminNav } from "@slices/backoffice/contract";
import { apartmentsAdminScreens } from "@slices/apartments/contract";
import { blogAdminScreens } from "@slices/blog/contract";
import { buildingsAdminScreens } from "@slices/buildings/contract";
import { faqAdminScreens } from "@slices/faq/contract";
import { geographyAdminScreens } from "@slices/geography/contract";
import { leadsAdminScreens } from "@slices/leads/contract";
import { pagesAdminScreens } from "@slices/pages/contract";
import { servicesAdminScreens } from "@slices/services/contract";
import { settingsAdminScreens } from "@slices/settings/contract";
import { testimonialsAdminScreens } from "@slices/testimonials/contract";
import { translationAdminScreens } from "@slices/translation/contract";

/**
 * Gated backoffice shell. `requireStaff()` redirects to `/admin/login` when
 * there is no staff session, so everything under `(panel)` is protected (the
 * login/forbidden screens sit outside this group). The sidebar is composed from
 * the core screens plus each slice's contributed `AdminScreen[]` (leads inbox so
 * far); more get spread into `composeAdminNav` here as they land.
 */
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const staff = await requireStaff();
  const nav = composeAdminNav(
    [
      ...pagesAdminScreens,
      ...buildingsAdminScreens,
      ...apartmentsAdminScreens,
      ...testimonialsAdminScreens,
      ...faqAdminScreens,
      ...geographyAdminScreens,
      ...servicesAdminScreens,
      ...blogAdminScreens,
      ...leadsAdminScreens,
      ...translationAdminScreens,
      ...settingsAdminScreens,
    ],
    staff.role,
  );
  return (
    <AdminShell staff={staff} nav={nav}>
      {children}
    </AdminShell>
  );
}
