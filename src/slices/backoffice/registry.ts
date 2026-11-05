import type { StaffRole } from "@core/auth";
import type { AdminNavGroup, AdminNavGroupId, AdminScreen } from "./types";

/**
 * The admin-screen registry — the "plug-in" framework for the backoffice shell.
 *
 * Built-in screens own by the shell live in {@link CORE_ADMIN_SCREENS}. Feature
 * slices contribute their own `AdminScreen[]` from their `contract.ts`; the app
 * composition layer (`app/(admin)/admin/(panel)/layout.tsx`) merges them in via
 * {@link composeAdminNav}. Composition is explicit (the app passes the list)
 * rather than module-level mutation, so the sidebar is deterministic under RSC.
 */

/** Screens provided by the shell itself. */
export const CORE_ADMIN_SCREENS: AdminScreen[] = [
  { id: "overview.dashboard", href: "/admin", label: "nav.dashboard", group: "overview", order: 0 },
];

/** Render order of the sidebar groups. */
const GROUP_ORDER: AdminNavGroupId[] = ["overview", "website", "content", "crm", "translation", "system"];

/**
 * Merge the core screens with any slice-contributed `extra` screens, filter by
 * the viewer's `role`, group + sort them, and drop empty groups. The result is
 * ready to hand to `<AdminShell nav=…>`.
 */
export function composeAdminNav(extra: AdminScreen[] = [], role?: StaffRole): AdminNavGroup[] {
  const visible = [...CORE_ADMIN_SCREENS, ...extra].filter(
    (s) => !s.roles || (role !== undefined && s.roles.includes(role)),
  );

  return GROUP_ORDER.map<AdminNavGroup>((id) => {
    const screens = visible
      .filter((s) => s.group === id)
      .sort((a, b) => (a.order ?? 100) - (b.order ?? 100) || a.id.localeCompare(b.id));
    // Only nest beneath a visible top-level parent. Missing/filtered parents
    // leave their permitted children accessible as top-level links.
    const parentIds = new Set(screens.filter((s) => !s.parentId).map((s) => s.id));
    const isChild = (s: AdminScreen) => s.parentId !== undefined && parentIds.has(s.parentId);
    return {
      id,
      items: screens.filter((s) => !isChild(s)).map((screen) => {
        const children = screens.filter((s) => isChild(s) && s.parentId === screen.id);
        return children.length ? { ...screen, children } : screen;
      }),
    };
  }).filter((g) => g.items.length > 0);
}
