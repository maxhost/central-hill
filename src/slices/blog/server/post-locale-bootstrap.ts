import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import { loadAlternateSlugs, loadTranslationRows, type TranslationRow } from "@core/i18n";
import type { Locale } from "@core/db/columns";
import { BLOG_EDITOR_LOCALES, type BlogPostEnvelopeV1 } from "../editorial-types";
import { blog_post, blog_post_locale_content, blog_post_related } from "../schema";
import { checkBlogEnvelope } from "./post-locale-validation";
import { postBody } from "../body";

export class LegacyPostError extends Error { constructor() { super("Existing article content could not be read safely. No values were overwritten."); this.name = "LegacyPostError"; } }
export type PostLocaleRow = typeof blog_post_locale_content.$inferSelect;
export type PostIdentity = typeof blog_post.$inferSelect;
/** Blog-only graph lock. Acquire in a separate batch statement so the following
 * READ COMMITTED statement observes writes committed while the lock was waiting. */
export function postGraphLockQuery() { return db.execute(sql`select pg_advisory_xact_lock(7157, 1)`); }

const textFields = ["title", "excerpt", "cta_label", "meta_title", "meta_description"] as const;
export function legacyBlogEnvelope(identity: PostIdentity, rows: TranslationRow[], relatedIds: string[], locale: Locale, pending = false, strict = true): BlogPostEnvelopeV1 {
  const source = new Map(rows.filter(row => row.locale === "en").map(row => [row.field, row.value]));
  const target = new Map(rows.filter(row => row.locale === locale && locale !== "en" && (pending || row.state === "approved")).map(row => [row.field, row.value]));
  const get = (field: string) => target.get(field) ?? source.get(field);
  let body;
  try { body = get("body") ? JSON.parse(get("body")!) : []; } catch { if (strict) throw new LegacyPostError(); body = []; }
  const envelope = {
    schemaVersion: 1 as const,
    content: {
      title: get("title") ?? "", excerpt: get("excerpt") ?? "", body,
      category_id: identity.category_id, author_id: identity.author_id,
      cover_media_id: identity.cover_media_id, og_image_media_id: identity.og_image_media_id,
      published_at: identity.published_at?.toISOString() ?? null,
      reading_minutes: identity.reading_minutes, is_featured: identity.is_featured,
      related_ids: relatedIds, cta_label: get("cta_label") ?? identity.cta_label,
      cta_url: identity.cta_url, meta_title: get("meta_title") ?? null,
      meta_description: get("meta_description") ?? null,
    },
  };
  if (!strict) {
    // Public compatibility preserves every prior field independently of the new
    // editor constraints. Only body follows its historical parse/fallback policy.
    const bodyResult = postBody.safeParse(body);
    return { ...envelope, content: { ...envelope.content, body: bodyResult.success ? bodyResult.data : [] } };
  }
  const checked = checkBlogEnvelope(envelope);
  if (!checked.envelope || Object.keys(checked.errors).length) throw new LegacyPostError();
  return checked.envelope;
}
export async function legacyPostLocaleRows(identity: PostIdentity, strict = true): Promise<PostLocaleRow[]> {
  const [translations, related] = await Promise.all([
    loadTranslationRows({ type: "blog_post", id: identity.id }),
    db.select().from(blog_post_related).where(eq(blog_post_related.post_id, identity.id)).orderBy(asc(blog_post_related.position)),
  ]);
  const relatedIds = related.map(row => row.related_post_id);
  return BLOG_EDITOR_LOCALES.map(locale => {
    const published = identity.status === "published" ? legacyBlogEnvelope(identity, translations, relatedIds, locale, false, strict) : null;
    const pending = translations.some(row => row.locale === locale && locale !== "en" && row.state !== "approved" && [...textFields, "body"].includes(row.field));
    const draft = !published || pending ? legacyBlogEnvelope(identity, translations, relatedIds, locale, true, strict) : null;
    return {
      id: identity.id, post_id: identity.id, locale, published, draft, revision: 0,
      published_at: published ? identity.published_at : null,
      draft_saved_at: draft ? identity.updated_at : null,
      updated_by: null, created_at: identity.created_at, updated_at: identity.updated_at,
    };
  });
}
export async function readPostLocaleRows(identity: PostIdentity, strict = true): Promise<PostLocaleRow[]> {
  const rows = await db.select().from(blog_post_locale_content).where(eq(blog_post_locale_content.post_id, identity.id));
  if (rows.length === 4) return rows;
  const legacy = await legacyPostLocaleRows(identity, strict);
  return BLOG_EDITOR_LOCALES.flatMap(locale => {
    const row = rows.find(row => row.locale === locale) ?? legacy.find(row => row.locale === locale);
    return row ? [row] : [];
  });
}
export async function bootstrapPostLocales(identity: PostIdentity, actor: string): Promise<void> {
  const existing = await db.select({ locale: blog_post_locale_content.locale }).from(blog_post_locale_content).where(eq(blog_post_locale_content.post_id, identity.id));
  if (existing.length === 4) return;
  const rows = await legacyPostLocaleRows(identity);
  await db.batch([
    postGraphLockQuery(),
    db.insert(blog_post_locale_content).values(rows.map(row => ({ post_id: row.post_id, locale: row.locale, published: row.published, draft: row.draft, revision: 0, published_at: row.published_at, draft_saved_at: row.draft_saved_at, updated_by: actor }))).onConflictDoNothing(),
  ]);
}
export async function readPostIdentity(id: string): Promise<PostIdentity | null> {
  const [identity] = await db.select().from(blog_post).where(eq(blog_post.id, id)).limit(1);
  return identity ?? null;
}
export async function postSlugMap(id: string) { return loadAlternateSlugs("blog_post", id); }
