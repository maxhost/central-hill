"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@core/ui";
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
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

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
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-md px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-accent/10 font-medium text-accent-deep"
                        : "text-ink hover:bg-bg/60",
                    )}
                  >
                    {t(item.label)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
