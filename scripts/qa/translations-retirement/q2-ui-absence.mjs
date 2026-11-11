import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { startBrowser, record, out } from "./qa-common.mjs";
const f = JSON.parse(await fs.readFile(out + "/fixtures.json", "utf8")),
  b = await startBrowser(),
  result = {
    candidate: process.env.CANDIDATE_COMMIT,
    pages: [],
    pageErrors: b.errors,
    namespaceErrors: [],
  };
b.page.on("console", (m) => {
  if (
    m.type() === "error" &&
    /MISSING_MESSAGE|IntlError|translation|undefined export|Cannot read properties/.test(m.text())
  )
    result.namespaceErrors.push(m.text());
});
try {
  for (const path of [
    "/admin/pages",
    "/admin/pages/home",
    "/admin/pages/about",
    "/admin/pages/blog",
    "/admin/pages/blog/article-sidebar",
    `/admin/posts/${f.ids.post}`,
    `/admin/services/${f.ids.service}`,
    `/admin/guides/${f.ids.guide}`,
    "/admin/settings",
  ]) {
    const response = await b.page.goto(b.base + path, { waitUntil: "domcontentloaded" });
    assert.equal(response.status(), 200, path);
    assert.equal(await b.page.locator('a[href^="/admin/translations"]').count(), 0, path);
    assert.equal(
      await b.page.locator("nav").getByText("Translations", { exact: true }).count(),
      0,
      path,
    );
    result.pages.push({ path, status: 200, noLegacyLinks: true });
  }
  for (const path of [
    "/admin/translations",
    `/admin/translations/service/${f.ids.service}`,
    "/admin/translations/unknown/not-an-id",
  ]) {
    await b.page.goto(b.base + path, { waitUntil: "domcontentloaded" });
    assert.ok(!new URL(b.page.url()).pathname.startsWith("/admin/translations"));
  }
  assert.deepEqual(b.errors, []);
  assert.deepEqual(result.namespaceErrors, []);
  result.ok = true;
  await record("q2-ui-absence", result);
  console.log(
    JSON.stringify({ ok: true, pages: result.pages.length, pageErrors: 0, namespaceErrors: 0 }),
  );
} catch (e) {
  result.ok = false;
  result.error = e.message;
  await record("q2-ui-absence", result);
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await b.browser.close();
}
