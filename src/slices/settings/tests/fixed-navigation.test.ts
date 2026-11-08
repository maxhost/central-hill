import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { FIXED_HEADER, FIXED_FOOTER, isFixedNavigationEntity, type FixedNavEntry } from "../fixed-navigation";
const locales = ["en", "es", "pt", "fr"] as const;
function messages(locale: string): Record<string, unknown> { return JSON.parse(readFileSync(`messages/${locale}.json`, "utf8")).settings; }
function label(locale: string, key: string): unknown { return key.split(".").reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], messages(locale)); }
const all = (rows: readonly FixedNavEntry[]): FixedNavEntry[] => rows.flatMap(row => [row, ...all(row.children ?? [])]);
test("fixed primary menu preserves the current six destinations and their order", () => {
  assert.deepEqual(FIXED_HEADER.map(row => row.url), ["/owners", "/buildings", "/real-estate", "/guests", "/about", "/blog"]);
  assert.deepEqual(FIXED_HEADER.find(row => row.key === "guests")?.children?.map(row => row.url), ["/services", "/guides"]);
  assert.equal(isFixedNavigationEntity("nav_item"), true);
  assert.equal(isFixedNavigationEntity("company_settings"), false);
});
test("Owners and About preserve all existing section anchors in page order", () => {
  assert.deepEqual(FIXED_HEADER.find(row => row.key === "owners")?.children?.map(row => row.url), ["worth","numbers","why","services","plans","journey","technology","testimonials","faq","start"].map(id => `/owners#${id}`));
  assert.deepEqual(FIXED_HEADER.find(row => row.key === "about")?.children?.map(row => row.url), ["who-we-are","story","serve","values","organised","certifications","community","contact"].map(id => `/about#${id}`));
});
test("fixed Footer keeps its two groups, five links each and original destinations", () => {
  assert.equal(FIXED_FOOTER.length, 2);
  assert.deepEqual(FIXED_FOOTER[0]?.children?.map(row => row.url), Array(5).fill("/owners"));
  assert.deepEqual(FIXED_FOOTER[1]?.children?.map(row => row.url), ["/buildings","/buildings","/about","/blog","/about"]);
});
for (const locale of locales) test(`${locale}: every fixed navigation label exists; Owners/About have their own translations`, () => {
  for (const row of [...all(FIXED_HEADER), ...all(FIXED_FOOTER)]) {
    const text = label(locale, row.labelKey);
    assert.equal(typeof text, "string", row.labelKey);
    assert.ok((text as string).trim(), row.labelKey);
    if (locale !== "en" && /^subnav\.(owners|about)\./.test(row.labelKey)) assert.notEqual(text, label("en", row.labelKey), row.labelKey);
  }
});
