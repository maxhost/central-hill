/**
 * Pure visibility rules of the blog listing's client-side category filter + "Load more"
 * (`category-tabs.tsx`). A plain module (no `"use client"`, no React) so it is unit-testable
 * with `node:test` and shareable with server code.
 */

/** Sentinel key of the "All" chip (category slugs are kebab-case, so it can't collide). */
export const ALL_CATEGORIES = "__all";

/**
 * Whether one card is hidden.
 * - A **category** chip shows every card of that category (no paging: a filtered view is
 *   always complete) and hides the rest.
 * - **"All"** shows the cards in listing order up to `limit` (the "Load more" window);
 *   with no `limit` or no `index`, nothing is paged.
 */
export function isFilterItemHidden({
  active,
  category,
  index,
  limit,
}: {
  active: string;
  category: string;
  index?: number;
  limit?: number;
}): boolean {
  if (active !== ALL_CATEGORIES) return active !== category;
  return index !== undefined && limit !== undefined && index >= limit;
}

/** Whether the "Load more" button shows: only on "All", while some cards are still paged out. */
export function hasMoreItems({
  active,
  total,
  limit,
}: {
  active: string;
  total: number;
  limit?: number;
}): boolean {
  return active === ALL_CATEGORIES && limit !== undefined && total > limit;
}
