import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { eq, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import { setSlugs } from "@core/i18n";
import type { Locale } from "@core/db/columns";
import type {
  PropertyEditorialResult,
  PropertyLocaleModel,
} from "@slices/backoffice/contract";
import type {
  BuildingEditorialContent,
  BuildingEnvelope,
} from "../editorial-types";
import { building, building_locale_content } from "../schema";
import {
  readBuildingIdentity,
  readBuildingLocaleRows,
  legacyBuildingLocaleRows,
} from "../server/editorial-bootstrap";
import { buildingLocaleModel } from "../server/editorial-model";
import { emptyBuildingEnvelope } from "../server/editorial-validation";
import {
  archiveBuildingIdentity,
  restoreBuildingIdentity,
  saveBuildingDraft,
  publishBuildingDraft,
  getBuildingLocaleScope,
  getBuildingSharedState,
} from "../server/editorial-store";
const CITY = "d1000000-0000-4000-8000-000000000001";
const EDITED = "e6400000-0000-4000-8000-000000000001";
const VIRGIN = "e6400000-0000-4000-8000-000000000002";
const LEGACY = "e6400000-0000-4000-8000-000000000003";
const actor = "building-status-backend";
type Model = PropertyLocaleModel<BuildingEditorialContent>;
let verified = false;
function success(result: PropertyEditorialResult<BuildingEditorialContent>) {
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) throw Error("Expected successful mutation");
  return result.model;
}
async function model(id: string, locale: Locale = "en"): Promise<Model> {
  const identity = await readBuildingIdentity(id);
  assert.ok(identity);
  return buildingLocaleModel(
    await readBuildingLocaleRows(identity),
    locale,
    emptyBuildingEnvelope(CITY),
  );
}
async function rows(id: string) {
  return db
    .select()
    .from(building_locale_content)
    .where(eq(building_locale_content.building_id, id))
    .orderBy(building_locale_content.locale);
}
async function save(
  id: string,
  current: Model,
  payload: BuildingEnvelope,
  sharedChanged = false,
) {
  return success(
    await saveBuildingDraft(
      {
        id,
        locale: current.locale,
        expectedRevision: current.revision,
        templateRevision: current.templateRevision,
        payload,
        sharedChanged,
        expectedSharedRevision:
          (await getBuildingSharedState(id))?.revision ?? 0,
      },
      actor,
    ),
  );
}
async function publish(id: string, current: Model) {
  return success(
    await publishBuildingDraft(
      { id, locale: current.locale, expectedRevision: current.revision },
      actor,
    ),
  );
}
async function create(id: string, slug: string, complete = true) {
  const payload = emptyBuildingEnvelope(CITY);
  if (complete)
    Object.assign(payload.content, {
      name: "Published English",
      teaser: "A complete synthetic teaser.",
      street_address: "Status QA Street",
    });
  return success(
    await saveBuildingDraft(
      {
        id,
        locale: "en",
        expectedRevision: 0,
        templateRevision: null,
        payload,
        slug,
        sharedChanged: true,
        expectedSharedRevision: 0,
      },
      actor,
    ),
  );
}
async function cleanup() {
  for (const id of [EDITED, VIRGIN, LEGACY]) {
    await db.execute(sql`delete from building where id=${id}::uuid`);
    await db.execute(sql`delete from translation where entity_id=${id}::uuid`);
    await db.execute(sql`delete from slug where entity_id=${id}::uuid`);
  }
}
before(async () => {
  assert.equal(
    new URL(process.env.DATABASE_URL ?? "http://invalid.test").hostname,
    "propertylocalesqa.local",
  );
  const identity = await db.execute(
    sql`select current_database() as database,current_user as role`,
  );
  assert.deepEqual(identity.rows[0], {
    database: "propertylocalesqa",
    role: "propertylocalesqa",
  });
  verified = true;
  Object.assign(globalThis, {
    __incrementalCache: {
      generateCacheKey: async (key: string) => key,
      get: async () => null,
      set: async () => undefined,
    },
  });
  await cleanup();
});
after(async () => {
  if (verified) await cleanup();
});

test("Archive is reversible; archived draft/common Save stays hidden and Restore preserves old publications/private drafts", async () => {
  await publish(EDITED, await create(EDITED, "building-status-edited"));
  const pt = await model(EDITED, "pt");
  const ptPayload = {
    ...structuredClone(pt.working),
    localeMode: "custom" as const,
  };
  ptPayload.content.name = "Publicado português";
  await publish(EDITED, await save(EDITED, pt, ptPayload));
  const publishedRows = await rows(EDITED);
  assert.deepEqual(await archiveBuildingIdentity(EDITED, actor), {
    ok: true,
    status: "archived",
  });
  assert.deepEqual(await rows(EDITED), publishedRows);
  for (const locale of ["en", "pt"] as const)
    assert.equal(
      (await getBuildingLocaleScope(EDITED, locale))?.published,
      false,
    );
  const own = await model(EDITED, "pt");
  const change = structuredClone(own.working);
  change.content.name = "Borrador português";
  change.content.meta_title = "Private SEO";
  change.content.street_address = "Saved while archived";
  const saved = await save(EDITED, own, change, true);
  assert.equal((await readBuildingIdentity(EDITED))?.status, "archived");
  assert.equal(saved.draft?.content.name, "Borrador português");
  assert.equal(
    (await getBuildingSharedState(EDITED))?.content.street_address,
    "Saved while archived",
  );
  assert.equal((await getBuildingLocaleScope(EDITED, "pt"))?.published, false);
  const beforeRestore = await rows(EDITED);
  assert.deepEqual(await restoreBuildingIdentity(EDITED, actor), {
    ok: true,
    status: "published",
  });
  assert.deepEqual(await rows(EDITED), beforeRestore);
  assert.equal((await getBuildingLocaleScope(EDITED, "pt"))?.published, true);
  assert.equal(
    (await model(EDITED, "pt")).published?.content.name,
    "Publicado português",
  );
  assert.equal(
    (await model(EDITED, "pt")).draft?.content.name,
    "Borrador português",
  );
  assert.equal((await getBuildingLocaleScope(EDITED, "es"))?.published, false);
});

