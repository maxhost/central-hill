"use client";

import { useId, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { UiIcon } from "@core/ui";

interface AdminWorkspaceProps {
  sidebar: ReactNode;
  identity: ReactNode;
  actions: ReactNode;
  children: ReactNode;
}

/** A new route starts with its default layout; toggling keeps editor children mounted. */
export function AdminWorkspace(props: AdminWorkspaceProps) {
  const pathname = usePathname();
  const workspaceKey = /^\/admin\/posts\/[^/]+\/?$/.test(pathname) ? "blog-post-editor" : pathname;
  return <AdminWorkspaceLayout key={workspaceKey} isPageEditor={/^\/admin\/pages\/[^/]+\/?$/.test(pathname) || pathname === "/admin/pages/blog/article-sidebar" || /^\/admin\/posts\/[^/]+\/?$/.test(pathname)} {...props} />;
}

function AdminWorkspaceLayout({
  sidebar,
  identity,
  actions,
  children,
  isPageEditor,
}: AdminWorkspaceProps & { isPageEditor: boolean }) {
  const t = useTranslations("backoffice.shell");
  const sidebarId = useId();
  // Each page editor starts focused on its canvas. Other admin routes keep the
  // normal sidebar; a manual choice lasts while working on the current route.
  const [sidebarOpen, setSidebarOpen] = useState(!isPageEditor);
  const toggleLabel = t(sidebarOpen ? "hideSidebar" : "showSidebar");

  return (
    <div className="flex min-h-screen bg-bg text-ink">
      <aside
        id={sidebarId}
        className={`hidden w-64 shrink-0 flex-col border-r border-line bg-surface px-4 py-6 ${sidebarOpen ? "md:flex" : ""}`}
      >
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-line bg-surface px-6 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label={toggleLabel}
              title={toggleLabel}
              aria-expanded={sidebarOpen}
              aria-controls={sidebarId}
              onClick={() => setSidebarOpen((open) => !open)}
              className="hidden size-11 shrink-0 cursor-pointer items-center justify-center rounded-md border border-line text-ink transition-colors hover:bg-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:inline-flex"
            >
              <UiIcon name={sidebarOpen ? "nav-arrow-left" : "menu"} size={20} />
            </button>
            {identity}
          </div>
          {actions}
        </header>

        <main className={`mx-auto w-full min-w-0 flex-1 px-6 py-8 ${isPageEditor ? "max-w-none" : "max-w-6xl"}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
