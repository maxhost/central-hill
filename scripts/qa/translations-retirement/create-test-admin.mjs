import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";
const root = process.env.SOURCE_ROOT || process.cwd(),
  out = process.env.FIXTURE_ARTIFACT_DIR || "/private/tmp/central-hill-translations-retirement-qa";
const req = createRequire(root + "/package.json"),
  { neon } = req("@neondatabase/serverless");
const u = new URL(process.env.DATABASE_URL);
assert.equal(u.hostname, "translationsretirementqa.local");
assert.equal(u.pathname, "/translationsretirementqa");
assert.equal(u.username, "translationsretirementqa");
const sql = neon(process.env.DATABASE_URL);
assert.deepEqual((await sql`select current_database()as db,current_user as role`)[0], {
  db: "translationsretirementqa",
  role: "translationsretirementqa",
});
const email = "translations-retirement-qa@example.invalid";
assert.equal(
  (await sql`select count(*)::int as n from "user" where email=${email}`)[0].n,
  0,
  "Own test Admin must not already exist",
);
const password = "TrQA-" + randomBytes(30).toString("base64url");
const { auth } = await import(root + "/src/core/auth/auth.ts");
const result = await auth.api.signUpEmail({
  body: { email, password, name: "Translations Retirement QA" },
});
assert.ok(result.user.id);
assert.equal(result.user.email, email);
await sql`insert into staff_role(user_id,role) values(${result.user.id},'admin')`;
await fs.writeFile(out + "/login-private.json", JSON.stringify({ email, password }), {
  mode: 0o600,
});
await fs.chmod(out + "/login-private.json", 0o600);
console.log(
  "Own synthetic Admin created via Better Auth; credential file0600; no session extraction",
);
