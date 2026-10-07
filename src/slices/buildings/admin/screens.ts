import type { AdminScreen } from "@slices/backoffice/contract";

/**
 * Backoffice screens contributed by slice `buildings` (S12 plug-in). Two list
 * screens under the `content` group: the buildings and the amenity taxonomy;
 * create/edit live at child routes (`/admin/buildings/new`, `/admin/buildings/[id]`,
 * `/admin/amenities/new`, `/admin/amenities/[id]`) that don't need their own nav
 * entry. Label keys resolve against the `backoffice` namespace.
 */
export const buildingsAdminScreens: AdminScreen[] = [
  { id: "buildings.list", href: "/admin/buildings", label: "nav.buildings", group: "content", order: 10 },
  {
    id: "buildings.amenities",
    href: "/admin/amenities",
    label: "nav.amenities",
    group: "content",
    order: 15,
  },
];
