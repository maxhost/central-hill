import "server-only";
import { z } from "zod";
import { editorialLocale } from "../server/editorial-policy";
import { validateDraftMutation, validateEnvelope } from "./editorial-validation";
import { applyDefaults, describe } from "./form-model";
function emptyEditorialEnvelope(): PageEnvelope { return { schemaVersion: 1, content: normalizeHome(applyDefaults(describe(homeSchema), {}) as import("../schemas/home").HomeContent), ogImageMediaId: null }; }
import { eq, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import { loadTranslationRows } from "@core/i18n";
import type { Locale } from "@core/db/columns";
import { page_content, page_locale_content } from "../schema";
import { homeSchema } from "../schemas/home";
import { homeIdentityErrors, homeSet, homeTextPaths, homeTranslationField, normalizeHome } from "../home-content";
import { prepareTargetEnvelope } from "../editorial-content";
import type { PageEnvelope, PageLocaleEditorialModel, PageEditorialResult, PublishPageDraftInput, SavePageDraftInput } from "../editorial-types";
import { resolveHomeData } from "../server/home-translations";

export const editorialLocales = ["en", "es", "pt", "fr"] as const;
export type EditorialRow = typeof page_locale_content.$inferSelect;
export async function legacyEditorialRows(): Promise<EditorialRow[]> {
  const [source] = await db.select().from(page_content).where(eq(page_content.key, "home")).limit(1);
  const parsed = homeSchema.safeParse(source?.data);
  if (source && !parsed.success) throw new Error("Invalid legacy Home content");
  if (!source || !parsed.success) return [];
  const content = normalizeHome(parsed.data);
  if (Object.keys(homeIdentityErrors(content)).length) throw new Error("Invalid legacy Home identities");
  const translations = await loadTranslationRows({ type: "page_content", id: source.id });
  return Promise.all(editorialLocales.map(async locale => {
    const published: PageEnvelope = { schemaVersion: 1, content: await resolveHomeData(source.id, content, locale), ogImageMediaId: source.og_image_media_id };
    let draft: PageEnvelope | null = null;
    const pending = translations.filter(row => row.locale === locale && row.state !== "approved" && row.field.startsWith("block:"));
    if (locale !== "en" && pending.length) {
      draft = structuredClone(published);
      if (pending.some(row => row.field.startsWith("block:seo."))) draft.content.seo ??= { meta_title: "", meta_description: "" };
      for (const path of homeTextPaths(draft.content)) {
        const row = pending.find(row => row.field === homeTranslationField(content, path));
        if (row) homeSet(draft.content, path, row.value);
      }
    }
    return { id: source.id, page_key: "home", locale, published, draft, revision: 0, published_at: source.updated_at, draft_saved_at: draft ? source.updated_at : null, updated_by: null, created_at: source.created_at, updated_at: source.updated_at };
  }));
}
export async function readEditorialRows(): Promise<EditorialRow[]> {
  const rows = await db.select().from(page_locale_content).where(eq(page_locale_content.page_key, "home"));
  if (rows.length === 4) return rows;
  const baseline = await legacyEditorialRows();
  return editorialLocales.flatMap(locale => {
    const row = rows.find(row => row.locale === locale) ?? baseline.find(row => row.locale === locale);
    return row ? [row] : [];
  });
}
/** A single idempotent INSERT initializes every baseline without replacing live rows. */
export async function bootstrapEditorial(actor: string): Promise<void> {
  const existing = await db.select({ locale: page_locale_content.locale }).from(page_locale_content).where(eq(page_locale_content.page_key, "home"));
  if (existing.length === 4) return;
  const baseline = await legacyEditorialRows();
  const values = editorialLocales.map(locale => {
    const row = baseline.find(row => row.locale === locale);
    return { page_key: "home", locale, published: row?.published ?? null, draft: row?.draft ?? null, revision: 0, published_at: row?.published_at ?? null, draft_saved_at: row?.draft_saved_at ?? null, updated_by: actor };
  });
  await db.insert(page_locale_content).values(values).onConflictDoNothing();
}
export function editorialModel(rows: EditorialRow[], locale: Locale, empty: PageEnvelope): PageLocaleEditorialModel {
  const row = rows.find(row => row.locale === locale);
  const en = rows.find(row => row.locale === "en");
  const template = en?.draft ?? en?.published ?? empty;
  const own = row?.draft ?? row?.published ?? null;
  const working = row?.draft ?? (locale === "en" ? own ?? empty : prepareTargetEnvelope(template, own));
  return { locale, revision: row?.revision ?? 0, published: row?.published ?? null, draft: row?.draft ?? null, working: structuredClone(working), templateRevision: locale !== "en" && !row?.draft ? en?.revision ?? 0 : null };
}
export async function commitEditorial(input: { locale: Locale; revision: number; payload?: PageEnvelope; templateRevision?: number | null; publish?: boolean; actor: string }): Promise<boolean> {
  // The EN lock serializes first-target writes with template changes. Locks are
  // always acquired EN first to keep concurrent EN/target saves deadlock-free.
  const templateGuard = input.templateRevision != null ? sql`and exists(select 1 from template where revision=${input.templateRevision})` : sql``;
  const result = await db.execute(sql`with template as materialized (
    select revision from page_locale_content where page_key='home' and locale='en' for update
  ), saved as (
    update page_locale_content set
      published=${input.publish ? sql`draft` : sql`published`},
      draft=${input.publish ? sql`null` : sql`${JSON.stringify(input.payload)}::jsonb`},
      revision=revision+1, updated_at=now(), updated_by=${input.actor},
      published_at=${input.publish ? sql`now()` : sql`published_at`},
      draft_saved_at=${input.publish ? sql`null` : sql`now()`}
    where page_key='home' and locale=${input.locale} and revision=${input.revision}
      and exists(select 1 from template) ${templateGuard}
      ${input.publish ? sql`and draft is not null` : sql``}
    returning id
  ) select id from saved`);
  return result.rows.length === 1;
}

const request = z.object({ key: z.literal("home"), locale: editorialLocale, expectedRevision: z.number().int().nonnegative() });
const saving = request.extend({ templateRevision: z.number().int().nonnegative().nullable(), payload: z.unknown() });
const invalid = (errors: Record<string, string>): PageEditorialResult => ({ ok: false, error: "validation", fieldErrors: errors });


export async function saveEditorialDraft(input: SavePageDraftInput, actor: string): Promise<PageEditorialResult> {
  const parsed = saving.safeParse(input);
  if (!parsed.success) return invalid({ _source: "Invalid draft request." });
  const checked = validateEnvelope(parsed.data.payload);
  if (!checked.payload || Object.keys(checked.errors).length) return invalid(checked.errors);
  try {
    await bootstrapEditorial(actor);
    const rows = await readEditorialRows();
    const current = editorialModel(rows, input.locale, emptyEditorialEnvelope());
    if (current.revision !== input.expectedRevision || (input.locale !== "en" && !current.draft && current.templateRevision !== input.templateRevision)) return { ok: false, error: "conflict" };
    const validation = await validateDraftMutation(checked.payload, current.working, input.locale);
    if (!validation.payload || Object.keys(validation.errors).length) return invalid(validation.errors);
    const saved = await commitEditorial({ locale: input.locale, revision: input.expectedRevision, payload: validation.payload, templateRevision: input.locale !== "en" && !current.draft ? input.templateRevision : null, actor: actor });
    if (!saved) return { ok: false, error: "conflict" };
    // Return this mutation's value/revision even if another staff save follows it.
    return { ok: true, model: { ...current, revision: current.revision + 1, draft: validation.payload, working: validation.payload, templateRevision: null } };
  } catch { return { ok: false, error: "server" }; }
}
export async function publishEditorialDraft(input: PublishPageDraftInput, actor: string): Promise<PageEditorialResult> {
  if (!request.safeParse(input).success) return invalid({ _source: "Invalid publication request." });
  try {
    await bootstrapEditorial(actor);
    const rows = await readEditorialRows();
    const current = editorialModel(rows, input.locale, emptyEditorialEnvelope());
    if (current.revision !== input.expectedRevision) return { ok: false, error: "conflict" };
    if (!current.draft) return { ok: false, error: "no_draft" };
    const checked = await validateDraftMutation(current.draft, current.draft, input.locale, true);
    if (!checked.payload || Object.keys(checked.errors).length) return invalid(checked.errors);
    if (!await commitEditorial({ locale: input.locale, revision: input.expectedRevision, publish: true, actor: actor })) return { ok: false, error: "conflict" };
    const model = { ...current, revision: current.revision + 1, published: current.draft, draft: null, working: current.draft, templateRevision: input.locale === "en" ? null : rows.find(row => row.locale === "en")?.revision ?? 0 };
    return { ok: true, model };
  } catch { return { ok: false, error: "server" }; }
}
