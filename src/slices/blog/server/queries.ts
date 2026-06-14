import "server-only";
import { unstable_cache } from "next/cache";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@core/db/client";
import type { Locale } from "@core/db/columns";
import {
  type ContentRef,
  type ContentResolver,
  loadAlternateSlugs,
  loadContent,
  loadSlugs,
  resolveSlug,
} from "@core/i18n/content";
import { slug as slugTable } from "@core/i18n/schema";
import { type MediaAsset, type MediaImageData, loadMedia, mediaUrl } from "@core/media";
import { BLOG_POST, BLOG_TAGS } from "../contract";
import type { AuthorRef, CategoryRef, PostDetail, PostSummary } from "../contract";
import { type PostBody, postBody } from "../body";
import { author, blog_category, blog_post, blog_post_related } from "../schema";

/**
 * Public read functions for slice `blog` (conventions.md → reads go through typed,
 * cache-tagged `server/` functions; never the DB at request time). Each is wrapped
 * in `unstable_cache` keyed by locale and tagged `blog_post-list` so a publish
 * busts them (see `./publish`). Translatable fields resolve via `core/i18n`.
 */

// ── Row shapes ───────────────────────────────────────────────────────────────
interface PostRow {
  id: string;
  published_at: Date | null;
  cover_media_id: string | null;
  reading_minutes: number | null;
  is_featured: boolean;
  cat_id: string;
  cat_slug: string;
  cat_color: string | null;
  auth_id: string;
  auth_slug: string;
}

const summarySelect = {
  id: blog_post.id,
  published_at: blog_post.published_at,
  cover_media_id: blog_post.cover_media_id,
  reading_minutes: blog_post.reading_minutes,
  is_featured: blog_post.is_featured,
  cat_id: blog_category.id,
  cat_slug: blog_category.slug,
  cat_color: blog_category.color,
  auth_id: author.id,
  auth_slug: author.slug,
} as const;

function summaryQuery() {
  return db
    .select(summarySelect)
    .from(blog_post)
    .innerJoin(blog_category, eq(blog_post.category_id, blog_category.id))
    .innerJoin(author, eq(blog_post.author_id, author.id));
}

// ── Mapping helpers ──────────────────────────────────────────────────────────
interface SummaryCtx {
  content: ContentResolver;
  slugs: Map<string, string>;
  media: Map<string, MediaAsset>;
}

const DEFAULT_W = 1600;
const DEFAULT_H = 1200;

function toImageData(asset: MediaAsset | undefined, alt: string): MediaImageData | null {
  if (!asset) return null;
  return {
    url: mediaUrl(asset.r2_key),
    width: asset.width ?? DEFAULT_W,
    height: asset.height ?? DEFAULT_H,
    alt,
    blurhash: asset.blurhash,
  };
}

async function buildCtx(rows: PostRow[], locale: Locale): Promise<SummaryCtx> {
  const refs: ContentRef[] = [];
  const coverIds: string[] = [];
  const postIds: string[] = [];
  for (const r of rows) {
    postIds.push(r.id);
    refs.push({ type: BLOG_POST, id: r.id });
    refs.push({ type: "blog_category", id: r.cat_id });
    refs.push({ type: "author", id: r.auth_id });
    if (r.cover_media_id) {
      refs.push({ type: "media_asset", id: r.cover_media_id });
      coverIds.push(r.cover_media_id);
    }
  }

  const [content, slugs, media] = await Promise.all([
    loadContent(refs, locale),
    loadSlugs(BLOG_POST, postIds, locale),
    loadMedia(coverIds),
  ]);

  return { content, slugs, media };
}

