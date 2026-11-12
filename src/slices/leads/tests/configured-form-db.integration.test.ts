import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { neon } from "@neondatabase/serverless";
import { parse } from "dotenv";
import { sql } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import ts from "typescript";
import { lead, lead_field } from "../schema";
import type { ContactCaptureInput } from "../form-capture-types";

const aboutEnabled = process.env.ABOUT_CONTACT_DB_TEST === "1";
const enabled = process.env.HEADER_CONTACT_DB_TEST === "1" || aboutEnabled;
const ownDatabase = aboutEnabled ? "aboutcontactunitqa20261112" : "headercontactqa20261112";
function load<T>(source: URL, dependencies: Record<string, unknown>): T {
  const compiled = { exports: {} };
  const code = ts.transpileModule(readFileSync(source, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  runInNewContext(code, { module: compiled, exports: compiled.exports, require: (name: string) => {
    assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency ${name}`);return dependencies[name];
  } });
  return compiled.exports as T;
}
function harness() {
  const config = parse(readFileSync(".env.local")), url = new URL(config.DATABASE_URL!);
  assert.deepEqual([url.hostname, url.pathname, url.username], [`${ownDatabase}.local`, `/${ownDatabase}`, ownDatabase]);
  const client = neon(url.href);
  const serialized = load<typeof import("../../../core/db/serialized")>(new URL("../../../core/db/serialized.ts", import.meta.url), {
    "server-only": {}, "drizzle-orm/pg-core": { PgDialect }, "./client": { sqlClient: client },
  });
  const capture = load<typeof import("../server/capture-form-contact")>(new URL("../server/capture-form-contact.ts", import.meta.url), {
    "server-only": {}, "drizzle-orm": { sql }, "@core/db/serialized": serialized,
    "@slices/forms/contract": { HEADER_CONTACT_LOCK: "header-contact:v1" }, "../schema": { lead, lead_field },
  });
  return { client, capture: capture.captureFormContact };
}
function fixture(): ContactCaptureInput {
  return { submissionKey: crypto.randomUUID(), email: "own-contact@example.test", ipAddress: "198.51.100.42", userAgent: "own DB test",
    snapshot: { formId: crypto.randomUUID(), name: "Own integration contact", revision: 1, locale: "pt", fingerprint: "a".repeat(64), payloadHash: "b".repeat(64),
      fields: [{ id: crypto.randomUUID(), label: "Nome capturado", type: "text", value: "Own person", displayValue: "Own person", consent: false },
        { id: crypto.randomUUID(), label: "Aviso capturado", type: "checkbox", value: false, displayValue: "No", consent: true }] } };
}

test("QA DB: concurrent same-key capture has one winner; different payload cannot reuse it", { skip: !enabled }, async () => {
  const h = harness(), own = fixture();
  assert.equal((await h.client`select current_database() as db`)[0]?.db, ownDatabase);
  try {
    const result = await Promise.all([h.capture(own, sql`true`), h.capture(own, sql`true`)]);
    assert.deepEqual(result.map(row => row.status).sort(), ["created", "duplicate"]);
    const rows = await h.client`select * from lead where submission_key=${own.submissionKey}::uuid`;
    assert.equal(rows.length, 1);assert.equal(rows[0]?.kind, "contact");assert.equal(rows[0]?.source_page, "header-contact");
    assert.equal(rows[0]?.marketing_consent, false);assert.equal(rows[0]?.consent_text, null);assert.equal(rows[0]?.consent_at, null);
    const fields = await h.client`select key,value from lead_field where lead_id=${rows[0]!.id}::uuid`;
    assert.equal(fields.length, 3);assert.ok(fields.some(f => f.value === "Own person"));
    const conflict = await h.capture({ ...own, snapshot: { ...own.snapshot, payloadHash: "c".repeat(64) } }, sql`true`);
    assert.equal(conflict.status, "conflict");
    const after = await h.client`select form_snapshot from lead where submission_key=${own.submissionKey}::uuid`;
    assert.equal(after[0]?.form_snapshot.payloadHash, own.snapshot.payloadHash);
  } finally { await h.client`delete from lead where submission_key=${own.submissionKey}::uuid`; }
});

test("QA DB: stale guard prevents capture and consent proof only records accepted configured notices", { skip: !enabled }, async () => {
  const h = harness(), own = fixture();
  try {
    assert.equal((await h.capture(own, sql`false`)).status, "stale");
    assert.equal((await h.client`select count(*)::int as n from lead where submission_key=${own.submissionKey}::uuid`)[0]?.n, 0);
    own.snapshot.fields[1]!.value = true;own.snapshot.fields[1]!.displayValue = "Yes";
    assert.equal((await h.capture(own, sql`true`)).status, "created");
    const [row] = await h.client`select marketing_consent,consent_text,consent_at from lead where submission_key=${own.submissionKey}::uuid`;
    assert.equal(row?.marketing_consent, false);assert.equal(row?.consent_text, "Aviso capturado");assert.ok(row?.consent_at);
  } finally { await h.client`delete from lead where submission_key=${own.submissionKey}::uuid`; }
});

test("QA DB: failure inserting any captured field rolls back its lead", { skip: !enabled }, async () => {
  const h = harness(), own = fixture();
  own.snapshot.fields[0]!.id = null as unknown as string;
  try {
    await assert.rejects(h.capture(own, sql`true`));
    assert.equal((await h.client`select count(*)::int as n from lead where submission_key=${own.submissionKey}::uuid`)[0]?.n, 0);
  } finally { await h.client`delete from lead where submission_key=${own.submissionKey}::uuid`; }
});


test("QA DB: About and legacy header replays are scoped to verified source, even with equal hashes", { skip: !enabled }, async () => {
  const h = harness(), own = fixture(), keys = [own.submissionKey];
  try {
    // A historical header snapshot has no sourcePage metadata. It remains a valid replay.
    assert.equal((await h.capture(own, sql`true`)).status, "created");
    assert.equal((await h.capture(own, sql`true`)).status, "duplicate");
    assert.equal((await h.capture(own, sql`false`)).status, "stale", "Replays must recheck current authority inside lock");
    assert.equal((await h.capture({ ...own, sourcePage: "about-contact" }, sql`true`)).status, "conflict");
    const about = { ...own, submissionKey: crypto.randomUUID(), sourcePage: "about-contact" as const };
    keys.push(about.submissionKey);
    assert.deepEqual((await Promise.all([h.capture(about,sql`true`),h.capture(about,sql`true`)])).map(r => r.status).sort(), ["created","duplicate"]);
    assert.equal((await h.capture({ ...about, sourcePage: "header-contact" },sql`true`)).status,"conflict");
    const [row] = await h.client`select kind,source_page,marketing_consent from lead where submission_key=${about.submissionKey}::uuid`;
    assert.equal(row?.kind,"contact");assert.equal(row?.source_page,"about-contact");assert.equal(row?.marketing_consent,false);
  } finally { await h.client`delete from lead where submission_key=any(${keys}::uuid[])`; }
});
