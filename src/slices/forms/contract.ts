/** Forms owns reusable definitions and staff-only tests. Placement/public submission are a later arc. */
import type { AdminScreen } from "@slices/backoffice/contract";
export type * from "./types";
export { createBlueprint, textFields, localizedBlueprint, approvedBlueprint } from "./domain";
export const formsAdminScreens: AdminScreen[] = [{ id: "forms.catalog", href: "/admin/forms", label: "nav.forms", group: "content", order: 85 }];

export { FormCatalog } from "./admin/form-catalog";
export { FormEditor } from "./admin/form-editor";
export { listForms, getFormEditor } from "./server/queries";
