"use client";
import { useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@core/ui";

interface FilterCategory {
  slug: string;
  name: string;
}

interface FilterItem {
  id: string;
  /** category slug used to filter. */
  category: string;
  node: ReactNode;
}

const ALL = "__all";

/**
 * Service category filter (mirrors the design-system tab pattern). Cards are
 * server-rendered and passed in as `items`; filtering is purely client-side over
 * already-rendered nodes — no request-time DB, stays static + fast.
 */
export function ServiceFilter({
  categories,
  items,
  allLabel,
}: {
  categories: FilterCategory[];
  items: FilterItem[];
  allLabel: string;
}) {
  const [active, setActive] = useState<string>(ALL);
  const shown = active === ALL ? items : items.filter((i) => i.category === active);

  return (
    <div>
      <div role="tablist" className="flex flex-wrap gap-2 border-b border-line pb-4">
        <TabButton active={active === ALL} onClick={() => setActive(ALL)}>
          {allLabel}
        </TabButton>
        {categories.map((c) => (
          <TabButton key={c.slug} active={active === c.slug} onClick={() => setActive(c.slug)}>
            {c.name}
          </TabButton>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((i) => (
          <div key={i.id}>{i.node}</div>
        ))}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
        active ? "bg-ink text-bg" : "text-ink-soft hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