function mapSummary(row: PostRow, ctx: SummaryCtx): PostSummary {
  const { content, slugs, media } = ctx;
  const title = content.get(BLOG_POST, row.id, "title") ?? "";

  const category: CategoryRef = {
    id: row.cat_id,
    slug: row.cat_slug,
    name: content.get("blog_category", row.cat_id, "name") ?? row.cat_slug,
    color: row.cat_color ?? "#8a8178",
  };
  const authorRef: AuthorRef = {
    id: row.auth_id,
    slug: row.auth_slug,
    name: content.get("author", row.auth_id, "name") ?? row.auth_slug,
  };

  const cover = row.cover_media_id
    ? toImageData(
        media.get(row.cover_media_id),
        content.get("media_asset", row.cover_media_id, "alt") ?? title,
      )
    : null;

  return {
    id: row.id,
    slug: slugs.get(row.id) ?? "",
    title,
    excerpt: content.get(BLOG_POST, row.id, "excerpt") ?? "",
    category,
    author: authorRef,
    cover,
    readingMinutes: row.reading_minutes,
    isFeatured: row.is_featured,
    publishedAt: row.published_at ? row.published_at.toISOString() : null,
  };
}

// ── Public, cache-wrapped reads ──────────────────────────────────────────────
async function _listPosts(locale: Locale): Promise<PostSummary[]> {
  const rows = await summaryQuery()
    .where(eq(blog_post.status, "published"))
    .orderBy(desc(blog_post.published_at));
  const ctx = await buildCtx(rows, locale);
  return rows.map((r) => mapSummary(r, ctx));
}

export function listPosts(locale: Locale): Promise<PostSummary[]> {
  return unstable_cache(() => _listPosts(locale), ["blog:listPosts", locale], {
    tags: [BLOG_TAGS.list],
  })();
}

async function _listCategories(locale: Locale): Promise<CategoryRef[]> {
  const rows = await db
    .select({ id: blog_category.id, slug: blog_category.slug, color: blog_category.color })
    .from(blog_category)
    .orderBy(blog_category.position);
  const content = await loadContent(
    rows.map((r) => ({ type: "blog_category", id: r.id })),
    locale,
  );
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: content.get("blog_category", r.id, "name") ?? r.slug,
    color: r.color ?? "#8a8178",
  }));
}

export function listCategories(locale: Locale): Promise<CategoryRef[]> {
  return unstable_cache(() => _listCategories(locale), ["blog:listCategories", locale], {
    tags: [BLOG_TAGS.list],
  })();
}

async function _getFeaturedPost(locale: Locale): Promise<PostSummary | null> {
  const rows = await summaryQuery()
    .where(and(eq(blog_post.status, "published"), eq(blog_post.is_featured, true)))
    .orderBy(desc(blog_post.published_at))
    .limit(1);
  if (rows.length === 0) return null;
  const ctx = await buildCtx(rows, locale);
  return mapSummary(rows[0]!, ctx);
}

export function getFeaturedPost(locale: Locale): Promise<PostSummary | null> {
  return unstable_cache(() => _getFeaturedPost(locale), ["blog:getFeaturedPost", locale], {
    tags: [BLOG_TAGS.list],
  })();
}

