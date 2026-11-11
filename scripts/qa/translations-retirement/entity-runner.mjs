import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  database,
  startBrowser,
  snapshot,
  own,
  at,
  action,
  selectLocale,
  publicAssert,
  waitUntil,
  publicSEO,
  assertNoBoundary,
  record,
  out,
  req,
} from "./qa-common.mjs";
const [kind, locale, mode = "full", phase = "final"] = process.argv.slice(2);
assert.ok(["post", "service", "guide"].includes(kind));
assert.ok(["en", "es", "pt", "fr"].includes(locale));
const fixture = JSON.parse(await fs.readFile(out + "/fixtures.json", "utf8")),
  baseline = JSON.parse(await fs.readFile(out + "/baseline.json", "utf8")),
  manifest = JSON.parse(await fs.readFile(out + "/concrete-field-manifest.json", "utf8")),
  m = manifest.entities[kind],
  id = fixture.ids[kind],
  caseName = `${phase}-${kind}-${locale}`,
  sql = await database(),
  b = await startBrowser();
const result = {
  case: caseName,
  candidate: process.env.CANDIDATE_COMMIT,
  kind,
  locale,
  fields: [],
  pageErrors: b.errors,
  conditionalPending: [],
  boundaries: [],
};
const values = Object.fromEntries(
  m.fields.map((f) => {
    const token = createHash("sha256")
      .update(caseName + "|" + f.path)
      .digest("hex")
      .slice(0, 7)
      .toUpperCase();
    let value = `QA ${locale.toUpperCase()} ${token}`;
    if (/(?:\.url|_url)$/.test(f.path))
      value = `https://example.invalid/${locale}/${token.toLowerCase()}`;
    if (f.path === "copy.enquiryTitle") value += " {name}";
    if (kind === "guide" && locale === "en" && f.path.endsWith(".category"))
      value = at(baseline.guide.en.content, f.path);
    return [f.path, value];
  }),
);
const altValue = `QA ${locale.toUpperCase()} ${kind} cover ALT`,
  route = fixture.publicPaths[locale][kind];
