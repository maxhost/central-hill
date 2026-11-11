import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {
  database,
  startBrowser,
  snapshot,
  own,
  action,
  selectLocale,
  publicAssert,
  waitUntil,
  record,
  out,
  assertNoBoundary,
} from "./qa-common.mjs";
const resume = process.argv.includes("--resume-faq");
const f = JSON.parse(await fs.readFile(out + "/fixtures.json", "utf8")),
  sql = await database(),
  b = await startBrowser(),
  r = { candidate: process.env.CANDIDATE_COMMIT, pageErrors: b.errors, boundaries: [], steps: [] };
async function historical() {
  return {
    translations:
      await sql`select id,xmin::text inserted_tx,md5(to_jsonb(t)::text) hash from translation t where (entity_type='faq_item' and entity_id=${f.ids.legacyFaqItem}::uuid) or(entity_type='media_asset' and entity_id=${f.media[0]}::uuid) order by id`,
    asset:
      await sql`select id,xmin::text inserted_tx,md5(to_jsonb(a)::text) hash from media_asset a where id=${f.media[0]}::uuid`,
  };
}
const history = await historical(),
  home = await snapshot(sql, "page", "home"),
  guide = await snapshot(sql, "guide", f.ids.guide);
assert.equal(history.translations.length, 12);
assert.equal(history.asset.length, 1);
assert.ok([...home, ...guide].every((row) => row.draft === null));
const seedTx = (await sql`select xmin::text tx from media_asset where id=${f.media[1]}::uuid`)[0]
  .tx;
assert.ok(
  [...history.translations, ...history.asset].every((row) => row.inserted_tx === seedTx),
  "Historical rows remain unchanged in original seed transaction",
);
if (resume) {
  const cp = JSON.parse(await fs.readFile(out + "/results/q6-legacy-checkpoint.json", "utf8"));
  assert.equal(cp.phase, "faq-published");
  assert.equal(cp.key, "trqa-faq-legacy");
  assert.equal(own(home, "fr").revision, cp.revision);
  assert.equal(own(home, "fr").published.content.faq_group_key, "trqa-faq-legacy");
  own(home, "fr").published.content.faq_group_key = f.faq.fr.key;
  r.resumedFaqPublished = cp.revision;
  r.steps.push({
    type: "faq-ref",
    key: "trqa-faq-legacy",
    save: cp.revision - 1,
    publish: cp.revision,
    recovered: true,
  });
}
await record("q6-legacy-initial-baseline", {
  history,
  seedTx,
  homeExpectedRestore: home,
  guide,
  resume,
});
async function pageFaq(key) {
  await b.page.goto(b.base + "/admin/pages/home", { waitUntil: "domcontentloaded" });
  await selectLocale(b.page, "fr");
  await b.page.locator('select[id$="-binding"]').selectOption("faq");
  await b.page.locator('[id="page-field-home-faq_group_key"]').selectOption(key);
  const saved = await action(b.page, sql, "page", "home", "fr", "Save draft");
  await record("q6-legacy-checkpoint", { phase: "faq-draft", revision: saved.revision, key });
  const published = await action(b.page, sql, "page", "home", "fr", "Publish");
  await record("q6-legacy-checkpoint", {
    phase: "faq-published",
    revision: published.revision,
    key,
  });
  r.steps.push({ type: "faq-ref", key, save: saved.revision, publish: published.revision });
}
async function guideAlt(value) {
  await b.page.goto(b.base + `/admin/guides/${f.ids.guide}`, { waitUntil: "domcontentloaded" });
  await selectLocale(b.page, "fr");
  await b.page
    .getByRole("textbox", { name: "Alternative text · FR", exact: true })
    .first()
    .fill(value);
  const saved = await action(b.page, sql, "guide", f.ids.guide, "fr", "Save draft");
  await record("q6-legacy-checkpoint", { phase: "alt-draft", revision: saved.revision, value });
  const published = await action(b.page, sql, "guide", f.ids.guide, "fr", "Publish");
  await record("q6-legacy-checkpoint", {
    phase: "alt-published",
    revision: published.revision,
    value,
  });
  r.steps.push({ type: "guide-alt", value, save: saved.revision, publish: published.revision });
}
try {
  if (!resume) await pageFaq("trqa-faq-legacy");
  await waitUntil(async () => {
    await b.pub.goto(b.base + "/fr", { waitUntil: "domcontentloaded" });
    await publicAssert(b.pub, { kind: "visible-text", value: "Legacy FAQ question FR" });
    return true;
  }, "Legacy FAQ approved target question");
  await b.pub.locator("summary").filter({ hasText: "Legacy FAQ question FR" }).click();
  await publicAssert(b.pub, { kind: "visible-text", value: "Legacy FAQ answer FR" });
  assert.deepEqual(await historical(), history);
  await pageFaq(own(home, "fr").published.content.faq_group_key);
  assert.deepEqual(
    (await snapshot(sql, "page", "home")).map((x) => ({
      locale: x.locale,
      published: x.published,
      draft: x.draft,
    })),
    home.map((x) => ({ locale: x.locale, published: x.published, draft: x.draft })),
  );
  await guideAlt("");
  await waitUntil(async () => {
    await b.pub.goto(b.base + f.publicPaths.fr.guide, { waitUntil: "domcontentloaded" });
    await publicAssert(b.pub, { kind: "image-alt", value: "Legacy asset 0 FR" });
    return true;
  }, "Approved historical asset ALT target fallback");
  assert.deepEqual(await historical(), history);
  const alt = own(guide, "fr").published.content.media_alts[f.media[0]];
  await guideAlt(alt);
  await waitUntil(async () => {
    await b.pub.goto(b.base + f.publicPaths.fr.guide, { waitUntil: "domcontentloaded" });
    await publicAssert(b.pub, { kind: "image-alt", value: alt });
    return true;
  }, "Restored owning-form ALT");
  assert.deepEqual(
    (await snapshot(sql, "guide", f.ids.guide)).map((x) => ({
      locale: x.locale,
      published: x.published,
      draft: x.draft,
    })),
    guide.map((x) => ({ locale: x.locale, published: x.published, draft: x.draft })),
  );
  assert.deepEqual(await historical(), history);
  await assertNoBoundary(b.page, r);
  await assertNoBoundary(b.pub, r);
  assert.deepEqual(b.errors, []);
  r.ok = true;
  r.historyBefore = history;
  r.historicalRowsExact = true;
  r.ownPublicationsRestored = true;
  await record("q6-legacy-readers", r);
  console.log(
    JSON.stringify({
      ok: true,
      historicalRows: history.translations.length + history.asset.length,
      steps: r.steps,
      pageErrors: b.errors,
      boundaries: r.boundaries,
    }),
  );
} catch (e) {
  r.ok = false;
  r.error = e.message;
  await record("q6-legacy-readers", r);
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await b.browser.close();
}
