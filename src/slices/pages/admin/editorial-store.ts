import "server-only";
import { z } from "zod";
import { editorialLocale } from "../server/editorial-policy";
import {
  validateDraftMutation,
  validateEnvelope,
} from "./editorial-validation";
import { getEditorialAdapter } from "../server/editorial-adapters";
import {
  isEditorialPageKey,
  usesPageLocaleDrafts,
} from "../editorial-registry";
function emptyEditorialEnvelope<K extends EditorialPageKey>(
  key: K,
): PageEnvelope<K> {
  return {
    schemaVersion: 1,
    content: getEditorialAdapter(key).defaultContent(),
    ogImageMediaId: null,
  };
}
import { eq, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import type { Locale } from "@core/db/columns";
import { page_locale_content } from "../schema";
import {
  prepareTargetEnvelope,
} from "../editorial-content";
import type {
  EditorialPageKey,
  PageEnvelope,
  PageLocaleEditorialModel,
  PageEditorialResult,
  PublishPageDraftInput,
  SavePageDraftInput,
} from "../editorial-types";

export const editorialLocales = ["en", "es", "pt", "fr"] as const;
export type EditorialRow<K extends EditorialPageKey = "home"> = Omit<
  typeof page_locale_content.$inferSelect,
  "published" | "draft"
> & { published: PageEnvelope<K> | null; draft: PageEnvelope<K> | null };
export { legacyEditorialRows } from "../server/editorial-legacy";
import { legacyEditorialRows } from "../server/editorial-legacy";
export async function readEditorialRows<K extends EditorialPageKey = "home">(
  key: K = "home" as K,
): Promise<EditorialRow<K>[]> {
  const rows = await db
    .select()
    .from(page_locale_content)
    .where(eq(page_locale_content.page_key, key));
  if (rows.length === 4) return rows as EditorialRow<K>[];
  const baseline = await legacyEditorialRows(key);
  return editorialLocales.flatMap((locale) => {
    const row =
      rows.find((row) => row.locale === locale) ??
      baseline.find((row) => row.locale === locale);
    return row ? [row as EditorialRow<K>] : [];
  });
}
/** A single idempotent INSERT initializes every baseline without replacing live rows. */
export async function bootstrapEditorial(
  actor: string,
  key: EditorialPageKey = "home",
): Promise<void> {
  const existing = await db
    .select({ locale: page_locale_content.locale })
    .from(page_locale_content)
    .where(eq(page_locale_content.page_key, key));
  if (existing.length === 4) return;
  const baseline = await legacyEditorialRows(key);
  const values = editorialLocales.map((locale) => {
    const row = baseline.find((row) => row.locale === locale);
    return {
      page_key: key,
      locale,
      published: row?.published ?? null,
      draft: row?.draft ?? null,
      revision: 0,
      published_at: row?.published_at ?? null,
      draft_saved_at: row?.draft_saved_at ?? null,
      updated_by: actor,
    };
  });
  await db.insert(page_locale_content).values(values).onConflictDoNothing();
}
export function editorialModel<K extends EditorialPageKey = "home">(
  rows: EditorialRow<K>[],
  locale: Locale,
  empty: PageEnvelope<K>,
  key: K = "home" as K,
): PageLocaleEditorialModel<K> {
  const row = rows.find((row) => row.locale === locale) as
    | (Omit<EditorialRow, "draft" | "published"> & {
        draft: PageEnvelope<K> | null;
        published: PageEnvelope<K> | null;
      })
    | undefined;
  const en = rows.find((row) => row.locale === "en") as typeof row;
  const template = en?.draft ?? en?.published ?? empty;
  const own = row?.draft ?? row?.published ?? null;
  const working =
    row?.draft ??
    (locale === "en"
      ? (own ?? empty)
      : prepareTargetEnvelope(
          template,
          own,
          getEditorialAdapter(key).descriptor,
        ));
  return {
    locale,
    revision: row?.revision ?? 0,
    published: row?.published ?? null,
    draft: row?.draft ?? null,
    working: structuredClone(working),
    templateRevision:
      locale !== "en" && !row?.draft ? (en?.revision ?? 0) : null,
  };
}
export async function commitEditorial<
  K extends EditorialPageKey = "home",
>(input: {
  key?: K;
  locale: Locale;
  revision: number;
  payload?: PageEnvelope<K>;
  templateRevision?: number | null;
  publish?: boolean;
  actor: string;
}): Promise<boolean> {
  // The EN lock serializes first-target writes with template changes. Locks are
  // always acquired EN first to keep concurrent EN/target saves deadlock-free.
  const templateGuard =
    input.templateRevision != null
      ? sql`and exists(select 1 from template where revision=${input.templateRevision})`
      : sql``;
  const result = await db.execute(sql`with template as materialized (
    select revision from page_locale_content where page_key=${input.key ?? "home"} and locale='en' for update
  ), saved as (
    update page_locale_content set
      published=${input.publish ? sql`draft` : sql`published`},
      draft=${input.publish ? sql`null` : sql`${JSON.stringify(input.payload)}::jsonb`},
      revision=revision+1, updated_at=now(), updated_by=${input.actor},
      published_at=${input.publish ? sql`now()` : sql`published_at`},
      draft_saved_at=${input.publish ? sql`null` : sql`now()`}
    where page_key=${input.key ?? "home"} and locale=${input.locale} and revision=${input.revision}
      and exists(select 1 from template) ${templateGuard}
      ${input.publish ? sql`and draft is not null` : sql``}
    returning id
  ) select id from saved`);
  return result.rows.length === 1;
}

const request = z.object({
  key: z
    .string()
    .refine((key) => isEditorialPageKey(key) && usesPageLocaleDrafts(key)),
  locale: editorialLocale,
  expectedRevision: z.number().int().nonnegative(),
});
const saving = request.extend({
  templateRevision: z.number().int().nonnegative().nullable(),
  payload: z.unknown(),
});
const invalid = <K extends EditorialPageKey>(
  errors: Record<string, string>,
): PageEditorialResult<K> => ({
  ok: false,
  error: "validation",
  fieldErrors: errors,
});

export async function saveEditorialDraft<K extends EditorialPageKey = "home">(
  input: SavePageDraftInput<K>,
  actor: string,
): Promise<PageEditorialResult<K>> {
  const parsed = saving.safeParse(input);
  if (!parsed.success) return invalid({ _source: "Invalid draft request." });
  const checked = validateEnvelope(parsed.data.payload, false, input.key);
  if (!checked.payload || Object.keys(checked.errors).length)
    return invalid(checked.errors);
  try {
    await bootstrapEditorial(actor, input.key);
    const rows = await readEditorialRows(input.key);
    const current = editorialModel(
      rows,
      input.locale,
      emptyEditorialEnvelope(input.key),
      input.key,
    );
    if (
      current.revision !== input.expectedRevision ||
      (input.locale !== "en" &&
        !current.draft &&
        current.templateRevision !== input.templateRevision)
    )
      return { ok: false, error: "conflict" };
    const validation = await validateDraftMutation(
      checked.payload,
      current.working,
      input.locale,
      false,
      input.key,
    );
    if (!validation.payload || Object.keys(validation.errors).length)
      return invalid(validation.errors);
    const saved = await commitEditorial({
      key: input.key,
      locale: input.locale,
      revision: input.expectedRevision,
      payload: validation.payload,
      templateRevision:
        input.locale !== "en" && !current.draft ? input.templateRevision : null,
      actor: actor,
    });
    if (!saved) return { ok: false, error: "conflict" };
    // Return this mutation's value/revision even if another staff save follows it.
    return {
      ok: true,
      model: {
        ...current,
        revision: current.revision + 1,
        draft: validation.payload,
        working: validation.payload,
        templateRevision: null,
      },
    };
  } catch {
    return { ok: false, error: "server" };
  }
}
export async function publishEditorialDraft<
  K extends EditorialPageKey = "home",
>(
  input: PublishPageDraftInput<K>,
  actor: string,
): Promise<PageEditorialResult<K>> {
  if (!request.safeParse(input).success)
    return invalid({ _source: "Invalid publication request." });
  try {
    await bootstrapEditorial(actor, input.key);
    const rows = await readEditorialRows(input.key);
    const current = editorialModel(
      rows,
      input.locale,
      emptyEditorialEnvelope(input.key),
      input.key,
    );
    if (current.revision !== input.expectedRevision)
      return { ok: false, error: "conflict" };
    if (!current.draft) return { ok: false, error: "no_draft" };
    const checked = await validateDraftMutation(
      current.draft,
      current.draft,
      input.locale,
      true,
      input.key,
    );
    if (!checked.payload || Object.keys(checked.errors).length)
      return invalid(checked.errors);
    if (
      !(await commitEditorial({
        key: input.key,
        locale: input.locale,
        revision: input.expectedRevision,
        publish: true,
        actor: actor,
      }))
    )
      return { ok: false, error: "conflict" };
    const model = {
      ...current,
      revision: current.revision + 1,
      published: current.draft,
      draft: null,
      working: current.draft,
      templateRevision:
        input.locale === "en"
          ? null
          : (rows.find((row) => row.locale === "en")?.revision ?? 0),
    };
    return { ok: true, model };
  } catch {
    return { ok: false, error: "server" };
  }
}
