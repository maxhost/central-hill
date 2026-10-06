"use client";
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { ChipBar, type ChipBarItem } from "@core/ui";

/** The slice of `CategoryRef` the tabs need (serialisable across the RSC boundary). */
export interface TabCategory {
  /** Language-neutral slug — the filter key cards are matched against. */
  slug: string;
  /** Localised display name. */
  name: string;
  /** Admin-entered category colour; used for the swatch only if it is a plain `#hex`. */
  color: string;
}

/** Sentinel key of the "All" chip (category slugs are kebab-case, so it can't collide). */
const ALL = "__all";

/** `#rgb`, `#rgba`, `#rrggbb` or `#rrggbbaa`. `blog_category.color` is free text up to 32
 *  chars in the admin validator (`hex` *or* any string), so anything else is dropped rather
 *  than handed to the browser as a style value. */
const HEX_COLOR = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

function safeSwatch(color: string): string | undefined {
  return HEX_COLOR.test(color) ? color : undefined;
}

interface FilterState {
  active: string;
  setActive: (key: string) => void;
}

const CategoryFilterContext = createContext<FilterState | null>(null);

/**
 * Client-side category filter for the blog listing (design-system.md → Nav/tabs), split in
 * three so the chips and the card grid can live in different sections of the page (the mock
 * puts the "Featured" block between them):
 *
 * - `CategoryFilterProvider` — owns the selected category (`"All"` by default). Wrap the part
 *   of the listing that contains both the tabs and the cards.
 * - `CategoryTabs` — the chip row: `core/ui`'s `ChipBar` (`variant="plain"`, `align="center"`)
 *   with an "All" chip (accent-token swatch) + one chip per DB category (its validated colour
 *   as the swatch).
 * - `CategoryFilterItem` — wraps one server-rendered card; hidden (`display:none` via the
 *   `hidden` attribute — Tailwind's preflight makes it `!important`, beating `contents`) when a
 *   different category is selected. `contents` keeps the wrapper out of the grid layout.
 *
 * Filtering is purely client-side over already-rendered nodes — no `searchParams`, no
 * request-time DB — so the page stays ISR/static (same approach as this file's previous
 * `CategoryTabs`, which filtered an `items` array but required chips and grid to be adjacent).
 *
 * **Wired now vs. later.** The blog listing's cards are still the mock's raw HTML, which
 * can't be wrapped in `CategoryFilterItem`, so `blog-listing.tsx` renders `CategoryTabs`
 * **without** a provider: with no context the chips are inert (no `onSelect`, so no
 * `onClick`/`aria-pressed`), "All" shows as active, and clicking does nothing. Once the cards
 * become JSX: wrap the listing body in `<CategoryFilterProvider>` and each card in
 * `<CategoryFilterItem category={post.category.slug}>` — the tabs then switch to toggle
 * buttons automatically.
 */
export function CategoryFilterProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<string>(ALL);
  return (
    <CategoryFilterContext.Provider value={{ active, setActive }}>{children}</CategoryFilterContext.Provider>
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
 *  provider it always renders. */
export function CategoryFilterItem({ category, children }: { category: string; children: ReactNode }) {
  const filter = useContext(CategoryFilterContext);
  const hidden = filter !== null && filter.active !== ALL && filter.active !== category;
  return (
    <div className="contents" hidden={hidden}>
      {children}
    </div>
  );
}
