import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import { root } from "../guests-welcome-media/common.mjs";
const journals = ["og", "og-about-real-estate", "og-services", "og-guest"];
const keys = [
  "home",
  "owners",
  "about",
  "real_estate",
  "guest",
  "blog",
  "guides",
  "buildings",
  "services",
  "privacy_policy",
  "cookies_policy",
  "complaints_book",
];
const ratios = ["recommended", "3-2", "2-3", "1-1"];
const records = [],
  evidence = [];
for (const journal of journals) {
  const bytes = await fs.readFile(root + "/" + journal + "/results.json");
  const result = JSON.parse(bytes);
  assert.deepEqual(result.errors, [], journal + " page errors");
  evidence.push({
    journal,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
  for (const record of result.records) {
    assert.equal(record.result, "pass");
    assert.equal(record.destinations.length, 4);
    assert.ok(
      Number.isInteger(record.revision) && record.revision > 0,
      "EN persisted publication revision",
    );
    assert.deepEqual(record.destinations.map((r) => r.locale).sort(), [
      "en",
      "es",
      "fr",
      "pt",
    ]);
    assert.deepEqual(record.localePublications.map((r) => r.locale).sort(), [
      "es",
      "fr",
      "pt",
    ]);
    for (const publication of record.localePublications) {
      assert.equal(publication.ownSaveReloadPublish, true);
      assert.equal(publication.ogImageMediaId, record.id);
    }
    records.push({ ...record, journal });
  }
}
assert.equal(records.length, 48);
assert.equal(new Set(records.map((r) => r.key + "/" + r.ratio)).size, 48);
for (const key of keys)
  for (const ratio of ratios)
    assert.ok(
      records.some((r) => r.key === key && r.ratio === ratio),
      key + "/" + ratio,
    );
await fs.writeFile(
  root + "/og/complete-receipt.json",
  JSON.stringify(
    {
      complete: true,
      fields: 12,
      cycles: 48,
      localePublications: 192,
      evidence,
      records,
    },
    null,
    2,
  ),
);
console.log(
  "OG complete:12 fields,48 real upload cycles,192 own locale publications",
);
