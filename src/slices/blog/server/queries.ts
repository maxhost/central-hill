import "server-only";
import { unstable_cache } from "next/cache";
import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "@core/db/client";
import type { Locale } from "@core/db/columns";
import { loadAlternateSlugs, loadContent, loadSlugs, loadTranslationRows, resolveSlug } from "@core/i18n";
import { slug as slugTable } from "@core/i18n/schema";
import { type MediaAsset, type MediaImageData, loadMedia, mediaUrl } from "@core/media";
import { BLOG_POST, BLOG_TAGS, type AuthorRef, type CategoryRef, type PostDetail, type PostSummary } from "../contract";
import type { BlogPostEnvelopeV1 } from "../editorial-types";
import { author, blog_category, blog_post, blog_post_locale_content, blog_post_related } from "../schema";
import { legacyBlogEnvelope } from "./post-locale-bootstrap";
import { blogMediaIds } from "./post-locale-validation";

export interface PublishedPostDocument { id: string; envelope: BlogPostEnvelopeV1 }
/** Read only. A present locale row with published=NULL is intentionally invisible. */
export async function readPublishedPostDocuments(locale: Locale, ids?: string[]): Promise<PublishedPostDocument[]> {
  if (ids && !ids.length) return [];
  const rows = await db.select({ identity: blog_post, snapshot: blog_post_locale_content })
    .from(blog_post).leftJoin(blog_post_locale_content, and(eq(blog_post_locale_content.post_id, blog_post.id), eq(blog_post_locale_content.locale, locale)))
    .where(and(ne(blog_post.status, "archived"), ids ? inArray(blog_post.id, ids) : undefined));
  const legacyIds = rows.filter(row => !row.snapshot && row.identity.status === "published").map(row => row.identity.id);
  const [translations, related] = legacyIds.length ? await Promise.all([
    loadTranslationRows({ type: BLOG_POST }),
    db.select().from(blog_post_related).where(inArray(blog_post_related.post_id, legacyIds)).orderBy(blog_post_related.position),
  ]) : [[], []];
  return rows.flatMap(({ identity, snapshot }) => {
    if (snapshot) return snapshot.published ? [{ id: identity.id, envelope: snapshot.published }] : [];
    if (identity.status !== "published") return [];
    return [{ id: identity.id, envelope: legacyBlogEnvelope(identity, translations.filter(row => row.entity_id === identity.id), related.filter(row => row.post_id === identity.id).map(row => row.related_post_id), locale, false, false) }];
  });
}
function imageData(asset: MediaAsset | undefined, alt: string): MediaImageData | null {
  return asset ? { url: mediaUrl(asset.r2_key), width: asset.width ?? 1600, height: asset.height ?? 1200, alt, blurhash: asset.blurhash } : null;
}
/** References are resolved from each snapshot, never the live identity's old columns. */
async function resolveSummaries(documents: PublishedPostDocument[], locale: Locale): Promise<PostSummary[]> {
  if (!documents.length) return [];
  const categoryIds = [...new Set(documents.map(row => row.envelope.content.category_id))];
  const authorIds = [...new Set(documents.map(row => row.envelope.content.author_id))];
  const mediaIds = documents.flatMap(row => row.envelope.content.cover_media_id ? [row.envelope.content.cover_media_id] : []);
  const [categories, authors, content, slugs, media] = await Promise.all([
    db.select().from(blog_category).where(inArray(blog_category.id, categoryIds)),
    db.select().from(author).where(inArray(author.id, authorIds)),
    loadContent([...categoryIds.map(id => ({ type: "blog_category", id })), ...authorIds.map(id => ({ type: "author", id })), ...mediaIds.map(id => ({ type: "media_asset", id }))], locale),
    loadSlugs(BLOG_POST, documents.map(row => row.id), locale), loadMedia(mediaIds),
  ]);
  return documents.flatMap(({ id, envelope }) => {
    const c = envelope.content;
    const cat = categories.find(row => row.id === c.category_id);
    const auth = authors.find(row => row.id === c.author_id);
    const slug = slugs.get(id);
    if (!cat || !auth || !slug) return [];
    const category: CategoryRef = { id: cat.id, slug: cat.slug, color: cat.color ?? "#8a8178", name: content.get("blog_category", cat.id, "name") ?? cat.slug };
    const authorRef: AuthorRef = { id: auth.id, slug: auth.slug, name: content.get("author", auth.id, "name") ?? auth.slug };
    const bio = content.get("author", auth.id, "bio")?.trim();
    if (bio) authorRef.bio = bio;
    return [{ id, slug, title: c.title, excerpt: c.excerpt, category, author: authorRef,
      cover: c.cover_media_id ? imageData(media.get(c.cover_media_id), content.get("media_asset", c.cover_media_id, "alt") ?? c.title) : null,
      readingMinutes: c.reading_minutes, isFeatured: c.is_featured, publishedAt: c.published_at }];
  });
}
async function listPublishedPosts(locale: Locale): Promise<PostSummary[]> {
  const documents = await readPublishedPostDocuments(locale);
  documents.sort((a, b) => (b.envelope.content.published_at ?? "").localeCompare(a.envelope.content.published_at ?? ""));
  return resolveSummaries(documents, locale);
}
export function listPosts(locale: Locale): Promise<PostSummary[]> {
  return unstable_cache(() => listPublishedPosts(locale), ["blog:listPosts", locale], { tags: [BLOG_TAGS.list] })();
}
export function getFeaturedPost(locale: Locale): Promise<PostSummary | null> {
  return unstable_cache(async () => (await listPublishedPosts(locale)).find(post => post.isFeatured) ?? null, ["blog:getFeaturedPost", locale], { tags: [BLOG_TAGS.list] })();
}
export function listCategories(locale: Locale): Promise<CategoryRef[]> {
  return unstable_cache(async () => {
    const rows = await db.select().from(blog_category).orderBy(blog_category.position);
    const content = await loadContent(rows.map(row => ({ type: "blog_category", id: row.id })), locale);
    return rows.map(row => ({ id: row.id, slug: row.slug, name: content.get("blog_category", row.id, "name") ?? row.slug, color: row.color ?? "#8a8178" }));
  }, ["blog:listCategories", locale], { tags: [BLOG_TAGS.list] })();
}
/** Also used privately with an injected document; it never writes or reads draft data. */
export async function resolvePostDocument(id: string, envelope: BlogPostEnvelopeV1, locale: Locale, slugOverride?: string): Promise<PostDetail | null> {
  const summaries = await resolveSummaries([{ id, envelope }], locale);
  let summary = summaries[0];
  // Unsaved posts have no reserved slug. Resolve references using the same mapping,
  // with a temporary read-only summary assembled below for private preview.
  if (!summary && slugOverride !== undefined) {
    const c = envelope.content;
    const [cats, authors, labels] = await Promise.all([
      db.select().from(blog_category).where(eq(blog_category.id, c.category_id)).limit(1),
      db.select().from(author).where(eq(author.id, c.author_id)).limit(1),
      loadContent([{ type: "blog_category", id: c.category_id }, { type: "author", id: c.author_id }], locale),
    ]);
    const cat = cats[0], auth = authors[0];
    if (!cat || !auth) return null;
    summary = { id, slug: slugOverride, title: c.title, excerpt: c.excerpt,
      category: { id: cat.id, slug: cat.slug, color: cat.color ?? "#8a8178", name: labels.get("blog_category", cat.id, "name") ?? cat.slug },
      author: { id: auth.id, slug: auth.slug, name: labels.get("author", auth.id, "name") ?? auth.slug, bio: labels.get("author", auth.id, "bio") },
      cover: null, publishedAt: c.published_at, readingMinutes: c.reading_minutes, isFeatured: c.is_featured };
  }
  if (!summary) return null;
  const c = envelope.content;
  const mediaIds = blogMediaIds(envelope);
  const [media, alt, relatedDocs, rawAlternates] = await Promise.all([
    loadMedia(mediaIds), loadContent(mediaIds.map(id => ({ type: "media_asset", id })), locale),
    readPublishedPostDocuments(locale, c.related_ids), loadAlternateSlugs(BLOG_POST, id),
  ]);
  const bodyMedia = Object.fromEntries(mediaIds.flatMap(mid => {
    const img = imageData(media.get(mid), alt.get("media_asset", mid, "alt") ?? "");
    return img ? [[mid, img]] : [];
  }));
  if (c.cover_media_id) summary = { ...summary, cover: imageData(media.get(c.cover_media_id), alt.get("media_asset", c.cover_media_id, "alt") ?? c.title) };
  const relatedSummaries = await resolveSummaries(relatedDocs, locale);
  const relatedById = new Map(relatedSummaries.map(post => [post.id, post]));
  const alternates: PostDetail["alternateSlugs"] = {};
  for (const [language, slug] of Object.entries(rawAlternates)) {
    if ((await readPublishedPostDocuments(language as Locale, [id])).length) alternates[language as Locale] = slug;
  }
  return { ...summary, slug: slugOverride ?? summary.slug, body: c.body, bodyMedia,
    cta: c.cta_label && c.cta_url ? { label: c.cta_label, url: c.cta_url } : null,
    metaTitle: c.meta_title ?? undefined, metaDescription: c.meta_description ?? undefined,
    ogImage: c.og_image_media_id ? imageData(media.get(c.og_image_media_id), c.title) ?? summary.cover : summary.cover,
    related: c.related_ids.flatMap(rid => relatedById.has(rid) ? [relatedById.get(rid)!] : []), alternateSlugs: alternates };
}
export function getPostBySlug(locale: Locale, slugValue: string): Promise<PostDetail | null> {
  return unstable_cache(async () => {
    const id = await resolveSlug(BLOG_POST, locale, slugValue);
    if (!id) return null;
    const [document] = await readPublishedPostDocuments(locale, [id]);
    return document ? resolvePostDocument(id, document.envelope, locale) : null;
  }, ["blog:getPostBySlug", locale, slugValue], { tags: [BLOG_TAGS.list] })();
}
export async function listPostParams(): Promise<Array<{ locale: Locale; slug: string }>> {
  const slugs = await db.select({ entity_id: slugTable.entity_id, locale: slugTable.locale, slug: slugTable.slug }).from(slugTable).where(eq(slugTable.entity_type, BLOG_POST));
  const output: Array<{ locale: Locale; slug: string }> = [];
  for (const locale of ["en", "es", "pt", "fr"] as const) {
    const visible = new Set((await readPublishedPostDocuments(locale)).map(row => row.id));
    for (const row of slugs) if (row.locale === locale && visible.has(row.entity_id)) output.push({ locale, slug: row.slug });
  }
  return output;
}
