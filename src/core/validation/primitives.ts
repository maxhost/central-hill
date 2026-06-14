/**
 * Shared Zod primitives (kernel — `core/validation`).
 *
 * Every slice composes its entity/page schemas from these so the whole codebase
 * validates external input the same way (conventions.md → "Validate all external
 * input with Zod at the boundary"). Change-controlled like the rest of `core/`.
 *
 * Conventions encoded here (see docs/data-model.md → "Conventions"):
 *  - ids are uuid; public entities also carry a per-locale `slug` (slug table).
 *  - money/measures are integers (cents/counts) — never floats.
 *  - translatable fields hold the SOURCE-locale value here; other locales live in
 *    the `translation` table. Mark them with `tStr()` so `translatablePaths()` can
 *    enumerate the leaf paths the translation pipeline must extract.
 */
import { z } from "zod";

// ── Scalars ────────────────────────────────────────────────────────────────
export const uuid = z.uuid();
export const locale = z.enum(["en", "pt", "es", "fr"]);
export type Locale = z.infer<typeof locale>;

/** kebab-case, url-safe, used for every public slug. */
export const slug = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be lowercase kebab-case");

/** Content entities: draft | published | archived. */
export const contentStatus = z.enum(["draft", "published", "archived"]);
/** Editable fixed pages only toggle draft | published. */
export const pageStatus = z.enum(["draft", "published"]);

/** 0-based ordering index for user-orderable lists. */
export const position = z.number().int().nonnegative();
/** Money in integer cents — no floats for money (data-model.md). */
export const cents = z.number().int().nonnegative();

export const url = z.url();
export const email = z.email();
/** Reference to a `media_asset.id` (R2-backed). Never a raw URL in content. */
export const mediaId = uuid;

/** WGS84 coordinates (buildings, guide places). */
export const latitude = z.number().min(-90).max(90);
export const longitude = z.number().min(-180).max(180);

// ── Translatable text ────────────────────────────────────────────────────────
const T_META = { t: true } as const;

/**
 * A translatable source-locale string. Marked so `translatablePaths()` can find
 * it. Use for any field marked **[T]** in docs/data-model.md.
 */
export function tStr(opts?: { min?: number; max?: number }): z.ZodString {
  let s = z.string();
  if (opts?.min !== undefined) s = s.min(opts.min);
  if (opts?.max !== undefined) s = s.max(opts.max);
  return s.meta(T_META);
}

/** Optional translatable string (field may be absent in `data`). */
export function tStrOpt(opts?: { max?: number }): z.ZodOptional<z.ZodString> {
  return tStr(opts).optional();
}

// ── Common composite shapes ──────────────────────────────────────────────────
/** A call-to-action button: translatable label + a link target. */
export const cta = z.object({
  label: tStr({ max: 80 }),
  url: url,
});

/** A CTA that also renders a small helper note under it. */
export const ctaWithNote = z.object({
  label: tStr({ max: 80 }),
  url: url,
  note: tStrOpt({ max: 160 }),
});

/** Curated icon set (iconoir names), shipped in code — no icon table. */
export const iconKey = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9-]+$/, "iconoir icon key (kebab-case)");

/**
 * Per-entity SEO override fields (translatable). hreflang/canonical/JSON-LD are
 * derived in `core/seo` — these are the only per-entity SEO columns (see
 * docs/seo-i18n.md). Spread into a public entity's schema: `{ ...seoShape }`.
 */
export const seoShape = {
  meta_title: tStrOpt({ max: 70 }),
  meta_description: tStrOpt({ max: 200 }),
} as const;

// ── Translatable-path introspection ──────────────────────────────────────────
/**
 * Walk a schema and return every translatable leaf path as a dot-path, using
 * `[]` for array elements (e.g. `why.benefits[].title`). The translation
 * pipeline expands `[]` per fixed-count index into concrete `block:<path>` keys
 * (e.g. `block:why.benefits.0.title`) — see docs/data-model.md → Page content.
 *
 * Single source of truth: the schema itself, via `tStr()`'s metadata.
 */
export function translatablePaths(schema: z.ZodType): string[] {
  const out: string[] = [];
  walk(schema, "", out);
  return out;
}

function unwrap(schema: z.ZodType): z.ZodType {
  let s: z.ZodType = schema;
  // Peel optional / nullable / default / readonly wrappers.
  // `in` checks keep this resilient across zod's internal shape changes.
  for (;;) {
    const def = (s as { def?: { innerType?: z.ZodType } }).def;
    const inner = def?.innerType;
    if (inner && inner !== s) {
      s = inner;
      continue;
    }
    return s;
  }
}

function isTranslatable(schema: z.ZodType): boolean {
  const meta = schema.meta?.() as { t?: boolean } | undefined;
  return meta?.t === true;
}

function walk(schema: z.ZodType, path: string, out: string[]): void {
  const base = unwrap(schema);

  if (base instanceof z.ZodObject) {
    const shape = base.shape as Record<string, z.ZodType>;
    for (const [key, child] of Object.entries(shape)) {
      walk(child, path ? `${path}.${key}` : key, out);
    }
    return;
  }

  if (base instanceof z.ZodArray) {
    const element = (base as z.ZodArray<z.ZodType>).element;
    walk(element, `${path}[]`, out);
    return;
  }

  // Leaf: translatable strings carry the metadata on the wrapper or the base.
  if (isTranslatable(schema) || isTranslatable(base)) {
    out.push(path);
  }
}