function control(f) {
  if (kind === "service") {
    if (f.path.startsWith("detail.pricing.columns."))
      return b.page.getByRole("textbox", {
        name: `Column ${Number(f.path.split(".").at(-1)) + 1}`,
        exact: true,
      });
    return b.page.locator(m.fields.find((x) => x.path === f.path).control).first();
  }
  if (kind === "guide") return b.page.locator(f.control);
  if (!f.path.startsWith("body.")) return b.page.locator(f.control).first();
  const block = baseline.posts[id].en.content.body[Number(f.path.split(".")[1])],
    body = b.page.locator("[data-post-rich-text]");
  if (block.type === "heading") return body.locator("h" + block.level).first();
  if (block.type === "paragraph") return body.locator(":scope > p").first();
  if (block.type === "list") return body.locator("li p").nth(Number(f.path.split(".").at(-1)));
  return body.locator(`input[id$="-${f.path.split(".").at(-1)}"]`).first();
}
async function visible(c) {
  await c.waitFor({ state: "attached" });
  for (let n = 0; n < 10 && !(await c.isVisible()); n++) {
    const summaries = c.locator("xpath=ancestor::details[not(@open)]/summary");
    if (await summaries.count()) {
      await summaries.first().click();
      continue;
    }
    const section = c.locator("xpath=ancestor::section[@data-service-section]");
    const toggle = section.locator('button[aria-expanded="false"]');
    assert.ok(await toggle.count(), "Hidden control has no supported expander");
    await toggle.first().click();
  }
}
async function edit(checkOnly = false) {
  await assertNoBoundary(b.page, result);
  for (const f of m.fields) {
    const c = control(f);
    await visible(c);
    if (checkOnly) {
      const current = await c.evaluate((el) => (el.isContentEditable ? el.textContent : el.value));
      assert.equal(current, values[f.path], f.path);
    } else if (await c.evaluate((el) => el.isContentEditable)) {
      await c.click();
      await c.evaluate((el) => {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(el);
        selection.removeAllRanges();
        selection.addRange(range);
      });
      await b.page.keyboard.insertText(values[f.path]);
      assert.equal(
        await c.textContent(),
        values[f.path],
        "Exact keyboard replacement before Save " + f.path,
      );
    } else await c.fill(values[f.path]);
  }
  const alt = b.page
    .getByRole("textbox", { name: `Alternative text · ${locale.toUpperCase()}`, exact: true })
    .first();
  if (checkOnly) assert.equal(await alt.inputValue(), altValue);
  else await alt.fill(altValue);
}
async function assertPublic() {
  const response = await b.pub.goto(b.base + route, { waitUntil: "domcontentloaded" });
  assert.equal(response.status(), 200);
  await assertNoBoundary(b.pub, result);
  assert.deepEqual(
    await publicSEO(b.pub),
    result.publicBaselineSEO,
    "Canonical/alternates/language/public path retained",
  );
  result.publicSEOInvariant = true;
  for (
    let y = 0, tries = 0;
    y < (await b.pub.evaluate(() => document.body.scrollHeight)) && tries < 35;
    y += 750, tries++
  ) {
    await b.pub.evaluate((y) => window.scrollTo(0, y), y);
    await b.pub.waitForTimeout(40);
  }
  for (const f of m.fields) {
    if (kind === "guide" && locale === "en" && f.path.endsWith(".category")) {
      const label = req("./messages/en.json").guides.recType[values[f.path]];
      assert.ok(label);
      await publicAssert(b.pub, { kind: "visible-text", value: label });
      result.fields.push({
        path: f.path,
        persisted: true,
        edited: false,
        public: "code-label-from-canonical-classification",
        value: values[f.path],
        label,
      });
      continue;
    }
    if (kind === "service" && f.path === "duration_label") {
      result.fields.push({
        path: f.path,
        persisted: true,
        public: "excluded-editor-only-no-renderer",
      });
      continue;
    }
    if (
      kind === "service" &&
      ((f.condition !== "configured baseline" &&
        f.condition !== "gallery with5media, open photos dialog") ||
        ["copy.allPhotos", "copy.close"].includes(f.path))
    ) {
      result.conditionalPending.push(f.path);
      continue;
    }
    let value = values[f.path];
    const type = f.path === "copy.breadcrumbLabel" ? "nav-aria-label" : f.public.kind;
    await waitUntil(
      async () => {
        if (type === "nav-aria-label") {
          assert.ok(
            await b.pub
              .locator("nav")
              .evaluateAll(
                (nodes, v) => nodes.some((n) => n.getAttribute("aria-label") === v),
                value,
              ),
          );
        } else await publicAssert(b.pub, { kind: type, value });
        return true;
      },
      f.path,
      5000,
    );
    result.fields.push({ path: f.path, persisted: true, public: true });
  }
  await publicAssert(b.pub, { kind: "image-alt", value: altValue });
  if (kind === "guide" || kind === "post") {
    const pageKey = kind === "guide" ? "guides" : "blog",
      page = own(await snapshot(sql, "page", pageKey), locale).published;
    const prefix = kind === "guide" ? "guide_aside" : "post_aside";
    for (const path of ["eyebrow", "title", "body", ...(kind === "guide" ? ["cta_label"] : [])])
      await publicAssert(b.pub, { kind: "visible-text", value: page.content[prefix][path] });
    result.sharedAsideVerified = true;
  }
  if (kind === "service" || kind === "post") {
    await b.pub.goto(b.base + `/${locale}/${kind === "post" ? "blog" : "services"}`, {
      waitUntil: "domcontentloaded",
    });
    const card = b.pub
      .locator(`a[href="${route}"]`)
      .filter({ has: b.pub.locator("h3") })
      .first();
    await card.waitFor();
    assert.ok((await card.textContent()).includes(values[kind === "service" ? "name" : "title"]));
    assert.ok((await card.textContent()).includes(values.excerpt));
    assert.ok(
      await card.locator("img").evaluateAll((nodes, v) => nodes.some((n) => n.alt === v), altValue),
      "Listing card retains document-owned cover ALT",
    );
    result.listingCardVerified = true;
  }
}
try {
  const before = await snapshot(sql, kind, id),
    initial = own(before, locale),
    parentPageKey = kind === "post" ? "blog" : kind === "service" ? "services" : "guides",
    parentPageBefore = await snapshot(sql, "page", parentPageKey);
  if (mode === "verify") {
    const prior = JSON.parse(await fs.readFile(out + "/results/" + caseName + ".json", "utf8"));
    result.noDraftMarkerInPublicHTML = prior.noDraftMarkerInPublicHTML;
    result.privatePreview = prior.privatePreview;
    const cp = JSON.parse(
      await fs.readFile(out + "/results/" + caseName + "-checkpoint.json", "utf8"),
    );
    assert.equal(cp.phase, "published");
    result.publicBaselineSEO = cp.publicBaselineSEO;
    assert.equal(initial.revision, cp.revision);
    for (const [path, value] of Object.entries(values))
      assert.equal(at(initial.published.content, path), value, path);
    await assertPublic();
    assert.deepEqual(
      before.filter((r) => r.locale !== locale),
      cp.before.filter((r) => r.locale !== locale),
    );
    assert.deepEqual(parentPageBefore, cp.parentPageBefore);
    result.parentPageSnapshotsUnchanged = true;
    result.pendingSiblingLocales = cp.before
      .filter((r) => r.locale !== locale && r.draft)
      .map((r) => ({ locale: r.locale, revision: r.revision }));
    result.crossLocalePublicVerified = [];
    for (const sibling of cp.before.filter((r) => r.locale !== locale)) {
      const response = await b.pub.goto(b.base + fixture.publicPaths[sibling.locale][kind], {
        waitUntil: "domcontentloaded",
      });
      await publicAssert(b.pub, {
        kind: "visible-text",
        value: sibling.published.content[kind === "service" ? "name" : "title"],
      });
      if (sibling.draft) {
        const marker = sibling.draft.content[kind === "service" ? "name" : "title"];
        assert.ok(!(await b.pub.locator("body").innerText()).includes(marker));
        assert.ok(
          !(await response.text()).includes(marker),
          "Sibling draft marker leaked HTML/RSC",
        );
        result.siblingDraftHTMLProtected ??= [];
        result.siblingDraftHTMLProtected.push({
          locale: sibling.locale,
          revision: sibling.revision,
        });
      }
      result.crossLocalePublicVerified.push(sibling.locale);
    }
    await assertNoBoundary(b.page, result);
    await assertNoBoundary(b.pub, result);
    assert.deepEqual(b.errors, []);
    result.ok = true;
    result.stage = "published-assertions-resumed-no-write";
    result.publishedRevision = cp.revision;
    await record(caseName, result);
    console.log(
      JSON.stringify({
        case: caseName,
        ok: true,
        fields: result.fields.length,
        conditionalPending: result.conditionalPending,
        resumed: true,
      }),
    );
  } else {
    await b.page.goto(b.base + m.editor, { waitUntil: "domcontentloaded" });
    await selectLocale(b.page, locale);
    let saved;
    if (mode === "publish") {
      const cp = JSON.parse(
        await fs.readFile(out + "/results/" + caseName + "-checkpoint.json", "utf8"),
      );
      assert.equal(cp.phase, "draft-saved");
      saved = initial;
      assert.equal(cp.revision, saved.revision);
    } else {
      if (mode === "repair-draft") {
        assert.equal(kind, "post");
        assert.equal(locale, "en");
        assert.equal(initial.revision, 1);
        assert.ok(initial.draft);
        result.correctedInitialRteHarnessSave = 1;
      }
      await edit();
      saved = await action(b.page, sql, kind, id, locale, "Save draft");
      await record(caseName + "-checkpoint", {
        phase: "draft-saved",
        revision: saved.revision,
        candidate: result.candidate,
        before,
        parentPageBefore,
      });
    }
    for (const [path, value] of Object.entries(values))
      assert.equal(at(saved.draft.content, path), value, path);
    assert.equal(saved.draft.content.media_alts[fixture.media[0]], altValue);
    assert.deepEqual(saved.published, initial.published);
    await b.page.reload({ waitUntil: "domcontentloaded" });
    await selectLocale(b.page, locale);
    await edit(true);
    const baselineResponse = await b.pub.goto(b.base + route, { waitUntil: "domcontentloaded" });
    assert.equal(baselineResponse.status(), 200);
    result.publicBaselineSEO = await publicSEO(b.pub);
    assert.ok(
      !(await b.pub.locator("body").innerText()).includes(
        values[kind === "service" ? "name" : "title"],
      ),
    );
    assert.ok(
      !(await baselineResponse.text()).includes(values[kind === "service" ? "name" : "title"]),
      "Draft marker leaked in public HTML/RSC",
    );
    result.noDraftMarkerInPublicHTML = true;
    await publicAssert(b.pub, {
      kind: "visible-text",
      value: initial.published.content[kind === "service" ? "name" : "title"],
    });
    let rows = await snapshot(sql, kind, id);
    assert.deepEqual(
      rows.filter((r) => r.locale !== locale),
      before.filter((r) => r.locale !== locale),
    );
    assert.deepEqual(
      await snapshot(sql, "page", parentPageKey),
      parentPageBefore,
      "Entity editing preserves owning listing/aside Page snapshots",
    );
    result.parentPageSnapshotsUnchanged = true;
    if (kind === "post") {
      const preview = await b.admin.newPage();
      await preview.goto(
        b.base + `/admin/preview/posts/${id}?locale=${locale}&instance=qa_${locale}`,
        { waitUntil: "domcontentloaded" },
      );
      await publicAssert(preview, { kind: "visible-text", value: values.title });
      result.privatePreview = true;
      await preview.close();
    }
    if (mode === "draft" || mode === "repair-draft") {
      await assertNoBoundary(b.page, result);
      await assertNoBoundary(b.pub, result);
      assert.deepEqual(b.errors, []);
      result.ok = true;
      result.stage = "draft-saved-only";
      result.revision = saved.revision;
      await record(caseName, result);
      console.log(
        JSON.stringify({ case: caseName, stage: result.stage, revision: saved.revision }),
      );
    } else {
      const published = await action(b.page, sql, kind, id, locale, "Publish");
      await record(caseName + "-checkpoint", {
        phase: "published",
        revision: published.revision,
        candidate: result.candidate,
        before,
        parentPageBefore,
        publicBaselineSEO: result.publicBaselineSEO,
      });
      await waitUntil(async () => {
        await b.pub.goto(b.base + route, { waitUntil: "domcontentloaded" });
        return (await b.pub.locator("body").innerText()).includes(
          values[kind === "service" ? "name" : "title"],
        );
      }, "Entity normal public revalidation");
      await assertPublic();
      rows = await snapshot(sql, kind, id);
      assert.deepEqual(
        rows.filter((r) => r.locale !== locale),
        before.filter((r) => r.locale !== locale),
      );
      assert.deepEqual(
        await snapshot(sql, "page", parentPageKey),
        parentPageBefore,
        "Entity editing preserves owning listing/aside Page snapshots",
      );
      result.parentPageSnapshotsUnchanged = true;
      result.pendingSiblingLocales = before
        .filter((r) => r.locale !== locale && r.draft)
        .map((r) => ({ locale: r.locale, revision: r.revision }));
      result.crossLocalePublicVerified = [];
      for (const sibling of before.filter((r) => r.locale !== locale)) {
        const siblingResponse = await b.pub.goto(
          b.base + fixture.publicPaths[sibling.locale][kind],
          { waitUntil: "domcontentloaded" },
        );
        await publicAssert(b.pub, {
          kind: "visible-text",
          value: sibling.published.content[kind === "service" ? "name" : "title"],
        });
        if (sibling.draft) {
          const draftMarker = sibling.draft.content[kind === "service" ? "name" : "title"];
          assert.ok(!(await b.pub.locator("body").innerText()).includes(draftMarker));
          assert.ok(
            !(await siblingResponse.text()).includes(draftMarker),
            "Sibling draft marker leaked in public HTML/RSC",
          );
          result.siblingDraftHTMLProtected ??= [];
          result.siblingDraftHTMLProtected.push({
            locale: sibling.locale,
            revision: sibling.revision,
          });
        }
        result.crossLocalePublicVerified.push(sibling.locale);
      }
      await assertNoBoundary(b.page, result);
      await assertNoBoundary(b.pub, result);
      assert.deepEqual(b.errors, []);
      result.ok = true;
      result.savedRevision = saved.revision;
      result.publishedRevision = published.revision;
      await record(caseName, result);
      console.log(
        JSON.stringify({
          case: caseName,
          ok: true,
          fields: result.fields.length,
          conditionalPending: result.conditionalPending,
        }),
      );
    }
  }
} catch (e) {
  await assertNoBoundary(b.page, result).catch(() => {});
  await assertNoBoundary(b.pub, result).catch(() => {});
  result.ok = false;
  result.error = e.message;
  await record(caseName, result);
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await b.browser.close();
}
