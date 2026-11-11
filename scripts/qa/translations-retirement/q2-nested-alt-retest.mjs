import assert from "node:assert/strict";
import { database, startBrowser, snapshot, selectLocale, record } from "./qa-common.mjs";
const sql = await database(),
  before = await snapshot(sql, "page", "about"),
  b = await startBrowser(),
  result = { candidate: process.env.CANDIDATE_COMMIT, pageErrors: b.errors, readOnly: true };
try {
  const response = await b.page.goto(b.base + "/admin/pages/about", {
    waitUntil: "domcontentloaded",
  });
  assert.equal(response.status(), 200);
  await selectLocale(b.page, "fr");
  await b.page.locator('select[id$="-binding"]').selectOption("certifications");
  const inspector = b.page.locator('aside[aria-label="Inspector"]');
  await inspector.waitFor();
  await b.page.locator('[id="page-field-about-certifications.items.0.logo_alt"]').waitFor();
  assert.ok(!(await b.page.locator("body").innerText()).includes("Something went wrong"));
  result.controlObserved = true;
  result.inspectorIdlessTextControls = await inspector
    .locator('textarea:not([id]),input:not([id]):not([type="file"]):not([type="hidden"])')
    .count();
  assert.deepEqual(
    await snapshot(sql, "page", "about"),
    before,
    "Readonly inspector opening preserves all revisions/drafts/publications",
  );
  assert.deepEqual(b.errors, []);
  result.ok = true;
  await record("q2-nested-alt-retest", result);
  console.log(JSON.stringify(result));
} catch (e) {
  result.ok = false;
  result.error = e.message;
  await record("q2-nested-alt-retest", result);
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await b.browser.close();
}
