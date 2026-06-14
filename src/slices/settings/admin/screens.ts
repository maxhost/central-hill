import type { AdminScreen } from "@slices/backoffice/contract";

/**
 * Backoffice screens contributed by slice `settings` (S12 plug-in). Two `system`-group
 * editors, **admin-only**: the company-globals singleton and the navigation builder.
 * Both are single-screen editors (no list / child routes). Label keys resolve against
 * the `backoffice` namespace.
 */
export const settingsAdminScreens: AdminScreen[] = [
  { id: "settings.globals", href: "/admin/settings", label: "nav.settings", group: "system", order: 10, roles: ["admin"] },
  { id: "settings.nav", href: "/admin/navigation", label: "nav.navigation", group: "system", order: 20, roles: ["admin"] },
];
