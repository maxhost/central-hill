import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
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
  sql = await database();
const b = await startBrowser();
const resume = process.argv.includes("--resume");
const result = resume
  ? JSON.parse(await fs.readFile(out + "/results/q1-routes-service.json", "utf8"))
  : { candidate: process.env.CANDIDATE_COMMIT, routes: [], service: {}, pageErrors: b.errors };
if (resume) {
  result.harnessCorrection =
    "ServiceDetail has no main element; visible body DOM excludes scripts. Resumed saved draft, no repeated Save or route matrix.";
  result.pageErrors = b.errors;
  delete result.error;
}
const { page, pub, base } = b;
function svcField(path) {
  return page
    .locator(
      `input[data-service-path="${path}"],textarea[data-service-path="${path}"],[data-service-field][data-service-path="${path}"] input,[data-service-field][data-service-path="${path}"] textarea`,
    )
    .first();
}
async function fingerprints() {
  const tables =
    await sql`select tablename from pg_tables where schemaname='public' and tablename not in('account','session','user','verification','staff_role')order by tablename`;
  const checks = tables.map(
    ({ tablename }) =>
      `select '${tablename}'as name,count(*)::int as n,md5(coalesce(jsonb_agg(to_jsonb(t)order by to_jsonb(t)::text)::text,'[]'))as hash from "${tablename}"t`,
  );
  return await sql.query(checks.join(" union all "));
}
try {
  if (!resume) {
    const before = await fingerprints();
    const routes = [
      ["root", "/admin/translations", "/admin/pages"],
      ["filters", "/admin/translations?type=service&view=attention", "/admin/pages"],
      ["page", `/admin/translations/page_content/${fixture.pages.about}`, "/admin/pages/about"],
      [
        "post",
        `/admin/translations/blog_post/${fixture.ids.post}?locale=pt`,
        `/admin/posts/${fixture.ids.post}?locale=pt`,
      ],
      [
        "author",
        `/admin/translations/author/${fixture.ids.author}`,
        `/admin/authors/${fixture.ids.author}`,
      ],
      [
        "blog-category",
        `/admin/translations/blog_category/${fixture.ids.blogCategory}`,
        `/admin/blog-categories/${fixture.ids.blogCategory}`,
      ],
      [
        "building",
        `/admin/translations/building/${fixture.ids.building}`,
        `/admin/buildings/${fixture.ids.building}`,
      ],
      [
        "apartment",
        `/admin/translations/apartment/${fixture.ids.apartment}`,
        `/admin/buildings/${fixture.ids.building}/apartments/${fixture.ids.apartment}`,
      ],
      [
        "building-faq",
        `/admin/translations/building_faq/${fixture.ids.buildingFaq}`,
        `/admin/buildings/${fixture.ids.building}`,
      ],
      [
        "guide",
        `/admin/translations/guide_page/${fixture.ids.guide}?locale=pt`,
        `/admin/guides/${fixture.ids.guide}?locale=pt`,
      ],
      [
        "guide-section",
        `/admin/translations/guide_section/${fixture.ids.section}`,
        `/admin/guides/${fixture.ids.guide}`,
      ],
      [
        "guide-place",
        `/admin/translations/guide_place/${fixture.places[0]}`,
        `/admin/guides/${fixture.ids.guide}`,
      ],
      [
        "testimonial",
        `/admin/translations/testimonial/${fixture.ids.ownerTestimonial}`,
        `/admin/testimonials/${fixture.ids.ownerTestimonial}`,
      ],
      [
        "settings",
        `/admin/translations/company_settings/${fixture.ids.settings}`,
        "/admin/settings",
      ],
      ["nav", `/admin/translations/nav_item/${randomUUID()}`, "/admin/settings"],
      [
        "service",
        `/admin/translations/service/${fixture.ids.service}`,
        `/admin/services/${fixture.ids.service}`,
      ],
      [
        "service-category",
        `/admin/translations/service_category/${fixture.ids.category}`,
        `/admin/service-categories/${fixture.ids.category}`,
      ],
      [
        "amenity",
        `/admin/translations/amenity/${fixture.ids.amenity}`,
        `/admin/amenities/${fixture.ids.amenity}`,
      ],
      ["city", `/admin/translations/city/${fixture.ids.city}`, `/admin/cities/${fixture.ids.city}`],
      [
        "neighbourhood",
        `/admin/translations/neighbourhood/${fixture.ids.neighbourhood}`,
        `/admin/cities/${fixture.ids.city}`,
      ],
      [
        "faq",
        `/admin/translations/faq_item/${fixture.faq.en.item}`,
        `/admin/faq/${fixture.faq.en.id}`,
      ],
      ["media", `/admin/translations/media_asset/${fixture.media[0]}`, "/admin/pages"],
      ["unknown", `/admin/translations/unrecognized/${randomUUID()}`, "/admin/pages"],
      ["bad-id", "/admin/translations/service/bad-id", "/admin/pages"],
      ["missing-faq", `/admin/translations/faq_item/${randomUUID()}`, "/admin/faq"],
      [
        "missing-neighbourhood",
        `/admin/translations/neighbourhood/${randomUUID()}`,
        "/admin/cities",
      ],
      ["missing-guide-child", `/admin/translations/guide_section/${randomUUID()}`, "/admin/guides"],
      ["missing-apartment", `/admin/translations/apartment/${randomUUID()}`, "/admin/buildings"],
    ];
    for (const [kind, input, expected] of routes) {
      const response = await page.goto(base + input, { waitUntil: "domcontentloaded" });
      assert.equal(new URL(page.url()).pathname + new URL(page.url()).search, expected, kind);
      assert.equal(response.status(), 200, kind);
      result.routes.push({ kind, input, expected, status: response.status() });
    }
    const fakeForm = randomUUID();
    await page.goto(base + `/admin/translations/form_definition/${fakeForm}`, {
      waitUntil: "domcontentloaded",
    });
    assert.equal(new URL(page.url()).pathname, `/admin/forms/${fakeForm}`);
    result.routes.push({ kind: "form-missing-native404", expected: `/admin/forms/${fakeForm}` });
    await pub.goto(base + "/admin/translations", { waitUntil: "domcontentloaded" });
    assert.equal(new URL(pub.url()).pathname, "/admin/login");
    await pub.goto(base + `/admin/translations/service/${fixture.ids.service}`, {
      waitUntil: "domcontentloaded",
    });
    assert.equal(new URL(pub.url()).pathname, "/admin/login");
    assert.deepEqual(
      await fingerprints(),
      before,
      "Opening compatibility routes changes no business rows",
    );
    result.routeConservation = true;
    result.unauthenticatedDenied = true;
  }
  const initial = await snapshot(sql, "service", fixture.ids.service),
    baseline = own(initial, "es").published.content;
  const changes = {
    name: "Q1 ES servicio propio",
    excerpt: "Q1 ES resumen del servicio",
    body: "Q1 ES cuerpo del servicio traducido",
    cta_label: "Q1 ES reservar servicio",
    "detail.about_title": "Q1 ES sobre el servicio",
    "detail.facts.0.title": "Q1 ES detalle principal",
    meta_title: "Q1 ES servicio SEO",
    meta_description: "Q1 ES descripción SEO del servicio",
  };
  await page.goto(base + `/admin/services/${fixture.ids.service}`, {
    waitUntil: "domcontentloaded",
  });
  await selectLocale(page, "es");
  const altValue = "Q1 ES descripción propia de portada";
  let saved;
  if (!resume) {
    for (const [path, value] of Object.entries(changes)) await svcField(path).fill(value);
    await page
      .getByRole("textbox", { name: "Alternative text · ES", exact: true })
      .first()
      .fill(altValue);
    saved = await action(page, sql, "service", fixture.ids.service, "es", "Save draft");
  } else {
    saved = own(initial, "es");
    assert.equal(saved.revision, 1);
    assert.ok(saved.draft);
  }
  for (const [path, value] of Object.entries(changes))
    assert.equal(at(saved.draft.content, path), value, path);
  assert.equal(saved.draft.content.media_alts[fixture.media[0]], altValue);
  assert.deepEqual(saved.published, own(initial, "es").published);
  await record("q1-checkpoint", {
    phase: "draft-saved",
    revision: saved.revision,
    candidate: result.candidate,
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await selectLocale(page, "es");
  for (const [path, value] of Object.entries(changes))
    assert.equal(await svcField(path).inputValue(), value, path);
  const publicPath = fixture.publicPaths.es.service;
  await pub.goto(base + publicPath, { waitUntil: "domcontentloaded" });
  await publicAssert(pub, { kind: "visible-text", value: baseline.name });
  assert.ok(!(await pub.locator("body").innerText()).includes(changes.body));
  let rows = await snapshot(sql, "service", fixture.ids.service);
  assert.deepEqual(
    rows.filter((r) => r.locale !== "es"),
    initial.filter((r) => r.locale !== "es"),
  );
  const published = await action(page, sql, "service", fixture.ids.service, "es", "Publish");
  assert.equal(published.draft, null);
  await record("q1-checkpoint", {
    phase: "published",
    revision: published.revision,
    candidate: result.candidate,
  });
  await waitUntil(async () => {
    await pub.goto(base + publicPath, { waitUntil: "domcontentloaded" });
    return (await pub.locator("body").innerText()).includes(changes.body);
  }, "Service ES ordinary public revalidation");
  for (const [path, value] of Object.entries(changes))
    await publicAssert(pub, {
      kind:
        path === "meta_title"
          ? "document-title"
          : path === "meta_description"
            ? "meta-description"
            : "visible-text",
      value,
    });
  await publicAssert(pub, { kind: "image-alt", value: altValue });
  rows = await snapshot(sql, "service", fixture.ids.service);
  assert.deepEqual(
    rows.filter((r) => r.locale !== "es"),
    initial.filter((r) => r.locale !== "es"),
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  await selectLocale(page, "es");
  assert.equal(await svcField("body").inputValue(), changes.body);
  result.service = {
    locale: "es",
    fields: Object.keys(changes),
    alt: true,
    draftSavedRevision: saved.revision,
    publishedRevision: published.revision,
    reload: true,
    publicBaselineBeforePublish: true,
    publicAfterPublish: true,
    otherLocalesUnchanged: true,
  };
  assert.deepEqual(b.errors, []);
  result.ok = true;
  await record("q1-routes-service", result);
  console.log(JSON.stringify({ ok: true, routes: result.routes.length, service: result.service }));
} catch (error) {
  result.ok = false;
  result.error = error.message;
  await record("q1-routes-service", result);
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await b.browser.close();
}
