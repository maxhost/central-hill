import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { neon } from "@neondatabase/serverless";
import { parse } from "dotenv";
import { sql } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import ts from "typescript";
import { form_public_rate_limit } from "../schema";

const serviceEnabled = process.env.SERVICE_ENQUIRY_DB_TEST === "1";
const realEstateEnabled = process.env.REAL_ESTATE_ENQUIRY_DB_TEST === "1";
const guestEnabled = process.env.GUEST_CONTACT_DB_TEST === "1";
const aboutEnabled = process.env.ABOUT_CONTACT_DB_TEST === "1";
const enabled = process.env.HEADER_CONTACT_DB_TEST === "1" || aboutEnabled || guestEnabled || realEstateEnabled || serviceEnabled;
const ownDatabase = serviceEnabled ? "serviceenquiryunitqa20261112" : realEstateEnabled ? "realestateenquiryunitqa20261112" : guestEnabled ? "guestcontactunitqa20261112" : aboutEnabled ? "aboutcontactunitqa20261112" : "headercontactqa20261112";
function load<T>(source: URL, dependencies: Record<string, unknown>): T {
  const compiled = { exports: {} };
  const code = ts.transpileModule(readFileSync(source, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  runInNewContext(code, { module: compiled, exports: compiled.exports, require: (name: string) => {
    assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency ${name}`);return dependencies[name];
  } });return compiled.exports as T;
}
test("QA DB: durable rate bound holds concurrently and a retry does not consume another personal slot", { skip: !enabled }, async () => {
  const config = parse(readFileSync(".env.local")), url = new URL(config.DATABASE_URL!);
  assert.deepEqual([url.hostname, url.pathname, url.username], [`${ownDatabase}.local`, `/${ownDatabase}`, ownDatabase]);
  const client = neon(url.href);
  const serialized = load<typeof import("../../../core/db/serialized")>(new URL("../../../core/db/serialized.ts", import.meta.url), { "server-only": {}, "drizzle-orm/pg-core": { PgDialect }, "./client": { sqlClient: client } });
  const deps = { "server-only": {}, "node:crypto": { createHmac, randomUUID }, "drizzle-orm": { sql }, "@core/env": { env: config }, "@core/db/serialized": serialized,
    "../public-types": { HEADER_CONTACT_LOCK: "header-contact:v1" }, "../schema": { form_public_rate_limit } };
  const a = load<typeof import("../server/public-rate-limit")>(new URL("../server/public-rate-limit.ts", import.meta.url), deps);
  const b = load<typeof import("../server/public-rate-limit")>(new URL("../server/public-rate-limit.ts", import.meta.url), deps);
  const ip = "2001:db8:" + randomUUID().slice(0, 4) + "::42", keys = Array.from({ length: 7 }, () => randomUUID());
  const digest = createHmac("sha256", config.BETTER_AUTH_SECRET || config.DATABASE_URL!).update(ip).digest("hex");
  const owned = [`header-contact:ip:${digest}`, ...keys.map(key => `header-contact:attempt:${createHmac("sha256", config.BETTER_AUTH_SECRET || config.DATABASE_URL!).update(digest + key).digest("hex")}`)];
  const hadGlobal = (await client`select key from form_public_rate_limit where key='header-contact:global'`).length > 0;
  try {
    const results = await Promise.all(keys.slice(0, 6).map((key, i) => (i % 2 ? a : b).admitPublicContact(ip, key)));
    assert.equal(results.filter(Boolean).length, 5);
    const allowed = keys[results.findIndex(Boolean)]!;
    const [before] = await client`select attempts from form_public_rate_limit where key=${owned[0]}`;
    assert.equal(await b.admitPublicContact(ip, allowed), true);
    const [after] = await client`select attempts from form_public_rate_limit where key=${owned[0]}`;
    assert.equal(before?.attempts, after?.attempts);
    assert.equal(await a.admitPublicContact(ip, keys[6]!), false);
  } finally {
    await client`delete from form_public_rate_limit where key=any(${owned}::text[])`;
    if ((aboutEnabled || guestEnabled || realEstateEnabled || serviceEnabled) && !hadGlobal) await client`delete from form_public_rate_limit where key='header-contact:global'`;
  }
});
