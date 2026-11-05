import type { AdminScreen } from "@slices/backoffice/contract";
export const guidesAdminScreens: AdminScreen[] = [
  { id: "guides.list", href: "/admin/guides", label: "nav.guides", group: "website", order: 30, roles: ["admin", "editor"] },
];
