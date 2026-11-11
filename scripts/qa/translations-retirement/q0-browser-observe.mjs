import fs from "node:fs/promises";
import { startBrowser, record, out, req } from "./qa-common.mjs";
const manifest = JSON.parse(
    await fs.readFile(out + "/concrete-field-manifest.json", "utf8"),
  ),
  messages = req("./messages/en.json"),
  labels = messages.pages.admin.labels;
const b = await startBrowser(),
  result = {
    candidate: process.env.CANDIDATE_COMMIT,
    pages: [],
    entities: [],
    pageErrors: b.errors,
  };
function humanize(k) {
  return k.replace(/_/g, " ").replace(/^./, (v) => v.toUpperCase());
}
async function section(key, locale) {
  if (key === "seo") {
    await b.page
      .getByRole("button", { name: `SEO ${locale.toUpperCase()}`, exact: true })
      .click();
    return;
  }
  const dropdown = b.page.locator('select[id$="-binding"]');
  if (await dropdown.count()) {
    await dropdown.selectOption(key);
    return;
  }
  await b.page.getByRole("button", { name: "Sections", exact: true }).click();
  await b.page
    .locator('nav[id$="-outline"]')
    .getByRole("button", { name: labels[key] || humanize(key), exact: true })
    .click();
}
async function expandDetails() {
  for (let tries = 0; tries < 8; tries++) {
    const summaries = b.page.locator(
      'aside[aria-label="Inspector"] details:not([open]) > summary',
    );
    if (!(await summaries.count())) return;
    await summaries.first().click();
  }
}
try {
  for (const p of manifest.pages) {
    await b.page.goto(b.base + p.editor, { waitUntil: "domcontentloaded" });
    await b.page.locator("[data-page-editor]").waitFor();
    const fields = [];
    for (const s of [
      ...new Set(
        p.fields
          .filter((f) => f.surface !== "blog_article")
          .map((f) => f.section),
      ),
    ]) {
      await section(s, "en");
      await expandDetails();
      const inSection = p.fields.filter(
        (f) => f.section === s && f.surface !== "blog_article",
      );
      for (const field of inSection) {
        const control = b.page.locator(field.control.selector);
        fields.push({
          path: field.path,
          section: s,
          count: await control.count(),
          visible: (await control.count())
            ? await control.first().isVisible()
            : false,
        });
      }
    }
    result.pages.push({
      key: p.key,
      fields,
      missing: fields.filter((f) => !f.count).map((f) => f.path),
    });
    console.log(
      JSON.stringify({
        page: p.key,
        controls: fields.length,
        missing: fields.filter((f) => !f.count).map((f) => f.path),
      }),
    );
  }
  for (const [kind, entity] of Object.entries(manifest.entities)) {
    await b.page.goto(b.base + entity.editor, {
      waitUntil: "domcontentloaded",
    });
    const controls = await b.page
      .locator("main input,main textarea,main select,[data-post-rich-text]")
      .evaluateAll((nodes) =>
        nodes.map((el) => ({
          tag: el.tagName,
          id: el.id,
          path:
            el.getAttribute("data-service-path") ||
            el
              .closest("[data-service-field]")
              ?.getAttribute("data-service-path"),
          name: el.getAttribute("aria-label"),
          type: el.getAttribute("type"),
          disabled: el.disabled,
        })),
      );
    result.entities.push({ kind, controls });
  }
  result.ok = true;
  await record("q0-browser-controls", result);
  console.log("Q0 control observation complete; no values changed");
} catch (e) {
  result.ok = false;
  result.error = e.message;
  await record("q0-browser-controls", result);
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await b.browser.close();
}
