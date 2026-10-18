import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { createElement } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import type { GuidePlace, GuideRecommendation } from "../contract";
import * as presentation from "../presentation";
import * as format from "../ui/format";
import * as scope from "../server/recommendation-scope";

const city = { id: "city", slug: "lisbon", name: "Lisbon" };
const types = ["restaurant", "viewpoint", "beach"];
const image = { r2_key: "photo.jpg", width: 100, height: 100, blurhash: null };

/** Exercise real public query composition with isolated in-memory read seams: no DB/env access. */
function publicQueries(results: unknown[][]) {
  const orders: unknown[][] = [];
  const tags: string[][] = [];
  const table = (name: string) => new Proxy({}, { get: (_, key) => `${name}.${String(key)}` });
  const schema = { guide_page: table("page"), guide_section: table("section"), guide_place: table("place") };
  const chain = {
    from: () => chain, where: () => chain, innerJoin: () => chain,
    orderBy: (...order: unknown[]) => { orders.push(order); return Promise.resolve(results.shift() ?? []); },
    limit: () => Promise.resolve(results.shift() ?? []),
  };
  const content = {
    get: (_type: string, id: string, field: string) => {
      if (field === "title") return id === "page" ? "Guide" : "Repeated";
      if (field === "name") return id;
      if (field === "cta_label") return "Book";
      if (field === "body" || field === "local_tip") return field;
      return null;
    },
  };
  const dependencies: Record<string, unknown> = {
    "server-only": {},
    "next/cache": { unstable_cache: (read: () => unknown, _key: string[], options: { tags: string[] }) => { tags.push(Array.from(options.tags)); return read; } },
    "drizzle-orm": { and: (...args: unknown[]) => args, asc: (x: unknown) => x, eq: () => null, inArray: () => null, isNotNull: () => null, sql: () => null },
    "@core/db/client": { db: { select: () => chain } },
    "@core/i18n/content": {
      resolveSlug: async () => "page", loadContent: async () => content,
      loadSlugs: async (_type: string, ids: string[]) => new Map(ids.map((id) => [id, "guide-slug"])),
      loadAlternateSlugs: async () => ({ en: "guide-slug", pt: "guia", es: "guia", fr: "guide" }),
    },
    "@core/media": { loadMedia: async (ids: string[]) => new Map(ids.map((id) => [id, image])), mediaUrl: (key: string) => `https://media.test/${key}` },
    "@slices/geography/contract": { CITY: "city", GEO_TAGS: { list: "city-list" }, getCityBySlug: async () => city, listCities: async () => [city] },
    "../contract": { GUIDE_PAGE: "guide_page", GUIDE_SECTION: "guide_section", GUIDE_PLACE: "guide_place", GUIDE_TAGS: { list: "guide-list" }, RECOMMENDATION_TYPES: types },
    "../schema": schema, "../presentation": presentation, "../ui/format": format, "./recommendation-scope": scope,
  };
  const compiled = { exports: {} };
  const source = ts.transpileModule(readFileSync(new URL("../server/queries.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(source, { module: compiled, exports: compiled.exports, require: (name: string) => {
    assert.ok(name in dependencies, `Unexpected query dependency ${name}`);
    return dependencies[name];
  } });
  return { queries: compiled.exports as typeof import("../server/queries"), orders, tags };
}

const section = (id: string, config: unknown) => ({ id, layout: "standard", header_media_id: id, cta_url: "https://example.com", presentation: config });
const place = (id: string, sectionId: string) => ({ id, guide_section_id: sectionId, category: "Restaurant", address: "Street", media_id: id, phone: null, price_tier: null, opening_hours: null, latitude: null, longitude: null, website_url: null, booking_url: null });

test("detail applies modules before gallery/TOC/count consumers and preserves full source records", async () => {
  const sections = [section("hidden", { version: 1, enabled: false }), section("modules", { version: 1, modules: { image: false, places: false, body: false, local_tip: false, cta: false } }), section("legacy", null)];
  const sourcePlaces = sections.map((s) => place(`place-${s.id}`, s.id));
  const { queries, tags, orders } = publicQueries([[{ id: "page", city_id: city.id, template: "custom", hero_media_id: null, og_image_media_id: null }], sections, sourcePlaces]);
  const guide = await queries.getGuidePage("en", city.slug, "guide-slug");
  assert.ok(guide);
  assert.deepEqual(Array.from(guide.sections, (s) => s.id), ["modules", "legacy"]);
  const [disabled, legacy] = guide.sections;
  assert.ok(disabled && legacy);
  assert.equal(disabled.body, null);
  assert.equal(disabled.headerImage, null);
  assert.equal(disabled.localTip, null);
  assert.equal(disabled.cta, null);
  assert.equal(disabled.places.length, 0);
  assert.equal(legacy.places.length, 1);
  assert.equal(guide.sections.reduce((n, s) => n + s.places.length, 0), 1);
  assert.equal(guide.sections.filter((s) => s.headerImage).length, 1);
  assert.deepEqual(format.sectionAnchorIds(guide.sections.map((s) => s.title)), ["repeated", "repeated-2"]);
  assert.equal(sections.length, 3);
  assert.equal(sourcePlaces.length, 3);
  assert.deepEqual(tags[0], ["guide-list", "city-list"]);
  assert.deepEqual(orders, [["section.position", "section.id"], ["place.position", "place.id"]]);
});

