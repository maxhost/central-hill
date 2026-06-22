import { z } from "zod";

/**
 * Schema → form model (S12, ADR 0012). The five fixed pages are edited by a
 * **schema-driven** form: we walk a page's Zod schema once into a `FieldNode` tree
 * the renderer consumes, and we can scaffold an empty `data` skeleton for a page
 * that has never been authored. Pure (no DB / React) so it's unit-testable.
 *
 * Leaf mapping: `*_media_id` → media picker; ZodBoolean → checkbox; ZodString →
 * text (textarea when its max length is large). Arrays carry their min/max so the
 * editor adds/removes within bounds (fixed-count arrays have min === max).
 */

export type FieldNode =
  | { kind: "object"; fields: { key: string; node: FieldNode }[] }
  | { kind: "array"; element: FieldNode; min: number; max: number }
  | { kind: "media"; hint?: string }
  | { kind: "select"; source: string; hint?: string }
  | { kind: "boolean" }
  | { kind: "string"; multiline: boolean; optional: boolean };

/**
 * Field-key → option source for the `select` leaf (a dropdown fed at render time from
 * another slice's contract — see `getPageEditModel`). Mirrors the `*_media_id` → media
 * picker heuristic: a known key suffix maps to a known catalogue. The only entry today is
 * `faq_group_key` → the `faq` slice's group list.
 */
const SELECT_SOURCES: Record<string, string> = {
  faq_group_key: "faq_group",
};

/** One dropdown choice for a `select` leaf (e.g. an FAQ group). */
export interface SelectOption {
  value: string;
  label: string;
}

/** Option catalogues keyed by a leaf's `source` (e.g. `faq_group`), filled server-side. */
export type SelectOptions = Record<string, SelectOption[]>;

/** Peel optional/nullable/default wrappers; report whether the field is optional. */
function unwrap(schema: z.ZodType): { base: z.ZodType; optional: boolean } {
  let s: z.ZodType = schema;
  let optional = false;
  for (;;) {
    if (s instanceof z.ZodOptional || s instanceof z.ZodNullable) optional = true;
    const inner = (s as { def?: { innerType?: z.ZodType } }).def?.innerType;
    if (inner && inner !== s) {
      s = inner;
      continue;
    }
    return { base: s, optional };
  }
}

/** Read array length bounds from the v4 check defs (length_equals / min / max). */
function arrayBounds(arr: z.ZodType): { min: number; max: number } {
  let min = 0;
  let max = Number.POSITIVE_INFINITY;
  const checks = (arr as { def?: { checks?: unknown[] } }).def?.checks ?? [];
  for (const c of checks) {
    const cd = ((c as { _zod?: { def?: unknown }; def?: unknown })._zod?.def ??
      (c as { def?: unknown }).def ??
      c) as { check?: string; length?: number; minimum?: number; maximum?: number };
    if (cd.check === "length_equals" && typeof cd.length === "number") {
      min = cd.length;
      max = cd.length;
    } else if (cd.check === "min_length" && typeof cd.minimum === "number") {
      min = cd.minimum;
    } else if (cd.check === "max_length" && typeof cd.maximum === "number") {
      max = cd.maximum;
    }
  }
  return { min, max };
}

const MULTILINE_OVER = 180;

/** Describe a schema as a `FieldNode`; `key` drives leaf heuristics (media). */
export function describe(schema: z.ZodType, key = ""): FieldNode {
  const { base, optional } = unwrap(schema);

  if (base instanceof z.ZodObject) {
    const shape = base.shape as Record<string, z.ZodType>;
    return {
      kind: "object",
      fields: Object.entries(shape).map(([k, child]) => ({ key: k, node: describe(child, k) })),
    };
  }

  if (base instanceof z.ZodArray) {
    const element = (base as z.ZodArray<z.ZodType>).element;
    const { min, max } = arrayBounds(base);
    return { kind: "array", element: describe(element, key), min, max };
  }

  if (base instanceof z.ZodBoolean) return { kind: "boolean" };

  if (key in SELECT_SOURCES) {
    // A known key maps to a dropdown sourced from another slice's catalogue (e.g. faq
    // groups). `.describe()` on the field becomes the picker hint. Detected by key, like
    // media, so the underlying schema can be any string/union shape.
    const hint = (base as { description?: string }).description;
    const source = SELECT_SOURCES[key]!;
    return hint ? { kind: "select", source, hint } : { kind: "select", source };
  }

  if (key.endsWith("_media_id")) {
    // A `.describe()` on the media schema becomes uploader guidance in the editor
    // (recommended size/format). Read from the unwrapped base (describe sets it there).
    const hint = (base as { description?: string }).description;
    return hint ? { kind: "media", hint } : { kind: "media" };
  }

  const maxLength = (base as { maxLength?: number | null }).maxLength ?? null;
  const multiline = typeof maxLength === "number" && maxLength > MULTILINE_OVER;
  return { kind: "string", multiline, optional };
}

/** Scaffold an empty value for a node (fills fixed arrays with `min` items). */
export function emptyValue(node: FieldNode): unknown {
  switch (node.kind) {
    case "object": {
      const out: Record<string, unknown> = {};
      for (const f of node.fields) out[f.key] = emptyValue(f.node);
      return out;
    }
    case "array": {
      const n = Number.isFinite(node.min) ? node.min : 0;
      return Array.from({ length: n }, () => emptyValue(node.element));
    }
    case "boolean":
      return false;
    case "media":
    case "select":
    case "string":
      return "";
  }
}

/**
 * Fill a stored value with scaffold defaults so the editor renders every field —
 * missing object keys get empties, and short arrays are padded up to `min` (so a
 * fixed-count array always shows its N slots, even on a never-authored page).
 */
export function applyDefaults(node: FieldNode, value: unknown): unknown {
  switch (node.kind) {
    case "object": {
      const obj = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const f of node.fields) out[f.key] = applyDefaults(f.node, obj[f.key]);
      return out;
    }
    case "array": {
      const arr = Array.isArray(value) ? value : [];
      const filled = arr.map((item) => applyDefaults(node.element, item));
      while (Number.isFinite(node.min) && filled.length < node.min) {
        filled.push(applyDefaults(node.element, undefined));
      }
      return filled;
    }
    case "boolean":
      return typeof value === "boolean" ? value : false;
    case "media":
    case "select":
    case "string":
      return typeof value === "string" ? value : "";
  }
}

/** Human label for a developer field key (`image_media_id` → "Image"). */
export function humanizeKey(key: string): string {
  const base = key.replace(/_media_id$/, "").replace(/_/g, " ").trim();
  return base.charAt(0).toUpperCase() + base.slice(1);
}
