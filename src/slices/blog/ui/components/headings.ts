import type { TocItem } from "@core/ui";
import type { PostBody } from "../../contract";

/**
 * Anchor ids for a post body's headings — the ONE source both the "In this article" TOC and the
 * `BodyRenderer` read, so a TOC link always lands on its heading. Pure (no React, no DOM), so it
 * is unit-tested in `tests/headings.test.ts`.
 */

/** URL-safe slug of a heading's text: lowercase ASCII, diacritics dropped, `-` separated. */
export function slugifyHeading(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** Fallback slug for a heading whose text has no ASCII letter or digit (e.g. all emoji/CJK). */
const EMPTY_SLUG = "section";

/**
 * One entry per body block, index-aligned: the heading's anchor id, or `undefined` for a
 * non-heading block. Ids are `slugifyHeading(text)`, deduplicated in document order with
 * `-2`, `-3`… (skipping any suffix another heading already took).
 */
export function headingIds(body: PostBody): (string | undefined)[] {
  const used = new Set<string>();
  return body.map((block) => {
    if (block.type !== "heading") return undefined;
    const base = slugifyHeading(block.text) || EMPTY_SLUG;
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    return id;
  });
}

/**
 * The TOC of a post body: its level-2 headings, with level-3 ones as `sub` entries (level 4 is
 * left out). Each carries the heading's `number` when it has one. `ids` is `headingIds(body)`.
 */
export function tocItems(body: PostBody, ids: readonly (string | undefined)[]): TocItem[] {
  const items: TocItem[] = [];
  body.forEach((block, i) => {
    const id = ids[i];
    if (block.type !== "heading" || block.level === 4 || !id) return;
    items.push({
      id,
      label: block.text,
      ...(block.number ? { number: block.number } : null),
      ...(block.level === 3 ? { sub: true } : null),
    });
  });
  return items;
}
