"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@core/ui";

/**
 * Tab strip of the building workspace (spec building-detail-admin-editor, S1).
 * Client island for active state only: "Building" is active on the exact
 * `/admin/buildings/[id]`, "Apartments" on `/apartments` and anything below it.
 * Labels arrive already localized from {@link BuildingWorkspaceHeader}.
 */
export function BuildingWorkspaceTabs({
  buildingId,
  buildingLabel,
  apartmentsLabel,
  ariaLabel,
}: {
  buildingId: string;
  buildingLabel: string;
  apartmentsLabel: string;
  ariaLabel: string;
}) {
  const pathname = usePathname();
  const base = `/admin/buildings/${buildingId}`;
  const apartmentsHref = `${base}/apartments`;
  const tabs = [
    { href: base, label: buildingLabel, active: pathname === base },
    {
      href: apartmentsHref,
      label: apartmentsLabel,
      active: pathname === apartmentsHref || pathname.startsWith(`${apartmentsHref}/`),
    },
  ];

  return (
    <nav aria-label={ariaLabel} className="-mb-px flex gap-6">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.active ? "page" : undefined}
          className={cn(
            "border-b-2 pb-3 text-sm transition-colors",
            tab.active
              ? "border-accent font-medium text-accent-deep"
              : "border-transparent text-ink-soft hover:border-line hover:text-ink",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
