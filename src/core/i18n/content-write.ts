import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import type { Locale } from "@core/db/columns";
import { slug as slugTable, translation } from "./schema";
import { hashSource } from "./translate";
import type { TranslationState } from "./content";

/**
 * Content + slug **write** seam (kernel — `core/i18n`, ADR 0019). The single
 * authorized path that mutates the cross-cutting `translation` / `slug` tables.
 * Slices read through `content.ts` and write through here — they never touch these
 * kernel tables directly (golden rule 4).
 *
 * Scope is the **source locale (`en`)** + slugs: the catalog/page admin authors
 * source content as `state='draft'` and creates the per-locale slug rows that make
 * a detail page resolvable. **Target-locale** translation writes (LLM draft →
 * `needs_review` → `approved`) remain S14's job, layered on this same seam later.
 *
 * Callers are `requireStaff`-gated slice admin actions (ADR 0009). Neon's HTTP
 * driver has no interactive transactions (see `core/db/client`), so writes are
 * sequential statements; each upsert is atomic and the unique constraints
 * (`translation_key`, `slug_key`) backstop concurrency.
 */

const SOURCE_LOCALE: Locale = "en";

/** Thrown when a slug is already taken by a *different* entity in that locale. */
export class SlugConflictError extends Error {
  constructor(
    readonly entityType: string,
    readonly locale: Locale,
    readonly slug: string,
  ) {
    super(`Slug "${slug}" is already in use for ${entityType} (${locale}).`);
    this.name = "SlugConflictError";
  }
}

/** `{ field → source value }`; a `null`/empty value clears the field. */
export type SourceFields = Record<string, string | null | undefined>;

/**
 * Upsert the **source-locale** value of each [T] field (`state='draft'`). Fields
 * with an empty/null value are **cleared** — their rows are removed for *all*
 * locales (the field no longer exists). Source rows carry no `source_hash`;
 * staleness is detected later by S14 hashing the live source against each target
 * row's stored `source_hash`.
 */
export async function setSourceContent(
  type: string,
  id: string,
  fields: SourceFields,
  opts?: { updatedBy?: string },
): Promise<void> {
  const upserts: {
    entity_type: string;
    entity_id: string;
    field: string;
    locale: Locale;
    value: string;
    state: "draft";
    updated_by: string | null;
  }[] = [];
  const clears: string[] = [];

  for (const [field, raw] of Object.entries(fields)) {
    const value = typeof raw === "string" ? raw.trim() : "";
    if (value) {
      upserts.push({
        entity_type: type,
        entity_id: id,
        field,
        locale: SOURCE_LOCALE,
        value,
        state: "draft",
        updated_by: opts?.updatedBy ?? null,
      });
    } else {
      clears.push(field);
    }
  }

  if (upserts.length > 0) {
    await db
      .insert(translation)
      .values(upserts)
      .onConflictDoUpdate({
        target: [
          translation.entity_type,
          translation.entity_id,
          translation.field,
          translation.locale,
        ],
        set: {
          value: sql`excluded.value`,
          state: sql`excluded.state`,
          updated_by: sql`excluded.updated_by`,
          updated_at: sql`now()`,
        },
      });
  }

  if (clears.length > 0) {
    await db
      .delete(translation)
      .where(
        and(
          eq(translation.entity_type, type),
          eq(translation.entity_id, id),
          inArray(translation.field, clears),
        ),
      );
  }
}

/**
 * Upsert exactly one slug row per `(type, id, locale)`. Throws
 * {@link SlugConflictError} when `value` is already owned by another entity in
 * that locale. Re-slugging overwrites the live slug (no history/redirects — ADR
 * 0019 defers those).
 */
