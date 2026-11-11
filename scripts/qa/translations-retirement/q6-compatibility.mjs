import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { database, startBrowser, record, out, assertNoBoundary } from "./qa-common.mjs";
const f = JSON.parse(await fs.readFile(out + "/fixtures.json", "utf8")),
  sql = await database(),
  b = await startBrowser(),
  r = {
    candidate: process.env.CANDIDATE_COMMIT,
    pageErrors: b.errors,
    boundaries: [],
    intlErrors: [],
    routes: [],
  };
b.page.on("console", (msg) => {
  if (msg.type() === "error" && /MISSING_MESSAGE.*(?:S14|translations)|S14\./.test(msg.text()))
    r.intlErrors.push(msg.text());
});
async function fingerprints() {
  const tables =
    await sql`select tablename from pg_tables where schemaname='public' and tablename not in('account','session','user','verification','staff_role')order by tablename`;
  const queries = tables.map(
    ({ tablename }) =>
      `select '${tablename}' name,count(*)::int n,md5(coalesce(jsonb_agg(to_jsonb(t)order by to_jsonb(t)::text)::text,'[]')) hash from "${tablename}"t`,
  );
  return sql.query(queries.join(" union all "));
}
try {
  const before = await fingerprints();
  assert.equal(before.length, 42);
  const routes = [
    ["root", "/admin/translations", "/admin/pages"],
    ["filters", "/admin/translations?type=service&view=attention", "/admin/pages"],
    ["page", `/admin/translations/page_content/${f.pages.about}`, "/admin/pages/about"],
    [
      "post",
      `/admin/translations/blog_post/${f.ids.post}?locale=pt`,
      `/admin/posts/${f.ids.post}?locale=pt`,
    ],
    ["service", `/admin/translations/service/${f.ids.service}`, `/admin/services/${f.ids.service}`],
    [
      "guide-child",
      `/admin/translations/guide_place/${f.places[0]}`,
      `/admin/guides/${f.ids.guide}`,
    ],
    [
      "city-child",
      `/admin/translations/neighbourhood/${f.ids.neighbourhood}`,
      `/admin/cities/${f.ids.city}`,
    ],
    [
      "legacy-faq",
      `/admin/translations/faq_item/${f.ids.legacyFaqItem}`,
      `/admin/faq/${f.ids.legacyFaq}`,
    ],
    ["asset", `/admin/translations/media_asset/${f.media[0]}`, "/admin/pages"],
    ["settings", `/admin/translations/company_settings/${f.ids.settings}`, "/admin/settings"],
    ["bad-id", "/admin/translations/service/not-an-id", "/admin/pages"],
    ["missing-faq", `/admin/translations/faq_item/${randomUUID()}`, "/admin/faq"],
  ];
  for (const [kind, input, expected] of routes) {
    const response = await b.page.goto(b.base + input, { waitUntil: "domcontentloaded" });
    assert.equal(new URL(b.page.url()).pathname + new URL(b.page.url()).search, expected, kind);
    assert.equal(response.status(), 200, kind);
    assert.equal(
      await b.page.locator('a[href^="/admin/translations"]').count(),
      0,
      "No retired navigation/operation link",
    );
    await assertNoBoundary(b.page, r);
    r.routes.push({ kind, input, expected, status: response.status() });
  }
  for (const path of [
    "/admin/translations",
    `/admin/translations/faq_item/${f.ids.legacyFaqItem}`,
  ]) {
    await b.pub.goto(b.base + path, { waitUntil: "domcontentloaded" });
    assert.equal(new URL(b.pub.url()).pathname, "/admin/login");
  }
  assert.deepEqual(
    await fingerprints(),
    before,
    "Final compatibility GETs leave all42own QA business tables exact",
  );
  assert.deepEqual(b.errors, []);
  assert.deepEqual(r.intlErrors, []);
  r.ok = true;
  r.anonymousLoginGate = true;
  r.businessTablesExact = 42;
  r.stubBoundaryEvidence =
    "Q3 source review plus root six-stub/direct-generator tests retained; no hidden action endpoint calls from QA";
  await record("q6-compatibility", r);
  console.log(
    JSON.stringify({
      ok: true,
      routes: r.routes.length,
      anonymousLoginGate: true,
      businessTablesExact: r.businessTablesExact,
      pageErrors: b.errors,
      boundaries: r.boundaries,
      intlErrors: r.intlErrors,
    }),
  );
} catch (e) {
  r.ok = false;
  r.error = e.message;
  await record("q6-compatibility", r);
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await b.browser.close();
}
