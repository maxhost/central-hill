import assert from "node:assert/strict";
import fs from "node:fs/promises";
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
  record,
  out,
} from "./qa-common.mjs";
const fixture = JSON.parse(await fs.readFile(out + "/fixtures.json", "utf8")),
  sql = await database(),
  b = await startBrowser(),
  locale = "pt",
  resume = process.argv.includes("--resume");
const fields = [
  { path: "title", id: fixture.ids.guide + "-title", value: "Q2 PT guia traduzido" },
  { path: "intro", id: fixture.ids.guide + "-intro", value: "Q2 PT introducao da guia" },
  { path: "meta_title", id: fixture.ids.guide + "-meta_title", value: "Q2 PT guia SEO" },
  {
    path: "meta_description",
    id: fixture.ids.guide + "-meta_description",
    value: "Q2 PT descricao da guia SEO",
  },
  { path: "sections.0.title", id: fixture.ids.section + "-title", value: "Q2 PT seccao traduzida" },
  { path: "sections.0.body", id: fixture.ids.section + "-body", value: "Q2 PT corpo da seccao" },
  {
    path: "sections.0.local_tip",
    id: fixture.ids.section + "-local_tip",
    value: "Q2 PT conselho local",
  },
  {
    path: "sections.0.cta_label",
    id: fixture.ids.section + "-cta_label",
    value: "Q2 PT visitar lugar",
  },
  {
    path: "sections.0.places.0.name",
    id: fixture.places[0] + "-name",
    value: "Q2 PT lugar traduzido",
  },
  {
    path: "sections.0.places.0.description",
    id: fixture.places[0] + "-description",
    value: "Q2 PT descricao do lugar",
  },
];
const result = {
  candidate: process.env.CANDIDATE_COMMIT,
  locale,
  fields: [],
  pageErrors: b.errors,
};
async function visible(control) {
  for (let n = 0; n < 8 && !(await control.isVisible()); n++) {
    const summaries = control.locator("xpath=ancestor::details[not(@open)]/summary");
    assert.ok(await summaries.count());
    await summaries.first().click();
  }
}
try {
  const initial = await snapshot(sql, "guide", fixture.ids.guide),
    before = own(initial, locale);
  await b.page.goto(b.base + `/admin/guides/${fixture.ids.guide}`, {
    waitUntil: "domcontentloaded",
  });
  await selectLocale(b.page, locale);
  let saved;
  const alt = "Q2 PT imagem da guia";
  if (!resume) {
    for (const f of fields) {
      const control = b.page.locator(`[id="${f.id}"]`);
      await visible(control);
      await control.fill(f.value);
    }
    await b.page
      .getByRole("textbox", { name: "Alternative text · PT", exact: true })
      .first()
      .fill(alt);
    saved = await action(b.page, sql, "guide", fixture.ids.guide, locale, "Save draft");
    await record("q2-guide-pt-checkpoint", {
      phase: "draft-saved",
      revision: saved.revision,
      candidate: result.candidate,
    });
  } else {
    saved = before;
    const cp = JSON.parse(await fs.readFile(out + "/results/q2-guide-pt-checkpoint.json", "utf8"));
    assert.equal(cp.phase, "draft-saved");
    assert.equal(saved.revision, cp.revision);
  }
  for (const f of fields) assert.equal(at(saved.draft.content, f.path), f.value);
  assert.equal(saved.draft.content.media_alts[fixture.media[0]], alt);
  assert.deepEqual(saved.published, before.published);
  await b.page.reload({ waitUntil: "domcontentloaded" });
  await selectLocale(b.page, locale);
  for (const f of fields) {
    const control = b.page.locator(`[id="${f.id}"]`);
    await visible(control);
    assert.equal(await control.inputValue(), f.value);
  }
  await b.pub.goto(b.base + fixture.publicPaths[locale].guide, { waitUntil: "domcontentloaded" });
  await publicAssert(b.pub, { kind: "visible-text", value: before.published.content.title });
  assert.ok(!(await b.pub.locator("body").innerText()).includes(fields[1].value));
  let rows = await snapshot(sql, "guide", fixture.ids.guide);
  assert.deepEqual(
    rows.filter((r) => r.locale !== locale),
    initial.filter((r) => r.locale !== locale),
  );
  const published = await action(b.page, sql, "guide", fixture.ids.guide, locale, "Publish");
  await record("q2-guide-pt-checkpoint", {
    phase: "published",
    revision: published.revision,
    candidate: result.candidate,
  });
  await waitUntil(async () => {
    await b.pub.goto(b.base + fixture.publicPaths[locale].guide, { waitUntil: "domcontentloaded" });
    return (await b.pub.locator("body").innerText()).includes(fields[0].value);
  }, "Guide PT normal revalidation");
  for (const f of fields) {
    await publicAssert(b.pub, {
      kind:
        f.path === "meta_title"
          ? "document-title"
          : f.path === "meta_description"
            ? "meta-description"
            : "visible-text",
      value: f.value,
    });
    result.fields.push(f.path);
  }
  await publicAssert(b.pub, { kind: "image-alt", value: alt });
  rows = await snapshot(sql, "guide", fixture.ids.guide);
  assert.deepEqual(
    rows.filter((r) => r.locale !== locale),
    initial.filter((r) => r.locale !== locale),
  );
  assert.deepEqual(b.errors, []);
  result.ok = true;
  result.savedRevision = saved.revision;
  result.publishedRevision = published.revision;
  result.publicBaselineBeforePublish = true;
  result.otherLocalesUnchanged = true;
  await record("q2-guide-pt", result);
  console.log(
    JSON.stringify({
      ok: true,
      fields: result.fields.length,
      saved: saved.revision,
      published: published.revision,
    }),
  );
} catch (e) {
  result.ok = false;
  result.error = e.message;
  await record("q2-guide-pt", result);
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await b.browser.close();
}
