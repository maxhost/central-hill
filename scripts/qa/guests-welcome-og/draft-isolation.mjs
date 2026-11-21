import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import {
  browser,
  login,
  root,
  base,
  saveDraft,
  publish,
  fixture,
  until,
} from "../guests-welcome-media/common.mjs";
const req = createRequire(new URL("../../../package.json", import.meta.url));
const { neon } = req("@neondatabase/serverless");
const uri = new URL(process.env.DATABASE_URL);
assert.equal(uri.hostname, "welcomeqa20261121.local");
assert.equal(uri.username, "welcomeqa20261121");
const sql = neon(uri.href);
const rows = () =>
  sql`select locale,published,draft,revision from page_locale_content where page_key='privacy_policy' order by locale`;
const original = await rows();
const source = original.find((row) => row.locale === "en"),
  spanish = original.find((row) => row.locale === "es");
assert.ok(source?.published && spanish?.published);
assert.ok(!source.draft && !spanish.draft, "Run after OG matrix finishes");
const oldId = spanish.published.ogImageMediaId;
assert.ok(oldId);
const b = await browser(),
  context = await b.newContext({ viewport: { width: 1440, height: 1000 } }),
  p = await login(context);
p.setDefaultNavigationTimeout(90000);
const evidence = [];
async function language(locale) {
  const name = locale.toUpperCase();
  await p.waitForFunction(
    (name) =>
      Array.from(
        document.querySelectorAll(
          '[role="group"][aria-label="Content language"] button',
        ),
      ).some(
        (element) =>
          element.textContent.trim().startsWith(name) &&
          Object.keys(element).some(
            (key) =>
              key.startsWith("__reactProps") &&
              typeof element[key]?.onClick === "function",
          ),
      ),
    name,
  );
  const button = p
    .getByRole("group", { name: "Content language", exact: true })
    .getByRole("button", {
      name: locale === "en" ? /^EN/ : name,
      exact: locale !== "en",
    });
  await button.click();
  await until(
    () => button.getAttribute("aria-pressed").then((value) => value === "true"),
    "Locale " + locale,
  );
}
async function title(value) {
  await p.getByRole("button", { name: "Sections", exact: true }).click();
  await p
    .getByRole("navigation", { name: "Sections", exact: true })
    .getByRole("button", { name: "Title", exact: true })
    .click();
  await p.locator("#page-field-privacy_policy-title").fill(value);
}
async function metadata(expected, label, privateTitle) {
  const out = await context.newPage();
  const response = await out.goto(base + "/es/privacy-policy", {
    waitUntil: "domcontentloaded",
  });
  assert.equal(response.status(), 200);
  await until(
    () =>
      out
        .locator('meta[property="og:image"]')
        .getAttribute("content")
        .then((value) => value?.includes(expected)),
    label,
  );
  const document = out.locator('[data-legal-page="privacy_policy"]');
  const text = await document.innerText();
  if (privateTitle)
    assert.ok(
      !text.includes(privateTitle),
      "Target draft title must stay private",
    );
  await document.screenshot({ path: root + "/og/" + label + ".png" });
  await out.close();
  evidence.push({ label, expected, text });
}
try {
  await p.goto(base + "/admin/pages/privacy_policy", {
    waitUntil: "domcontentloaded",
  });
  await p.waitForFunction(() =>
    Array.from(document.querySelectorAll("button")).some(
      (element) =>
        element.textContent.trim() === "SEO EN" &&
        Object.keys(element).some(
          (key) =>
            key.startsWith("__reactProps") &&
            typeof element[key]?.onClick === "function",
        ),
    ),
  );
  await p.getByRole("button", { name: "SEO EN", exact: true }).click();
  await p
    .locator("input[type=file]")
    .setInputFiles(await fixture("og-private-source-probe", [1200, 800]));
  await until(() => p.locator('img[src^="blob:"]').count(), "OG private blob");
  await saveDraft(p);
  const draft = (await rows()).find((row) => row.locale === "en");
  const newId = draft.draft.ogImageMediaId;
  assert.notEqual(newId, oldId);
  await metadata(oldId, "legal-og-source-draft-private");
  await language("es");
  const privateTitle = "QA PRIVATE Spanish draft title";
  await title(privateTitle);
  await saveDraft(p);
  const target = (await rows()).find((row) => row.locale === "es");
  assert.equal(target.draft.content.title, privateTitle);
  assert.equal(target.draft.ogImageMediaId, newId);
  assert.deepEqual(target.published, spanish.published);
  await metadata(oldId, "legal-og-target-draft-private", privateTitle);
  await language("en");
  await publish(p);
  await metadata(oldId, "legal-og-en-publish-preserves-own-es", privateTitle);
  assert.deepEqual(
    (await rows()).find((row) => row.locale === "es").published,
    spanish.published,
  );
  await language("es");
  await title(spanish.published.content.title);
  await saveDraft(p);
  await publish(p);
  await metadata(newId, "legal-og-es-own-publish", privateTitle);
  const final = await rows();
  assert.deepEqual(
    final.find((row) => row.locale === "es").published.content,
    spanish.published.content,
  );
  assert.deepEqual(
    final.find((row) => row.locale === "en").published.content,
    source.published.content,
  );
  assert.equal(final.find((row) => row.locale === "es").draft, null);
  await fs.writeFile(
    root + "/og/draft-isolation.json",
    JSON.stringify(
      {
        oldId,
        newId,
        evidence,
        result: "pass",
        sourceCopyPreserved: true,
        targetCopyPreserved: true,
        onlyOwnPublishActivatesTarget: true,
      },
      null,
      2,
    ),
  );
  console.log("Legal per-locale OG draft isolation PASS");
} finally {
  await b.close();
}
