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
  assertNoBoundary,
} from "./qa-common.mjs";
const onlyKind = process.argv[2];
assert.ok(["page", "post", "service", "guide"].includes(onlyKind));
const f = JSON.parse(await fs.readFile(out + "/fixtures.json", "utf8")),
  sql = await database(),
  b = await startBrowser(),
  r = {
    candidate: process.env.CANDIDATE_COMMIT,
    pageErrors: b.errors,
    boundaries: [],
    viewport: { width: 390, height: 844 },
    cases: [],
  };
await b.page.setViewportSize(r.viewport);
await b.pub.setViewportSize(r.viewport);
const cases = [
  {
    kind: "page",
    id: "home",
    list: "/admin/pages",
    editor: "/admin/pages/home",
    route: "/en",
    path: "hero.headline",
    control: '[id="page-field-home-hero.headline"]',
  },
  {
    kind: "post",
    id: f.ids.post,
    list: "/admin/posts",
    editor: `/admin/posts/${f.ids.post}`,
    route: f.publicPaths.en.post,
    path: "title",
    control: '[data-post-field="title"] input',
  },
  {
    kind: "service",
    id: f.ids.service,
    list: "/admin/services",
    editor: `/admin/services/${f.ids.service}`,
    route: f.publicPaths.en.service,
    path: "name",
    control: 'input[data-service-path="name"]',
  },
  {
    kind: "guide",
    id: f.ids.guide,
    list: "/admin/guides",
    editor: `/admin/guides/${f.ids.guide}`,
    route: f.publicPaths.en.guide,
    path: "title",
    control: 'input[id$="-title"]',
  },
];
function valueAt(content, path) {
  return path.split(".").reduce((v, k) => v[k], content);
}
try {
  for (const c of cases.filter((c) => c.kind === onlyKind)) {
    const before = await snapshot(sql, c.kind, c.id),
      en = own(before, "en");
    assert.equal(en.draft, null);
    const original = valueAt(en.published.content, c.path),
      marker = `QA MOBILE ${c.kind.toUpperCase()} 2026`;
    await b.page.goto(b.base + c.list, { waitUntil: "domcontentloaded" });
    const link = b.page.locator(`a[href="${c.editor}"]`).first();
    await link.waitFor();
    await link.click();
    await b.page.waitForURL((url) => url.pathname === c.editor);
    if (c.kind === "page") {
      const dropdown = b.page.locator('select[id$="-binding"]');
      if (await dropdown.count()) await dropdown.selectOption("hero");
      else {
        await b.page
          .getByRole("button", { name: "Sections", exact: true })
          .click();
        await b.page
          .locator('nav[id$="-outline"]')
          .getByRole("button", { name: "Hero", exact: true })
          .click();
      }
    }
    const control = b.page.locator(c.control).first();
    await control.fill(marker);
    const saved = await action(b.page, sql, c.kind, c.id, "en", "Save draft");
    assert.equal(valueAt(saved.draft.content, c.path), marker);
    await record("q6-mobile-" + c.kind + "-checkpoint", {
      phase: "draft-saved",
      revision: saved.revision,
      original,
      before,
    });
    await b.page.reload({ waitUntil: "domcontentloaded" });
    assert.equal(await b.page.locator(c.control).first().inputValue(), marker);
    const response = await b.pub.goto(b.base + c.route, {
      waitUntil: "domcontentloaded",
    });
    await publicAssert(b.pub, { kind: "visible-text", value: original });
    assert.ok(!(await response.text()).includes(marker));
    const published = await action(b.page, sql, c.kind, c.id, "en", "Publish");
    await record("q6-mobile-" + c.kind + "-checkpoint", {
      phase: "published",
      revision: published.revision,
      original,
      before,
    });
    await waitUntil(async () => {
      await b.pub.goto(b.base + c.route, { waitUntil: "domcontentloaded" });
      await publicAssert(b.pub, { kind: "visible-text", value: marker });
      return true;
    }, "Mobile public revalidation " + c.kind);
    assert.deepEqual(
      (await snapshot(sql, c.kind, c.id)).filter((x) => x.locale !== "en"),
      before.filter((x) => x.locale !== "en"),
    );
    await b.page.locator(c.control).first().fill(original);
    await action(b.page, sql, c.kind, c.id, "en", "Save draft");
    const restored = await action(b.page, sql, c.kind, c.id, "en", "Publish");
    await record("q6-mobile-" + c.kind + "-checkpoint", {
      phase: "restored",
      revision: restored.revision,
      before,
    });
    assert.deepEqual(restored.published, en.published);
    await waitUntil(async () => {
      await b.pub.goto(b.base + c.route, { waitUntil: "domcontentloaded" });
      await publicAssert(b.pub, { kind: "visible-text", value: original });
      return true;
    }, "Mobile fixture restored " + c.kind);
    await assertNoBoundary(b.page, r);
    await assertNoBoundary(b.pub, r);
    r.cases.push({
      kind: c.kind,
      navigatedViaListLink: true,
      save: saved.revision,
      publish: published.revision,
      restored: restored.revision,
      fullPublicationRestored: true,
    });
  }
  assert.deepEqual(b.errors, []);
  r.ok = true;
  await record("q6-mobile-" + onlyKind, r);
  console.log(JSON.stringify(r));
} catch (e) {
  r.ok = false;
  r.error = e.message;
  await record("q6-mobile-" + onlyKind, r);
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await b.browser.close();
}
