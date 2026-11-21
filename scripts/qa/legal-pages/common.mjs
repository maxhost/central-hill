import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
export const sourceRoot = process.env.SOURCE_ROOT || process.cwd();
export const req = createRequire(path.join(sourceRoot, "package.json"));
export const artifactRoot = "/private/tmp/central-hill-legal-pages/qa";
export const keys = ["privacy_policy", "cookies_policy", "complaints_book"];
export const routes = { privacy_policy: "privacy-policy", cookies_policy: "cookies-policy", complaints_book: "complaints-book" };
export function guard() {
  const u = new URL(process.env.DATABASE_URL || "");
  assert.equal(u.hostname, "legalpagesqa20261121.local");
  assert.equal(u.pathname, "/legalpagesqa20261121");
  assert.equal(u.username, "legalpagesqa20261121");
  const base = new URL(process.env.QA_BASE_URL || "http://127.0.0.1:3090");
  assert.ok(["localhost", "127.0.0.1"].includes(base.hostname));
  assert.equal(base.protocol, "http:");
  assert.equal(base.port, "3090");
  return base.origin;
}
export async function database() {
  guard();
  const { neon } = req("@neondatabase/serverless"), sql = neon(process.env.DATABASE_URL);
  assert.deepEqual((await sql`select current_database() as db,current_user as role`)[0], { db: "legalpagesqa20261121", role: "legalpagesqa20261121" });
  return sql;
}
export async function save(name, value) {
  assert.match(name, /^[a-z0-9-]+$/);
  await fs.mkdir(artifactRoot, { recursive: true, mode: 0o700 });
  await fs.writeFile(path.join(artifactRoot, name + ".json"), JSON.stringify(value, null, 2), { mode: 0o600 });
}
export async function snapshot(sql, key) {
  assert.ok(keys.includes(key));
  return sql`select * from page_locale_content where page_key=${key} order by locale`;
}
export const own = (rows, locale) => rows.find(row => row.locale === locale);
export async function until(fn, label, timeout = 60000) {
  const end = Date.now() + timeout;
  let last;
  while (Date.now() < end) {
    try { const value = await fn(); if (value) return value; } catch (error) { last = error; }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error(`Timeout: ${label}${last ? "; " + last.message : ""}`);
}
export async function protectedSnapshot(sql) {
  const tables = await sql`select tablename from pg_tables where schemaname='public' and tablename not in('account','session','user','verification','staff_role') order by tablename`;
  const result = {};
  for (const { tablename } of tables) {
    assert.match(tablename, /^[a-z_][a-z0-9_]*$/i);
    const condition = tablename === "page_locale_content" ? " where page_key not in ('privacy_policy','cookies_policy','complaints_book')" : tablename === "page_content" ? " where key not in ('privacy_policy','cookies_policy','complaints_book')" : "";
    result[tablename] = (await sql.query(`select count(*)::int n,md5(coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text)::text,'[]')) hash from "${tablename}" t${condition}`))[0];
  }
  result.migrations = await sql`select * from drizzle.__drizzle_migrations order by id`;
  return result;
}
