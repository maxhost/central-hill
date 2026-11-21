import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { artifactRoot, database, guard, keys, own, req, routes, save, snapshot, until } from "./common.mjs";

const requested = process.argv[2] || "all";
assert.ok(requested === "all" || keys.includes(requested));
const sql = await database(), base = guard();
const { chromium } = req("playwright");
const browser = await chromium.launch({ headless: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-").toLowerCase();
const videoDir = path.join(artifactRoot, "videos", stamp);
await fs.mkdir(videoDir, { recursive: true, mode: 0o700 });
const admin = await browser.newContext({ viewport: { width: 1440, height: 1000 }, recordVideo: { dir: videoDir, size: { width: 1440, height: 1000 } } });
const anonymous = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const authPage = await admin.newPage();
authPage.setDefaultTimeout(30000);
authPage.setDefaultNavigationTimeout(90000);
const credentials = JSON.parse(await fs.readFile(artifactRoot + "/login-private.json", "utf8"));
await authPage.goto(base + "/admin/login", { waitUntil: "domcontentloaded" });
await authPage.getByLabel("Email", { exact: true }).fill(credentials.email);
await authPage.getByLabel("Password", { exact: true }).fill(credentials.password);
await authPage.getByRole("button", { name: /Sign in|Log in/i }).click();
await authPage.waitForURL(url => !url.pathname.includes("/login"));
const loginVideo = authPage.video();
await authPage.close();
await loginVideo.delete(); // Keep normal in-context login; never copy/extract session state.
const reports = [];

async function selectLocale(page, locale) {
  await page.getByRole("group", { name: "Content language", exact: true }).getByRole("button", { name: locale === "en" ? /^EN/ : locale.toUpperCase(), exact: locale !== "en" }).click();
}
async function section(page, key) {
  await page.locator('select[id$="-binding"]').selectOption(key);
  console.log(JSON.stringify({ stage: "select-section", key }));
}
async function title(page, key, value) {
  await section(page, "title");
  await page.locator(`#page-field-${key}-title`).fill(value);
}
async function body(page, lines, addList = false) {
  await section(page, "body");
  const editor = page.locator("[data-page-rich-text][contenteditable=true]");
  await editor.fill(lines[0]);
  for (const text of lines.slice(1)) {
    await editor.press("End");
    await editor.press("Enter");
    await editor.pressSequentially(text, { delay: 2 });
  }
  if (addList) {
    await editor.press("End");
    await editor.press("Enter");
    await page.getByRole("button", { name: "Bulleted list", exact: true }).click();
    await editor.pressSequentially("Additional EN list item", { delay: 2 });
  }
}
async function live(page, key, token) {
  await until(async () => {
    const frame = page.frames().find(frame => frame.url().includes(`/admin/preview/${key}?`));
    return frame && (await frame.locator("[data-legal-body]").innerText()).includes(token);
  }, `live preview ${key} ${token}`);
}
async function action(page, key, locale, name) {
  const before = own(await snapshot(sql, key), locale);
  const button = page.getByRole("button", { name, exact: true }).first();
  await button.click();
  try {
    const row = await until(async () => {
      const row = own(await snapshot(sql, key), locale);
      return row && row.revision > (before?.revision || 0) && (name !== "Publish" || !row.draft) ? row : null;
    }, `${key}/${locale}/${name}`);
    // SQL commits before the server-action response flushes cache invalidations.
    // Wait for the normal UI to finish before leaving the editor.
    await page.getByRole("button", { name: "Save draft", exact: true }).first().waitFor();
    await until(() => page.getByRole("button", { name: "Save draft", exact: true }).first().isEnabled(), `${key}/${locale}/${name} settled UI`);
    return row;
  } catch (error) {
    const alerts = await page.locator('[role="alert"],[aria-invalid="true"]').allTextContents();
    throw new Error(error.message + "; UI validation=" + JSON.stringify(alerts));
  }
}
async function publish(page, key, locale) {
  await action(page, key, locale, "Save draft");
  return action(page, key, locale, "Publish");
}
async function viaFooter(page, key, locale, heading, token) {
  await page.goto(`${base}/${locale}/about`, { waitUntil: "domcontentloaded" });
  const link = page.locator(`footer a[href="/${locale}/${routes[key]}"]`);
  await link.scrollIntoViewIfNeeded();
  await link.click();
  await page.waitForURL(url => url.pathname === `/${locale}/${routes[key]}`);
  await assertPublic(page, key, locale, heading, token);
}
async function assertPublic(page, key, locale, heading, token) {
  const content = page.locator(`[data-legal-page="${key}"]`);
  await content.getByRole("heading", { name: heading, exact: true }).waitFor();
  assert.ok((await content.locator("[data-legal-body]").innerText()).includes(token));
  assert.equal(await page.locator("html").getAttribute("lang"), locale);
  assert.equal(await page.locator(`[data-site-header] a[href$="/${routes[key]}"]`).count(), 0, "No legal navigation link in navbar");
  assert.equal(await page.locator("[data-site-header]").count(), 1);
  assert.equal(await page.locator("footer").count(), 1);
  assert.equal(await page.locator("[data-editor-binding]").count(), 0, "No private editing annotations publicly");
}
async function anonymousCheck(key, locale, heading, token) {
  const page = await anonymous.newPage();
  const response = await page.goto(`${base}/${locale}/${routes[key]}`, { waitUntil: "domcontentloaded", timeout: 90000 });
  assert.equal(response.status(), 200);
  await assertPublic(page, key, locale, heading, token);
  await page.close();
}

try {
  for (const key of requested === "all" ? keys : [requested]) {
    const page = await admin.newPage();
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(90000);
    page.on("dialog", dialog => dialog.accept());
    const report = { key, route: routes[key], stamp, checks: [], pageErrors: [], serverErrors: [], publicResponses: [] };
    page.on("pageerror", error => report.pageErrors.push({ url: page.url(), message: error.message }));
    page.on("response", response => {
      if (response.status() >= 500) report.serverErrors.push({ url: response.url(), status: response.status() });
      const url = new URL(response.url());
      if (keys.some(legalKey => url.pathname.endsWith("/" + routes[legalKey])))
        report.publicResponses.push({ url: response.url(), status: response.status(), cache: response.headers()["x-nextjs-cache"], contentType: response.headers()["content-type"] });
    });
    const initial = await snapshot(sql, key);
    const enHeading = `QA ${routes[key]} English`, esHeading = `QA ${routes[key]} Español`;
    const en1 = `English first publication ${routes[key]}`;
    const en2 = `English revised publication ${routes[key]}`;
    const es1 = `Contenido español independiente ${routes[key]}`;
    let failure;
    try {
      if (!initial.some(row => row.published)) {
        const initialPublic = await anonymous.newPage();
        const response = await initialPublic.goto(`${base}/en/${routes[key]}`, { waitUntil: "domcontentloaded", timeout: 90000 });
        assert.equal(response.status(), 404);
        await initialPublic.goto(`${base}/en/about`, { waitUntil: "domcontentloaded" });
        assert.equal(await initialPublic.locator(`footer a[href="/en/${routes[key]}"]`).count(), 0);
        await initialPublic.close();
        report.checks.push("Unpublished page404 and absent footer link");
      }
      await page.goto(`${base}/admin/pages/${key}`, { waitUntil: "domcontentloaded" });
      await title(page, key, enHeading);
      await body(page, [en1, "A second paragraph authored in the Rich editor."]);
      await live(page, key, en1);
      report.checks.push("Unsaved EN Rich content appears in private live preview");
      await action(page, key, "en", "Save draft");
      const savedEN = own(await snapshot(sql, key), "en");
      assert.ok(savedEN.draft);
      if (!initial.some(row => row.published)) {
        const probe = await anonymous.newPage();
        const response = await probe.goto(`${base}/en/${routes[key]}`, { waitUntil: "domcontentloaded" });
        assert.equal(response.status(), 404);
        await probe.close();
      }
      report.checks.push("Save draft remains private");
      await action(page, key, "en", "Publish");
      await viaFooter(page, key, "en", enHeading, en1);
      await anonymousCheck(key, "en", enHeading, en1);
      report.checks.push("Create/publish EN in BO; navigate from public footer; anonymous EN200");
      await page.goto(`${base}/admin/pages/${key}`, { waitUntil: "domcontentloaded" });
      await selectLocale(page, "es");
      await title(page, key, esHeading);
      await body(page, [es1, "Este párrafo conserva su traducción aunque cambie inglés."]);
      await live(page, key, es1);
      await publish(page, key, "es");
      const esBefore = own(await snapshot(sql, key), "es");
      await viaFooter(page, key, "es", esHeading, es1);
      await anonymousCheck(key, "es", esHeading, es1);
      report.checks.push("ES translated independently in Rich, live preview and public footer destination200");
      await page.goto(`${base}/admin/pages/${key}`, { waitUntil: "domcontentloaded" });
      await title(page, key, enHeading + " updated");
      await body(page, [en2, "English paragraph two changed.", "A new third paragraph that has no ES counterpart."], true);
      await live(page, key, en2);
      await publish(page, key, "en");
      const finalRows = await snapshot(sql, key);
      assert.deepEqual(own(finalRows, "es"), esBefore, "Complete saved ES snapshot/revision/timestamp remains intact");
      assert.ok(own(finalRows, "en").published.content.body.length > esBefore.published.content.body.length);
      await viaFooter(page, key, "en", enHeading + " updated", en2);
      await viaFooter(page, key, "es", esHeading, es1);
      await anonymousCheck(key, "es", esHeading, es1);
      report.checks.push("EN content and structure changed; ES snapshot exact and public translation intact");
      await viaFooter(page, key, "pt", enHeading + " updated", en2);
      await anonymousCheck(key, "pt", enHeading + " updated", en2);
      assert.equal(own(finalRows, "pt")?.published ?? null, null);
      await anonymousCheck(key, "fr", enHeading + " updated", en2);
      report.checks.push("Untranslated PT and FR show current EN snapshot within their localized shell");
      await page.screenshot({ path: `${artifactRoot}/${routes[key]}-desktop.png`, fullPage: true });
      assert.deepEqual(report.pageErrors, []);
      assert.deepEqual(report.serverErrors, []);
      report.ok = true;
    } catch (error) {
      failure = error;
      report.ok = false;
      report.failure = error.stack;
      report.failureState = { url: page.url(), headings: await page.locator("h1").allTextContents(), legalText: await page.locator("[data-legal-page]").allTextContents() };
      await page.screenshot({ path: `${artifactRoot}/${routes[key]}-failure-${stamp}.png`, fullPage: true }).catch(() => {});
    } finally {
      const video = page.video();
      await page.close();
      const videoPath = path.join(videoDir, routes[key] + ".webm");
      await video.saveAs(videoPath);
      await video.delete();
      assert.ok((await fs.stat(videoPath)).size > 1000);
      report.video = videoPath;
      report.finalRows = await snapshot(sql, key);
      await save(`${routes[key]}-${stamp}`, report);
      reports.push(report);
      console.log(JSON.stringify({ key, ok: report.ok, checks: report.checks.length, video: report.video, failure: failure?.message }));
    }
    if (failure) throw failure;
  }
} finally {
  await admin.close();
  await anonymous.close();
  await browser.close();
  await save("e2e-latest", { stamp, reports, ok: reports.length > 0 && reports.every(report => report.ok) });
}
