import type { AdminScreen } from "@slices/backoffice/contract";

/**
 * Backoffice screens contributed by slice `services` (S12 plug-in). Two `content`-group
 * screens: the category manager and the service list; create/edit for both live at
 * child routes. Label keys resolve against the `backoffice` namespace.
 */
export const servicesAdminScreens: AdminScreen[] = [
  {
    id: "services.categories",
    href: "/admin/service-categories",
    label: "nav.serviceCategories",
    group: "content",
    order: 60,
  },
  { id: "services.list", href: "/admin/services", label: "nav.services", group: "content", order: 65 },
];
