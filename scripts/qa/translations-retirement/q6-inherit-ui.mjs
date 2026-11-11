import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {
  database,
  startBrowser,
  snapshot,
  own,
  action,
  selectLocale,
  publicAssert,
  waitUntil,
  record,
  out,
  assertNoBoundary,
} from "./qa-common.mjs";
const kind = process.argv[2],
  resumeEN = process.argv.includes("--resume-en");
assert.ok(["service", "guide"].includes(kind));
const f = JSON.parse(await fs.readFile(out + "/fixtures.json", "utf8")),
  sql = await database(),
  b = await startBrowser(),
  r = {
    candidate: process.env.CANDIDATE_COMMIT,
    kind,
    pageErrors: b.errors,
    boundaries: [],
    steps: [],
  };
const slug = `qa-inherit-${kind}`,
  table = kind === "service" ? "service" : "guide_page",
  plural = kind === "service" ? "services" : "guides",
  titleKey = kind === "service" ? "name" : "title",
  source1 = `QA SOURCE ${kind.toUpperCase()} ONE`,
  source2 = `QA SOURCE ${kind.toUpperCase()} TWO`,
  custom = `QA ES CUSTOM ${kind.toUpperCase()}`,
  route = (locale) =>
    kind === "service" ? `/${locale}/services/${slug}` : `/${locale}/guides/qa-city/${slug}`;
function field(key) {
  return kind === "service"
    ? b.page.locator(`[data-service-path="${key}"]`).first()
    : b.page.locator(`[id$="-${key}"]`).first();
}
async function publicTitle(locale, value, status = 200) {
  return waitUntil(
    async () => {
      const response = await b.pub.goto(b.base + route(locale), { waitUntil: "domcontentloaded" });
      assert.equal(response.status(), status);
      if (status === 200) await publicAssert(b.pub, { kind: "visible-text", value });
      return true;
    },
    kind + " public " + locale + " " + status,
  );
}
try {
  let id;
  if (resumeEN) {
    const found = await sql.query(`select id from ${table} where slug=$1`, [slug]);
    assert.equal(found.length, 1);
    id = found[0].id;
    await b.page.goto(b.base + `/admin/${plural}/${id}`, { waitUntil: "domcontentloaded" });
    r.resumedENSave = true;
  } else {
    assert.equal(
      (await sql.query(`select count(*)::int n from ${table} where slug=$1`, [slug]))[0].n,
      0,
      "Own new slug must be absent",
    );
    await b.page.goto(b.base + `/admin/${plural}/new`, { waitUntil: "domcontentloaded" });
    await field(titleKey).fill(source1);
    await field("slug").fill(slug);
    if (kind === "service") {
      await field("excerpt").fill("QA source-only service excerpt");
      await field("body").fill("QA source-only service body");
      await field("category_id").selectOption(f.ids.category);
    } else {
      await field("intro").fill("QA source-only guide intro");
      await field("city_id").selectOption(f.ids.city);
      await b.page.getByRole("button", { name: "Add section", exact: true }).first().click();
      const section = b.page.locator('details[id^="entity-"]').first();
      await section.locator('input[id$="-title"]').fill("QA source-only section");
      await section.locator('textarea[id$="-body"]').fill("QA source-only section body");
    }
    await b.page.getByRole("button", { name: "Save draft", exact: true }).first().click();
    id = await waitUntil(async () => {
      const rows = await sql.query(`select id from ${table} where slug=$1`, [slug]);
      if (!rows[0]?.id) return false;
      const en = own(await snapshot(sql, kind, rows[0].id), "en");
      return en.draft?.content[titleKey] === source1 ? rows[0].id : false;
    }, "UI firstSave complete draft " + kind);
  }
  r.id = id;
  await record("q6-inherit-" + kind + "-checkpoint", { phase: "en-first-draft", id, slug });
  const first = own(await snapshot(sql, kind, id), "en");
  assert.equal(first.draft.content[titleKey], source1);
  await action(b.page, sql, kind, id, "en", "Publish");
  await publicTitle("en", source1);
  await b.page.reload({ waitUntil: "domcontentloaded" });
  await selectLocale(b.page, "es");
  assert.equal(
    await field(titleKey).inputValue(),
    source1,
    "Absent target projects saved EN into working only",
  );
  assert.equal(own(await snapshot(sql, kind, id), "es").published, null);
  await publicTitle("es", null, 404);
  r.steps.push({ phase: "absent-target", workingEN: true, public404: true });
  const inherited = await action(b.page, sql, kind, id, "es", "Save draft");
  assert.equal(inherited.draft.localeMode, "inherit");
  assert.equal(inherited.draft.content[titleKey], source1);
  await publicTitle("es", null, 404);
  await action(b.page, sql, kind, id, "es", "Publish");
  await publicTitle("es", source1);
  r.steps.push({ phase: "inherit-published", localeMode: "inherit", snapshot: source1 });
  await selectLocale(b.page, "en");
  await field(titleKey).fill(source2);
  await action(b.page, sql, kind, id, "en", "Save draft");
  await action(b.page, sql, kind, id, "en", "Publish");
  await publicTitle("en", source2);
  await publicTitle("es", source1);
  await b.page.reload({ waitUntil: "domcontentloaded" });
  await selectLocale(b.page, "es");
  assert.equal(
    await field(titleKey).inputValue(),
    source2,
    "Working inherit adopts latest saved EN",
  );
  assert.equal(
    own(await snapshot(sql, kind, id), "es").published.content[titleKey],
    source1,
    "Published inherit remains saved snapshot",
  );
  r.steps.push({
    phase: "EN-updated",
    workingEN: source2,
    publishedES: source1,
    liveENFallback: false,
  });
  await field(titleKey).fill(custom);
  const customDraft = await action(b.page, sql, kind, id, "es", "Save draft");
  assert.equal(customDraft.draft.localeMode, "custom");
  await publicTitle("es", source1);
  await b.page.reload({ waitUntil: "domcontentloaded" });
  await selectLocale(b.page, "es");
  assert.equal(await field(titleKey).inputValue(), custom);
  await action(b.page, sql, kind, id, "es", "Publish");
  await publicTitle("es", custom);
  const final = await snapshot(sql, kind, id);
  assert.equal(own(final, "en").published.content[titleKey], source2);
  assert.equal(own(final, "es").published.localeMode, "custom");
  assert.ok(final.every((row) => row.draft === null));
  assert.ok(
    final.filter((row) => ["pt", "fr"].includes(row.locale)).every((row) => row.published === null),
  );
  await assertNoBoundary(b.page, r);
  await assertNoBoundary(b.pub, r);
  assert.deepEqual(b.errors, []);
  r.steps.push({ phase: "custom-published", localeMode: "custom", title: custom });
  r.ok = true;
  r.noUploads = true;
  r.noSQLWrites = true;
  await record("q6-inherit-" + kind, r);
  console.log(JSON.stringify(r));
} catch (e) {
  r.ok = false;
  r.error = e.message;
  await record("q6-inherit-" + kind, r);
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await b.browser.close();
}
