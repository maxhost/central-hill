import type { AdminScreen } from "@slices/backoffice/contract";

/**
 * Backoffice screens contributed by slice `faq` (S12 plug-in). One list screen in
 * the `content` group; the group editor (with inline items) lives at child routes
 * (`/admin/faq/new`, `/admin/faq/[id]`). Label key resolves against the
 * `backoffice` namespace.
 */
export const faqAdminScreens: AdminScreen[] = [
  { id: "faq.list", href: "/admin/faq", label: "nav.faq", group: "content", order: 40 },
];
