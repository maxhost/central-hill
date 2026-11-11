import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {
  database,
  startBrowser,
  snapshot,
  own,
  action,
  selectLocale,
  record,
  out,
} from "./qa-common.mjs";
const fixture = JSON.parse(await fs.readFile(out + "/fixtures.json", "utf8")),
  id = fixture.ids.secondPost,
  sql = await database(),
  b = await startBrowser(),
  result = {
    candidate: process.env.CANDIDATE_COMMIT,
    variant: "secondary-post-inherit-sidebar-cta",
    locales: [],
    pageErrors: b.errors,
  };
try {
  for (const locale of ["en", "es", "pt", "fr"]) {
    const before = await snapshot(sql, "post", id),
      current = own(before, locale);
    await b.page.goto(b.base + `/admin/posts/${id}`, { waitUntil: "domcontentloaded" });
    await selectLocale(b.page, locale);
    let saved;
    if (current.draft) {
      assert.equal(locale, "en");
      assert.equal(current.revision, 1);
      assert.equal(current.draft.content.cta_label, "");
      assert.equal(current.draft.content.cta_url, "");
      saved = current;
      result.resumedExistingENSave = true;
    } else {
      await b.page.locator('[data-post-field="cta_label"] input').fill("");
      await b.page.locator('[data-post-field="cta_url"] input').fill("");
      saved = await action(b.page, sql, "post", id, locale, "Save draft");
    }
    assert.ok(!saved.draft.content.cta_label);
    assert.ok(!saved.draft.content.cta_url);
    await record("variant-secondary-cta-" + locale + "-checkpoint", {
      phase: "saved",
      revision: saved.revision,
    });
    const published = await action(b.page, sql, "post", id, locale, "Publish");
    await record("variant-secondary-cta-" + locale + "-checkpoint", {
      phase: "published",
      revision: published.revision,
    });
    const expected = structuredClone(current.published);
    expected.content.cta_label = saved.draft.content.cta_label;
    expected.content.cta_url = saved.draft.content.cta_url;
    assert.deepEqual(published.published, expected);
    assert.deepEqual(
      (await snapshot(sql, "post", id)).filter((r) => r.locale !== locale),
      before.filter((r) => r.locale !== locale),
    );
    result.locales.push({ locale, save: saved.revision, publish: published.revision });
  }
  assert.deepEqual(b.errors, []);
  result.ok = true;
  await record("variant-secondary-cta", result);
  console.log(JSON.stringify(result));
} catch (e) {
  result.ok = false;
  result.error = e.message;
  await record("variant-secondary-cta", result);
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await b.browser.close();
}
