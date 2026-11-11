import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test, { beforeEach } from "node:test";

type Owner = "blog" | "property" | "faq" | "geography" | "guide" | "page" | "testimonial";
type Call = { owner: Owner; args: unknown[] };
const calls: Call[] = [];
const responses = new Map<Owner, string | null>();
const stateKey = Symbol.for("central-hill:legacy-redirect-tests");
const state = {
  invoke(owner: Owner, args: unknown[]) {
    calls.push({ owner, args });
    return responses.get(owner) ?? null;
  },
};
(globalThis as typeof globalThis & { [stateKey]: typeof state })[stateKey] = state;

const contracts = new Map([
  ["@slices/blog/contract", ["blog", "getBlogEditorialRedirect"]],
  ["@slices/buildings/contract", ["property", "getPropertyEditorialRedirect"]],
  ["@slices/faq/contract", ["faq", "getFaqLegacyEditorRedirect"]],
  ["@slices/geography/contract", ["geography", "getGeographyLegacyEditorRedirect"]],
  ["@slices/guides/contract", ["guide", "getGuideEditorialRedirect"]],
  ["@slices/pages/contract", ["page", "getPageEditorialRedirect"]],
  ["@slices/testimonials/contract", ["testimonial", "getTestimonialEditorialRedirect"]],
]);

// Load the actual resolver, replacing only foreign contracts. An accidental DB,
// auth, content-write or revalidation dependency fails before any network access.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return { url: "data:text/javascript,export {};", shortCircuit: true };
    }
    const contract = contracts.get(specifier);
    if (contract) {
      const [owner, name] = contract;
      const source = `export const ${name} = (...args) => globalThis[Symbol.for(${JSON.stringify(Symbol.keyFor(stateKey))})].invoke(${JSON.stringify(owner)}, args);`;
      return { url: `data:text/javascript,${encodeURIComponent(source)}`, shortCircuit: true };
    }
    if (/^@core\/(db|auth|i18n|revalidate)(\/|$)/.test(specifier)) {
      throw new Error(`Unexpected editorial dependency: ${specifier}`);
    }
    return nextResolve(specifier, context);
  },
});

const { getLegacyTranslationRedirect: resolve } = await import("../server/legacy-redirect");
const id = "e8770000-0000-4000-8000-000000000001";
const parent = "e8770000-0000-4000-8000-000000000002";

beforeEach(() => {
  calls.length = 0;
  responses.clear();
});

for (const [type, destination] of [
  ["company_settings", "/admin/settings"],
  ["nav_item", "/admin/settings"],
  ["service", `/admin/services/${id}`],
  ["service_category", `/admin/service-categories/${id}`],
  ["amenity", `/admin/amenities/${id}`],
  ["form_definition", `/admin/forms/${id}`],
] as const) {
  test(`${type} opens its direct editor without resolving unrelated owners`, async () => {
    assert.equal(await resolve(type, id, "es"), destination);
    assert.deepEqual(calls, []);
  });
}

for (const [type, owner, destination, acceptsLocale] of [
  ["page_content", "page", "/admin/pages/about", false],
  ["blog_post", "blog", `/admin/posts/${id}?locale=pt`, true],
  ["author", "blog", `/admin/authors/${id}`, true],
  ["blog_category", "blog", `/admin/blog-categories/${id}`, true],
  ["building", "property", `/admin/buildings/${id}?locale=pt`, true],
  ["apartment", "property", `/admin/buildings/${parent}/apartments/${id}?locale=pt`, true],
  ["building_faq", "property", `/admin/buildings/${parent}?locale=pt`, true],
  ["guide_page", "guide", `/admin/guides/${id}?locale=pt`, true],
  ["guide_section", "guide", `/admin/guides/${parent}?locale=pt`, true],
  ["guide_place", "guide", `/admin/guides/${parent}?locale=pt`, true],
  ["testimonial", "testimonial", `/admin/testimonials/${id}`, false],
  ["city", "geography", `/admin/cities/${id}`, false],
  ["neighbourhood", "geography", `/admin/cities/${parent}`, false],
  ["faq_item", "faq", `/admin/faq/${parent}`, false],
] as const) {
  test(`${type} delegates identity to ${owner} and retains its destination`, async () => {
    responses.set(owner, destination);
    assert.equal(await resolve(type, id, "pt"), destination);
    assert.deepEqual(calls, [{ owner, args: acceptsLocale ? [type, id, "pt"] : [type, id] }]);
  });
}

for (const [type, owner, fallback] of [
  ["page_content", "page", "/admin/pages"],
  ["apartment", "property", "/admin/buildings"],
  ["building_faq", "property", "/admin/buildings"],
  ["guide_page", "guide", "/admin/guides"],
  ["guide_section", "guide", "/admin/guides"],
  ["guide_place", "guide", "/admin/guides"],
  ["neighbourhood", "geography", "/admin/cities"],
  ["faq_item", "faq", "/admin/faq"],
] as const) {
  test(`${type} without a recognized owner has a stable catalogue fallback`, async () => {
    assert.equal(await resolve(type, id), fallback);
    assert.equal(calls.length, 1);
    assert.equal(calls[0]!.owner, owner);
  });
}

for (const type of ["media_asset", "unknown", "https://evil.invalid", "__proto__", ""]) {
  test(`${JSON.stringify(type)} cannot resurrect a generic editor or pick an asset consumer`, async () => {
    assert.equal(await resolve(type, id, "fr"), "/admin/pages");
    assert.deepEqual(calls, []);
  });
}

for (const badId of ["", "not-a-uuid", "//evil.invalid", `${id}?next=https://evil.invalid`, `../${id}`]) {
  test(`invalid identity ${JSON.stringify(badId)} is rejected before owner lookups`, async () => {
    for (const type of ["page_content", "guide_place", "neighbourhood", "faq_item", "service", "company_settings"]) {
      assert.equal(await resolve(type, badId, "es"), "/admin/pages");
    }
    assert.deepEqual(calls, []);
  });
}

for (const locale of ["en", "es", "pt", "fr"]) {
  test(`valid editor locale ${locale} reaches the owning guide contract`, async () => {
    responses.set("guide", `/admin/guides/${parent}?locale=${locale}`);
    assert.equal(await resolve("guide_place", id, locale), `/admin/guides/${parent}?locale=${locale}`);
    assert.deepEqual(calls, [{ owner: "guide", args: ["guide_place", id, locale] }]);
  });
}

test("invalid locale input is not forwarded to locale-aware owners", async () => {
  for (const locale of ["", "ES", "de", "//evil.invalid", "es&next=https://evil.invalid"]) {
    calls.length = 0;
    await resolve("blog_post", id, locale);
    assert.deepEqual(calls, [{ owner: "blog", args: ["blog_post", id, undefined] }]);
  }
});

test("parent-resolution failures propagate instead of hiding operational errors", async () => {
  const original = state.invoke;
  const failure = new Error("Unavailable owning slice");
  state.invoke = () => { throw failure; };
  try {
    await assert.rejects(resolve("guide_place", id, "es"), error => error === failure);
  } finally {
    state.invoke = original;
  }
});
