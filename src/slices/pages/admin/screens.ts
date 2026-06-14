import type { AdminScreen } from "@slices/backoffice/contract";

/**
 * Backoffice screens contributed by slice `pages` (S12 plug-in). One list screen
 * at the top of the `content` group; each page's editor is a child route
 * (`/admin/pages/[key]`).
 */
export const pagesAdminScreens: AdminScreen[] = [
  { id: "pages.list", href: "/admin/pages", label: "nav.pages", group: "content", order: 0 },
];
