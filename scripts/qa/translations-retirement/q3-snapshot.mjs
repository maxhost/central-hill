import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import { database, snapshot, out, record } from "./qa-common.mjs";
const sql = await database(),
  f = JSON.parse(await fs.readFile(out + "/fixtures.json", "utf8")),
  manifest = JSON.parse(await fs.readFile(out + "/concrete-field-manifest.json", "utf8"));
const result = {
  candidate: process.env.CANDIDATE_COMMIT,
  stage: "Q3-current-own-fixtures-before-final-cycles",
  rows: {},
  sha256: {},
  manifestSha256: createHash("sha256")
    .update(await fs.readFile(out + "/concrete-field-manifest.json"))
    .digest("hex"),
};
for (const key of Object.keys(f.pages)) {
  const rows = await snapshot(sql, "page", key);
  assert.equal(rows.length, 4);
  assert.ok(
    rows.every((r) => r.published && r.draft === null),
    "Four published custom snapshots; no unfinished incremental draft",
  );
  assert.equal(new Set(rows.map((r) => JSON.stringify(r.published.content))).size, 4);
  result.rows["page-" + key] = rows;
}
for (const kind of ["post", "service", "guide"]) {
  const rows = await snapshot(sql, kind, f.ids[kind]);
  assert.equal(rows.length, 4);
  assert.ok(rows.every((r) => r.published && r.draft === null));
  assert.equal(new Set(rows.map((r) => JSON.stringify(r.published.content))).size, 4);
  result.rows[kind] = rows;
}
for (const [key, rows] of Object.entries(result.rows))
  result.sha256[key] = createHash("sha256").update(JSON.stringify(rows)).digest("hex");
result.coverage = {
  principalPages: 9 * 4,
  principalEntities: 3 * 4,
  sidebar: 4,
  total: 52,
  interleaved: ["page-owners", "post", "service", "guide"],
  fieldManifestVersion: manifest.version,
  notes:
    "Current published baselines follow normal incremental Saves/Publishes; final runner loads each baseline anew, requires no draft, creates working values in UI and verifies stored draft independently.",
};
result.ok = true;
await record("q3-current-baselines", result);
console.log(
  JSON.stringify({
    ok: true,
    candidate: result.candidate,
    units: Object.keys(result.rows).length,
    manifestSha256: result.manifestSha256,
    cycles: result.coverage.total,
  }),
);