async function _getPostBySlug(locale: Locale, slugValue: string): Promise<PostDetail | null> {
  const id = await resolveSlug(BLOG_POST, locale, slugValue);
  if (!id) return null;

  const detailRows = await db
    .select({
      ...summarySelect,
      cta_label: blog_post.cta_label,
      cta_url: blog_post.cta_url,
      og_image_media_id: blog_post.og_image_media_id,
    })
    .from(blog_post)
    .innerJoin(blog_category, eq(blog_post.category_id, blog_category.id))
    .innerJoin(author, eq(blog_post.author_id, author.id))
    .where(and(eq(blog_post.id, id), eq(blog_post.status, "published")))
    .limit(1);

  const detail = detailRows[0];
  if (!detail) return null;

  // Related posts (curated, ordered), published only.
  const relRows = await db
    .select({ related_post_id: blog_post_related.related_post_id, position: blog_post_related.position })
    .from(blog_post_related)
    .where(eq(blog_post_related.post_id, id))
    .orderBy(blog_post_related.position);
  const relatedIds = relRows.map((r) => r.related_post_id);

  const relatedRows = relatedIds.length
    ? await summaryQuery().where(
        and(eq(blog_post.status, "published"), inArray(blog_post.id, relatedIds)),
      )
    : [];

  // One ctx for the main post + related (cover images, slugs, base [T] fields).
  const ctx = await buildCtx([detail, ...relatedRows], locale);
  const summary = mapSummary(detail, ctx);

  // Preserve curated order of related.
  const relById = new Map(relatedRows.map((r) => [r.id, mapSummary(r, ctx)]));
  const related = relatedIds.map((rid) => relById.get(rid)).filter((p): p is PostSummary => Boolean(p));

  // Body (portable JSON in the translation table, field 'body').
  let body: PostBody = [];
  const bodyRaw = ctx.content.get(BLOG_POST, id, "body");
  if (bodyRaw) {
    try {
      const parsed = postBody.safeParse(JSON.parse(bodyRaw));
      if (parsed.success) body = parsed.data;
    } catch {
      body = [];
    }
  }

  // Inline body images → resolve media + alt.
  const bodyImageIds = body
    .filter((b): b is Extract<PostBody[number], { type: "image" }> => b.type === "image")
    .map((b) => b.media_id);
  const bodyMedia: Record<string, MediaImageData> = {};
  if (bodyImageIds.length) {
    const [bodyMediaMap, bodyAlt] = await Promise.all([
      loadMedia(bodyImageIds),
      loadContent(
        bodyImageIds.map((mid) => ({ type: "media_asset", id: mid })),
        locale,
      ),
    ]);
    for (const mid of bodyImageIds) {
      const img = toImageData(bodyMediaMap.get(mid), bodyAlt.get("media_asset", mid, "alt") ?? "");
      if (img) bodyMedia[mid] = img;
    }
  }

  // CTA: label is [T] (fallback to column), url is a plain column.
  const ctaLabel = ctx.content.get(BLOG_POST, id, "cta_label") ?? detail.cta_label;
  const cta = ctaLabel && detail.cta_url ? { label: ctaLabel, url: detail.cta_url } : null;

  // OG image: explicit override, else cover.
  let ogImage = summary.cover;
  if (detail.og_image_media_id) {
    const ogMap = await loadMedia([detail.og_image_media_id]);
    ogImage =
      toImageData(
        ogMap.get(detail.og_image_media_id),
        ctx.content.get("media_asset", detail.og_image_media_id, "alt") ?? summary.title,
      ) ?? summary.cover;
  }

  const alternateSlugs = await loadAlternateSlugs(BLOG_POST, id);

  return {
    ...summary,
    body,
    bodyMedia,
    cta,
    metaTitle: ctx.content.get(BLOG_POST, id, "meta_title") ?? undefined,
    metaDescription: ctx.content.get(BLOG_POST, id, "meta_description") ?? undefined,
    ogImage,
    related,
    alternateSlugs,
  };
}

export function getPostBySlug(locale: Locale, slugValue: string): Promise<PostDetail | null> {
  return unstable_cache(
    () => _getPostBySlug(locale, slugValue),
    ["blog:getPostBySlug", locale, slugValue],
    { tags: [BLOG_TAGS.list] },
  )();
}

/** For `generateStaticParams`: every published post's slug, per locale. */
export async function listPostParams(): Promise<Array<{ locale: Locale; slug: string }>> {
  const rows = await db
    .select({ locale: slugTable.locale, slug: slugTable.slug })
    .from(slugTable)
    .innerJoin(blog_post, eq(slugTable.entity_id, blog_post.id))
    .where(and(eq(slugTable.entity_type, BLOG_POST), eq(blog_post.status, "published")));
  return rows.map((r) => ({ locale: r.locale, slug: r.slug }));
}
