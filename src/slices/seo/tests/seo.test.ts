import assert from "node:assert/strict";
import { test } from "node:test";

// Deterministic origin for the URL helpers (read lazily by config).
process.env.SITE_URL = "https://example.test";

import { absoluteUrl, siteUrl } from "../config";
import { buildSitemapIndex, buildUrlset, sectionPath } from "../server/sitemap";
import { buildRobots } from "../server/robots";
import type { SitemapSection, SitemapUrl } from "../server/urls";
import {
  faqPageLd,
  localBusinessLd,
  lodgingBusinessLd,
  organizationLd,
} from "@core/seo";

/**
 * Slice `seo` (S13) — pure builder tests (no DB/IO). Covers the config URL helpers,
 * the sitemap index/urlset serializers (incl. escaping + xhtml alternates), robots,
 * and the JSON-LD builders added to the kernel by ADR 0020. Run:
 * `npx tsx --test src/slices/seo/tests/seo.test.ts`.
 */

test("siteUrl strips trailing slashes; absoluteUrl joins one slash", () => {
  assert.equal(siteUrl(), "https://example.test");
  assert.equal(absoluteUrl("/en/buildings"), "https://example.test/en/buildings");
  assert.equal(absoluteUrl("robots.txt"), "https://example.test/robots.txt");
});

test("sectionPath + sitemap index lists each section absolutely", () => {
  const sections: SitemapSection[] = [
    { id: "pages", urls: [] },
    { id: "buildings", urls: [] },
  ];
  const xml = buildSitemapIndex(sections);
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.ok(xml.includes("<sitemapindex"));
  assert.ok(xml.includes("<loc>https://example.test/sitemaps/pages</loc>"));
  assert.ok(xml.includes("<loc>https://example.test/sitemaps/buildings</loc>"));
  assert.equal(sectionPath("blog"), "/sitemaps/blog");
});

test("urlset emits a <url> per entry with xhtml alternates", () => {
  const urls: SitemapUrl[] = [
    {
      loc: "https://example.test/en/blog/hello",
      alternates: [
        { hreflang: "en", href: "https://example.test/en/blog/hello" },
        { hreflang: "pt", href: "https://example.test/pt/blog/ola" },
        { hreflang: "x-default", href: "https://example.test/en/blog/hello" },
      ],
    },
  ];
  const xml = buildUrlset(urls);
  assert.ok(xml.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"'));
  assert.ok(xml.includes("<loc>https://example.test/en/blog/hello</loc>"));
  assert.ok(
    xml.includes(
      '<xhtml:link rel="alternate" hreflang="pt" href="https://example.test/pt/blog/ola" />',
    ),
  );
  assert.equal((xml.match(/<url>/g) ?? []).length, 1);
  assert.equal((xml.match(/hreflang=/g) ?? []).length, 3);
});

test("urlset escapes XML-special characters in URLs", () => {
  const xml = buildUrlset([
    { loc: "https://example.test/en/blog/a&b", alternates: [] },
  ]);
  assert.ok(xml.includes("a&amp;b"));
  assert.ok(!xml.includes("a&b<"));
});

test("robots allows public, disallows admin/api, references the sitemap", () => {
  const txt = buildRobots();
  assert.ok(txt.includes("User-agent: *"));
  assert.ok(txt.includes("Disallow: /admin"));
  assert.ok(txt.includes("Disallow: /api"));
  assert.ok(txt.includes("Sitemap: https://example.test/sitemap.xml"));
});

test("organizationLd carries identity and omits empty fields", () => {
  const ld = organizationLd({ name: "Central Hill", url: "https://example.test", sameAs: [] });
  assert.equal(ld["@type"], "Organization");
  assert.equal(ld["@id"], "https://example.test#organization");
  assert.equal(ld.name, "Central Hill");
  assert.ok(!("sameAs" in ld));
  assert.ok(!("logo" in ld));
});

test("localBusinessLd is a LodgingBusiness with PostalAddress when given", () => {
  const ld = localBusinessLd({
    name: "Central Hill",
    url: "https://example.test",
    address: "Lisbon, Portugal",
    currency: "EUR",
    sameAs: ["https://instagram.com/centralhill"],
  });
  assert.equal(ld["@type"], "LodgingBusiness");
  assert.deepEqual(ld.address, { "@type": "PostalAddress", streetAddress: "Lisbon, Portugal" });
  assert.equal(ld.currenciesAccepted, "EUR");
  assert.deepEqual(ld.sameAs, ["https://instagram.com/centralhill"]);
});

test("lodgingBusinessLd includes geo + amenities + occupancy when present", () => {
  const ld = lodgingBusinessLd({
    name: "Casa A",
    url: "/en/buildings/casa-a",
    latitude: 38.7,
    longitude: -9.1,
    occupancy: 4,
    amenities: ["Wifi", "Kitchen"],
    image: ["https://cdn/x.jpg"],
  });
  assert.equal(ld["@type"], "LodgingBusiness");
  assert.deepEqual(ld.geo, { "@type": "GeoCoordinates", latitude: 38.7, longitude: -9.1 });
  assert.equal(ld.numberOfRooms, 4);
  assert.equal((ld.amenityFeature as unknown[]).length, 2);
});

test("lodgingBusinessLd omits geo when coordinates are null", () => {
  const ld = lodgingBusinessLd({
    name: "Casa B",
    url: "/en/buildings/casa-b",
    latitude: null,
    longitude: null,
    occupancy: 0,
  });
  assert.ok(!("geo" in ld));
  assert.ok(!("numberOfRooms" in ld));
});

test("faqPageLd maps questions to Question/Answer nodes", () => {
  const ld = faqPageLd([{ question: "Q1?", answer: "A1." }]);
  assert.equal(ld["@type"], "FAQPage");
  const entity = ld.mainEntity as Array<Record<string, unknown>>;
  assert.equal(entity[0]!.name, "Q1?");
  assert.deepEqual(entity[0]!.acceptedAnswer, { "@type": "Answer", text: "A1." });
});
