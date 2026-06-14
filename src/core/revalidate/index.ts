import { revalidatePath, revalidateTag, updateTag } from "next/cache";

/**
 * ISR cache-tag helpers (kernel — `core/revalidate`). Tag naming follows
 * conventions.md → "Cache tags: `entity:<id>`, `entity-list`, `globals`, `nav`".
 * Slices declare the concrete tags they use in their `contract.ts` and bust them
 * from a single `publish()` helper on content publish (ADR 0002 — on-demand ISR).
 */
export const cacheTags = {
  /** A single entity, e.g. `blog_post:<id>`. */
  entity: (type: string, id: string) => `${type}:${id}`,
  /** A list of an entity type, e.g. `blog_post-list`. */
  list: (type: string) => `${type}-list`,
  globals: "globals",
  nav: "nav",
  sitemap: "sitemap",
} as const;

/**
 * Next 16 split tag invalidation: `updateTag(tag)` is the Server-Action purge
 * (single arg, read-your-own-writes) — what `publish()` helpers use. `revalidateTag`
 * now requires a cache-life profile and is for non-action invalidation contexts.
 */
export { revalidatePath, revalidateTag, updateTag };
