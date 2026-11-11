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
const [key, locale, mode = "full", phase = "final"] = process.argv.slice(2);
assert.ok(["en", "es", "pt", "fr"].includes(locale));
const fixtures = JSON.parse(await fs.readFile(out + "/fixtures.json", "utf8")),
  manifest = JSON.parse(await fs.readFile(out + "/concrete-field-manifest.json", "utf8")),
  m = manifest.pages.find((p) => p.key === key);
assert.ok(m);
const fields = m.fields.filter((f) =>
  phase === "sidebar" ? f.surface === "blog_article" : f.surface !== "blog_article",
);
const caseName = `${phase}-${key}-${locale}`,
  sql = await database(),
  b = await startBrowser(),
  labels = req("./messages/en.json").pages.admin.labels;
const result = {
  case: caseName,
  candidate: process.env.CANDIDATE_COMMIT,
  key,
  locale,
  fields: [],
  pageErrors: b.errors,
  conditionalPending: [],
  boundaries: [],
};
const values = Object.fromEntries(
  fields.map((f) => {
    const token = createHash("sha256")
      .update(caseName + "|" + f.path)
      .digest("hex")
      .slice(0, 7)
      .toUpperCase();
    let value = `QA ${locale.toUpperCase()} ${token}`;
    if (/(?:\.url|_url)$/.test(f.path))
      value = `https://example.invalid/${locale}/${token.toLowerCase()}`;
    if (/\.value$/.test(f.path))
      value = String(100 + ["en", "es", "pt", "fr"].indexOf(locale) * 150 + fields.indexOf(f));
    if (f.path.endsWith(".corner_badge"))
      value = `${30 + ["en", "es", "pt", "fr"].indexOf(locale) * 5 + Number(f.path.match(/tiers\.(\d+)/)?.[1] || 0)}%`;
    if (key === "guides" && f.path === "catalogue.headline") value += " {city}";
    return [f.path, value];
  }),
);
const route =
    phase === "sidebar"
      ? `/${locale}/blog/qa-featured`
      : key === "home"
        ? `/${locale}`
        : `/${locale}${{ guest: "/guests", real_estate: "/real-estate" }[key] || "/" + key}`,
  editor = phase === "sidebar" ? "/admin/pages/blog/article-sidebar" : m.editor;
async function section(s) {
  if (s === "seo") {
    await b.page.getByRole("button", { name: `SEO ${locale.toUpperCase()}`, exact: true }).click();
    return;
  }
  const dropdown = b.page.locator('select[id$="-binding"]');
  if (await dropdown.count()) {
    await dropdown.selectOption(s);
    return;
  }
  await b.page.getByRole("button", { name: "Sections", exact: true }).click();
  await b.page
    .locator('nav[id$="-outline"]')
    .getByRole("button", {
      name: labels[s] || s.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()),
      exact: true,
    })
    .click();
}
const ownAltValue = `QA ${locale.toUpperCase()} ${key} photo ALT`;
const genericAlt =
  phase !== "sidebar" && ["home", "owners", "buildings", "guides", "blog"].includes(key);
