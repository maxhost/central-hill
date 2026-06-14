import type { AdminScreen } from "@slices/backoffice/contract";

/**
 * Backoffice screens contributed by slice `geography` (S12 plug-in). One list
 * screen ("Cities") in the `content` group; the city editor (with inline
 * neighbourhoods) lives at child routes (`/admin/cities/new`, `/admin/cities/[id]`).
 * Label key resolves against the `backoffice` namespace.
 */
export const geographyAdminScreens: AdminScreen[] = [
  { id: "geography.cities", href: "/admin/cities", label: "nav.cities", group: "content", order: 50 },
];
