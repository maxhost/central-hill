import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { artifactRoot, database, guard, keys, protectedSnapshot, req, routes, save } from "./common.mjs";
const sql = await database(), base = guard();
const { chromium } = req("playwright"), browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
page.setDefaultTimeout(30000);
page.setDefaultNavigationTimeout(90000);
const result = { checks: [], pageErrors: [], serverErrors: [], visuals: [] };
page.on("pageerror", error => result.pageErrors.push({ url: page.url(), message: error.message }));
page.on("response", response => { if (response.status() >= 500) result.serverErrors.push({ url: response.url(), status: response.status() }); });
try {
  for (const locale of ["en", "es", "pt", "fr"]) {
    await page.goto(`${base}/${locale}/privacy-policy`, { waitUntil: "domcontentloaded" });
    const foot = page.locator("footer");
    for (const key of keys) {
      assert.equal(await foot.locator(`a[href="/${locale}/${routes[key]}"]`).count(), 1);
      assert.equal(await page.locator(`[data-site-header] a[href$="/${routes[key]}"]`).count(), 0);
    }
    const heading = { en: "Others", es: "Otros", pt: "Outros", fr: "Autres" }[locale];
    await foot.getByRole("heading", { name: heading, exact: true }).waitFor();
    result.checks.push(`${locale}: Others label and all three locale-prefixed footer links; no navbar links`);
  }
  for (const device of [{ label: "desktop", width: 1440, height: 1000 }, { label: "mobile", width: 390, height: 844 }]) {
    await page.setViewportSize({ width: device.width, height: device.height });
    for (const key of keys) {
      await page.goto(`${base}/en/${routes[key]}`, { waitUntil: "domcontentloaded" });
      await page.locator("[data-legal-body]").waitFor();
      await page.evaluate(() => document.fonts.ready);
      const width = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: innerWidth }));
      assert.ok(width.scroll <= width.viewport + 1, `${device.label}/${key}: horizontal overflow ${JSON.stringify(width)}`);
      const screenshot = `${artifactRoot}/${routes[key]}-${device.label}-final.png`;
      await page.screenshot({ path: screenshot, fullPage: true });
      result.visuals.push(screenshot);
      if (key === "privacy_policy") {
        const footerShot = `${artifactRoot}/footer-${device.label}-final.png`;
        await page.locator("footer").screenshot({ path: footerShot });
        result.visuals.push(footerShot);
      }
    }
    result.checks.push(`${device.label}: three pages render and no horizontal overflow`);
  }
  for (const route of ["/admin/pages/privacy_policy", "/admin/preview/privacy_policy?locale=en&instance=qa-probe"]) {
    await page.goto(base + route, { waitUntil: "domcontentloaded" });
    assert.ok(new URL(page.url()).pathname === "/admin/login", "Anonymous editorial route requires normal login");
  }
  result.checks.push("Anonymous BO and private preview redirect to login");
  const before = JSON.parse(await fs.readFile(artifactRoot + "/business-before.json", "utf8"));
  const after = await protectedSnapshot(sql);
  assert.deepEqual(after, before, "Unrelated business tables and existing Page rows and migration ledger remain exact");
  result.protectedTables = Object.keys(after).filter(key => key !== "migrations").length;
  result.checks.push("Unrelated business rows and migration ledger exact");
  await save("business-after", after);
  assert.deepEqual(result.pageErrors, []);
  assert.deepEqual(result.serverErrors, []);
  result.ok = true;
} catch (error) {
  result.ok = false;
  result.failure = error.stack;
  throw error;
} finally {
  await browser.close();
  await save("additional-checks", result);
  console.log(JSON.stringify({ ok: result.ok, checks: result.checks.length, protectedTables: result.protectedTables, failure: result.failure }));
}
