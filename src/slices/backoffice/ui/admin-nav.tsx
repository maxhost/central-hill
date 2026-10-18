"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn, UiIcon } from "@core/ui";
import type { AdminNavGroup } from "../types";

/**
 * Sidebar navigation for the backoffice shell. Client island for active-link
 * state only (`usePathname` — admin routes are NOT locale-prefixed, so this uses
 * plain `next/link`/`next/navigation`, not the i18n helpers). Labels + group
 * headings resolve against the `backoffice` i18n namespace.
 */
export function AdminNav({ groups }: { groups: AdminNavGroup[] }) {
  const t = useTranslations("backoffice");
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));

  return (
    <nav className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.id}>
          <h3 className="px-3 text-xs font-semibold uppercase tracking-wide text-ink-soft/70">
            {t(`nav.groups.${group.id}`)}
          </h3>
          <ul className="mt-2 space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(item.href);
              const childActive = item.children?.some((child) => isActive(child.href));
              const showChildren = active || childActive;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                      active
                        ? "bg-accent/10 font-medium text-accent-deep"
                        : childActive ? "font-medium text-ink"
                        : "text-ink hover:bg-bg/60",
                    )}
                  >
                    {t(item.label)}
                    {item.children && item.children.length > 0 && (
                      <UiIcon
                        name={showChildren ? "nav-arrow-down" : "nav-arrow-right"}
                        size={16}
                        className="shrink-0"
                      />
                    )}
                  </Link>
                  {showChildren && item.children && (
                    <ul className="ml-3 mt-0.5 space-y-0.5 border-l border-line pl-2">
                      {item.children.map((child) => {
                        const active = isActive(child.href);
                        return (
                          <li key={child.id}>
                            <Link
                              href={child.href}
                              aria-current={active ? "page" : undefined}
                              className={cn(
                                "block rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                                active ? "bg-accent/10 font-medium text-accent-deep" : "text-ink hover:bg-bg/60",
                              )}
                            >
                              {t(child.label)}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
