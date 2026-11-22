import test from "node:test";
import assert from "node:assert/strict";
import { emptyServiceEnvelope } from "../locale-content";
import { serviceDetailContent } from "../detail";
import {
  saveServiceRequestSchema,
  serviceFieldErrors,
} from "../server/locale-validation";
import {
  serviceFormEnvelope,
  serviceFormSharedContent,
} from "../admin/locale-form-state";
import { checkServiceEnvelope } from "../server/locale-validation";
import {
  createServiceWorkspace,
  changeServiceForm,
} from "../admin/locale-form-state";
import {
  retainServiceErrors,
  serviceFeedbackLabel,
  serviceFeedbackGroups,
  normalizeServiceFieldErrors,
} from "../admin/feedback-model";
const category = "eef10000-0000-4000-8000-000000000001",
  media = "eef10000-0000-4000-8000-000000000002";
function doc() {
  const e = emptyServiceEnvelope(category);
  Object.assign(e.content, {
    name: "Tour",
    excerpt: "Description",
    body: "About",
    cover_media_id: media,
  });
  return e;
}
test("inactive External URL is retained for None/Enquiry and revalidated when External returns", () => {
  const d = doc();
  d.content.cta_url = "broken";
  for (const booking of ["none", "enquiry"] as const) {
    d.content.booking_type = booking;
    assert.deepEqual(checkServiceEnvelope(d).errors, {});
    assert.deepEqual(checkServiceEnvelope(d, true).errors, {});
    assert.equal(d.content.cta_url, "broken");
  }
  d.content.booking_type = "external";
  assert.ok(checkServiceEnvelope(d).errors.cta_url);
  assert.ok(checkServiceEnvelope(d, true).errors.cta_url);
  d.content.cta_url = "https://example.test";
  assert.ok(checkServiceEnvelope(d, true).errors.cta_label);
  d.content.cta_label = "Book";
  assert.deepEqual(checkServiceEnvelope(d, true).errors, {});
});
test("Save can retain incomplete publication text while required initial references remain enforced", () => {
  const d = doc();
  d.content.name = "";
  d.content.body = "";
  d.content.excerpt = "";
  d.content.cover_media_id = null;
  assert.deepEqual(checkServiceEnvelope(d).errors, {});
  const errors = checkServiceEnvelope(d, true).errors;
  for (const key of ["name", "excerpt", "body", "cover_media_id"])
    assert.ok(errors[key]);
});
test("Service field corrections retain other locales, remaining publication requirements, and reference errors", () => {
  const w = createServiceWorkspace(null, category);
  w.locales.es.working.cover_media_id = media;
  w.locales.es.errors = {
    name: "Name required",
    excerpt: "Excerpt required",
    cover_media_id: "Select an uploaded image.",
  };
  w.locales.fr.errors = { body: "Body required" };
  const next = changeServiceForm(w, "es", {
    ...w.locales.es.working,
    name: "Fixed",
  });
  assert.equal(next.locales.es.errors.name, undefined);
  assert.ok(next.locales.es.errors.excerpt);
  assert.equal(
    next.locales.es.errors.cover_media_id,
    "Select an uploaded image.",
  );
  assert.deepEqual(next.locales.fr.errors, w.locales.fr.errors);
  const saved = retainServiceErrors(w, "es", next.locales.es.working, true);
  assert.ok(saved.excerpt);
  assert.equal(saved.cover_media_id, undefined);
});
test("Service nested labels identify list entries and the actual field", () => {
  assert.deepEqual(serviceFeedbackLabel("detail.itinerary.2.time"), {
    section: "Itinerary",
    label: "Itinerary → Item 3 → Time",
  });
});

test("target dependency errors identify their English source without marking independent copy as shared", () => {
  const workspace = createServiceWorkspace(null, category);
  workspace.locales.es.errors = {
    category_id: "Category no longer exists.",
    name: "Name is required.",
  };
  const issues = serviceFeedbackGroups(workspace).find(
    (group) => group.locale === "es",
  )!.issues;
  assert.equal(
    issues.find((issue) => issue.path === "category_id")?.sourceLocale,
    "en",
  );
  assert.equal(
    issues.find((issue) => issue.path === "name")?.sourceLocale,
    undefined,
  );
});

test("actual blank category shared-request rejection maps to the visible Category control", () => {
  const w = createServiceWorkspace(null, category);
  w.locales.en.working.category_id = "";
  w.shared.category_id = "";
  const input = {
    serviceId: media,
    locale: "en",
    expectedRevision: 0,
    templateRevision: null,
    expectedSharedRevision: 0,
    payload: serviceFormEnvelope(w, "en"),
    shared: serviceFormSharedContent(w, "en"),
    slug: "new-service",
  };
  const rejected = saveServiceRequestSchema.safeParse(input);
  assert.equal(rejected.success, false);
  if (rejected.success) throw Error("Expected required category failure");
  const serverErrors = serviceFieldErrors(rejected.error.issues);
  assert.ok(
    serverErrors["shared.category_id"],
    "exercise the actual request-schema root",
  );
  const normalized = normalizeServiceFieldErrors(
    serverErrors,
    w.locales.en.working,
  );
  assert.deepEqual(Object.keys(normalized), ["category_id"]);
  assert.deepEqual(serviceFeedbackLabel(Object.keys(normalized)[0]!), {
    section: "General",
    label: "Category",
  });
});
test("detail-only preflight errors keep nested control paths and do not double-prefix rooted errors", () => {
  const w = createServiceWorkspace(null, category);
  const form = w.locales.en.working;
  const parsed = serviceDetailContent.safeParse({
    ...doc().content.detail,
    itinerary: [{ id: "row", time: "", title: "Title", text: "Text" }],
  });
  assert.equal(parsed.success, false);
  if (parsed.success) throw Error("Expected required time failure");
  const issues = Object.fromEntries(
    parsed.error.issues.map((issue) => [issue.path.join("."), issue.message]),
  );
  assert.deepEqual(
    Object.keys(normalizeServiceFieldErrors(issues, form, "detail")),
    ["detail.itinerary.0.time"],
  );
  const rooted = normalizeServiceFieldErrors(
    {
      "content.category_id": "Choose category",
      "payload.content.excerpt": "Enter excerpt",
      "detail.itinerary.0.time": "Enter time",
    },
    form,
    "detail",
  );
  assert.deepEqual(Object.keys(rooted), [
    "category_id",
    "excerpt",
    "detail.itinerary.0.time",
  ]);
});
