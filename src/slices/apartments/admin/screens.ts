import type { AdminScreen } from "@slices/backoffice/contract";

/**
 * Backoffice screens contributed by slice `apartments` (S12 plug-in). One list
 * screen in the `content` group, after buildings; create/edit live at child routes.
 */
export const apartmentsAdminScreens: AdminScreen[] = [
  { id: "apartments.list", href: "/admin/apartments", label: "nav.apartments", group: "content", order: 20 },
];
