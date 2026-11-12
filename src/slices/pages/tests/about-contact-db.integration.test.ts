import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { PgDialect } from "drizzle-orm/pg-core";
import { eq, sql } from "drizzle-orm";
import { parse } from "dotenv";
import { z } from "zod";
import ts from "typescript";
import { page_locale_content } from "../schema";
import { getEditorialAdapter } from "../server/editorial-adapters";
import { prepareTargetEnvelope } from "../editorial-content";
import { usesPageLocaleDrafts, isEditorialPageKey } from "../editorial-registry";
import { editorialLocale } from "../server/editorial-policy";
import { realEstateEnquiryFormId, preserveRealEstateEnquiryAssignment } from "../real-estate-enquiry-content";
import { guestContactFormId, preserveGuestContactAssignment } from "../guest-contact-content";
import { aboutContactFormId, preserveAboutContactAssignment } from "../about-contact-content";
import type { PageEnvelope } from "../editorial-types";

function load<T>(source: URL, dependencies: Record<string, unknown>): T {
  const compiled = { exports: {} };
  const code = ts.transpileModule(readFileSync(source, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  runInNewContext(code, { module: compiled, exports: compiled.exports, require: (name: string) => {
    assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency ${name}`);
    return dependencies[name];
  }, structuredClone });
  return compiled.exports as T;
}
const guestRegression = process.env.GUEST_CONTACT_ABOUT_REGRESSION === "1";
const realEstateRegression = process.env.REAL_ESTATE_ENQUIRY_PAGES_REGRESSION === "1";
const enabled = process.env.ABOUT_CONTACT_PAGES_DB_TEST === "1" || guestRegression || realEstateRegression;

test("About DB: concurrent revision winners, published/draft separation and form assignment mutation guard", { skip: !enabled }, async () => {
  const config = parse(readFileSync(".env.local"));
  const u = new URL(config.DATABASE_URL!);
  const target = realEstateRegression ? "realestateenquirypagesqa20261112" : guestRegression ? "guestcontactpagesqa20261112" : "aboutcontactpagesqa20261112";
  assert.deepEqual([u.hostname, u.pathname, u.username], [`${target}.local`, `/${target}`, target]);
  const client = neon(u.href), db = drizzle(client);
  const identity = await db.execute(sql`select current_database() as db,current_user as role`);
  assert.deepEqual(identity.rows[0], { db: target, role: target });
  assert.equal((await db.select().from(page_locale_content).where(eq(page_locale_content.page_key, "about"))).length, 0, "Own schema-only fixture dataset required");
  const serialized = load<typeof import("../../../core/db/serialized")>(new URL("../../../core/db/serialized.ts", import.meta.url), {
    "server-only": {}, "drizzle-orm/pg-core": { PgDialect }, "./client": { sqlClient: client },
  });
  const empty: PageEnvelope<"about"> = { schemaVersion: 1, content: getEditorialAdapter("about").defaultContent(), ogImageMediaId: null };
  const deps = {
    "server-only": {}, zod: { z }, "../server/editorial-policy": { editorialLocale },
    "./editorial-validation": {}, "../server/editorial-adapters": { getEditorialAdapter },
    "../editorial-registry": { usesPageLocaleDrafts, isEditorialPageKey },
    "@core/db/serialized": serialized, "@slices/forms/server-contract": { HEADER_CONTACT_LOCK: "header-contact:v1" },
    "../about-contact-content": { aboutContactFormId, preserveAboutContactAssignment },
    "../guest-contact-content": { guestContactFormId, preserveGuestContactAssignment },
    "../real-estate-enquiry-content": { realEstateEnquiryFormId, preserveRealEstateEnquiryAssignment },
    "drizzle-orm": { eq, sql }, "@core/db/client": { db }, "../schema": { page_locale_content },
    "../editorial-content": { prepareTargetEnvelope }, "../server/editorial-legacy": { legacyEditorialRows: async () => [] },
  };
  const store = load<typeof import("../admin/editorial-store")>(new URL("../admin/editorial-store.ts", import.meta.url), deps);
  const formId = randomUUID(), actor = "about-pages-own-fixture";
  await client`insert into form_definition(id,name,template,recipient,definition) values(${formId},'About own guard fixture','contact','qa@example.test','{}'::jsonb)`;
  try {
    await db.insert(page_locale_content).values((["en", "es", "pt", "fr"] as const).map(locale => ({ page_key: "about", locale, published: empty, revision: 0 })));
    const payload = structuredClone(empty); payload.content.contact.form.form_id = formId;
    const guard = sql`exists(select 1 from form_definition where id=${formId}::uuid and status='draft' and revision=1)`;
    const [first, second] = await Promise.all([0, 1].map(() => store.commitEditorial({ key: "about", locale: "en", revision: 0, payload, actor, assignmentGuard: guard })));
    assert.equal([first, second].filter(Boolean).length, 1, "Only one optimistic writer wins");
    let [en] = await db.select().from(page_locale_content).where(eq(page_locale_content.locale, "en"));
    assert.equal((en!.published as PageEnvelope<"about">).content.contact.form.form_id, undefined);
    assert.equal((en!.draft as PageEnvelope<"about">).content.contact.form.form_id, formId);
    const archiver = client.transaction([
      client.query("select pg_advisory_xact_lock(hashtextextended($1,0))", ["header-contact:v1"]),
      client.query("update form_definition set status='archived', revision=2 where id=$1::uuid", [formId]),
      client.query("select pg_sleep(0.8)", []),
    ], { isolationLevel: "ReadCommitted" });
    let locked = false;
    for (let attempt = 0; attempt < 40 && !locked; attempt++) {
      const [state] = await client`select exists(select 1 from pg_locks where locktype='advisory' and granted and classid=((hashtextextended('header-contact:v1',0)>>32)&4294967295)::oid and objid=(hashtextextended('header-contact:v1',0)&4294967295)::oid) as locked`;
      locked = state?.locked === true;
      if (!locked) await new Promise(resolve => setTimeout(resolve, 10));
    }
    assert.equal(locked, true, "Concurrent archiver holds the real shared advisory lock");
    assert.equal(await store.commitEditorial({ key: "about", locale: "en", revision: 1, publish: true, actor, assignmentGuard: guard }), false, "Publication waits then sees archived form in a fresh mutation snapshot");
    await archiver;
    [en] = await db.select().from(page_locale_content).where(eq(page_locale_content.locale, "en"));
    assert.equal(en!.revision, 1);
    assert.equal(en!.published_at, null);
    await client`update form_definition set status='draft', revision=3 where id=${formId}`;
    const refreshed = sql`exists(select 1 from form_definition where id=${formId}::uuid and status='draft' and revision=3)`;
    assert.equal(await store.commitEditorial({ key: "about", locale: "en", revision: 1, publish: true, actor, assignmentGuard: refreshed }), true);
    [en] = await db.select().from(page_locale_content).where(eq(page_locale_content.locale, "en"));
    assert.equal((en!.published as PageEnvelope<"about">).content.contact.form.form_id, formId);
    const publishedAt = en!.published_at;
    assert.ok(publishedAt);
    const targetBefore = await db.select().from(page_locale_content).where(eq(page_locale_content.locale, "es"));
    const draftB = structuredClone(payload); draftB.content.contact.form.form_id = null;
    assert.equal(await store.commitEditorial({ key: "about", locale: "en", revision: 2, payload: draftB, actor }), true);
    [en] = await db.select().from(page_locale_content).where(eq(page_locale_content.locale, "en"));
    assert.equal(en!.published_at?.toISOString(), publishedAt.toISOString(), "Draft save never changes published assignment identity");
    assert.equal((en!.published as PageEnvelope<"about">).content.contact.form.form_id, formId);
    assert.deepEqual(await db.select().from(page_locale_content).where(eq(page_locale_content.locale, "es")), targetBefore);
  } finally {
    await db.delete(page_locale_content).where(eq(page_locale_content.page_key, "about"));
    await client`delete from form_definition where id=${formId}`;
  }
});
