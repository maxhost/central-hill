"use client";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@core/ui";

interface FilterPlace {
  id: string;
  name: string;
}
interface FilterNeighbourhood extends FilterPlace {
  cityId: string;
}
interface FilterItem {
  id: string;
  cityId: string;
  neighbourhoodId: string | null;
  node: ReactNode;
}

const ALL = "__all";

/**
 * Two-level catalog filter (content-briefs.md → Buildings: city + neighbourhood
 * tabs). Cards are server-rendered and passed as `items`; filtering is purely
 * client-side over already-rendered nodes — no request-time DB, stays static + fast
 * (mirrors the blog `CategoryTabs` pattern). Selecting a city scopes the
 * neighbourhood row to that city and resets the neighbourhood selection.
 */
export function BuildingFilter({
  cities,
  neighbourhoods,
  items,
  allLabel,
  countLabel,
}: {
  cities: FilterPlace[];
  neighbourhoods: FilterNeighbourhood[];
  items: FilterItem[];
  allLabel: string;
  /** `(n) => "14 Buildings"` — localized count line. */
  countLabel: (n: number) => string;
}) {
  const [city, setCity] = useState<string>(ALL);
  const [neighbourhood, setNeighbourhood] = useState<string>(ALL);

  const visibleNeighbourhoods = useMemo(
    () => (city === ALL ? neighbourhoods : neighbourhoods.filter((n) => n.cityId === city)),
    [city, neighbourhoods],
  );

  const shown = useMemo(
    () =>
      items.filter(
        (i) =>
          (city === ALL || i.cityId === city) &&
          (neighbourhood === ALL || i.neighbourhoodId === neighbourhood),
      ),
    [items, city, neighbourhood],
  );

  function selectCity(next: string) {
    setCity(next);
    setNeighbourhood(ALL);
  }

  return (
    <div>
      {cities.length > 1 ? (
        <div role="tablist" className="flex flex-wrap gap-2">
          <Tab active={city === ALL} onClick={() => selectCity(ALL)}>
            {allLabel}
          </Tab>
          {cities.map((c) => (
            <Tab key={c.id} active={city === c.id} onClick={() => selectCity(c.id)}>
              {c.name}
            </Tab>
          ))}
        </div>
      ) : null}

      {visibleNeighbourhoods.length ? (
        <div role="tablist" className="mt-3 flex flex-wrap gap-2">
          <Tab subtle active={neighbourhood === ALL} onClick={() => setNeighbourhood(ALL)}>
            {allLabel}
          </Tab>
          {visibleNeighbourhoods.map((n) => (
            <Tab
              key={n.id}
              subtle
              active={neighbourhood === n.id}
              onClick={() => setNeighbourhood(n.id)}
            >
              {n.name}
            </Tab>
          ))}
        </div>
      ) : null}

      <p className="mt-8 border-b border-line pb-4 text-sm text-ink-soft">
        {countLabel(shown.length)}
      </p>

      <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((i) => (
          <div key={i.id}>{i.node}</div>
        ))}
      </div>
    </div>
  );
}

function Tab({
  active,
  subtle,
  onClick,
  children,
}: {
  active: boolean;
  subtle?: boolean;
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
        "inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors",
        subtle ? "text-xs uppercase tracking-[0.08em]" : "",
        active ? "bg-ink text-bg" : "text-ink-soft hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
