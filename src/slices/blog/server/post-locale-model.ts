import "server-only";
import type { Locale } from "@core/db/columns";
import { loadMedia, mediaUrl } from "@core/media";
import { requireStaff } from "@core/auth";
import { BLOG_EDITOR_LOCALES, type BlogPostEnvelopeV1, type BlogPostLocaleModel, type BlogPostEditorialModel } from "../editorial-types";
import { LegacyPostError, readPostIdentity, readPostLocaleRows, postSlugMap, type PostLocaleRow, type PostIdentity } from "./post-locale-bootstrap";
import { blogMediaIds, checkBlogEnvelope, prepareBlogTarget } from "./post-locale-validation";

export function emptyBlogEnvelope(identity: Pick<PostIdentity, "category_id" | "author_id">): BlogPostEnvelopeV1 {
  return { schemaVersion: 1, content: { title: "", excerpt: "", body: [], category_id: identity.category_id, author_id: identity.author_id,
    cover_media_id: null, og_image_media_id: null, published_at: null, reading_minutes: 5, is_featured: false,
    related_ids: [], cta_label: null, cta_url: null, meta_title: null, meta_description: null } };
}
export function postLocaleModel(rows: PostLocaleRow[], locale: Locale, empty: BlogPostEnvelopeV1): BlogPostLocaleModel {
  const row = rows.find(row => row.locale === locale);
  const en = rows.find(row => row.locale === "en");
  const template = en?.draft ?? en?.published ?? empty;
  const own = row?.published ?? null;
  for (const envelope of [row?.draft, own, template]) {
    if (envelope && !checkBlogEnvelope(envelope).envelope) throw new LegacyPostError();
  }
  return {
    locale, revision: row?.revision ?? 0,
    templateRevision: locale !== "en" && !row?.draft ? (en?.revision ?? 0) : null,
    published: own, draft: row?.draft ?? null,
    working: structuredClone(row?.draft ?? (locale === "en" ? own ?? empty : prepareBlogTarget(template, own))),
  };
}
/** Staff-only read. A GET never initializes or writes the baseline. */
export async function getPostEditorialModel(id: string): Promise<BlogPostEditorialModel | null> {
  await requireStaff();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  const identity = await readPostIdentity(id);
  if (!identity) return null;
  const [rows, slugByLocale] = await Promise.all([readPostLocaleRows(identity), postSlugMap(id)]);
  const empty = emptyBlogEnvelope(identity);
  const locales = Object.fromEntries(BLOG_EDITOR_LOCALES.map(locale => [locale, postLocaleModel(rows, locale, empty)])) as BlogPostEditorialModel["locales"];
  const mediaIds = BLOG_EDITOR_LOCALES.flatMap(locale => [locales[locale].working, locales[locale].published].flatMap(value => value ? blogMediaIds(value) : []));
  const assets = await loadMedia(mediaIds);
  const previews = Object.fromEntries([...assets].map(([id, asset]) => [id, { id, url: mediaUrl(asset.r2_key), width: asset.width, height: asset.height, mime: asset.mime }]));
  return { id, archived: identity.status === "archived", slugByLocale, locales, previews };
}
