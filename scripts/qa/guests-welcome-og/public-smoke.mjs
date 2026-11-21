import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import { browser, root, base, until } from "../guests-welcome-media/common.mjs";
const req = createRequire(new URL("../../../package.json", import.meta.url));
const uri = new URL(process.env.DATABASE_URL);
assert.equal(uri.hostname, "welcomeqa20261121.local");
assert.equal(uri.username, "welcomeqa20261121");
const { neon } = req("@neondatabase/serverless"),
  sql = neon(uri.href);
const routes = {
  home: "",
  owners: "owners",
  real_estate: "real-estate",
  about: "about",
  guest: "guests",
  blog: "blog",
  guides: "guides",
  buildings: "buildings",
  services: "services",
  privacy_policy: "privacy-policy",
  cookies_policy: "cookies-policy",
  complaints_book: "complaints-book",
};
const snapshot = () =>
  sql`select page_key,locale,published,draft,revision from page_locale_content order by page_key,locale`;
const before = await snapshot();
const b = await browser(),
  context = await b.newContext({ viewport: { width: 1440, height: 1000 } }),
  page = await context.newPage();
page.setDefaultNavigationTimeout(120000);
const cases = [],
  failures = [],
  errors = [];
let activeRoute = "";
page.on("pageerror", (error) =>
  errors.push({ route: activeRoute, message: error.message }),
);
try {
  for (const [key, path] of Object.entries(routes))
    for (const locale of ["en", "es", "pt", "fr"]) {
      activeRoute = base + "/" + locale + (path ? "/" + path : "");
      const own = before.find(
        (row) => row.page_key === key && row.locale === locale,
      );
      const selected =
        own?.published ||
        before.find((row) => row.page_key === key && row.locale === "en")
          ?.published;
      assert.ok(
        selected?.ogImageMediaId,
        key + "/" + locale + " OG matrix must finish first",
      );
      const expectedId = selected.ogImageMediaId;
      const startErrors = errors.length;
      const response = await page.goto(activeRoute, {
        waitUntil: "domcontentloaded",
      });
      assert.equal(response.status(), 200, activeRoute);
      await response.finished();
      await until(
        () =>
          page
            .locator('meta[property="og:image"]')
            .getAttribute("content")
            .then((value) => value?.includes(expectedId)),
        "published own OG " + activeRoute,
      );
      assert.equal(
        await page.locator("#__next_error__").count(),
        0,
        "No server error document",
      );
      await page.locator("main").first().waitFor({ state: "visible" });
      assert.equal(
        await page.locator("[data-editor-binding]").count(),
        0,
        "No private preview annotations",
      );
      assert.equal(
        errors.length,
        startErrors,
        JSON.stringify(errors.slice(startErrors)),
      );
      const asset = (
        await sql`select width,height from media_asset where id=${expectedId}::uuid`
      )[0];
      const width = await page
        .locator('meta[property="og:image:width"]')
        .getAttribute("content");
      const height = await page
        .locator('meta[property="og:image:height"]')
        .getAttribute("content");
      assert.equal(Number(width), asset.width);
      assert.equal(Number(height), asset.height);
      cases.push({
        key,
        locale,
        route: activeRoute,
        status: response.status(),
        expectedId,
        width: asset.width,
        height: asset.height,
        pageErrors: 0,
      });
      console.log("PUBLIC SMOKE PASS", key, locale);
    }
  assert.deepEqual(
    await snapshot(),
    before,
    "Public GETs do not change editorial snapshots",
  );
} catch (error) {
  failures.push({ route: activeRoute, error: error.stack });
  throw error;
} finally {
  await fs.writeFile(
    root + "/og/public-smoke.json",
    JSON.stringify(
      {
        cases,
        errors,
        failures,
        complete: cases.length === 48 && !failures.length,
      },
      null,
      2,
    ),
  );
  await b.close();
}
