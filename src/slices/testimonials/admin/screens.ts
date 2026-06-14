import type { AdminScreen } from "@slices/backoffice/contract";

/**
 * Backoffice screens contributed by slice `testimonials` (S12 plug-in). One list
 * screen in the `content` group, after the catalog; create/edit live at child
 * routes (`/admin/testimonials/new`, `/admin/testimonials/[id]`). Label key
 * resolves against the `backoffice` namespace.
 */
export const testimonialsAdminScreens: AdminScreen[] = [
  { id: "testimonials.list", href: "/admin/testimonials", label: "nav.testimonials", group: "content", order: 30 },
];
