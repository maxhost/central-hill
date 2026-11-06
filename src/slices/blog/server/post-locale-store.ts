import "server-only";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import { SlugConflictError, setSlugs, deleteSlugs } from "@core/i18n";
import { loadMedia } from "@core/media";
import type { Locale } from "@core/db/columns";
import { BLOG_EDITOR_LOCALES, type BlogPostEditorialResult, type SaveBlogPostDraftInput, type PublishBlogPostDraftInput, type BlogPostEnvelopeV1 } from "../editorial-types";
import { author, blog_category, blog_post } from "../schema";
import { LegacyPostError, readPostIdentity, readPostLocaleRows, postSlugMap, bootstrapPostLocales, postGraphLockQuery } from "./post-locale-bootstrap";
import { emptyBlogEnvelope, postLocaleModel } from "./post-locale-model";
import { checkBlogEnvelope, saveBlogRequest, publishBlogRequest, issuesByField, sharedBlogValuesMatch, blogMediaIds } from "./post-locale-validation";

function invalid(fieldErrors: Record<string, string>): BlogPostEditorialResult { return { ok: false, error: "validation", fieldErrors }; }
/** Resolve all references before persisting; placeholders are allowed only when absent. */
export async function validatePostReferences(envelope: BlogPostEnvelopeV1, postId: string, preview = false, localIds: Set<string> = new Set()): Promise<Record<string, string>> {
  const c = envelope.content;
  const [categories, authors, related, media] = await Promise.all([
    db.select({ id: blog_category.id }).from(blog_category).where(eq(blog_category.id, c.category_id)).limit(1),
    db.select({ id: author.id }).from(author).where(eq(author.id, c.author_id)).limit(1),
    c.related_ids.length ? db.select({ id: blog_post.id }).from(blog_post).where(inArray(blog_post.id, c.related_ids)) : Promise.resolve([]),
    loadMedia(blogMediaIds(envelope)),
  ]);
  const errors: Record<string, string> = {};
  if (!categories.length) errors.category_id = "Category no longer exists.";
  if (!authors.length) errors.author_id = "Author no longer exists.";
  if (c.related_ids.includes(postId) || related.length !== c.related_ids.length) errors.related_ids = "Related articles must exist and exclude this article.";
  for (const id of blogMediaIds(envelope)) {
    if (preview && localIds.has(id)) continue;
    const asset = media.get(id);
    if (!asset || !asset.mime.startsWith("image/")) errors[id === c.cover_media_id ? "cover_media_id" : id === c.og_image_media_id ? "og_image_media_id" : "body"] = "Select an available image.";
  }
  return errors;
}
/** Identity + four empty locale rows form one atomic creation; no public snapshot. */
async function createIdentity(input: SaveBlogPostDraftInput): Promise<void> {
  const c = input.payload.content;
  await db.execute(sql`with created as (
    insert into blog_post(id,slug,status,category_id,author_id)
    values(${input.postId}::uuid,${input.slug!},'draft',${c.category_id}::uuid,${c.author_id}::uuid)
    on conflict(id) do nothing returning id
  ), locales as (select unnest(array['en','es','pt','fr']) as locale)
  insert into blog_post_locale_content(post_id,locale,revision)
  select created.id,locales.locale,0 from created cross join locales on conflict do nothing`);
}
/** Graph lock first, then parent, EN template and selected row. The second batch
 * statement gets a fresh READ COMMITTED snapshot after any lock wait. */
