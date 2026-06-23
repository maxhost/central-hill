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

/**
 * Shared admin **form** primitives (S12) — presentational controls slices compose
 * inside their own client form islands. See `ui/form.tsx`.
 */
export {
  Field,
  TextInput,
  TextArea,
  Select,
  Checkbox,
  AdminButton,
  FieldGrid,
  FormActions,
  controlClass,
} from "./ui/form";

/**
 * Media picker islands + their gated upload actions (S12 + ADR 0018). The media
 * admin UI lives here per ADR 0018; consuming slices import the fields and pass
 * resolved previews via {@link resolveMediaPreviews} from their server screens.
 */
export { MediaField, MediaGalleryField } from "./ui/media-field";
export {
  presignAdminUpload,
  finalizeAdminUpload,
  resolveMediaPreviews,
} from "./server/media-actions";
export type { AdminMediaPreview } from "./server/media-actions";

/**
 * Agnostic toast system (S12). Mount `ToastProvider` once in the admin root layout;
 * any admin client component calls `useToast()` to fire any message with any variant
 * (success / error / info / warning). Not coupled to CRUD — see `ui/toast.tsx`.
 */
export { ToastProvider, useToast } from "./ui/toast";
export type { ToastApi, ToastVariant, ToastOptions } from "./ui/toast";
