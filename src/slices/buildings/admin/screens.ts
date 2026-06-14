import type { AdminScreen } from "@slices/backoffice/contract";

/**
 * Backoffice screens contributed by slice `buildings` (S12 plug-in). One list
 * screen under the `content` group; create/edit live at child routes
 * (`/admin/buildings/new`, `/admin/buildings/[id]`) that don't need their own nav
 * entry. Label key resolves against the `backoffice` namespace.
 */
export const buildingsAdminScreens: AdminScreen[] = [
  { id: "buildings.list", href: "/admin/buildings", label: "nav.buildings", group: "content", order: 10 },
];
