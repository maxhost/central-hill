/** Forms owns reusable definitions (including dates and email attachments) and staff-only tests.
 * Placement/public submission are a later arc; file bytes are never public assets. */
import type { AdminScreen } from "@slices/backoffice/contract";
export type * from "./types";
export { createBlueprint, textFields, localizedBlueprint, approvedBlueprint } from "./domain";
export { normalizeBlueprint, orderedFields, rowsForStep, fieldLocation } from "./layout";
export const formsAdminScreens: AdminScreen[] = [{ id: "forms.catalog", href: "/admin/forms", label: "nav.forms", group: "content", order: 30 }];

export { FormCatalog } from "./admin/form-catalog";
export { FormEditor } from "./admin/form-editor";
export { listForms, getFormEditor } from "./server/queries";

export * from "./public-types";
export { PublicContactForm } from "./ui/public-contact-form";