test("Publishing an archived saved language activates the identity atomically and leaves every other locale untouched", async () => {
  assert.deepEqual(await archiveBuildingIdentity(EDITED, actor), {
    ok: true,
    status: "archived",
  });
  const before = await rows(EDITED);
  const pt = await model(EDITED, "pt");
  const published = await publish(EDITED, pt);
  assert.equal((await readBuildingIdentity(EDITED))?.status, "published");
  assert.equal(published.published?.content.name, "Borrador português");
  assert.equal(published.draft, null);
  const after = await rows(EDITED);
  assert.deepEqual(
    after.filter((row) => row.locale !== "pt"),
    before.filter((row) => row.locale !== "pt"),
  );
  assert.equal((await getBuildingLocaleScope(EDITED, "en"))?.published, true);
  assert.equal((await getBuildingLocaleScope(EDITED, "fr"))?.published, false);
});

test("An archived never-published draft stays private on Restore and becomes public only after a valid explicit Publish", async () => {
  await create(VIRGIN, "building-status-private", false);
  assert.deepEqual(await archiveBuildingIdentity(VIRGIN, actor), {
    ok: true,
    status: "archived",
  });
  const old = await model(VIRGIN);
  const invalid = await publishBuildingDraft(
    { id: VIRGIN, locale: "en", expectedRevision: old.revision },
    actor,
  );
  assert.equal(invalid.ok, false);
  assert.equal((await readBuildingIdentity(VIRGIN))?.status, "archived");
  const before = await rows(VIRGIN);
  assert.deepEqual(await restoreBuildingIdentity(VIRGIN, actor), {
    ok: true,
    status: "draft",
  });
  assert.deepEqual(await rows(VIRGIN), before);
  assert.equal((await getBuildingLocaleScope(VIRGIN, "en"))?.published, false);
  await archiveBuildingIdentity(VIRGIN, actor);
  const change = structuredClone(old.working);
  Object.assign(change.content, {
    name: "Valid after archive",
    teaser: "Ready for explicit publication.",
    street_address: "Draft QA Street",
  });
  const saved = await save(VIRGIN, await model(VIRGIN), change, true);
  assert.equal((await readBuildingIdentity(VIRGIN))?.status, "archived");
  await publish(VIRGIN, saved);
  assert.equal((await readBuildingIdentity(VIRGIN))?.status, "published");
  assert.equal((await getBuildingLocaleScope(VIRGIN, "en"))?.published, true);
  assert.equal((await getBuildingLocaleScope(VIRGIN, "pt"))?.published, false);
});

test("First archive captures untouched legacy publications before hiding and Restore never consumes pending translation", async () => {
  await db
    .insert(building)
    .values({
      id: LEGACY,
      slug: "building-status-legacy",
      status: "published",
      city_id: CITY,
      street_address: "Legacy QA Street",
    });
  await setSlugs("building", LEGACY, {
    en: "building-status-legacy",
    pt: "building-status-legado",
    es: "building-status-legado-es",
    fr: "building-status-ancien",
  });
  for (const [locale, field, value, state] of [
    ["en", "name", "Legacy English", "draft"],
    ["en", "teaser", "Legacy teaser", "draft"],
    ["pt", "name", "Legado publicado", "approved"],
    ["pt", "meta_title", "SEO pendente", "needs_review"],
  ])
    await db.execute(
      sql`insert into translation(entity_type,entity_id,field,locale,value,state)values('building',${LEGACY}::uuid,${field},${locale},${value},${state})`,
    );
  const identity = (await readBuildingIdentity(LEGACY))!;
  const legacy = await legacyBuildingLocaleRows(identity);
  assert.equal((await rows(LEGACY)).length, 0);
  assert.deepEqual(await archiveBuildingIdentity(LEGACY, actor), {
    ok: true,
    status: "archived",
  });
  const captured = await rows(LEGACY);
  assert.equal(captured.length, 4);
  for (const row of legacy) {
    const own = captured.find((r) => r.locale === row.locale)!;
    assert.deepEqual(own.published, row.published);
    assert.deepEqual(own.draft, row.draft);
  }
  assert.equal((await getBuildingLocaleScope(LEGACY, "pt"))?.published, false);
  assert.deepEqual(await restoreBuildingIdentity(LEGACY, actor), {
    ok: true,
    status: "published",
  });
  assert.deepEqual(await rows(LEGACY), captured);
  assert.equal((await getBuildingLocaleScope(LEGACY, "pt"))?.published, true);
  assert.equal((await model(LEGACY, "pt")).published?.content.meta_title, null);
  assert.equal(
    (await model(LEGACY, "pt")).draft?.content.meta_title,
    "SEO pendente",
  );
});
