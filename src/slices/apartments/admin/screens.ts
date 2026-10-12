import type { AdminScreen } from "@slices/backoffice/contract";

/**
 * Backoffice screens contributed by slice `apartments` (S12 plug-in). Empty on
 * purpose: apartments are managed only inside their building
 * (`/admin/buildings/[id]/apartments`), so they have no menu entry of their own —
 * decision D4 of `docs/specs/building-detail-admin-editor.md`. Kept (rather than
 * removed) so the panel layout's composition does not change.
 */
export const apartmentsAdminScreens: AdminScreen[] = [];
