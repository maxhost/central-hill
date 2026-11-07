import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import { deleteContent, setSourceContent } from "@core/i18n";
import { getFaqGroup } from "@slices/faq/contract";
import { ownersAdapter } from "../adapters/owners";
import type {
  PageEditorialResult,
  PageEnvelope,
  PageLocaleEditorialModel,
} from "../editorial-types";
import {
  editorialModel,
  legacyEditorialRows,
  publishEditorialDraft,
  readEditorialRows,
  saveEditorialDraft,
} from "../admin/editorial-store";
import { getPublishedPageLocale } from "../server/editorial-publication";
import { page_content, page_locale_content } from "../schema";

const id = (n: number) =>
  `e8100000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const ROOT = id(1);
const locales = ["en", "es", "pt", "fr"] as const;
const groups = locales.map((locale, index) => ({
  locale,
  id: id(10 + index * 2),
  item: id(11 + index * 2),
  key: `page-faq-own-${locale}-20261107`,
  question: `${locale.toUpperCase()} own FAQ question`,
}));
const actor = "page-faq-locales-backend";
let verified = false;
let owned = false;
let baseline: PageEnvelope<"owners">;

function success(
  result: PageEditorialResult<"owners">,
): PageLocaleEditorialModel<"owners"> {
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) throw Error("Expected successful Owners mutation");
  return result.model;
}
function validEnvelope(): PageEnvelope<"owners"> {
  const content = ownersAdapter.defaultContent();
  content.why.cta_primary.url = "https://example.test/primary";
  content.why.cta_secondary.url = "https://example.test/secondary";
  content.services.cta.url = "https://example.test/services";
  content.dashboard.cta.url = "https://example.test/dashboard";
  if (content.plans.helpers[0]?.cta)
    content.plans.helpers[0].cta.url = "https://example.test/helper";
  content.plans.tiers[0]!.commission = "12%";
  content.hero.headline = "EN independent FAQ test page";
  content.faq_group_key = groups[0]!.key;
  ownersAdapter.publishSchema.parse(content);
  return { schemaVersion: 1, content, ogImageMediaId: null };
}
async function model(locale: (typeof locales)[number]) {
  return editorialModel(
    await readEditorialRows("owners"),
    locale,
    validEnvelope(),
    "owners",
  );
}
async function rows() {
  return db
    .select()
    .from(page_locale_content)
    .where(eq(page_locale_content.page_key, "owners"))
    .orderBy(page_locale_content.locale);
}
async function save(
  locale: (typeof locales)[number],
  value: PageEnvelope<"owners">,
) {
  const current = await model(locale);
  return saveEditorialDraft(
    {
      key: "owners",
      locale,
      expectedRevision: current.revision,
      templateRevision: current.templateRevision,
      payload: value,
    },
    actor,
  );
}
async function publish(locale: (typeof locales)[number]) {
  const current = await model(locale);
  return publishEditorialDraft(
    { key: "owners", locale, expectedRevision: current.revision },
    actor,
  );
}

before(async () => {
  assert.equal(
    new URL(process.env.DATABASE_URL ?? "").hostname,
    "propertylocalesqa.local",
  );
  const who = await db.execute(
    sql`select current_database() as database, current_user as role`,
  );
  assert.equal(who.rows[0]?.database, "propertylocalesqa");
  assert.equal(who.rows[0]?.role, "propertylocalesqa");
  verified = true;
  // Outside Next requests, always miss the cache while exercising the real reader.
  Object.assign(globalThis, {
    __incrementalCache: {
      generateCacheKey: async (key: string) => key,
      get: async () => null,
      set: async () => undefined,
    },
  });
  assert.equal(
    (await db.select().from(page_content).where(eq(page_content.key, "owners")))
      .length,
    0,
    "Refuse to replace any existing Owners page",
  );
  assert.equal(
    (await rows()).length,
    0,
    "Refuse to replace existing Owners locales",
  );
  for (const group of groups) {
    const existing =
      await db.execute(sql`select id from faq_group where id=${group.id}::uuid or key=${group.key}
      union all select id from faq_item where id=${group.item}::uuid`);
    assert.equal(
      existing.rows.length,
      0,
      "Refuse to overwrite FAQ fixture IDs",
    );
  }
  baseline = validEnvelope();
  await db
    .insert(page_content)
    .values({ id: ROOT, key: "owners", data: baseline.content });
  owned = true;
  for (const group of groups) {
    await db.execute(
      sql`insert into faq_group(id,key,position) values(${group.id}::uuid,${group.key},9999)`,
    );
    await db.execute(sql`insert into faq_item(id,group_id,status,position)
      values(${group.item}::uuid,${group.id}::uuid,'published',0)`);
    await setSourceContent(
      "faq_item",
      group.item,
      {
        question: group.question,
        answer: `${group.locale.toUpperCase()} own FAQ answer`,
      },
      { updatedBy: actor },
    );
  }
});

after(async () => {
  if (!verified || !owned) return;
  const source = await db
    .select({ id: page_content.id })
    .from(page_content)
    .where(eq(page_content.key, "owners"));
  assert.equal(
    source[0]?.id,
    ROOT,
    "Refuse cleanup if Owners ownership changed",
  );
  await db
    .delete(page_locale_content)
    .where(eq(page_locale_content.page_key, "owners"));
  await db
    .delete(page_content)
    .where(and(eq(page_content.id, ROOT), eq(page_content.key, "owners")));
  for (const group of groups) {
    await db.execute(sql`delete from faq_group where id=${group.id}::uuid`);
    await deleteContent("faq_item", group.item);
  }
});

test("legacy FAQ choices remain public and projection does not initialize or rewrite rows", async () => {
  const sourceBefore = await db
    .select()
    .from(page_content)
    .where(eq(page_content.id, ROOT));
  const projected = await legacyEditorialRows("owners");
  for (const locale of locales) {
    assert.equal(
      projected.find((row) => row.locale === locale)?.published?.content
        .faq_group_key,
      groups[0]!.key,
    );
    assert.equal(
      (await getPublishedPageLocale("owners", locale))?.content.faq_group_key,
      groups[0]!.key,
    );
  }
  assert.equal((await rows()).length, 0);
  assert.deepEqual(
    await db.select().from(page_content).where(eq(page_content.id, ROOT)),
    sourceBefore,
  );
});

test("new target has no EN FAQ; a saved ES selection becomes its private draft while existing blanks remain empty", async () => {
  const es = structuredClone(baseline);
  es.content.faq_group_key = groups[3]!.key;
  const fr = structuredClone(baseline);
  fr.content.faq_group_key = "";
  await db.insert(page_locale_content).values(
    locales.map((locale, index) => ({
      id: id(30 + index),
      page_key: "owners",
      locale,
      published:
        locale === "pt"
          ? null
          : locale === "es"
            ? es
            : locale === "fr"
              ? fr
              : baseline,
      draft: null,
      revision: locale === "pt" ? 0 : 5,
    })),
  );
  assert.equal((await model("pt")).working.content.faq_group_key, undefined);
  assert.equal(
    (await model("es")).working.content.faq_group_key,
    groups[3]!.key,
  );
  assert.equal((await model("fr")).working.content.faq_group_key, "");
  const original = await rows();
  const own = (await model("es")).working;
  own.content.faq_group_key = groups[1]!.key;
  own.content.hero.headline = "ES independent headline";
  success(await save("es", own));
  assert.equal(
    (await model("es")).draft?.content.faq_group_key,
    groups[1]!.key,
  );
  assert.equal(
    (await getPublishedPageLocale("owners", "es"))?.content.faq_group_key,
    groups[3]!.key,
  );
  assert.deepEqual(
    (await rows()).filter((row) => row.locale !== "es"),
    original.filter((row) => row.locale !== "es"),
  );
});

test("EN changes cannot replace target drafts or published selection; every locale publishes explicitly", async () => {
  const before = await rows();
  const en = (await model("en")).working;
  en.content.faq_group_key = groups[2]!.key;
  en.content.hero.headline = "EN later headline";
  success(await save("en", en));
  success(await publish("en"));
  assert.deepEqual(
    (await rows()).filter((row) => row.locale !== "en"),
    before.filter((row) => row.locale !== "en"),
  );
  assert.equal(
    (await model("es")).working.content.faq_group_key,
    groups[1]!.key,
  );
  success(await publish("es"));
  const es = await model("es");
  assert.equal(es.working.content.faq_group_key, groups[1]!.key);
  assert.equal(es.working.content.hero.headline, "ES independent headline");
  const published = await getPublishedPageLocale("owners", "es");
  assert.equal(published?.content.faq_group_key, groups[1]!.key);
  assert.equal(
    (await getFaqGroup("es", published!.content.faq_group_key!))?.items[0]
      ?.question,
    groups[1]!.question,
  );
  assert.equal(await getPublishedPageLocale("owners", "pt"), null);
  const pt = (await model("pt")).working;
  assert.equal(pt.content.faq_group_key, undefined);
  pt.content.faq_group_key = groups[2]!.key;
  const others = (await rows()).filter((row) => row.locale !== "pt");
  success(await save("pt", pt));
  success(await publish("pt"));
  assert.equal(
    (await getPublishedPageLocale("owners", "pt"))?.content.faq_group_key,
    groups[2]!.key,
  );
  assert.deepEqual(
    (await rows()).filter((row) => row.locale !== "pt"),
    others,
  );
});

test("clearing the selected language publishes no FAQ and never revives an active EN group", async () => {
  const own = (await model("es")).working;
  own.content.faq_group_key = "";
  const others = (await rows()).filter((row) => row.locale !== "es");
  success(await save("es", own));
  assert.equal(
    (await getPublishedPageLocale("owners", "es"))?.content.faq_group_key,
    groups[1]!.key,
  );
  success(await publish("es"));
  assert.equal(
    (await getPublishedPageLocale("owners", "es"))?.content.faq_group_key,
    "",
  );
  assert.equal((await model("es")).working.content.faq_group_key, "");
  assert.equal(
    (await getPublishedPageLocale("owners", "en"))?.content.faq_group_key,
    groups[2]!.key,
  );
  assert.deepEqual(
    (await rows()).filter((row) => row.locale !== "es"),
    others,
  );
});

test("stale revisions/template writes and target shared-media changes remain rejected without overwrites", async () => {
  const stale = await model("es");
  const en = (await model("en")).working;
  en.content.faq_group_key = groups[0]!.key;
  success(await save("en", en));
  const previous = await rows();
  assert.deepEqual(
    await saveEditorialDraft(
      {
        key: "owners",
        locale: "es",
        expectedRevision: stale.revision,
        templateRevision: stale.templateRevision,
        payload: stale.working,
      },
      actor,
    ),
    { ok: false, error: "conflict" },
  );
  const current = await model("es");
  const bad = structuredClone(current.working);
  bad.ogImageMediaId = id(99);
  const rejected = await save("es", bad);
  assert.equal(rejected.ok, false);
  if (!rejected.ok) assert.equal(rejected.error, "validation");
  assert.deepEqual(await rows(), previous);
  const own = current.working;
  own.content.faq_group_key = groups[1]!.key;
  success(await save("es", own));
  const newer = await rows();
  assert.deepEqual(
    await saveEditorialDraft(
      {
        key: "owners",
        locale: "es",
        expectedRevision: current.revision,
        templateRevision: current.templateRevision,
        payload: own,
      },
      actor,
    ),
    { ok: false, error: "conflict" },
  );
  assert.deepEqual(await rows(), newer);
  assert.equal(
    (await db.select().from(page_content).where(eq(page_content.id, ROOT)))[0]
      ?.data.faq_group_key,
    groups[0]!.key,
    "Aggregate saves never rewrite legacy source data",
  );
  assert.equal(
    (
      await db
        .select()
        .from(page_locale_content)
        .where(inArray(page_locale_content.page_key, ["owners"]))
    ).length,
    4,
  );
});
