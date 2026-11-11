import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { out, record } from "./qa-common.mjs";
const read = async (name) =>
    JSON.parse(await fs.readFile(out + "/results/" + name + ".json", "utf8")),
  score = await read("final-scoreboard"),
  svc = await read("variant-service-conditionals"),
  empty = await read("variant-guides-empty"),
  legacy = await read("q6-legacy-readers"),
  compat = await read("q6-compatibility"),
  conservation = await read("q6-principal-conservation"),
  guide = await read("q6-inherit-guide");
const originalUserProof = await read("q6-protected-user-review");
assert.equal(originalUserProof.independentlyComparedJSON, true);
assert.equal(originalUserProof.exact, true);
assert.equal(originalUserProof.tables, 42);
assert.equal(originalUserProof.settingsCount, 0);
assert.equal(score.passed, 52);
assert.equal(score.failed, 0);
assert.equal(score.draftPending, 0);
for (const r of [svc, empty, legacy, compat, conservation, guide]) assert.equal(r.ok, true);
for (const k of ["page", "post", "service", "guide"])
  assert.equal((await read("q6-mobile-" + k)).ok, true);
const locales = ["en", "es", "pt", "fr"],
  m = JSON.parse(await fs.readFile(out + "/concrete-field-manifest.json", "utf8"));
m.version = 7;
m.candidate = "b30a18c85fbb916e62bf4d5ada97bf0f0169a5d9";
m.note =
  "Final audited field-to-control-to-public evidence; no hidden/editor-only/decorative/code-label field is counted as public text editing.";
const unresolved = [];
for (const p of m.pages)
  for (const f of p.fields) {
    const records = await Promise.all(
      locales.map((l) =>
        read((f.surface === "blog_article" ? "sidebar-" : "final-") + p.key + "-" + l),
      ),
    );
    const evidence = records.map((r, i) => ({
      locale: locales[i],
      entry: r.fields.find((x) => x.path === f.path),
    }));
    if (evidence.every((x) => x.entry?.public === true))
      f.status = "browser-public-asserted-4-locales";
    else if (evidence.every((x) => typeof x.entry?.public === "string"))
      f.status = "ui-persisted-no-public-consumer";
    else if (
      p.key === "guides" &&
      f.path === "catalogue.empty_message" &&
      empty.locales.length === 4
    ) {
      f.status = "browser-public-conditional-Q6-4-locales";
      f.resolution = "results/variant-guides-empty.json";
    } else unresolved.push("page " + p.key + " " + f.path);
    f.finalEvidence = evidence.map((x) => ({
      locale: x.locale,
      result: x.entry?.public ?? f.resolution,
    }));
  }
for (const [k, entity] of Object.entries(m.entities))
  for (const f of entity.fields) {
    const records = await Promise.all(locales.map((l) => read("final-" + k + "-" + l))),
      evidence = records.map((r, i) => ({
        locale: locales[i],
        entry: r.fields.find((x) => x.path === f.path),
      }));
    if (evidence.every((x) => x.entry?.public === true))
      f.status = "browser-public-asserted-4-locales";
    else if (
      k === "guide" &&
      f.path.endsWith(".category") &&
      evidence[0].entry?.edited === false &&
      evidence.slice(1).every((x) => x.entry?.public === true)
    )
      f.status = "ES-PT-FR-text-public-asserted-EN-canonical-code-label-observed";
    else if (evidence.every((x) => typeof x.entry?.public === "string"))
      f.status = "ui-persisted-no-public-consumer";
    else if (k === "service" && f.path.startsWith("copy.")) {
      const key = f.path.slice(5),
        covered = new Set(
          svc.steps.flatMap((s) =>
            s.checks.filter((c) => c.keys.includes(key)).map((c) => c.locale),
          ),
        );
      if (covered.size === 4) {
        f.status = "browser-public-conditional-Q6-4-locales";
        f.resolution = "results/variant-service-conditionals.json";
      } else unresolved.push(k + " " + f.path);
    } else unresolved.push(k + " " + f.path);
    f.finalEvidence = evidence.map((x) => ({
      locale: x.locale,
      result: x.entry?.public ?? f.resolution,
    }));
  }
assert.deepEqual(unresolved, []);
m.finalCoverage = {
  principalUnits: 52,
  principalPassed: 52,
  pending: 0,
  serviceConditionalFields: 12,
  serviceConditionalLocales: 4,
  guideEmptyLocales: 4,
  legacyHistoricalRowsOriginal: 15,
  mobileFamilies: 4,
  inheritBrowser: ["guide"],
  inheritPureSource: ["pages", "post", "service"],
  explicitBrowserLimits:
    "Pages no reset/fixed keys; Post/Service require cover upload for new publication; no added media/infra/reset.",
};
const manifestBytes = JSON.stringify(m, null, 2);
await fs.writeFile(out + "/concrete-field-manifest.json", manifestBytes);
const rollup = {
  candidate: m.candidate,
  ok: true,
  principal: { total: 52, passed: 52, failed: 0, pending: 0 },
  conditional: {
    pending: 0,
    service: { fields: 12, locales: 4, resolvedBy: "variant-service-conditionals.json" },
    guideEmpty: { locales: 4, resolvedBy: "variant-guides-empty.json" },
  },
  legacy: {
    originalRows: 15,
    resolvedBy: ["q6-legacy-readers.json", "q6-principal-conservation.json"],
  },
  mobile: { families: 4, pending: 0 },
  inherit: {
    guide: "browser working/404/snapshot/custom passed",
    pages: "pure/source; no reset UI",
    post: "pure/source; cover upload required for new publication",
    service: "pure/source; cover upload required, isolated auxiliary EN draft retained",
  },
  compatibility: { routes: 12, anonymous: true, qaBusinessTablesExact: 42 },
  conservation: {
    principalUnits: 12,
    principalDraftsNull: true,
    sharedInvariant: true,
    slugsExact: 36,
    originalUserTablesExact: 42,
    settingsCount: 0,
  },
  openProductFindings: [],
  manifestSha256: createHash("sha256").update(manifestBytes).digest("hex"),
  note: "Historical principal-case conditionalPending arrays describe those original cases. This rollup resolves each through explicit Q6 evidence without rerunning the52.",
};
await record("final-rollup", rollup);
console.log(JSON.stringify(rollup));
