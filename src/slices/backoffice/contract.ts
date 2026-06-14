/**
 * Public contract of the `backoffice` slice (S12) — the admin shell + the
 * plug-in framework that every other slice's `admin/` composes against.
 *
 * What others use:
 *  - **Types + registry** to contribute screens to the sidebar: declare an
 *    `AdminScreen[]` in your slice's `contract.ts`; the app panel layout passes
 *    them to {@link composeAdminNav}. Nav labels resolve against the `backoffice`
 *    i18n namespace (add your key there, or escalate for a namespaced label).
 *  - **Shell components** (`AdminShell`, `Dashboard`, `LoginForm`) wired by the
 *    `app/(admin)` route group.
 *  - **Admin primitives** (`DataTable`, `AdminPageHeader`, …) to build screens.
 *
 * The slice owns **no DB tables** (the auth tables belong to `core/auth`; each
 * feature slice reads its own data), so there is no migration.
 */

export type { AdminScreen, AdminNavGroup, AdminNavGroupId } from "./types";
export type { StaffRole, StaffContext } from "@core/auth";

export { composeAdminNav, CORE_ADMIN_SCREENS } from "./registry";

export { AdminShell } from "./ui/admin-shell";
export { Dashboard } from "./ui/dashboard";
export { LoginForm } from "./ui/login-form";

export {
  AdminPageHeader,
  AdminCard,
  EmptyState,
  StateBadge,
  DataTable,
  TranslationFieldRow,
} from "./ui/primitives";
export type { Column } from "./ui/primitives";
