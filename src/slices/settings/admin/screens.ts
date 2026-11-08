import type { AdminScreen } from "@slices/backoffice/contract";

/** Settings singleton editor; navigation is fixed in code (ADR0074). */
export const settingsAdminScreens: AdminScreen[] = [
  { id: "settings.globals", href: "/admin/settings", label: "nav.settings", group: "system", order: 10, roles: ["admin"] },
];
