import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import { deleteContent, deleteSlugs, loadTranslationRows } from "@core/i18n";
import { saveOwnerMediaAlts } from "@core/media/owner-alt-write";
import { author, blog_category, blog_post } from "../schema";
import { savePostDraft, publishPostDraft } from "../server/post-locale-store";
import { emptyBlogEnvelope, postLocaleModel } from "../server/post-locale-model";
import { readPostIdentity, readPostLocaleRows } from "../server/post-locale-bootstrap";
import { getPostBySlug, listPosts } from "../server/queries";
import { getAuthorForEdit } from "../admin/queries";
import type { BlogPostEditorialResult, BlogPostLocaleModel } from "../editorial-types";

const CATEGORY = "e8620000-0000-4000-8000-000000000001";
const AUTHOR = "e8620000-0000-4000-8000-000000000002";
const POST = "e8620000-0000-4000-8000-000000000003";
const OTHER = "e8620000-0000-4000-8000-000000000004";
const OWN = [CATEGORY, AUTHOR, POST, OTHER];
const PHOTO = "d3000000-0000-4000-8000-000000000001";
const actor = "image-alt-blog-test";
let owned = false;
function success(result: BlogPostEditorialResult): BlogPostLocaleModel {
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) throw new Error("Expected success");
  return result.model;
}
async function current(id: string, locale: "en" | "es") {
  const identity = await readPostIdentity(id);
  assert.ok(identity);
  return postLocaleModel(await readPostLocaleRows(identity), locale, emptyBlogEnvelope(identity));
}
before(async () => {
  assert.equal(new URL(process.env.DATABASE_URL!).hostname, "propertylocalesqa.local");
  const identity = await db.execute(sql`select current_database() as database, current_user as role`);
  assert.deepEqual(identity.rows[0], { database: "propertylocalesqa", role: "propertylocalesqa" });
  const guard = await db.execute(sql`select count(*)::int as n from (
    select id from author where id in (${AUTHOR}::uuid)
    union all select id from blog_category where id in (${CATEGORY}::uuid)
    union all select id from blog_post where id in (${POST}::uuid,${OTHER}::uuid)
    union all select entity_id from translation where entity_id in (${CATEGORY}::uuid,${AUTHOR}::uuid,${POST}::uuid,${OTHER}::uuid)
    union all select entity_id from slug where entity_id in (${CATEGORY}::uuid,${AUTHOR}::uuid,${POST}::uuid,${OTHER}::uuid)
  ) own`);
  assert.equal(guard.rows[0]?.n, 0, "Own fixture IDs must be absent; never reset prior rows");
  owned = true;
  await db.insert(blog_category).values({ id: CATEGORY, slug: "image-alt-qa-category" });
  await db.insert(author).values({ id: AUTHOR, slug: "image-alt-qa-author", status: "published" });
});
after(async () => {
  if (!owned) return;
  await db.delete(blog_post).where(inArray(blog_post.id, [POST, OTHER]));
  await db.delete(author).where(eq(author.id, AUTHOR));
  await db.delete(blog_category).where(eq(blog_category.id, CATEGORY));
  for (const id of OWN) {
    for (const type of ["blog_post", "author", "blog_category"]) {
      await deleteContent(type, id);
      await deleteSlugs(type, id);
    }
  }
});

test("actual Blog Save/Publish keeps draft ALT private, publishes per locale and isolates reused photos", async () => {
  const envelope = emptyBlogEnvelope({ category_id: CATEGORY, author_id: AUTHOR });
  Object.assign(envelope.content, {
    title: "Image ALT QA", excerpt: "Excerpt", body: [{ type: "paragraph", text: "Body" }],
    cover_media_id: PHOTO, og_image_media_id: PHOTO, media_alts: { [PHOTO]: "English published photo" },
  });
  let en = success(await savePostDraft({ postId: POST, locale: "en", expectedRevision: 0, templateRevision: null,
    payload: envelope, slug: "image-alt-qa-post" }, actor));
  assert.equal(await getPostBySlug("en", "image-alt-qa-post"), null);
  en = success(await publishPostDraft({ postId: POST, locale: "en", expectedRevision: en.revision }, actor));
  assert.equal((await getPostBySlug("en", "image-alt-qa-post"))?.cover?.alt, "English published photo");
  assert.equal((await getPostBySlug("en", "image-alt-qa-post"))?.ogImage?.alt, "English published photo");
  assert.equal((await listPosts("en")).find(p => p.id === POST)?.cover?.alt, "English published photo");
  const es = await current(POST, "es");
  const esPayload = structuredClone(es.working);
  esPayload.content.media_alts = { [PHOTO]: "Foto publicada en español" };
  const esDraft = success(await savePostDraft({ postId: POST, locale: "es", expectedRevision: es.revision,
    templateRevision: es.templateRevision, payload: esPayload }, actor));
  const esBefore = await getPostBySlug("es", "image-alt-qa-post");
  assert.equal(esBefore, null);
  success(await publishPostDraft({ postId: POST, locale: "es", expectedRevision: esDraft.revision }, actor));
  assert.equal((await getPostBySlug("es", "image-alt-qa-post"))?.cover?.alt, "Foto publicada en español");
  const enPayload = structuredClone(en.working);
  enPayload.content.media_alts = { [PHOTO]: "English draft only" };
  en = success(await savePostDraft({ postId: POST, locale: "en", expectedRevision: en.revision,
    templateRevision: null, payload: enPayload }, actor));
  assert.equal((await getPostBySlug("en", "image-alt-qa-post"))?.cover?.alt, "English published photo");
  success(await publishPostDraft({ postId: POST, locale: "en", expectedRevision: en.revision }, actor));
  assert.equal((await getPostBySlug("en", "image-alt-qa-post"))?.cover?.alt, "English draft only");
  assert.equal((await getPostBySlug("es", "image-alt-qa-post"))?.cover?.alt, "Foto publicada en español");
  const second = structuredClone(envelope);
  second.content.media_alts = { [PHOTO]: "Different context for same photo" };
  const other = success(await savePostDraft({ postId: OTHER, locale: "en", expectedRevision: 0,
    templateRevision: null, payload: second, slug: "image-alt-qa-other" }, actor));
  success(await publishPostDraft({ postId: OTHER, locale: "en", expectedRevision: other.revision }, actor));
  assert.equal((await getPostBySlug("en", "image-alt-qa-other"))?.cover?.alt, "Different context for same photo");
  assert.equal((await getPostBySlug("en", "image-alt-qa-post"))?.cover?.alt, "English draft only");
});

test("Author raw ALT loads all language values, manual Save owns selected image only and omission preserves rows", async () => {
  await db.update(author).set({ avatar_media_id: PHOTO }).where(eq(author.id, AUTHOR));
  await saveOwnerMediaAlts("author", AUTHOR, PHOTO, { en: "Portrait", es: "Retrato", pt: "", fr: "" }, actor);
  const edit = await getAuthorForEdit(AUTHOR);
  assert.deepEqual(edit?.data.avatar_alts, { en: "Portrait", es: "Retrato", pt: "", fr: "" });
  const before = await loadTranslationRows({ type: "author", id: AUTHOR });
  await saveOwnerMediaAlts("author", AUTHOR, PHOTO, undefined, actor);
  assert.deepEqual(await loadTranslationRows({ type: "author", id: AUTHOR }), before);
  await saveOwnerMediaAlts("author", AUTHOR, PHOTO, { en: "New portrait", es: "Retrato", pt: "", fr: "" }, actor);
  assert.equal((await getAuthorForEdit(AUTHOR))?.data.avatar_alts?.es, "Retrato");
});