async function allSections(checkOnly = false) {
  await assertNoBoundary(b.page, result);
  for (const s of [...new Set(fields.map((f) => f.section))]) {
    await section(s);
    for (let n = 0; n < 8; n++) {
      const closed = b.page.locator('aside[aria-label="Inspector"] details:not([open]) > summary');
      if (!(await closed.count())) break;
      await closed.first().click();
    }
    const sectionFields = fields.filter((f) => f.section === s),
      unbound = [];
    for (const f of sectionFields)
      if (!(await b.page.locator(f.control.selector).count())) unbound.push(f);
    const noId = b.page.locator(
      'aside[aria-label="Inspector"] textarea:not([id]),aside[aria-label="Inspector"] input:not([id]):not([type="file"]):not([type="hidden"])',
    );
    if (unbound.length)
      assert.equal(await noId.count(), unbound.length, `Descriptor-order target count ${s}`);
    for (const f of sectionFields) {
      let control = b.page.locator(f.control.selector);
      if (!(await control.count())) control = noId.nth(unbound.indexOf(f));
      assert.equal(await control.count(), 1, `Control ${f.path}`);
      if (checkOnly) assert.equal(await control.inputValue(), values[f.path], f.path);
      else await control.fill(values[f.path]);
    }
  }
  await assertNoBoundary(b.page, result);
  if (genericAlt) {
    await section("hero");
    const alt = b.page
      .getByRole("textbox", { name: `Alternative text · ${locale.toUpperCase()}`, exact: true })
      .first();
    assert.ok(await alt.count(), "Own photo ALT control");
    if (checkOnly) assert.equal(await alt.inputValue(), ownAltValue);
    else await alt.fill(ownAltValue);
  }
  if (m.references.length) {
    await section("faq");
    if (checkOnly)
      assert.equal(
        await b.page.locator(m.references[0].control).inputValue(),
        fixtures.faq[locale].key,
      );
    else await b.page.locator(m.references[0].control).selectOption(fixtures.faq[locale].key);
  }
}
async function revealAll(p) {
  for (
    let y = 0, tries = 0;
    y < (await p.evaluate(() => document.body.scrollHeight)) && tries < 40;
    y += 750, tries++
  ) {
    await p.evaluate((y) => window.scrollTo(0, y), y);
    await p.waitForTimeout(40);
  }
  await p.waitForTimeout(350);
}
async function assertPublished() {
  const response = await b.pub.goto(b.base + route, { waitUntil: "domcontentloaded" });
  assert.equal(response.status(), 200);
  await assertNoBoundary(b.pub, result);
  assert.deepEqual(
    await publicSEO(b.pub),
    result.publicBaselineSEO,
    "Canonical/alternates/language/public path retained",
  );
  result.publicSEOInvariant = true;
  await revealAll(b.pub);
  const expected = fields.filter(
    (f) => f.surface !== "shared_aside" && f.surface !== "blog_article",
  );
  for (const f of expected) {
    if (f.public.exclusion) {
      result.fields.push({
        path: f.path,
        persisted: true,
        public: "excluded-no-public-consumer",
        source: f.public.source,
      });
      continue;
    }
    if (f.path === "why.cta_secondary.note" && key === "owners") {
      result.fields.push({
        path: f.path,
        persisted: true,
        public: "excluded-no-public-consumer",
        source: "owners-page.tsx:283-291 only passes primary note",
      });
      continue;
    }
    if (f.public.interaction || (key === "guides" && f.path === "catalogue.empty_message")) {
      if (key === "guides" && f.path === "catalogue.empty_message")
        result.conditionalPending.push(f.path);
      continue;
    }
    let value = values[f.path];
    if (key === "guides" && f.path === "catalogue.headline")
      value = value.replace(
        "{city}",
        "QA City" + (locale === "en" ? "" : " " + locale.toUpperCase()),
      );
    await waitUntil(
      async () => {
        await publicAssert(b.pub, { kind: f.public.kind, value });
        return true;
      },
      f.path,
      5000,
    );
    result.fields.push({ path: f.path, persisted: true, public: true });
  }
  const modalGroups = [
    ["hero.contact", "hero.contact.label"],
    ["dual_cta.owner.contact", "dual_cta.owner.cta.label"],
  ];
  for (const [prefix, trigger] of modalGroups) {
    const modalFields = fields.filter((f) => f.path.startsWith(prefix + ".") && f.path !== trigger);
    if (!modalFields.length) continue;
    await b.pub
      .getByRole("button", { name: new RegExp(values[trigger]) })
      .first()
      .click();
    for (const f of modalFields) {
      await publicAssert(b.pub, { kind: f.public.kind, value: values[f.path] });
      result.fields.push({
        path: f.path,
        persisted: true,
        public: true,
        interaction: "contact-dialog",
      });
    }
    await b.pub.keyboard.press("Escape");
  }
  const wizardFields = fields.filter((f) => /(?:contact_step|done_step)\./.test(f.path));
  if (wizardFields.length) {
    const wizard = b.pub.locator("[data-wizard]").first();
    await wizard.locator('[data-panel="1"] [data-wiz-next]').click();
    for (const f of wizardFields.filter((f) => f.path.includes("contact_step"))) {
      await publicAssert(b.pub, { kind: f.public.kind, value: values[f.path] });
      result.fields.push({
        path: f.path,
        persisted: true,
        public: true,
        interaction: "wizard-step2-no-submission",
      });
    }
    await wizard.locator('[data-panel="2"] [data-wiz-next]').click();
    for (const f of wizardFields.filter((f) => f.path.includes("done_step"))) {
      await publicAssert(b.pub, { kind: f.public.kind, value: values[f.path] });
      result.fields.push({
        path: f.path,
        persisted: true,
        public: true,
        interaction: "wizard-step3-no-submission",
      });
    }
  }
  const asideFields = fields.filter(
    (f) => f.surface === "shared_aside" || f.surface === "blog_article",
  );
  if (asideFields.length) {
    await b.pub.goto(
      b.base +
        (key === "guides"
          ? fixtures.publicPaths[locale].guide
          : phase === "sidebar"
            ? `/${locale}/blog/qa-featured`
            : fixtures.publicPaths[locale].post),
      { waitUntil: "domcontentloaded" },
    );
    await revealAll(b.pub);
    for (const f of asideFields) {
      await publicAssert(b.pub, { kind: f.public.kind, value: values[f.path] });
      result.fields.push({ path: f.path, persisted: true, public: true, surface: f.surface });
    }
  }
}
async function assertOwnAlt() {
  if (!genericAlt) return;
  if (key === "guides")
    await b.pub.goto(b.base + fixtures.publicPaths[locale].guide, {
      waitUntil: "domcontentloaded",
    });
  if (key === "blog") {
    const backgrounds = await b.pub
      .locator("img")
      .evaluateAll(
        (nodes, id) =>
          nodes
            .filter((n) => n.classList.contains("-z-10") && (n.currentSrc || n.src).includes(id))
            .map((n) => ({ alt: n.alt })),
        fixtures.media[0],
      );
    assert.equal(backgrounds.length, 1, "Configured decorative Blog hero image present");
    assert.equal(backgrounds[0].alt, "");
    result.decorativeHeroAlt = {
      persistedAndReloaded: true,
      renderedEmpty: true,
      publicEditPass: false,
      source: "blog-listing.tsx:115; unchanged since f947c4f",
    };
  } else {
    await publicAssert(b.pub, { kind: "image-alt", value: ownAltValue });
    result.ownPhotoAlt = true;
  }
}
try {
  const before = await snapshot(sql, "page", key),
    baseline = own(before, locale).published;
  if (mode === "verify") {
    const prior = JSON.parse(await fs.readFile(out + "/results/" + caseName + ".json", "utf8"));
    result.noDraftMarkerInPublicHTML = prior.noDraftMarkerInPublicHTML;
    result.privatePreview = prior.privatePreview;
    const cp = JSON.parse(
      await fs.readFile(out + "/results/" + caseName + "-checkpoint.json", "utf8"),
    );
    assert.equal(cp.phase, "published");
    result.publicBaselineSEO = cp.publicBaselineSEO;
    assert.equal(own(before, locale).revision, cp.revision);
    for (const [path, value] of Object.entries(values))
      assert.equal(at(baseline.content, path), value, path);
    await assertPublished();
    await assertOwnAlt();
    assert.deepEqual(
      before.filter((r) => r.locale !== locale),
      cp.before.filter((r) => r.locale !== locale),
    );
    result.pendingSiblingLocales = cp.before
      .filter((r) => r.locale !== locale && r.draft)
      .map((r) => ({ locale: r.locale, revision: r.revision }));
    result.crossLocalePublicVerified = [];
    if (phase !== "sidebar")
      for (const sibling of cp.before.filter((r) => r.locale !== locale)) {
        const siblingRoute = route.replace("/" + locale, "/" + sibling.locale);
        const siblingResponse = await b.pub.goto(b.base + siblingRoute, {
          waitUntil: "domcontentloaded",
        });
        await publicAssert(b.pub, {
          kind: "visible-text",
          value: sibling.published.content.hero.headline,
        });
        if (sibling.draft) {
          const draftMarker = sibling.draft.content.hero.headline;
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
    await b.page.goto(b.base + editor, { waitUntil: "domcontentloaded" });
    await b.page.locator("[data-page-editor]").waitFor();
    await selectLocale(b.page, locale);
    let saved;
    if (mode === "publish") {
      const checkpoint = JSON.parse(
        await fs.readFile(out + "/results/" + caseName + "-checkpoint.json", "utf8"),
      );
      assert.equal(checkpoint.phase, "draft-saved");
      saved = own(before, locale);
      assert.equal(saved.revision, checkpoint.revision);
      for (const [path, value] of Object.entries(values))
        assert.equal(at(saved.draft.content, path), value, path);
    } else {
      await allSections(false);
      saved = await action(b.page, sql, "page", key, locale, "Save draft");
      for (const [path, value] of Object.entries(values))
        assert.equal(at(saved.draft.content, path), value, path);
      if (phase === "sidebar") {
        const expected = structuredClone(baseline.content);
        for (const [path, value] of Object.entries(values)) {
          const bits = path.split(".");
          let node = expected;
          for (const bit of bits.slice(0, -1)) node = node[bit];
          node[bits.at(-1)] = value;
        }
        assert.deepEqual(saved.draft.content, expected, "Sidebar preserves every other Blog field");
        result.blogOtherFieldsUnchanged = true;
      }
      if (genericAlt) assert.equal(saved.draft.mediaAlts[fixtures.media[0]], ownAltValue);
      assert.deepEqual(saved.published, baseline);
      await record(caseName + "-checkpoint", {
        phase: "draft-saved",
        revision: saved.revision,
        candidate: result.candidate,
        before,
      });
    }
    await b.page.reload({ waitUntil: "domcontentloaded" });
    await selectLocale(b.page, locale);
    await allSections(true);
    const rowsAfterSave = await snapshot(sql, "page", key);
    assert.deepEqual(
      rowsAfterSave.filter((r) => r.locale !== locale),
      before.filter((r) => r.locale !== locale),
    );
    const baselineResponse = await b.pub.goto(b.base + route, { waitUntil: "domcontentloaded" });
    assert.equal(baselineResponse.status(), 200);
    result.publicBaselineSEO = await publicSEO(b.pub);
    const marker =
      values[
        fields.find(
          (f) =>
            !f.path.startsWith("seo.") && f.public.kind === "visible-text" && !f.public.interaction,
        )?.path
      ];
    assert.ok(
      !(await b.pub.locator("body").innerText()).includes(marker),
      "Draft marker leaked publicly",
    );
    assert.ok(
      !(await baselineResponse.text()).includes(marker),
      "Draft marker leaked in public HTML/RSC",
    );
    result.noDraftMarkerInPublicHTML = true;
    if (phase !== "sidebar")
      await publicAssert(b.pub, { kind: "visible-text", value: baseline.content.hero.headline });
    const frame = b.page.locator("iframe").first();
    assert.ok(await frame.count(), "Page private preview exists");
    const iframe = await frame.elementHandle(),
      content = await iframe.contentFrame();
    await waitUntil(async () => {
      if (!content) return false;
      await publicAssert(content, { kind: "visible-text", value: marker });
      return true;
    }, "Private preview contains saved draft marker");
    result.privatePreview = true;
    if (mode === "draft") {
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
      const published = await action(b.page, sql, "page", key, locale, "Publish");
      await record(caseName + "-checkpoint", {
        phase: "published",
        revision: published.revision,
        candidate: result.candidate,
        before,
        publicBaselineSEO: result.publicBaselineSEO,
      });
      await waitUntil(async () => {
        await b.pub.goto(b.base + route, { waitUntil: "domcontentloaded" });
        return (await b.pub.locator("body").innerText()).includes(marker);
      }, "Page normal public revalidation");
      await assertPublished();
      await assertOwnAlt();
      const final = await snapshot(sql, "page", key);
      assert.deepEqual(
        final.filter((r) => r.locale !== locale),
        before.filter((r) => r.locale !== locale),
      );
      result.pendingSiblingLocales = before
        .filter((r) => r.locale !== locale && r.draft)
        .map((r) => ({ locale: r.locale, revision: r.revision }));
      result.crossLocalePublicVerified = [];
      if (phase !== "sidebar")
        for (const sibling of before.filter((r) => r.locale !== locale)) {
          const siblingRoute = route.replace("/" + locale, "/" + sibling.locale);
          const siblingResponse = await b.pub.goto(b.base + siblingRoute, {
            waitUntil: "domcontentloaded",
          });
          await publicAssert(b.pub, {
            kind: "visible-text",
            value: sibling.published.content.hero.headline,
          });
          if (sibling.draft) {
            const draftMarker = sibling.draft.content.hero.headline;
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
