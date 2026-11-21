import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { artifactRoot, database, guard, own, req, save, snapshot, until } from "./common.mjs";
const sql = await database(), base = guard(), key = "privacy_policy";
const { chromium } = req("playwright"), browser = await chromium.launch({ headless: true });
const admin = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const anonymous = await browser.newContext();
const page = await admin.newPage(), result = { checks: [], pageErrors: [] };
function observe(p) {
  p.setDefaultTimeout(30000); p.setDefaultNavigationTimeout(90000);
  p.on("pageerror", error => result.pageErrors.push({ url: p.url(), message: error.message }));
  p.on("dialog", dialog => dialog.accept());
}
observe(page);
async function section(p, id) { await p.locator('select[id$="-binding"]').selectOption(id); }
async function action(p, locale, name) {
  const before = own(await snapshot(sql, key), locale);
  await p.getByRole("button", { name, exact: true }).first().click();
  const row = await until(async () => {
    const next = own(await snapshot(sql, key), locale);
    return next.revision > before.revision && (name !== "Publish" || !next.draft) ? next : null;
  }, `${locale}/${name}`);
  await until(() => p.getByRole("button", { name: "Save draft", exact: true }).first().isEnabled(), "action UI settled");
  return row;
}
try {
  const credentials = JSON.parse(await fs.readFile(artifactRoot + "/login-private.json", "utf8"));
  await page.goto(base + "/admin/login", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Email", { exact: true }).fill(credentials.email);
  await page.getByLabel("Password", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: /Sign in|Log in/i }).click();
  await page.waitForURL(url => !url.pathname.includes("/login"));
  const baseline = await snapshot(sql, key), english = own(baseline, "en"), spanish = own(baseline, "es");
  assert.ok(english.published && spanish.published);
  assert.equal(own(baseline, "pt").published, null);
  await page.goto(`${base}/admin/pages/${key}`, { waitUntil: "domcontentloaded" });
  await page.getByRole("group", { name: "Content language", exact: true }).getByRole("button", { name: "PT", exact: true }).click();
  await section(page, "title");
  await page.locator(`#page-field-${key}-title`).fill("QA private Portuguese draft");
  await section(page, "body");
  await page.locator("[data-page-rich-text][contenteditable=true]").fill("Texto português privado que não pode aparecer publicamente.");
  await action(page, "pt", "Save draft");
  const afterPT = await snapshot(sql, key);
  assert.equal(own(afterPT, "pt").published, null);
  assert.ok(own(afterPT, "pt").draft.content.title.includes("private"));
  assert.deepEqual(own(afterPT, "en"), english);
  assert.deepEqual(own(afterPT, "es"), spanish);
  const pub = await anonymous.newPage(); observe(pub);
  await pub.goto(base + "/pt/privacy-policy", { waitUntil: "domcontentloaded" });
  await pub.getByRole("heading", { name: english.published.content.title, exact: true }).waitFor();
  assert.ok(!(await pub.locator("[data-legal-body]").innerText()).includes("Texto português privado"));
  result.checks.push("PT private draft remains unpublished; PT anonymous route still shows published EN; EN/ES rows exact");
  await pub.close();

  const second = await admin.newPage(); observe(second);
  await Promise.all([page.goto(`${base}/admin/pages/${key}`, { waitUntil: "domcontentloaded" }), second.goto(`${base}/admin/pages/${key}`, { waitUntil: "domcontentloaded" })]);
  for (const p of [page, second]) await section(p, "title");
  await page.locator(`#page-field-${key}-title`).fill("QA first concurrent writer");
  const firstSaved = await action(page, "en", "Save draft");
  await second.locator(`#page-field-${key}-title`).fill("QA stale concurrent writer must lose");
  await second.getByRole("button", { name: "Save draft", exact: true }).click();
  await second.getByRole("alert").filter({ hasText: "This language changed in another tab. Reload before continuing." }).waitFor();
  assert.deepEqual(own(await snapshot(sql, key), "en"), firstSaved, "Stale save leaves winner row completely unchanged");
  assert.deepEqual(firstSaved.published, english.published, "Saving conflict fixture never changes live publication");
  result.checks.push("Two normal BO tabs: stale Save draft rejected; first writer row exact and published EN unaffected");
  await second.close();
  // Restore only this test's new EN draft to its already-published content via BO.
  await page.locator(`#page-field-${key}-title`).fill(english.published.content.title);
  await action(page, "en", "Save draft");
  await action(page, "en", "Publish");
  const restored = await snapshot(sql, key);
  assert.deepEqual(own(restored, "en").published, english.published);
  assert.deepEqual(own(restored, "es"), spanish);
  assert.equal(own(restored, "en").draft, null);

  const posts = await sql`select p.id from blog_post p left join blog_post_locale_content c on c.post_id=p.id and c.locale='en' order by (c.published is not null) desc,p.id limit 1`;
  if (posts.length) {
    await page.goto(`${base}/admin/posts/${posts[0].id}`, { waitUntil: "domcontentloaded" });
    const editor = page.locator("[data-post-rich-text][contenteditable]");
    await until(async () => (await editor.count()) || (await page.getByRole("alert").count()), "Blog Rich editor or declared legacy validation");
    if (await editor.count()) {
      await editor.waitFor();
      assert.equal(await page.locator("[data-page-rich-text]").count(), 0, "Blog retains full Rich capability");
      for (const name of ["Insert image", "Callout", "Button"]) assert.equal(await page.getByRole("button", { name, exact: true }).count(), 1);
      result.checks.push("Existing Blog post opens full Rich editor with image/callout/button controls; no Blog mutation");
    } else result.blogUnavailable = { id: posts[0].id, reason: await page.getByRole("alert").allTextContents() };
  } else result.blogUnavailable = { reason: "No preexisting Blog post in isolated snapshot" };
  assert.deepEqual(result.pageErrors, []);
  result.finalRows = await snapshot(sql, key);
  result.ok = true;
} catch (error) {
  result.ok = false; result.failure = error.stack;
  await page.screenshot({ path: artifactRoot + "/state-checks-failure.png", fullPage: true }).catch(() => {});
  throw error;
} finally {
  await browser.close();
  await save("state-checks", result);
  console.log(JSON.stringify({ ok: result.ok, checks: result.checks, blogUnavailable: result.blogUnavailable, failure: result.failure }));
}