export async function commitPostLocale(input: { postId: string; locale: Locale; revision: number; templateRevision?: number | null; payload?: BlogPostEnvelopeV1; publish?: boolean; actor: string }): Promise<boolean> {
  const [, result] = await db.batch([postGraphLockQuery(), db.execute(sql`with parent as materialized (
    select id,status from blog_post where id=${input.postId}::uuid for update
  ), template as materialized (
    select revision from blog_post_locale_content where post_id=${input.postId}::uuid and locale='en'
    and exists(select 1 from parent where status<>'archived') for update
  ), saved as (
    update blog_post_locale_content set
      published=${input.publish ? sql`draft` : sql`published`},
      draft=${input.publish ? sql`null` : sql`${JSON.stringify(input.payload)}::jsonb`},
      revision=revision+1,updated_at=now(),updated_by=${input.actor},
      draft_saved_at=${input.publish ? sql`null` : sql`now()`},
      published_at=${input.publish ? sql`now()` : sql`published_at`}
    where post_id=${input.postId}::uuid and locale=${input.locale} and revision=${input.revision}
      and exists(select 1 from template)
      ${input.templateRevision != null ? sql`and exists(select 1 from template where revision=${input.templateRevision})` : sql``}
      ${input.publish ? sql`and draft is not null` : sql``}
      and not exists (
        select 1 from jsonb_array_elements_text(coalesce(
          ${input.publish ? sql`draft` : sql`${JSON.stringify(input.payload)}::jsonb`}->'content'->'related_ids', '[]'::jsonb
        )) requested(id)
        left join blog_post related on related.id=requested.id::uuid
        where related.id is null
      )
    returning id
  ) select id from saved`)]);
  return result.rows.length === 1;
}
export async function savePostDraft(input: SaveBlogPostDraftInput, actor: string): Promise<BlogPostEditorialResult> {
  const request = saveBlogRequest.safeParse(input);
  if (!request.success) return invalid(issuesByField(request.error.issues));
  const checked = checkBlogEnvelope(input.payload);
  if (!checked.envelope || Object.keys(checked.errors).length) return invalid(checked.errors);
  input = { ...input, payload: checked.envelope };
  try {
    let identity = await readPostIdentity(input.postId);
    if (!identity) {
      if (input.locale !== "en" || input.expectedRevision !== 0 || !input.slug) return { ok: false, error: "not_found" };
      const errors = await validatePostReferences(input.payload, input.postId);
      if (Object.keys(errors).length) return invalid(errors);
      await createIdentity(input);
      identity = await readPostIdentity(input.postId);
      if (!identity) return { ok: false, error: "server" };
    }
    if (identity.status === "archived") return { ok: false, error: "archived" };
    await bootstrapPostLocales(identity, actor);
    const rows = await readPostLocaleRows(identity);
    const model = postLocaleModel(rows, input.locale, emptyBlogEnvelope(identity));
    // An identity with empty rows may be a retry after a partial reservation. Never
    // replace existing localized slugs; only complete this new unpublished identity.
    let slugByLocale = await postSlugMap(identity.id);
    const virgin = rows.every(row => row.revision === 0 && row.draft === null && row.published === null);
    if (input.slug !== undefined && input.slug !== identity.slug) {
      if (!virgin || input.locale !== "en" || input.expectedRevision !== 0) return invalid({ slug: "The article URL cannot be changed in this editor." });
      // A failed first reservation has no editable/published content yet. Permit
      // correcting that slug, without ever renaming a successfully saved article.
      const changed = await db.execute(sql`update blog_post set slug=${input.slug},updated_at=now()
        where id=${identity.id}::uuid and status='draft' and not exists(
          select 1 from blog_post_locale_content where post_id=${identity.id}::uuid
          and (revision<>0 or draft is not null or published is not null)) returning id`);
      if (!changed.rows.length) return { ok: false, error: "conflict" };
      await deleteSlugs("blog_post", identity.id);
      identity = { ...identity, slug: input.slug };
      slugByLocale = {};
    }
    if (virgin && input.locale === "en") {
      const missing = Object.fromEntries(BLOG_EDITOR_LOCALES.filter(locale => !slugByLocale[locale]).map(locale => [locale, identity!.slug]));
      await setSlugs("blog_post", identity.id, missing);
      slugByLocale = await postSlugMap(identity.id);
    }
    if (!slugByLocale[input.locale] && !slugByLocale.en) return invalid({ slug: "The article has no public URL. Resolve the existing URL before saving." });
    const source = rows.find(row => row.locale === "en");
    // A non-null EN revision on an existing target draft is explicit local
    // adoption of saved English details. Never replace its copy/body implicitly.
    const adoptsSavedDetails = input.locale !== "en" && Boolean(model.draft) && input.templateRevision !== null;
    if (model.revision !== input.expectedRevision ||
      (input.locale !== "en" && !model.draft && model.templateRevision !== input.templateRevision) ||
      (adoptsSavedDetails && input.templateRevision !== (source?.revision ?? 0))) return { ok: false, error: "conflict" };
    const sharedTemplate = adoptsSavedDetails ? source?.draft ?? source?.published ?? emptyBlogEnvelope(identity) : model.working;
    if (input.locale !== "en" && !sharedBlogValuesMatch(input.payload, sharedTemplate)) return invalid({ _source: "Shared article fields must match the selected saved English details." });
    const referenceErrors = await validatePostReferences(input.payload, input.postId);
    if (Object.keys(referenceErrors).length) return invalid(referenceErrors);
    if (!await commitPostLocale({ postId: input.postId, locale: input.locale, revision: input.expectedRevision, templateRevision: input.locale !== "en" && (!model.draft || adoptsSavedDetails) ? input.templateRevision : null, payload: input.payload, actor })) return { ok: false, error: "conflict" };
    return { ok: true, postId: input.postId, slugByLocale, model: { ...model, revision: model.revision + 1, draft: input.payload, working: input.payload, templateRevision: null } };
  } catch (error) {
    if (error instanceof LegacyPostError) return { ok: false, error: "legacy_invalid" };
    if (error instanceof SlugConflictError) return { ok: false, error: "slug_conflict" };
    console.error("Blog draft save failed", error instanceof Error ? error.name : "unknown");
    return { ok: false, error: "server" };
  }
}
export async function publishPostDraft(input: PublishBlogPostDraftInput, actor: string): Promise<BlogPostEditorialResult> {
  const request = publishBlogRequest.safeParse(input);
  if (!request.success) return invalid(issuesByField(request.error.issues));
  try {
    const identity = await readPostIdentity(input.postId);
    if (!identity) return { ok: false, error: "not_found" };
    if (identity.status === "archived") return { ok: false, error: "archived" };
    await bootstrapPostLocales(identity, actor);
    const rows = await readPostLocaleRows(identity);
    const model = postLocaleModel(rows, input.locale, emptyBlogEnvelope(identity));
    if (model.revision !== input.expectedRevision) return { ok: false, error: "conflict" };
    if (!model.draft) return { ok: false, error: "no_draft" };
    const checked = checkBlogEnvelope(model.draft, true);
    if (!checked.envelope || Object.keys(checked.errors).length) return invalid(checked.errors);
    const errors = await validatePostReferences(checked.envelope, input.postId);
    if (Object.keys(errors).length) return invalid(errors);
    const slugByLocale = await postSlugMap(identity.id);
    if (!slugByLocale[input.locale] && !slugByLocale.en) return invalid({ slug: "The article has no public URL." });
    if (!await commitPostLocale({ postId: input.postId, locale: input.locale, revision: input.expectedRevision, publish: true, actor })) return { ok: false, error: "conflict" };
    return { ok: true, postId: input.postId, slugByLocale, model: { ...model, revision: model.revision + 1, published: model.draft, working: model.draft, draft: null, templateRevision: input.locale === "en" ? null : rows.find(row => row.locale === "en")?.revision ?? 0 } };
  } catch (error) {
    if (error instanceof LegacyPostError) return { ok: false, error: "legacy_invalid" };
    console.error("Blog publication failed", error instanceof Error ? error.name : "unknown");
    return { ok: false, error: "server" };
  }
}

