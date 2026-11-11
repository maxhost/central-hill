import assert from "node:assert/strict";
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
} from "./qa-common.mjs";
const sql = await database(),
  b = await startBrowser(),
  result = {
    candidate: process.env.CANDIDATE_COMMIT,
    variant: "owners-popular-shared-precondition",
    locales: [],
    pageErrors: b.errors,
  };
try {
  for (const locale of ["en", "es", "pt", "fr"]) {
    const before = await snapshot(sql, "page", "owners"),
      current = own(before, locale);
    assert.equal(
      current.draft,
      null,
      "No pending text cycle during precondition",
    );
    await b.page.goto(b.base + "/admin/pages/owners", {
      waitUntil: "domcontentloaded",
    });
    await selectLocale(b.page, locale);
    await b.page.locator('select[id$="-binding"]').selectOption("plans");
    if (locale === "en") {
      const box = b.page.locator(
        '[id="page-field-owners-plans.tiers.0.is_popular"]',
      );
      for (let n = 0; n < 8 && !(await box.isVisible()); n++) {
        const closed = b.page.locator(
          'aside[aria-label="Inspector"] details:not([open]) > summary',
        );
        assert.ok(await closed.count());
        await closed.first().click();
      }
      await box.check();
    }
    const saved = await action(
      b.page,
      sql,
      "page",
      "owners",
      locale,
      "Save draft",
    );
    assert.equal(saved.draft.content.plans.tiers[0].is_popular, true);
    assert.deepEqual(saved.published, current.published);
    await record("variant-popular-" + locale + "-checkpoint", {
      phase: "saved",
      revision: saved.revision,
    });
    const published = await action(
      b.page,
      sql,
      "page",
      "owners",
      locale,
      "Publish",
    );
    await record("variant-popular-" + locale + "-checkpoint", {
      phase: "published",
      revision: published.revision,
    });
    const expected = structuredClone(current.published);
    expected.content.plans.tiers[0].is_popular = true;
    assert.deepEqual(
      published.published,
      expected,
      "Only intended shared popular flag changes",
    );
    assert.deepEqual(
      (await snapshot(sql, "page", "owners")).filter(
        (r) => r.locale !== locale,
      ),
      before.filter((r) => r.locale !== locale),
    );
    await waitUntil(async () => {
      await b.pub.goto(b.base + `/${locale}/owners`, {
        waitUntil: "domcontentloaded",
      });
      await publicAssert(b.pub, {
        kind: "visible-text",
        value: published.published.content.plans.popular_label,
      });
      return true;
    }, "Popular configured pill visible");
    result.locales.push({
      locale,
      save: saved.revision,
      publish: published.revision,
    });
  }
  assert.deepEqual(b.errors, []);
  result.ok = true;
  await record("variant-popular", result);
  console.log(JSON.stringify(result));
} catch (e) {
  result.ok = false;
  result.error = e.message;
  await record("variant-popular", result);
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await b.browser.close();
}
