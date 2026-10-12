import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { REAL_ESTATE_SECTIONS } from "../ui/subnav-sections";

/**
 * Real Estate header sub-tabs (real-estate spec S6): the section list's keys must exist as
 * non-empty `settings.subnav.realEstate.<key>` strings in all 4 locales, and hrefs must be the
 * 10 real-estate page anchors. Pure, no DB, no rendering.
 * Run: `npx tsx --test src/slices/settings/tests/subnav.test.ts`.
 */

const LOCALES = ["en", "pt", "es", "fr"] as const;
const KEYS = [
  "top",
  "partners",
  "capabilities",
  "manage",
  "dealStructures",
  "market",
  "trackRecord",
  "process",
  "faq",
  "dealEnquiry",
];
const ANCHORS = [
  "top",
  "partners",
  "capabilities",
  "manage",
  "deal-structures",
  "market",
  "track-record",
  "process",
  "faq",
  "deal-enquiry",
];

function realEstateMessages(locale: string): Record<string, unknown> {
  const raw = readFileSync(
    join(process.cwd(), "messages", `${locale}.json`),
    "utf8",
  );
  const json = JSON.parse(raw) as {
    settings?: { subnav?: { realEstate?: Record<string, unknown> } };
  };
  const node = json.settings?.subnav?.realEstate;
  assert.ok(node, `${locale}: settings.subnav.realEstate missing`);
  return node;
}

test("section list keys and hrefs are the 10 real-estate anchors, in page order", () => {
  assert.deepEqual(
    REAL_ESTATE_SECTIONS.map((s) => s.key),
    KEYS,
  );
  assert.deepEqual(
    REAL_ESTATE_SECTIONS.map((s) => s.href),
    ANCHORS.map((a) => `/real-estate#${a}`),
  );
});

for (const locale of LOCALES) {
  test(`${locale}: settings.subnav.realEstate has exactly the 10 keys, all non-empty`, () => {
    const node = realEstateMessages(locale);
    assert.deepEqual(Object.keys(node).sort(), [...KEYS].sort());
    for (const key of KEYS) {
      const value = node[key];
      assert.equal(typeof value, "string", `${locale}.${key} not a string`);
      assert.ok((value as string).trim().length > 0, `${locale}.${key} empty`);
    }
  });
}

test("en labels match the previous hardcoded copy (minus the 'Portugal-' typo)", () => {
  const en = realEstateMessages("en");
  assert.equal(en.top, "Real Estate Partnerships");
  assert.equal(en.market, "Portugal Market Opportunity");
  assert.equal(en.dealEnquiry, "Start a Conversation");
});
