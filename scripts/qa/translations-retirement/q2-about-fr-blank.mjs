import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {
  database,
  startBrowser,
  snapshot,
  own,
  action,
  selectLocale,
  publicAssert,
  waitUntil,
  record,
  out,
} from "./qa-common.mjs";
const fixture = JSON.parse(await fs.readFile(out + "/fixtures.json", "utf8")),
  sql = await database(),
  b = await startBrowser(),
  result = { candidate: process.env.CANDIDATE_COMMIT, pageErrors: b.errors };
try {
  const before = await snapshot(sql, "page", "about"),
    fr = own(before, "fr");
  assert.equal(fr.published.content.faq_group_key, fixture.faq.fr.key);
  await b.page.goto(b.base + "/admin/pages/about", { waitUntil: "domcontentloaded" });
  await selectLocale(b.page, "fr");
  await b.page.locator('select[id$="-binding"]').selectOption("faq");
  await b.page.locator('[id="page-field-about-faq_group_key"]').selectOption("");
  const saved = await action(b.page, sql, "page", "about", "fr", "Save draft");
  assert.equal(saved.draft.content.faq_group_key, "");
  assert.deepEqual(saved.published, fr.published);
  await record("q2-about-fr-blank-checkpoint", { phase: "draft-saved", revision: saved.revision });
  await b.page.reload({ waitUntil: "domcontentloaded" });
  await selectLocale(b.page, "fr");
  await b.page.locator('select[id$="-binding"]').selectOption("faq");
  assert.equal(await b.page.locator('[id="page-field-about-faq_group_key"]').inputValue(), "");
  await b.pub.goto(b.base + "/fr/about", { waitUntil: "domcontentloaded" });
  await publicAssert(b.pub, { kind: "visible-text", value: "QA FR FAQ question" });
  const published = await action(b.page, sql, "page", "about", "fr", "Publish");
  await record("q2-about-fr-blank-checkpoint", {
    phase: "published",
    revision: published.revision,
  });
  await waitUntil(async () => {
    await b.pub.goto(b.base + "/fr/about", { waitUntil: "domcontentloaded" });
    return !(await b.pub.locator("body").innerText()).includes("QA FR FAQ question");
  }, "Cleared FAQ public removal");
  const text = await b.pub.locator("body").innerText();
  assert.ok(!text.includes("QA EN FAQ question"));
  await publicAssert(b.pub, { kind: "visible-text", value: fr.published.content.hero.headline });
  assert.deepEqual(
    (await snapshot(sql, "page", "about")).filter((r) => r.locale !== "fr"),
    before.filter((r) => r.locale !== "fr"),
  );
  assert.deepEqual(b.errors, []);
  result.ok = true;
  result.savedRevision = saved.revision;
  result.publishedRevision = published.revision;
  result.noEnglishInheritance = true;
  await record("q2-about-fr-blank", result);
  console.log(JSON.stringify(result));
} catch (e) {
  result.ok = false;
  result.error = e.message;
  await record("q2-about-fr-blank", result);
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await b.browser.close();
}
