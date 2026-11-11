import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {
  database,
  startBrowser,
  snapshot,
  own,
  publicAssert,
  waitUntil,
  record,
  out,
} from "./qa-common.mjs";
const fixture = JSON.parse(await fs.readFile(out + "/fixtures.json", "utf8")),
  sql = await database(),
  b = await startBrowser(),
  result = {
    candidate: process.env.CANDIDATE_COMMIT,
    variant: "guides-empty-own-archive-restore",
    pageErrors: b.errors,
    locales: [],
  };
try {
  const before = await snapshot(sql, "guide", fixture.ids.guide),
    pages = await snapshot(sql, "page", "guides");
  assert.ok(
    before.every((r) => r.draft === null),
    "Run after final Guide text units",
  );
  const identityBefore = (
    await sql`select id,status from guide_page where id=${fixture.ids.guide}::uuid`
  )[0];
  assert.equal(identityBefore.status, "published");
  await b.page.goto(b.base + `/admin/guides/${fixture.ids.guide}`, {
    waitUntil: "domcontentloaded",
  });
  await b.page.getByRole("button", { name: "Archive", exact: true }).click();
  await waitUntil(async () => {
    const row = (await sql`select status from guide_page where id=${fixture.ids.guide}::uuid`)[0];
    return row.status === "archived";
  }, "Own Guide archived");
  await record("variant-guides-empty-checkpoint", { phase: "archived", before, identityBefore });
  assert.deepEqual(
    await snapshot(sql, "guide", fixture.ids.guide),
    before,
    "Archive does not change any draft/publication/revision",
  );
  for (const locale of ["en", "es", "pt", "fr"]) {
    const text = own(pages, locale).published.content.catalogue.empty_message;
    await waitUntil(async () => {
      await b.pub.goto(b.base + `/${locale}/guides`, { waitUntil: "domcontentloaded" });
      await publicAssert(b.pub, { kind: "visible-text", value: text });
      return true;
    }, "Guide catalogue empty label " + locale);
    result.locales.push({ locale, emptyMessage: text, visible: true });
  }
  await b.page.getByRole("button", { name: "Restore", exact: true }).click();
  await waitUntil(async () => {
    const row = (await sql`select status from guide_page where id=${fixture.ids.guide}::uuid`)[0];
    return row.status === "published";
  }, "Own Guide restored");
  await record("variant-guides-empty-checkpoint", { phase: "restored" });
  assert.deepEqual(await snapshot(sql, "guide", fixture.ids.guide), before);
  assert.deepEqual(await snapshot(sql, "page", "guides"), pages);
  for (const locale of ["en", "es", "pt", "fr"]) {
    await waitUntil(async () => {
      await b.pub.goto(b.base + fixture.publicPaths[locale].guide, {
        waitUntil: "domcontentloaded",
      });
      await publicAssert(b.pub, {
        kind: "visible-text",
        value: own(before, locale).published.content.title,
      });
      return true;
    }, "Restored Guide public " + locale);
  }
  assert.deepEqual(b.errors, []);
  result.ok = true;
  result.revisionsAndSnapshotsUnchanged = true;
  await record("variant-guides-empty", result);
  console.log(JSON.stringify(result));
} catch (e) {
  result.ok = false;
  result.error = e.message;
  await record("variant-guides-empty", result);
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await b.browser.close();
}
