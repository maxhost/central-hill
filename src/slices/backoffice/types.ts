import type { StaffRole } from "@core/auth";

/**
 * Shared types for the backoffice shell (kept separate from `contract.ts` to
 * avoid an import cycle between the contract and the registry). Type-only — no
 * runtime, no `server-only` — so it is safe to import from client components
 * and from the unit tests.
 */

/** Sidebar groups, rendered top-to-bottom in this order. */
export type AdminNavGroupId = "overview" | "content" | "crm" | "translation" | "system";

/**
 * One backoffice screen contributed to the admin shell. Core screens live in
 * `registry.ts`; feature slices contribute their own through their `contract.ts`
 * and the app composes them via {@link composeAdminNav}.
 */
export interface AdminScreen {
  /** Stable, slice-scoped id, e.g. `"leads.inbox"`. */
  id: string;
  /** Absolute path under `/admin`, e.g. `"/admin/leads"`. */
  href: string;
  /** i18n key resolved by the nav renderer against the `backoffice` namespace. */
  label: string;
  /** Sidebar group this screen belongs to. */
  group: AdminNavGroupId;
  /** Sort order within the group (ascending; defaults to 100). */
  order?: number;
  /** Roles allowed to see the screen; omitted ⇒ visible to any staff member. */
  roles?: StaffRole[];
}

/** A non-empty sidebar group of screens, ready to render. */
export interface AdminNavGroup {
  id: AdminNavGroupId;
  items: AdminScreen[];
}
