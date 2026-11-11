import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { randomUUID, createHash } from "node:crypto";
const out =
    process.env.FIXTURE_ARTIFACT_DIR || "/private/tmp/central-hill-translations-retirement-qa",
  runtime = process.env.QA_RUNTIME_ROOT || process.env.SOURCE_ROOT || process.cwd(),
  req = createRequire((process.env.SOURCE_ROOT || process.cwd()) + "/package.json"),
  { neon } = req("@neondatabase/serverless"),
  sharp = req("sharp");
const u = new URL(process.env.DATABASE_URL);
assert.equal(u.hostname, "translationsretirementqa.local");
assert.equal(u.pathname, "/translationsretirementqa");
assert.equal(u.username, "translationsretirementqa");
const sql = neon(process.env.DATABASE_URL);
assert.deepEqual((await sql`select current_database()as db,current_user as role`)[0], {
  db: "translationsretirementqa",
  role: "translationsretirementqa",
});
const fixture = JSON.parse(await fs.readFile(out + "/fixtures.json", "utf8")),
  baseline = JSON.parse(await fs.readFile(out + "/baseline.json", "utf8"));
assert.equal(fixture.media.length, 3);
const rows =
  await sql`select locale,revision,published,md5(published::text)as hash from service_locale_content where service_id=${fixture.ids.service} order by locale`;
assert.equal(rows.length, 4);
for (const row of rows) {
  assert.equal(row.revision, 0);
  assert.deepEqual(row.published, baseline.service[row.locale]);
}
const [common] =
  await sql`select data,revision,md5(data::text)as hash from service_shared_content where service_id=${fixture.ids.service}`;
assert.equal(common.revision, 0);
const nextMedia = [randomUUID(), randomUUID()],
  queries = [];
const hash = (s) => createHash("sha256").update(s.trim()).digest("hex");
for (const [id, i] of nextMedia.map((id, i) => [id, i])) {
  const key = id + "/1.png",
    target = path.join(runtime, "public/translationsretirementqa", key);
  await fs.mkdir(path.dirname(target), { recursive: true });
  const png = await sharp({
    create: { width: 1200, height: 900, channels: 3, background: ["#a47648", "#387d83"][i] },
  })
    .png()
    .toBuffer();
  await fs.writeFile(target, png);
  queries.push(
    sql`insert into media_asset(id,storage,r2_key,mime,width,height,bytes)values(${id},'r2',${key},'image/png',1200,900,${png.length})`,
  );
  const source = `Legacy extra gallery ${i}`;
  for (const locale of ["en", "es", "pt", "fr"])
    queries.push(
      sql`insert into translation(entity_type,entity_id,field,locale,value,state,source_hash)values('media_asset',${id},'alt',${locale},${source + (locale === "en" ? "" : " " + locale.toUpperCase())},${locale === "en" ? "draft" : "approved"},${locale === "en" ? null : hash(source)})`,
    );
}
fixture.media.push(...nextMedia);
for (const row of rows) {
  row.published.content.gallery = fixture.media.slice(1);
  for (const [id, i] of nextMedia.map((id, i) => [id, i]))
    row.published.content.media_alts[id] = `Base ${row.locale.toUpperCase()} gallery${i + 3}`;
  queries.push(
    sql`with changed as(update service_locale_content set published=${JSON.stringify(row.published)}::jsonb where service_id=${fixture.ids.service} and locale=${row.locale} and revision=0 and md5(published::text)=${row.hash} and draft is null returning id)select 1/count(*)::int as guard from changed`,
  );
  baseline.service[row.locale] = row.published;
}
common.data.content.gallery = fixture.media.slice(1);
queries.push(
  sql`with changed as(update service_shared_content set data=${JSON.stringify(common.data)}::jsonb where service_id=${fixture.ids.service} and revision=0 and md5(data::text)=${common.hash} returning id)select 1/count(*)::int as guard from changed`,
);
await sql.transaction(queries);
baseline.fixture = fixture;
await fs.writeFile(out + "/baseline.json", JSON.stringify(baseline, null, 2));
await fs.writeFile(out + "/fixtures.json", JSON.stringify(fixture, null, 2));
await fs.writeFile(
  out + "/gallery-extension.json",
  JSON.stringify(
    {
      ownService: fixture.ids.service,
      newMedia: nextMedia,
      mediaTotal: fixture.media.length,
      statements: queries.length,
      cas: true,
    },
    null,
    2,
  ),
);
console.log("Own service baseline gallery extended by CAS:5media;4gallery; no E2E edits yet");
