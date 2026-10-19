import test from "node:test";
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "@core/db/client";
import { page_locale_content } from "../schema";
import { commitEditorial } from "../admin/editorial-store";
import { defaultBuildings } from "../schemas/buildings";
import type { PageEnvelope } from "../editorial-types";
import { assertEditorialTestDatabase } from "./editorial-test-environment";

test("Real DB CAS isolates page/language and persistent revisions reject saves after publication", async () => {
  await assertEditorialTestDatabase();
  const keys = ["buildings", "owners"];
  const originals = await db
    .select()
    .from(page_locale_content)
    .where(inArray(page_locale_content.page_key, keys));
  try {
    await db
      .delete(page_locale_content)
      .where(inArray(page_locale_content.page_key, keys));
    const payload: PageEnvelope<"buildings"> = {
      schemaVersion: 1,
      content: structuredClone(defaultBuildings),
      ogImageMediaId: null,
    };
    await db.insert(page_locale_content).values([
      { page_key: "buildings", locale: "en", published: payload, revision: 0 },
      {
        page_key: "buildings",
        locale: "es",
        published: payload,
        draft: payload,
        revision: 5,
      },
      { page_key: "owners", locale: "en", revision: 7 },
    ]);
    const witness = await db
      .select()
      .from(page_locale_content)
      .where(eq(page_locale_content.page_key, "owners"));
    const spanish = await db
      .select()
      .from(page_locale_content)
      .where(eq(page_locale_content.locale, "es"));
    const saves = await Promise.all(
      [0, 1].map(() =>
        commitEditorial({
          key: "buildings",
          locale: "en",
          revision: 0,
          payload,
          actor: "pageeditorsqa-staff",
        }),
      ),
    );
    assert.equal(saves.filter(Boolean).length, 1);
    assert.equal(
      await commitEditorial({
        key: "buildings",
        locale: "en",
        revision: 1,
        publish: true,
        actor: "pageeditorsqa-staff",
      }),
      true,
    );
    assert.equal(
      await commitEditorial({
        key: "buildings",
        locale: "en",
        revision: 1,
        payload,
        actor: "pageeditorsqa-staff",
      }),
      false,
    );
    assert.equal(
      await commitEditorial({
        key: "buildings",
        locale: "en",
        revision: 2,
        publish: true,
        actor: "pageeditorsqa-staff",
      }),
      false,
    );
    const [published] = await db
      .select()
      .from(page_locale_content)
      .where(eq(page_locale_content.page_key, "buildings"));
    const en = (
      await db
        .select()
        .from(page_locale_content)
        .where(eq(page_locale_content.page_key, "buildings"))
    ).find((row) => row.locale === "en")!;
    assert.ok(published);
    assert.equal(en.revision, 2);
    assert.equal(en.draft, null);
    assert.deepEqual(en.published, payload);
    assert.deepEqual(
      await db
        .select()
        .from(page_locale_content)
        .where(eq(page_locale_content.page_key, "owners")),
      witness,
    );
    assert.deepEqual(
      await db
        .select()
        .from(page_locale_content)
        .where(eq(page_locale_content.locale, "es")),
      spanish,
    );
  } finally {
    await db
      .delete(page_locale_content)
      .where(inArray(page_locale_content.page_key, keys));
    if (originals.length)
      await db.insert(page_locale_content).values(originals);
  }
});
