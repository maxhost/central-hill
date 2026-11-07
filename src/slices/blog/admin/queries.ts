import "server-only";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@core/db/client";
import { loadContent, loadTranslationRows } from "@core/i18n/content";
import { loadMedia, mediaUrl } from "@core/media";
import type { Locale } from "@core/db/columns";
import { getPostEditorialModel } from "../server/post-locale-model";
import { rawAuthorTranslations, rawBlogCategoryTranslations, loadBlogReferenceOptions } from "../server/reference-locales";
import type { BlogReferenceOption } from "../reference-locale-types";
import { blog_post_locale_content } from "../schema";
import type { AdminMediaPreview } from "@slices/backoffice/contract";
import { BLOG_POST } from "../contract";
import { type PostBody, postBody } from "../body";
import { author, blog_category, blog_post, blog_post_related } from "../schema";

/**
 * Backoffice reads for slice `blog` (S12). Not cache-wrapped (admin is dynamic) and
 * return **all** statuses + **source-locale** ([T] en) values for editing.
 */

const SOURCE = "en" as const;

type Status = "draft" | "published" | "archived";

// ── Categories ───────────────────────────────────────────────────────────────
export interface BlogCategoryAdminListItem {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  position: number;
}

export async function listBlogCategoriesAdmin(): Promise<BlogCategoryAdminListItem[]> {
  const rows = await db
    .select({
      id: blog_category.id,
      slug: blog_category.slug,
      color: blog_category.color,
      position: blog_category.position,
    })
    .from(blog_category)
    .orderBy(asc(blog_category.position));
  if (rows.length === 0) return [];
  const content = await loadContent(
    rows.map((r) => ({ type: "blog_category", id: r.id })),
    SOURCE,
  );
  return rows.map((r) => ({
    id: r.id,
    name: content.get("blog_category", r.id, "name") ?? r.slug,
    slug: r.slug,
    color: r.color,
    position: r.position,
  }));
}

export interface BlogCategoryEditData {
  id: string;
  slug: string;
  color: string;
  position: number;
  name: string;
  translations?: import("../reference-locale-types").BlogCategoryTranslations;
}

export async function getBlogCategoryForEdit(id: string): Promise<BlogCategoryEditData | null> {
  const [row] = await db.select().from(blog_category).where(eq(blog_category.id, id)).limit(1);
  if (!row) return null;
  const translations = await loadTranslationRows({ type: "blog_category", id });
  return {
    id: row.id,
    slug: row.slug,
    color: row.color ?? "#8a8178",
    position: row.position,
    name: translations.find(row => row.locale === SOURCE && row.field === "name")?.value ?? "",
    translations: rawBlogCategoryTranslations(translations),
  };
}

export async function listBlogCategoryOptions(): Promise<BlogReferenceOption[]> {
  const rows = await db
    .select({ id: blog_category.id, slug: blog_category.slug })
    .from(blog_category)
    .orderBy(asc(blog_category.position));
  return loadBlogReferenceOptions("blog_category", rows);
}

// ── Authors ──────────────────────────────────────────────────────────────────
export interface AuthorAdminListItem {
  id: string;
  name: string;
  slug: string;
  status: Status;
}

export async function listAuthorsAdmin(): Promise<AuthorAdminListItem[]> {
  const rows = await db
    .select({ id: author.id, slug: author.slug, status: author.status })
    .from(author)
    .orderBy(asc(author.slug));
  if (rows.length === 0) return [];
  const content = await loadContent(
    rows.map((r) => ({ type: "author", id: r.id })),
    SOURCE,
  );
  return rows.map((r) => ({
    id: r.id,
    name: content.get("author", r.id, "name") ?? r.slug,
    slug: r.slug,
    status: r.status,
  }));
}

export interface AuthorEditData {
  id: string;
  slug: string;
  status: Status;
  avatar_media_id: string | null;
  name: string;
  bio: string | null;
  translations?: import("../reference-locale-types").AuthorTranslations;
}

export interface AuthorEditBundle {
  data: AuthorEditData;
  previews: Record<string, AdminMediaPreview>;
}

export async function getAuthorForEdit(id: string): Promise<AuthorEditBundle | null> {
  const [row] = await db.select().from(author).where(eq(author.id, id)).limit(1);
  if (!row) return null;
  const translations = await loadTranslationRows({ type: "author", id });
  const data: AuthorEditData = {
    id: row.id,
    slug: row.slug,
    status: row.status,
    avatar_media_id: row.avatar_media_id,
    name: translations.find(row => row.locale === SOURCE && row.field === "name")?.value ?? "",
    bio: translations.find(row => row.locale === SOURCE && row.field === "bio")?.value ?? null,
    translations: rawAuthorTranslations(translations),
  };
  const previews = await resolvePreviews([row.avatar_media_id]);
  return { data, previews };
}

export async function listAuthorOptions(): Promise<BlogReferenceOption[]> {
  const rows = await db
    .select({ id: author.id, slug: author.slug })
    .from(author)
    .orderBy(asc(author.slug));
  return loadBlogReferenceOptions("author", rows);
}

// ── Posts ────────────────────────────────────────────────────────────────────
export interface PostAdminListItem {
  id: string;
  title: string;
  slug: string;
  status: Status;
  category: string;
  isFeatured: boolean;
  publishedAt: string | null;
  localeStates?: Partial<Record<Locale, { published: boolean; draft: boolean }>>;
}

