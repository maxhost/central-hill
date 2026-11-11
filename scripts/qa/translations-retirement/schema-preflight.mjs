import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { database, out } from "./qa-common.mjs";
const sql = await database(),
  identity = (await sql`select current_database()as db,current_user as role`)[0],
  scaffolds = await sql`select id,key,md5(to_jsonb(p)::text)hash from page_content p order by key`;
assert.deepEqual(
  scaffolds.map((x) => x.key),
  ["blog", "buildings", "guest", "guides"],
  "Only fresh migration scaffolds may be adopted",
);
const tables =
    await sql`select tablename from pg_tables where schemaname='public' and tablename not in('account','session','user','verification','staff_role')order by tablename`,
  counts = {};
for (const { tablename } of tables) {
  const [row] = await sql.query(
    `select count(*)::int n,md5(coalesce(jsonb_agg(to_jsonb(t)order by to_jsonb(t)::text)::text,'[]'))hash from "${tablename}"t`,
  );
  counts[tablename] = row;
  assert.equal(
    row.n,
    { page_content: 4, faq_group: 2, faq_item: 14, translation: 28 }[tablename] || 0,
    "Not a fresh authorized schema: " + tablename,
  );
}
await fs.mkdir(out, { recursive: true });
await fs.writeFile(
  out + "/schema-scaffold-before.json",
  JSON.stringify({ identity, scaffolds, counts }, null, 2),
);
console.log("Fresh migration scaffolds and business counts verified; no writes to DB.");
