/**
 * Pure (DB-free) [T]-block overlay helpers for `page_content` (slice `pages`). Source
 * values live inline in the row's `data` jsonb; target-locale leaves are looked up by
 * their concrete dot-path. Kept free of `server-only`/DB so the overlay logic is unit
 * testable; `resolve.ts` supplies the `core/i18n` lookup. See data-model.md → Page content.
 */

export type Json = Record<string, unknown>;

/** Generic dot-path getter (numeric segments index arrays). */
function getAt(root: unknown, path: string[]): unknown {
  let node: unknown = root;
  for (const seg of path) {
    if (node == null || typeof node !== "object") return undefined;
    node = (node as Record<string, unknown>)[seg];
  }
  return node;
}

/** Generic dot-path setter — no-op when the parent chain is missing. */
function setAt(root: unknown, path: string[], value: string): void {
  let node: unknown = root;
  for (let i = 0; i < path.length - 1; i++) {
    if (node == null || typeof node !== "object") return;
    node = (node as Record<string, unknown>)[path[i]!];
  }
  if (node != null && typeof node === "object") {
    (node as Record<string, unknown>)[path[path.length - 1]!] = value;
  }
}

/**
 * Expand a translatablePaths() pattern (e.g. `why.benefits[].title`) into the concrete
 * numeric leaf paths present in `data` (e.g. `why.benefits.0.title`, `…1.title`, …) by
 * walking the actual array lengths. Segments ending in `[]` denote an array level.
 */
export function expand(segments: string[], node: unknown, prefix: string[]): string[][] {
  if (segments.length === 0) return [prefix];
  const [seg, ...rest] = segments;

  if (seg!.endsWith("[]")) {
    const key = seg!.slice(0, -2);
    const arr = key ? getAt(node, [key]) : node;
    if (!Array.isArray(arr)) return [];
    const out: string[][] = [];
    arr.forEach((item, i) => {
      const next = key ? [...prefix, key, String(i)] : [...prefix, String(i)];
      out.push(...expand(rest, item, next));
    });
    return out;
  }

  return expand(rest, getAt(node, [seg!]), [...prefix, seg!]);
}

/**
 * Recursively collect every `*_media_id` string value referenced in `data`. Empty strings
 * are skipped: optional image fields store `""` when unset (e.g. owners
 * `services`/`dashboard` images), and `""` is not a valid `media_asset` uuid — passing it to
 * the media/alt-text query throws `invalid input syntax for type uuid`.
 */
export function collectMediaIds(node: unknown, acc: string[]): void {
  if (Array.isArray(node)) {
    for (const item of node) collectMediaIds(item, acc);
    return;
  }
  if (node != null && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      if (key.endsWith("_media_id") && typeof value === "string") {
        if (value) acc.push(value);
      } else collectMediaIds(value, acc);
    }
  }
}

/**
 * Clone `data` and replace each translatable leaf with `lookup(path)` when it returns a
 * value (the concrete numeric path, e.g. `why.benefits.0.title`).
 */
export function overlayTranslations(
  data: Json,
  translatablePaths: string[],
  lookup: (concretePath: string) => string | undefined,
): Json {
  const out = structuredClone(data);
  for (const pattern of translatablePaths) {
    const segments = pattern.split(".");
    for (const concrete of expand(segments, out, [])) {
      const value = lookup(concrete.join("."));
      if (value !== undefined) setAt(out, concrete, value);
    }
  }
  return out;
}
