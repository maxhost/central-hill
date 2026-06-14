import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import type { StaffContext } from "@core/auth";
import type { AdminNavGroup } from "../types";
import { AdminNav } from "./admin-nav";
import { SignOutButton } from "./sign-out-button";

/**
 * The authenticated backoffice chrome: fixed sidebar (brand + nav) and a topbar
 * (signed-in identity + sign-out), wrapping each screen's content. Server
 * component — the gate (`requireStaff`) runs in the route layout that renders it,
 * so by the time `AdminShell` renders, `staff` is trusted.
 */
export async function AdminShell({
  staff,
  nav,
  children,
}: {
  staff: StaffContext;
  nav: AdminNavGroup[];
  children: ReactNode;
}) {
  const t = await getTranslations("backoffice");

  return (
    <div className="flex min-h-screen bg-bg text-ink">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-surface px-4 py-6 md:flex">
        <div className="px-3 pb-6">
          <span className="font-serif text-lg text-ink">Central Hill</span>
          <span className="mt-0.5 block text-xs uppercase tracking-wide text-ink-soft/70">
            Backoffice
          </span>
        </div>
        <AdminNav groups={nav} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line bg-surface px-6 py-3">
          <div className="text-sm text-ink-soft">
            <span>{t("shell.signedInAs")} </span>
            <span className="font-medium text-ink">{staff.name}</span>
            <span className="ml-2 text-ink-soft/70">
              · {t(`shell.roles.${staff.role}`)}
            </span>
          </div>
          <SignOutButton />
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
