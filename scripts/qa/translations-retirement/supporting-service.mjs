import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
const out =
    process.env.FIXTURE_ARTIFACT_DIR || "/private/tmp/central-hill-translations-retirement-qa",
  req = createRequire((process.env.SOURCE_ROOT || process.cwd()) + "/package.json"),
  { neon } = req("@neondatabase/serverless");
const u = new URL(process.env.DATABASE_URL);
assert.equal(u.hostname, "translationsretirementqa.local");
assert.equal(u.pathname, "/translationsretirementqa");
const sql = neon(process.env.DATABASE_URL);
assert.deepEqual((await sql`select current_database()as db,current_user as role`)[0], {
  db: "translationsretirementqa",
  role: "translationsretirementqa",
});
const fixture = JSON.parse(await fs.readFile(out + "/fixtures.json", "utf8")),
  baseline = JSON.parse(await fs.readFile(out + "/baseline.json", "utf8"));
assert.ok(!fixture.ids.supportingService);
const id = randomUUID();
assert.equal((await sql`select count(*)::int as n from service where id=${id}`)[0].n, 0);
const [common] =
  await sql`select data from service_shared_content where service_id=${fixture.ids.service}`;
const queries = [
  sql`insert into service(id,slug,status,position,category_id,cover_media_id,og_image_media_id,price_from,rating_tenths,booking_type,cta_url)values(${id},'qa-support-service','published',1,${fixture.ids.category},${fixture.media[0]},${fixture.media[1]},15000,48,'external','https://example.invalid/support')`,
];
for (const locale of ["en", "es", "pt", "fr"]) {
  const env = structuredClone(baseline.service[locale]);
  env.content.name = "Supporting " + locale.toUpperCase() + " Service";
  queries.push(
    sql`insert into service_locale_content(service_id,locale,published,revision,published_at)values(${id},${locale},${JSON.stringify(env)}::jsonb,0,now())`,
  );
  queries.push(
    sql`insert into slug(entity_type,entity_id,locale,slug)values('service',${id},${locale},'qa-support-service')`,
  );
}
queries.push(
  sql`insert into service_shared_content(service_id,data,revision)values(${id},${JSON.stringify(common.data)}::jsonb,0)`,
);
await sql.transaction(queries);
fixture.ids.supportingService = id;
baseline.fixture = fixture;
await fs.writeFile(out + "/fixtures.json", JSON.stringify(fixture, null, 2));
await fs.writeFile(out + "/baseline.json", JSON.stringify(baseline, null, 2));
console.log("Supporting own service seeded before build to render relatedTitle");