export async function listPostsAdmin(): Promise<PostAdminListItem[]> {
  const rows = await db
    .select({
      id: blog_post.id,
      slug: blog_post.slug,
      status: blog_post.status,
      category_id: blog_post.category_id,
      is_featured: blog_post.is_featured,
      published_at: blog_post.published_at,
    })
    .from(blog_post)
    .orderBy(desc(blog_post.published_at), desc(blog_post.created_at), asc(blog_post.id));
  if (rows.length === 0) return [];

  const [snapshots, legacyRows] = await Promise.all([
    db.select().from(blog_post_locale_content).where(inArray(blog_post_locale_content.post_id, rows.map(row => row.id))),
    loadTranslationRows({ type: BLOG_POST }),
  ]);
  const categoryIds = [...new Set([
    ...rows.map(row => row.category_id),
    ...snapshots.flatMap(row => [row.draft?.content.category_id, row.published?.content.category_id].filter((id): id is string => Boolean(id))),
  ])];
  const content = await loadContent([
    ...rows.map(row => ({ type: BLOG_POST, id: row.id })),
    ...categoryIds.map(id => ({ type: "blog_category", id })),
  ], SOURCE);
  // Bootstrap imports these pending target fields as drafts. Show that work in
  // the list before the first write, without initializing any snapshot on GET.
  const importedFields = new Set(["title", "excerpt", "body", "cta_label", "meta_title", "meta_description"]);
  const pendingLegacy = new Set(legacyRows
    .filter(row => row.locale !== "en" && row.state !== "approved" && importedFields.has(row.field))
    .map(row => `${row.entity_id}:${row.locale}`));

  return rows.map((r) => {
    const own = snapshots.filter(row => row.post_id === r.id);
    const en = own.find(row => row.locale === "en");
    const doc = en?.draft ?? en?.published;
    return {
      id: r.id, title: doc?.content.title || content.get(BLOG_POST, r.id, "title") || r.slug,
      slug: r.slug,
      status: r.status === "archived" ? "archived" as const : own.length ? own.some(row => row.published) ? "published" as const : "draft" as const : r.status,
      category: content.get("blog_category", doc?.content.category_id ?? r.category_id, "name") ?? "",
      isFeatured: doc?.content.is_featured ?? r.is_featured,
      publishedAt: doc?.content.published_at ?? r.published_at?.toISOString() ?? null,
      localeStates: Object.fromEntries((["en", "es", "pt", "fr"] as const).map(locale => {
        const row = own.find(row => row.locale === locale);
        return [locale, row ? { published: r.status !== "archived" && Boolean(row.published), draft: Boolean(row.draft) } : { published: r.status === "published", draft: r.status !== "published" || pendingLegacy.has(`${r.id}:${locale}`) }];
      })),
    };
  });
}

export interface PostEditData {
  id: string;
  slug: string;
  status: Status;
  category_id: string;
  author_id: string;
  cover_media_id: string | null;
  og_image_media_id: string | null;
  published_at: string | null;
  reading_minutes: number | null;
  is_featured: boolean;
  cta_label: string | null;
  cta_url: string | null;
  title: string;
  excerpt: string;
  body: PostBody;
  meta_title: string | null;
  meta_description: string | null;
  related_ids: string[];
}

export interface PostEditBundle {
  data: PostEditData;
  previews: Record<string, AdminMediaPreview>;
}

export async function getPostForEdit(id: string): Promise<PostEditBundle | null> {
  const [row] = await db.select().from(blog_post).where(eq(blog_post.id, id)).limit(1);
  if (!row) return null;

  const relRows = await db
    .select({ related_post_id: blog_post_related.related_post_id })
    .from(blog_post_related)
    .where(eq(blog_post_related.post_id, id))
    .orderBy(asc(blog_post_related.position));

  const content = await loadContent([{ type: BLOG_POST, id }], SOURCE);

  const body = parseBody(content.get(BLOG_POST, id, "body"));
  const bodyImageIds = body
    .filter((b): b is Extract<PostBody[number], { type: "image" }> => b.type === "image")
    .map((b) => b.media_id);

  const data: PostEditData = {
    id: row.id,
    slug: row.slug,
    status: row.status,
    category_id: row.category_id,
    author_id: row.author_id,
    cover_media_id: row.cover_media_id,
    og_image_media_id: row.og_image_media_id,
    published_at: row.published_at ? row.published_at.toISOString() : null,
    reading_minutes: row.reading_minutes,
    is_featured: row.is_featured,
    cta_label: content.get(BLOG_POST, id, "cta_label") ?? null,
    cta_url: row.cta_url,
    title: content.get(BLOG_POST, id, "title") ?? "",
    excerpt: content.get(BLOG_POST, id, "excerpt") ?? "",
    body,
    meta_title: content.get(BLOG_POST, id, "meta_title") ?? null,
    meta_description: content.get(BLOG_POST, id, "meta_description") ?? null,
    related_ids: relRows.map((r) => r.related_post_id),
  };

  const previews = await resolvePreviews([row.cover_media_id, row.og_image_media_id, ...bodyImageIds]);
  return { data, previews };
}

/** `{ id, title }` options of every post (for the related-post selector). */
export async function listPostOptions(): Promise<{ id: string; title: string }[]> {
  return (await listPostsAdmin()).map(row => ({ id: row.id, title: row.title }));
}

export { getPostEditorialModel };

// ── Helpers ──────────────────────────────────────────────────────────────────
function parseBody(raw: string | undefined): PostBody {
  if (!raw) return [];
  try {
    const parsed = postBody.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

async function resolvePreviews(ids: (string | null)[]): Promise<Record<string, AdminMediaPreview>> {
  const clean = Array.from(new Set(ids.filter((x): x is string => !!x)));
  if (clean.length === 0) return {};
  const assets = await loadMedia(clean);
  const out: Record<string, AdminMediaPreview> = {};
  for (const [mid, a] of assets) {
    out[mid] = { id: mid, url: mediaUrl(a.r2_key), width: a.width, height: a.height, mime: a.mime };
  }
  return out;
}