test("recommendations skip hidden first candidates and retain scoped cache and ID tie breaks", async () => {
  const candidate = (id: string, config: unknown) => ({ id, category: "Restaurant", address: "Street", media_id: id, page_id: "page", city_id: city.id, presentation: config });
  const { queries, tags, orders } = publicQueries([[
    candidate("hidden-section", { version: 1, enabled: false }),
    candidate("hidden-places", { version: 1, modules: { places: false } }),
    candidate("visible-other-modules-hidden", { version: 1, modules: { image: false, body: false } }),
    candidate("later", null),
  ]]);
  const recommendations = await queries.listTopRecommendations("en", 3, { cityIds: [city.id] });
  assert.deepEqual(Array.from(recommendations, (rec) => rec.id), ["visible-other-modules-hidden"]);
  assert.deepEqual(tags[0], ["guide-list", "city-list"]);
  assert.deepEqual(orders[0], ["page.position", "page.id", "section.position", "section.id", "place.position", "place.id"]);
});

test("invalid legacy presentation uses historical visibility and unsafe CTA is omitted", async () => {
  for (const raw of [null, undefined, { version: 2, enabled: false }, { version: 1, modules: { image: "false" } }]) {
    const rows = [section("legacy", raw)];
    rows[0]!.cta_url = "javascript:alert(1)";
    const { queries } = publicQueries([[{ id: "page", city_id: city.id, template: "eat", hero_media_id: null, og_image_media_id: null }], rows, [place("legacy-place", "legacy")]]);
    const guide = await queries.getGuidePage("fr", city.slug, "guide-slug");
    assert.equal(guide?.sections.length, 1);
    assert.ok(guide?.sections[0]?.headerImage);
    assert.equal(guide?.sections[0]?.places.length, 1);
    assert.equal(guide?.sections[0]?.cta, null);
  }
});


function recommendationCard() {
  const compiled = { exports: {} };
  const dependencies: Record<string, unknown> = {
    "react/jsx-runtime": jsxRuntime,
    "next/link": { __esModule: true, default: "a" },
    "@core/media": { MediaImage: ({ data }: { data: { url: string; alt: string } }) => createElement("img", { src: data.url, alt: data.alt }) },
    "@core/ui/icon": { Icon: () => null },
    "../../contract": { RECOMMENDATION_TYPES: types },
    "../format": format,
  };
  const source = ts.transpileModule(readFileSync(new URL("../ui/components/recommendation-card.tsx", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  runInNewContext(source, { module: compiled, exports: compiled.exports, require: (name: string) => {
    assert.ok(name in dependencies, `Unexpected card dependency ${name}`);
    return dependencies[name];
  } });
  return (compiled.exports as typeof import("../ui/components/recommendation-card")).RecommendationCard;
}

test("place cards expose hours, safe website/booking links and formatted phone without breaking listing cards", () => {
  const Card = recommendationCard();
  const labels = { directionsLabel: "Directions", hoursLabel: "Hours", websiteLabel: "Website", bookingLabel: "Book", typeLabels: { restaurant: "Restaurant" }, pinIcon: "pin" };
  const p: GuidePlace = { id: "place", name: "Example", description: null, category: "restaurant", address: "Street", phone: "+351 (21) 123-4567", priceTier: "mid", openingHours: "Tuesday 09:00–18:00", latitude: null, longitude: null, websiteUrl: "https://example.com", bookingUrl: "https://example.com/book", image: null };
  const html = renderToStaticMarkup(createElement(Card, { place: p, ...labels }));
  assert.match(html, /Hours: /);
  assert.match(html, /Tuesday 09:00–18:00/);
  assert.match(html, /href="https:\/\/example.com"/);
  assert.match(html, /href="https:\/\/example.com\/book"/);
  assert.match(html, /href="tel:\+351211234567"/);
  assert.match(html, /\+351 \(21\) 123-4567/);
  assert.match(html, /rel="noopener noreferrer"/);
  const unsafe = renderToStaticMarkup(createElement(Card, { place: { ...p, phone: "call us", address: null, websiteUrl: "javascript:alert(1)", bookingUrl: "data:text/html,x", openingHours: " " }, ...labels }));
  assert.doesNotMatch(unsafe, /href=|Hours:|Website|Book/);
  assert.match(unsafe, /call us/);
  const rec: GuideRecommendation = { id: "rec", type: "restaurant", category: "restaurant", name: "Recommendation", description: null, address: "Street", image: { url: "https://media.test/photo.jpg", width: 100, height: 100, alt: "Photo", blurhash: null }, guide: { citySlug: "lisbon", slug: "food" } };
  const listing = renderToStaticMarkup(createElement(Card, { rec, locale: "fr", typeLabels: labels.typeLabels, pinIcon: "pin" }));
  assert.match(listing, /href="\/fr\/guides\/lisbon\/food"/);
  assert.equal((listing.match(/<a /g) ?? []).length, 1);
  assert.doesNotMatch(listing, /Hours:|Website|Book|tel:/);
});