export async function setSlug(
  type: string,
  id: string,
  locale: Locale,
  value: string,
): Promise<void> {
  const [clash] = await db
    .select({ entity_id: slugTable.entity_id })
    .from(slugTable)
    .where(
      and(eq(slugTable.entity_type, type), eq(slugTable.locale, locale), eq(slugTable.slug, value)),
    )
    .limit(1);
  if (clash && clash.entity_id !== id) throw new SlugConflictError(type, locale, value);

  const [existing] = await db
    .select({ id: slugTable.id })
    .from(slugTable)
    .where(
      and(
        eq(slugTable.entity_type, type),
        eq(slugTable.entity_id, id),
        eq(slugTable.locale, locale),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .update(slugTable)
      .set({ slug: value, updated_at: new Date() })
      .where(eq(slugTable.id, existing.id));
  } else {
    await db.insert(slugTable).values({ entity_type: type, entity_id: id, locale, slug: value });
  }
}

/** Convenience: set several locales' slugs (skips empty values). */
export async function setSlugs(
  type: string,
  id: string,
  slugByLocale: Partial<Record<Locale, string>>,
): Promise<void> {
  for (const [loc, value] of Object.entries(slugByLocale)) {
    if (value) await setSlug(type, id, loc as Locale, value);
  }
}

/**
 * Target-locale write seam (ADR 0021 — the part ADR 0019 deferred to S14). The
 * LLM draft → `needs_review` → `approved` workflow mutates **non-source** locales
 * only through these three functions; the source locale stays
 * {@link setSourceContent}'s job. Same constraints as the source seam:
 * `requireStaff`-gated at the slice action, sequential statements (Neon HTTP has
 * no interactive tx), and the `translation_key` unique backstops concurrency.
 */

/** Reject any attempt to write the source locale through the target seam. */
function assertTarget(locale: Locale): void {
  if (locale === SOURCE_LOCALE) {
    throw new Error(`setTargetTranslation: '${SOURCE_LOCALE}' is the source locale (use setSourceContent).`);
  }
}

/**
 * Upsert one **target-locale** field value, stamping `source_hash` from the
 * `sourceValue` it was translated from (so the row goes stale when the source later
 * changes). Defaults to `state='needs_review'` — the draft a reviewer approves.
 */
export async function setTargetTranslation(
  type: string,
  id: string,
  field: string,
  locale: Locale,
  value: string,
  opts: { sourceValue: string; state?: TranslationState; updatedBy?: string },
): Promise<void> {
  assertTarget(locale);
  const row = {
    entity_type: type,
    entity_id: id,
    field,
    locale,
    value: value.trim(),
    state: opts.state ?? ("needs_review" as TranslationState),
    source_hash: hashSource(opts.sourceValue),
    updated_by: opts.updatedBy ?? null,
  };
  await db
    .insert(translation)
    .values(row)
    .onConflictDoUpdate({
      target: [
        translation.entity_type,
        translation.entity_id,
        translation.field,
        translation.locale,
      ],
      set: {
        value: sql`excluded.value`,
        state: sql`excluded.state`,
        source_hash: sql`excluded.source_hash`,
        updated_by: sql`excluded.updated_by`,
        updated_at: sql`now()`,
      },
    });
}

/**
 * Value-preserving state transition of one target row (approve, or reset to
 * `needs_review`). No-op if the row does not exist.
 */
export async function setTranslationState(
  type: string,
  id: string,
  field: string,
  locale: Locale,
  state: TranslationState,
): Promise<void> {
  assertTarget(locale);
  await db
    .update(translation)
    .set({ state, updated_at: new Date() })
    .where(
      and(
        eq(translation.entity_type, type),
        eq(translation.entity_id, id),
        eq(translation.field, field),
        eq(translation.locale, locale),
      ),
    );
}

/** Remove one target-locale field row (a reviewer clearing a translation). */
export async function deleteTranslation(
  type: string,
  id: string,
  field: string,
  locale: Locale,
): Promise<void> {
  assertTarget(locale);
  await db
    .delete(translation)
    .where(
      and(
        eq(translation.entity_type, type),
        eq(translation.entity_id, id),
        eq(translation.field, field),
        eq(translation.locale, locale),
      ),
    );
}

/** Remove every translation row for an entity (used on entity delete). */
export async function deleteContent(type: string, id: string): Promise<void> {
  await db
    .delete(translation)
    .where(and(eq(translation.entity_type, type), eq(translation.entity_id, id)));
}

/** Remove every slug row for an entity (used on entity delete). */
export async function deleteSlugs(type: string, id: string): Promise<void> {
  await db.delete(slugTable).where(and(eq(slugTable.entity_type, type), eq(slugTable.entity_id, id)));
}
