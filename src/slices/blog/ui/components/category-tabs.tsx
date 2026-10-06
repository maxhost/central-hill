"use client";
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { ChipBar, buttonClassName, type ChipBarItem } from "@core/ui";
// Shared with `CategoryTag` (a server component), so it lives outside this client module.
import { safeSwatch } from "./category-color";
import { ALL_CATEGORIES as ALL, hasMoreItems, isFilterItemHidden } from "./category-filter-logic";

/** The slice of `CategoryRef` the tabs need (serialisable across the RSC boundary). */
export interface TabCategory {
  /** Language-neutral slug — the filter key cards are matched against. */
  slug: string;
  /** Localised display name. */
  name: string;
  /** Admin-entered category colour; used for the swatch only if it is a plain `#hex`. */
  color: string;
}

interface FilterState {
  active: string;
  setActive: (key: string) => void;
  /** Cards visible on "All" (the "Load more" window); `undefined` = no paging. */
  limit: number | undefined;
  showMore: () => void;
}

const CategoryFilterContext = createContext<FilterState | null>(null);

/**
 * Client-side category filter (+ optional "Load more") for the blog listing
 * (design-system.md → Nav/tabs), split in pieces so the chips and the card grid can live in
 * different sections of the page (the mock puts the "Featured" block between them):
 *
 * - `CategoryFilterProvider` — owns the selected category (`"All"` by default) and, when given
 *   a `pageSize`, the "Load more" window. Wraps the part of the listing that contains both the
 *   tabs and the cards (`blog-listing.tsx` wraps tabs + Featured + "From the Journal").
 * - `CategoryTabs` — the chip row: `core/ui`'s `ChipBar` (`variant="plain"`, `align="center"`)
 *   with an "All" chip (accent-token swatch) + one chip per DB category (its validated colour
 *   as the swatch). Inside a provider the chips are toggle buttons (`aria-pressed`).
 * - `CategoryFilterItem` — wraps one server-rendered card; hidden (`display:none` via the
 *   `hidden` attribute — Tailwind's preflight makes it `!important`, beating `contents`) per
 *   `isFilterItemHidden`: a category chip shows all of that category's cards; "All" shows the
 *   first `limit` cards by `index`. `contents` keeps the wrapper out of the grid layout.
 * - `CategoryLoadMore` — the "Load more" button: shown only on "All" while cards are still
 *   paged out; each click reveals the next `pageSize`. Renders nothing otherwise (and nothing
 *   outside a provider), so there is never a button that does nothing.
 *
 * Filtering/paging is purely client-side over already-rendered nodes — no `searchParams`, no
 * request-time DB — so the page stays ISR/static, and every post is in the HTML (crawlable).
 * The visibility rules live in `category-filter-logic.ts` (pure, unit-tested).
 *
 * Outside a provider: the chips are inert (no `onSelect`, so no `onClick`/`aria-pressed`, "All"
 * shown active) and every item renders.
 */
export function CategoryFilterProvider({ pageSize, children }: { pageSize?: number; children: ReactNode }) {
  const [active, setActive] = useState<string>(ALL);
  const [limit, setLimit] = useState<number | undefined>(pageSize);
  const showMore = () => setLimit((l) => (l === undefined || pageSize === undefined ? l : l + pageSize));
  return (
    <CategoryFilterContext.Provider value={{ active, setActive, limit, showMore }}>
      {children}
    </CategoryFilterContext.Provider>
  );
}

/** The category chip row (see the module docstring above `CategoryFilterProvider`). */
export function CategoryTabs({
  categories,
  allLabel,
  className,
}: {
  categories: TabCategory[];
  allLabel: string;
  className?: string;
}) {
  const filter = useContext(CategoryFilterContext);
  const active = filter?.active ?? ALL;

  const items: ChipBarItem[] = [
    { key: ALL, label: allLabel, swatch: "var(--color-accent)", active: active === ALL },
    ...categories.map((c) => ({
      key: c.slug,
      label: c.name,
      swatch: safeSwatch(c.color),
      active: active === c.slug,
    })),
  ];

  return (
    <ChipBar variant="plain" align="center" items={items} onSelect={filter?.setActive} className={className} />
  );
}

/** One filterable card (see the module docstring above `CategoryFilterProvider`). Outside a
 *  provider it always renders. `index` = its position in the listing, for "Load more" paging. */
export function CategoryFilterItem({
  category,
  index,
  children,
}: {
  category: string;
  index?: number;
  children: ReactNode;
}) {
  const filter = useContext(CategoryFilterContext);
  const hidden =
    filter !== null && isFilterItemHidden({ active: filter.active, category, index, limit: filter.limit });
  return (
    <div className="contents" hidden={hidden}>
      {children}
    </div>
  );
}

/**
 * "Load more" — `core/ui`'s ghost button look (`buttonClassName("ghost")`, same classes as
 * `ButtonLink variant="ghost"`) as a native `<button>`, centred `48px` under the grid (the mock's
 * `.load-more`). `total` = number of `CategoryFilterItem`s in the grid.
 */
export function CategoryLoadMore({ total, label }: { total: number; label: string }) {
  const filter = useContext(CategoryFilterContext);
  if (!filter || !hasMoreItems({ active: filter.active, total, limit: filter.limit })) return null;
  return (
    <div className="mt-12 flex justify-center">
      <button type="button" onClick={filter.showMore} className={buttonClassName("ghost")}>
        {label}
      </button>
    </div>
  );
}
