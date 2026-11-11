import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {
  database,
  startBrowser,
  snapshot,
  own,
  action,
  publicAssert,
  waitUntil,
  record,
  out,
} from "./qa-common.mjs";
const fixture = JSON.parse(await fs.readFile(out + "/fixtures.json", "utf8")),
  id = fixture.ids.service,
  sql = await database(),
  b = await startBrowser(),
  result = {
    candidate: process.env.CANDIDATE_COMMIT,
    variant: "service-conditional-public-branches",
    steps: [],
    pageErrors: b.errors,
  };
const initial = await snapshot(sql, "service", id);
assert.ok(
  initial.every((r) => r.draft === null),
  "Run after four principal Service units",
);
async function shared(booking, priceMode) {
  const before = await snapshot(sql, "service", id),
    en = own(before, "en");
  await b.page.goto(b.base + `/admin/services/${id}`, { waitUntil: "domcontentloaded" });
  await b.page.locator('[data-service-path="booking_type"]').selectOption(booking);
  const price = b.page
    .locator("select")
    .filter({ has: b.page.locator('option[value="on_request"]') });
  assert.equal(await price.count(), 1);
  await price.selectOption(priceMode);
  const saved = await action(b.page, sql, "service", id, "en", "Save draft");
  await record("variant-service-checkpoint", {
    phase: "draft-saved",
    booking,
    priceMode,
    revision: saved.revision,
  });
  const published = await action(b.page, sql, "service", id, "en", "Publish");
  await record("variant-service-checkpoint", {
    phase: "published",
    booking,
    priceMode,
    revision: published.revision,
  });
  assert.deepEqual(
    (await snapshot(sql, "service", id)).filter((r) => r.locale !== "en"),
    before.filter((r) => r.locale !== "en"),
  );
  const expected = structuredClone(en.published);
  expected.content.booking_type = booking;
  expected.content.presentation =
    priceMode === "auto" ? null : { version: 1, price_display: priceMode };
  assert.deepEqual(published.published, expected, "Only intended shared mode changes");
  result.steps.push({
    booking,
    priceMode,
    save: saved.revision,
    publish: published.revision,
    checks: [],
  });
}
async function checkKeys(keys, { mobile = false, photos = false } = {}) {
  await b.pub.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 });
  for (const locale of ["en", "es", "pt", "fr"]) {
    const content = own(initial, locale).published.content;
    await waitUntil(async () => {
      await b.pub.goto(b.base + fixture.publicPaths[locale].service, {
        waitUntil: "domcontentloaded",
      });
      if (photos)
        await b.pub.getByRole("button", { name: content.copy.showAllPhotos, exact: true }).click();
      for (const key of keys) {
        const value =
          key === "enquiryTitle"
            ? content.copy[key].replace("{name}", content.name)
            : content.copy[key];
        await publicAssert(b.pub, { kind: "visible-text", value });
      }
      return true;
    }, "Conditional Service branch " + locale);
    result.steps.at(-1).checks.push({ locale, keys, mobile, photos });
    if (photos) await b.pub.getByRole("button", { name: content.copy.close, exact: true }).click();
  }
}
try {
  await shared("enquiry", "auto");
  await checkKeys([
    "phone",
    "whatsapp",
    "email",
    "noPayment",
    "enquiryTitle",
    "enquiryIntro",
    "enquiryInfoTitle",
  ]);
  await checkKeys(["requestShort"], { mobile: true });
  await shared("enquiry", "on_request");
  await checkKeys(["onRequest"]);
  await shared("none", "on_request");
  await checkKeys(["seePartners"]);
  await checkKeys(["allPhotos", "close"], { photos: true });
  await shared("external", "auto");
  const final = await snapshot(sql, "service", id);
  for (const locale of ["en", "es", "pt", "fr"])
    assert.deepEqual(
      own(final, locale).published,
      own(initial, locale).published,
      "Restored shared mode preserves all authored text/ALT/publications",
    );
  await b.pub.setViewportSize({ width: 1440, height: 1000 });
  for (const locale of ["en", "es", "pt", "fr"]) {
    await b.pub.goto(b.base + fixture.publicPaths[locale].service, {
      waitUntil: "domcontentloaded",
    });
    await publicAssert(b.pub, {
      kind: "visible-text",
      value: own(initial, locale).published.content.name,
    });
    await publicAssert(b.pub, {
      kind: "link-href",
      value: own(initial, locale).published.content.cta_url,
    });
  }
  assert.deepEqual(b.errors, []);
  result.ok = true;
  result.restoredModes = true;
  result.noSubmission = true;
  await record("variant-service-conditionals", result);
  console.log(
    JSON.stringify({
      ok: true,
      steps: result.steps.length,
      checks: result.steps.reduce((n, s) => n + s.checks.length, 0),
      pageErrors: b.errors,
    }),
  );
} catch (e) {
  result.ok = false;
  result.error = e.message;
  await record("variant-service-conditionals", result);
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await b.browser.close();
}
