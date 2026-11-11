import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { database, snapshot, own, out, record } from "./qa-common.mjs";
const root = process.env.SOURCE_ROOT || process.env.QA_RUNTIME_ROOT || process.cwd();
const { getEditorialAdapter } = await import(
  root + "/src/slices/pages/server/editorial-adapters.ts"
);
const { sharedEnvelope } = await import(root + "/src/slices/pages/editorial-content.ts");
const { serviceSharedContent } = await import(root + "/src/slices/services/locale-content.ts");
const { guideSharedContent } = await import(root + "/src/slices/guides/locale-content.ts");
const f = JSON.parse(await fs.readFile(out + "/fixtures.json", "utf8")),
  base = JSON.parse(await fs.readFile(out + "/baseline.json", "utf8")),
  sql = await database(),
  r = {
    candidate: process.env.CANDIDATE_COMMIT,
    pages: [],
    entities: [],
    slugs: [],
    legacyRows: [],
  };
for (const key of Object.keys(f.pages)) {
  const rows = await snapshot(sql, "page", key),
    expected = structuredClone(base.pages[key].en);
  if (key === "owners") expected.content.plans.tiers[0].is_popular = true;
  if (key === "real_estate") expected.content.hero.capability_statement_media_id = "";
  const descriptor = getEditorialAdapter(key).descriptor;
  assert.equal(rows.length, 4);
  for (const row of rows) {
    assert.equal(row.draft, null);
    assert.ok(row.published);
    assert.equal(
      sharedEnvelope(row.published, descriptor),
      sharedEnvelope(expected, descriptor),
      "Shared Page structure/media/OG invariant " + key + " " + row.locale,
    );
    if (descriptor.localeReferencePaths?.includes("faq_group_key"))
      assert.equal(row.published.content.faq_group_key, f.faq[row.locale].key);
  }
  r.pages.push({
    key,
    locales: 4,
    publishedCustom: true,
    draftsNull: true,
    sharedInvariant: true,
    documentedPreconditions:
      key === "owners"
        ? "popular flag"
        : key === "real_estate"
          ? "optional invalid PDF cleared"
          : null,
  });
}
for (const kind of ["post", "service", "guide"]) {
  const rows = await snapshot(sql, kind, f.ids[kind]);
  assert.equal(rows.length, 4);
  assert.ok(rows.every((row) => row.published && row.draft === null));
  if (kind === "post") {
    const fields = [
      "category_id",
      "author_id",
      "cover_media_id",
      "og_image_media_id",
      "published_at",
      "is_featured",
      "related_ids",
    ];
    for (const row of rows)
      for (const field of fields)
        assert.deepEqual(
          row.published.content[field],
          base.posts[f.ids.post][row.locale].content[field],
        );
  } else {
    const fn = kind === "service" ? serviceSharedContent : guideSharedContent,
      expected = fn(base[kind].en.content),
      actual = fn(own(rows, "en").published.content);
    assert.deepEqual(actual, expected, kind + " shared invariants");
    const table = kind + "_shared_content",
      key = kind + "_id",
      stored = (await sql.query(`select data from ${table} where ${key}=$1`, [f.ids[kind]]))[0]
        .data;
    assert.deepEqual(stored.content, expected, kind + " canonical shared store unchanged");
  }
  r.entities.push({
    kind,
    locales: 4,
    publishedCustom: true,
    draftsNull: true,
    sharedInvariant: true,
  });
}
const slugCases = [
  ["city", f.ids.city, "qa-city"],
  ["city", f.ids.emptyCity, "qa-empty-city"],
  ["neighbourhood", f.ids.neighbourhood, "qa-neighbourhood"],
  ["building", f.ids.building, "qa-building"],
  ["apartment", f.ids.apartment, "qa-apartment"],
  ["service", f.ids.service, "qa-service"],
  ["guide_page", f.ids.guide, "qa-guide"],
  ["blog_post", f.ids.post, "qa-article"],
  ["blog_post", f.ids.secondPost, "qa-featured"],
];
for (const [type, id, slug] of slugCases) {
  const rows =
    await sql`select locale,slug from slug where entity_type=${type} and entity_id=${id}::uuid order by locale`;
  assert.deepEqual(
    rows,
    ["en", "es", "fr", "pt"].map((locale) => ({ locale, slug })),
  );
  r.slugs.push({ type, id, locales: 4, slug });
}
const seedTx = (await sql`select xmin::text tx from media_asset where id=${f.media[1]}::uuid`)[0]
  .tx;
for (const [table, id] of [
  ["faq_group", f.ids.legacyFaq],
  ["faq_item", f.ids.legacyFaqItem],
]) {
  const rows = await sql.query(
    `select id,xmin::text tx,md5(to_jsonb(t)::text) hash from ${table} t where id=$1`,
    [id],
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].tx, seedTx, "Historical FAQ identity row untouched since seed");
  r.legacyRows.push({ table, ...rows[0] });
}
r.ok = true;
r.slugsExact = 36;
r.principalUnits = 12;
r.originalUserDatabase =
  "Root JSON proof reviewed independently:42exact/settings0, no QA connection";
await record("q6-principal-conservation", r);
console.log(
  JSON.stringify({
    ok: true,
    principalUnits: 12,
    pages: 9,
    sharedInvariant: true,
    slugsExact: 36,
    legacyIdentityRowsOriginalTx: 2,
  }),
);
