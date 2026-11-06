import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { eq, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import { setSlugs, loadTranslationRows } from "@core/i18n";
import { blog_post, blog_post_locale_content } from "../schema";
import { savePostDraft, publishPostDraft, commitPostLocale, deletePostIdentityIfUnused } from "../server/post-locale-store";
import { bootstrapPostLocales, legacyPostLocaleRows, legacyBlogEnvelope, LegacyPostError, readPostIdentity, readPostLocaleRows } from "../server/post-locale-bootstrap";
import { emptyBlogEnvelope, postLocaleModel } from "../server/post-locale-model";
import type { BlogPostEditorialResult, BlogPostLocaleModel, BlogPostEnvelopeV1 } from "../editorial-types";
const CAT = "c1000000-0000-4000-8000-000000000001", AUTHOR = "c2000000-0000-4000-8000-000000000001", MEDIA = "c3000000-0000-4000-8000-000000000001";
const POST = "c4000000-0000-4000-8000-000000000001", LEGACY = "c4000000-0000-4000-8000-000000000002", BROKEN = "c4000000-0000-4000-8000-000000000003";
const RETRY = "c4000000-0000-4000-8000-000000000004";
const DELETE_SOURCE = "c5000000-0000-4000-8000-000000000001", DELETE_TARGET = "c5000000-0000-4000-8000-000000000002", RACE_TARGET = "c5000000-0000-4000-8000-000000000003";
const actor = "postlocalesqa-backend";
let verified = false;
function expectSuccess(result: BlogPostEditorialResult): BlogPostLocaleModel { assert.equal(result.ok, true, JSON.stringify(result)); if (!result.ok) throw Error("Unexpected failed action"); return result.model; }
async function model(id: string, locale: "en" | "es" | "pt" = "en") { const identity = await readPostIdentity(id); assert.ok(identity); return postLocaleModel(await readPostLocaleRows(identity), locale, emptyBlogEnvelope(identity)); }
function complete(envelope: BlogPostEnvelopeV1, title: string) { const next = structuredClone(envelope); Object.assign(next.content, { title, excerpt: `${title} intro`, body: [{ type: "paragraph", text: `${title} text` }], cover_media_id: MEDIA }); return next; }
async function save(id: string, current: BlogPostLocaleModel, payload = current.working) { return savePostDraft({ postId: id, locale: current.locale, expectedRevision: current.revision, templateRevision: current.templateRevision, payload }, actor); }
async function publish(id: string, current: BlogPostLocaleModel) { return publishPostDraft({ postId: id, locale: current.locale, expectedRevision: current.revision }, actor); }
before(async () => {
  const url = new URL(process.env.DATABASE_URL ?? "http://invalid.test");
  assert.equal(url.hostname, "postlocalesqa.local");
  const identity = await db.execute(sql`select current_database() as database,current_user as role`);
  assert.deepEqual(identity.rows[0], { database: "postlocalesqa", role: "postlocalesqa" });
  verified = true;
  // Dedicated IDs, never DELETE arbitrary rows or touch another fixture's namespace.
  await db.execute(sql`delete from blog_post where id in (${POST}::uuid,${LEGACY}::uuid,${BROKEN}::uuid,${RETRY}::uuid,${DELETE_SOURCE}::uuid,${DELETE_TARGET}::uuid,${RACE_TARGET}::uuid)`);
  await db.execute(sql`delete from translation where entity_id in (${POST}::uuid,${LEGACY}::uuid,${BROKEN}::uuid,${RETRY}::uuid,${DELETE_SOURCE}::uuid,${DELETE_TARGET}::uuid,${RACE_TARGET}::uuid)`);
  await db.execute(sql`delete from slug where entity_id in (${POST}::uuid,${LEGACY}::uuid,${BROKEN}::uuid,${RETRY}::uuid,${DELETE_SOURCE}::uuid,${DELETE_TARGET}::uuid,${RACE_TARGET}::uuid)`);
  await db.execute(sql`insert into blog_category(id,slug,color) values(${CAT}::uuid,'postlocales-backend','#888888') on conflict(id) do nothing`);
  await db.execute(sql`insert into author(id,slug,status) values(${AUTHOR}::uuid,'postlocales-backend','published') on conflict(id) do nothing`);
  await db.execute(sql`insert into media_asset(id,storage,r2_key,mime,width,height) values(${MEDIA}::uuid,'r2','backend-fixture.webp','image/webp',1200,800) on conflict(id) do nothing`);
});
after(async () => {
  if (!verified) return;
  await db.execute(sql`delete from blog_post where id in (${POST}::uuid,${LEGACY}::uuid,${BROKEN}::uuid,${RETRY}::uuid,${DELETE_SOURCE}::uuid,${DELETE_TARGET}::uuid,${RACE_TARGET}::uuid)`);
  await db.execute(sql`delete from translation where entity_id in (${POST}::uuid,${LEGACY}::uuid,${BROKEN}::uuid,${RETRY}::uuid,${DELETE_SOURCE}::uuid,${DELETE_TARGET}::uuid,${RACE_TARGET}::uuid)`);
  await db.execute(sql`delete from slug where entity_id in (${POST}::uuid,${LEGACY}::uuid,${BROKEN}::uuid,${RETRY}::uuid,${DELETE_SOURCE}::uuid,${DELETE_TARGET}::uuid,${RACE_TARGET}::uuid)`);
});
test("First EN save preserves unfinished draft and creates four invisible snapshots; replay is stale", async () => {
  const empty = emptyBlogEnvelope({ category_id: CAT, author_id: AUTHOR });
  empty.content.body = [{ type: "paragraph", text: "" }];
  const request = { postId: POST, locale: "en" as const, expectedRevision: 0, templateRevision: null, payload: empty, slug: "postlocales-backend-new" };
  const saved = expectSuccess(await savePostDraft(request, actor)); assert.equal(saved.revision, 1);
  const rows = await db.select().from(blog_post_locale_content).where(eq(blog_post_locale_content.post_id, POST));
  assert.equal(rows.length, 4); assert.ok(rows.every(row => row.published === null));
  assert.deepEqual((await model(POST)).draft, empty);
  assert.deepEqual(await savePostDraft(request, actor), { ok: false, error: "conflict" });
  const invalid = await publish(POST, saved); assert.equal(invalid.ok, false); if (!invalid.ok) assert.equal(invalid.error, "validation");
});
test("Publish ES before EN and save/reload preserves drafts; EN shared changes do not mutate ES", async () => {
  const en = await model(POST); const enSaved = expectSuccess(await save(POST, en, complete(en.working, "English draft")));
  const es = await model(POST, "es"); const esDoc = complete(es.working, "Artículo ES"); esDoc.content.cta_label = "Reservar"; esDoc.content.cta_url = "https://example.test/es";
  const esSaved = expectSuccess(await save(POST, es, esDoc));
  const esPublished = expectSuccess(await publish(POST, esSaved)); assert.equal(esPublished.draft, null);
  assert.deepEqual((await model(POST, "es")).published, esDoc); assert.equal((await model(POST)).published, null);
  const esRowBefore = (await readPostLocaleRows((await readPostIdentity(POST))!)).find(row => row.locale === "es");
  expectSuccess(await publish(POST, enSaved));
  assert.deepEqual((await readPostLocaleRows((await readPostIdentity(POST))!)).find(row => row.locale === "es"), esRowBefore);
});
test("Same-language CAS rejects stale writers and cannot resurrect a cleared draft", async () => {
  const en = await model(POST); const a = complete(en.working, "Writer one"), b = complete(en.working, "Writer two");
  const results = await Promise.all([save(POST, en, a), save(POST, en, b)]);
  assert.equal(results.filter(result => result.ok).length, 1); assert.ok(results.some(result => !result.ok && result.error === "conflict"));
  const current = await model(POST); expectSuccess(await publish(POST, current));
  assert.deepEqual(await save(POST, current, a), { ok: false, error: "conflict" }); assert.equal((await model(POST)).draft, null);
});
test("Target cannot alter shared references; missing media or invalid related IDs do not save", async () => {
  const es = await model(POST, "es"); const forged = structuredClone(es.working); forged.content.is_featured = !forged.content.is_featured;
  const shared = await save(POST, es, forged); assert.equal(shared.ok, false); if (!shared.ok) assert.equal(shared.error, "validation");
  const en = await model(POST); const missing = structuredClone(en.working); missing.content.cover_media_id = "c3000000-0000-4000-8000-000000000099";
  assert.equal((await save(POST, en, missing)).ok, false);
  missing.content.cover_media_id = MEDIA; missing.content.related_ids = [POST]; assert.equal((await save(POST, en, missing)).ok, false);
  assert.equal((await model(POST)).revision, en.revision);
});
test("Bootstrap preserves four public versions, pending orphan optional text and localized slugs idempotently", async () => {
  await db.insert(blog_post).values({ id: LEGACY, slug: "backend-legacy", status: "published", category_id: CAT, author_id: AUTHOR, cover_media_id: MEDIA, reading_minutes: null });
  await setSlugs("blog_post", LEGACY, { en: "backend-legacy", es: "backend-legado", pt: "backend-legado-pt", fr: "backend-ancien" });
  for (const [field, value] of Object.entries({ title: "Legacy EN", excerpt: "Original intro", body: JSON.stringify([{ type: "paragraph", text: "Original body" }]) })) {
    await db.execute(sql`insert into translation(entity_type,entity_id,field,locale,value,state) values('blog_post',${LEGACY}::uuid,${field},'en',${value},'draft')`);
  }
  await db.execute(sql`insert into translation(entity_type,entity_id,field,locale,value,state) values('blog_post',${LEGACY}::uuid,'title','es','Título anterior','approved'),('blog_post',${LEGACY}::uuid,'meta_title','es','SEO pendiente sin fuente','needs_review')`);
  const identity = (await readPostIdentity(LEGACY))!; const baseline = await legacyPostLocaleRows(identity);
  const sourceRowsForCompatibility = await loadTranslationRows({ type: "blog_post", id: LEGACY });
  const priorPublic = legacyBlogEnvelope({ ...identity, reading_minutes: 0 }, sourceRowsForCompatibility.map(row => row.field === "title" && row.locale === "en" ? { ...row, value: "x".repeat(201) } : row), [], "en", false, false);
  assert.equal(priorPublic.content.reading_minutes, 0); assert.equal(priorPublic.content.title.length, 201);
  assert.deepEqual(priorPublic.content.body, [{ type: "paragraph", text: "Original body" }]);
  const es = baseline.find(row => row.locale === "es")!; assert.equal(es.published?.content.reading_minutes, null); assert.equal(es.published?.content.title, "Título anterior"); assert.equal(es.published?.content.meta_title, null); assert.equal(es.draft?.content.meta_title, "SEO pendiente sin fuente");
  await bootstrapPostLocales(identity, actor); const first = await readPostLocaleRows(identity);
  await bootstrapPostLocales(identity, actor); assert.deepEqual(await readPostLocaleRows(identity), first);
  for (const row of baseline) assert.deepEqual(first.find(saved => saved.locale === row.locale)?.published, row.published);
  const sourceRows = await db.execute(sql`select count(*)::int as count from translation where entity_id=${LEGACY}::uuid`); assert.equal(sourceRows.rows[0]?.count, 5);
});
test("Malformed legacy JSON refuses bootstrap without writing empty snapshots", async () => {
  await db.insert(blog_post).values({ id: BROKEN, slug: "backend-broken", status: "published", category_id: CAT, author_id: AUTHOR });
  await db.execute(sql`insert into translation(entity_type,entity_id,field,locale,value,state) values('blog_post',${BROKEN}::uuid,'body','en','broken json','draft')`);
  const identity = (await readPostIdentity(BROKEN))!;
  await assert.rejects(() => bootstrapPostLocales(identity, actor), LegacyPostError);
  assert.equal((await db.select().from(blog_post_locale_content).where(eq(blog_post_locale_content.post_id, BROKEN))).length, 0);
});
test("A failed first slug reservation can be corrected without changing saved article URLs", async () => {
  const payload = emptyBlogEnvelope({ category_id: CAT, author_id: AUTHOR });
  const request = { postId: RETRY, locale: "en" as const, expectedRevision: 0, templateRevision: null, payload, slug: "postlocales-backend-new" };
  assert.deepEqual(await savePostDraft(request, actor), { ok: false, error: "slug_conflict" });
  const saved = expectSuccess(await savePostDraft({ ...request, slug: "postlocales-backend-retry" }, actor));
  assert.equal(saved.revision, 1); assert.equal(saved.published, null);
  const rejected = await savePostDraft({ ...request, slug: "postlocales-backend-renamed", expectedRevision: 1 }, actor);
  assert.equal(rejected.ok, false); if (!rejected.ok) assert.equal(rejected.error, "validation");
});
test("Archive wins over any saved locale snapshot and prevents direct CAS publication", async () => {
  const en = await model(POST); const saved = expectSuccess(await save(POST, en, complete(en.working, "Before archive")));
  await db.update(blog_post).set({ status: "archived" }).where(eq(blog_post.id, POST));
  assert.equal(await commitPostLocale({ postId: POST, locale: "en", revision: saved.revision, publish: true, actor }), false);
  assert.deepEqual(await publish(POST, saved), { ok: false, error: "archived" });
  assert.deepEqual(await save(POST, saved), { ok: false, error: "archived" });
  assert.deepEqual((await model(POST)).draft, saved.draft);
});

test("Deletion refuses every incoming snapshot and serializes with a concurrent related-article save", async () => {
  const empty = emptyBlogEnvelope({ category_id: CAT, author_id: AUTHOR });
  const create = (postId: string, slug: string) => savePostDraft({ postId, locale: "en", expectedRevision: 0, templateRevision: null, slug, payload: empty }, actor);
  expectSuccess(await create(DELETE_TARGET, "backend-delete-target"));
  const source = expectSuccess(await create(DELETE_SOURCE, "backend-delete-source"));
  const referenced = complete(source.working, "Source with related article"); referenced.content.related_ids = [DELETE_TARGET];
  let saved = expectSuccess(await save(DELETE_SOURCE, source, referenced));
  assert.deepEqual(await deletePostIdentityIfUnused(DELETE_TARGET), { ok: false, error: "in_use" });
  saved = expectSuccess(await publish(DELETE_SOURCE, saved));
  const withoutRelation = structuredClone(saved.working); withoutRelation.content.related_ids = [];
  saved = expectSuccess(await save(DELETE_SOURCE, saved, withoutRelation));
  assert.deepEqual(await deletePostIdentityIfUnused(DELETE_TARGET), { ok: false, error: "in_use" }, "Published relation still blocks deletion after draft removal");
  await db.execute(sql`insert into blog_post_related(post_id,related_post_id,position) values(${DELETE_SOURCE}::uuid,${DELETE_TARGET}::uuid,0)`);
  saved = expectSuccess(await publish(DELETE_SOURCE, saved));
  assert.deepEqual(await deletePostIdentityIfUnused(DELETE_TARGET), { ok: true }, "Stale legacy joins cannot override adapted snapshots");
  saved = expectSuccess(await save(DELETE_SOURCE, saved, saved.working));
  expectSuccess(await create(RACE_TARGET, "backend-race-target"));
  const racing = structuredClone(saved.working); racing.content.related_ids = [RACE_TARGET];
  const [committed, deleted] = await Promise.all([
    commitPostLocale({ postId: DELETE_SOURCE, locale: "en", revision: saved.revision, payload: racing, actor }),
    deletePostIdentityIfUnused(RACE_TARGET),
  ]);
  assert.equal(committed && deleted.ok, false, "Save and deletion cannot both succeed with a dangling relation");
  const current = await model(DELETE_SOURCE);
  if (current.draft?.content.related_ids.includes(RACE_TARGET)) assert.ok(await readPostIdentity(RACE_TARGET));
  else assert.equal(committed, false);
});