/** Reject incoming draft/published references instead of mutating another article.
 * Legacy joins remain authoritative only until that source article is adapted. */
export async function deletePostIdentityIfUnused(postId: string): Promise<{ ok: true } | { ok: false; error: "in_use" | "not_found" }> {
  const [, result] = await db.batch([
    postGraphLockQuery(),
    db.execute(sql`with incoming as materialized (
      select post_id from blog_post_locale_content
      where post_id<>${postId}::uuid and (
        coalesce(draft->'content'->'related_ids','[]'::jsonb) ? ${postId}
        or coalesce(published->'content'->'related_ids','[]'::jsonb) ? ${postId}
      )
      union all
      select relation.post_id from blog_post_related relation
      where relation.related_post_id=${postId}::uuid and relation.post_id<>${postId}::uuid
        and not exists(select 1 from blog_post_locale_content source where source.post_id=relation.post_id)
    ), deleted as (
      delete from blog_post where id=${postId}::uuid and not exists(select 1 from incoming)
      returning id
    ) select exists(select 1 from deleted) as deleted, exists(select 1 from incoming) as in_use`),
  ]);
  const row = result.rows[0];
  if (row?.deleted) return { ok: true };
  return { ok: false, error: row?.in_use ? "in_use" : "not_found" };
}
