import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { root } from "./common.mjs";
const directory = root + "/matrix";
const inventory = await fs.readFile(
  new URL(
    "../../../docs/specs/guests-welcome-media-inventory.md",
    import.meta.url,
  ),
  "utf8",
);
const declarations = [...inventory.matchAll(/^\| (P\d\d) \| ([^|]+) \|/gm)].map(
  (m) => ({ id: m[1], field: m[2].split(";")[0].trim() }),
);
assert.equal(declarations.length, 33);
const files = (await fs.readdir(directory)).filter((n) => n.endsWith(".json"));
let cases = [];
const snapshots = {};
const creations = [];
for (const file of files) {
  const data = JSON.parse(
    await fs.readFile(path.join(directory, file), "utf8"),
  );
  if (file.endsWith("-initial.json"))
    snapshots[file.replace("-initial.json", "")] =
      data.draft?.content ?? data.published?.content;
  if (
    data.field &&
    data.asset &&
    data.previewDesktop &&
    data.previewMobile &&
    data.publicEvidence?.length === 2
  ) {
    creations.push({ ...data, receipt: file });
    cases.push({
      page: data.key,
      path: data.field,
      ratio: "3-2",
      filename: path.basename(data.asset.r2_key, ".png"),
      persisted: data.asset,
      public: data.publicEvidence.map((x, i) => ({
        viewport: { width: x.viewport ?? [1440, 390][i] },
        measurements: [x],
      })),
      localPreview: [data.previewDesktop],
      savedPreview: [],
      evidence: [1440, 390].map(
        (width) => `${data.key}-${data.group}-created-public-${width}.png`,
      ),
      creation: true,
      receipt: file,
    });
  }
  if (!Array.isArray(data.checks) || typeof data.page !== "string") continue;
  for (const check of data.checks) {
    if (
      !check.path ||
      !check.ratio ||
      !check.persisted ||
      !check.localPreview?.length ||
      !check.savedPreview?.length ||
      !check.public?.some((p) => p.viewport.width === 1440) ||
      !check.public?.some((p) => p.viewport.width === 390)
    )
      continue;
    if (
      data.failures?.some(
        (f) => f.field === check.path && f.ratio === check.ratio,
      )
    )
      continue;
    const evidence = [];
    let valid = true;
    for (const visit of check.public)
      for (let i = 0; i < visit.measurements.length; i++) {
        const screenshot =
          "public-" +
          check.filename +
          "-" +
          visit.viewport.width +
          "-" +
          i +
          ".png";
        try {
          assert.ok(
            (await fs.stat(path.join(directory, screenshot))).size > 100,
          );
          evidence.push(screenshot);
        } catch {
          valid = false;
        }
      }
    if (valid)
      cases.push({ ...check, page: data.page, receipt: file, evidence });
  }
}
cases = [
  ...new Map(cases.map((c) => [`${c.page}:${c.path}:${c.ratio}`, c])).values(),
];
const recommended = {
  P01: "16-9",
  P02: "4-5",
  P03: "4-3",
  P04: "4-3",
  P05: "16-9",
  P06: "4-5",
  P07: "3-4",
  P08: "4-5",
  P09: "4-5",
  P10: "16-9",
  P11: "4-5",
  P12: "3-2",
  P13: "3-2",
  P14: "3-2",
  P15: "2-3",
  P16: "16-9",
  P17: "4-5",
  P18: "4-3",
  P19: "4-5",
  P20: "3-2",
  P21: "4-5",
  P22: "4-3",
  P23: "16-9",
  P24: "3-2",
  P25: "16-9",
  P26: "16-9",
  P27: "16-10",
  P28: "16-9",
  P29: "4-5",
  P30: "16-9",
  P31: "16-9",
  P32: "4-5",
  P33: "4-5",
};
function logical(key, field) {
  return key + "." + field.replace(/\.\d+(?=\.)/g, "[]");
}
function expand(pattern, content, prefix = "") {
  const [part, ...tail] = pattern.split(".");
  if (part.endsWith("[]")) {
    const k = part.slice(0, -2);
    const items = content?.[k];
    return (Array.isArray(items) ? items : []).flatMap((item, i) =>
      expand(tail.join("."), item, prefix + k + "." + i + "."),
    );
  }
  if (!tail.length) return [prefix + part];
  return expand(tail.join("."), content?.[part], prefix + part + ".");
}
const rows = [];
for (const declaration of declarations) {
  const [key, ...parts] = declaration.field.split(".");
  const field = parts.join(".");
  const matching = cases.filter(
    (c) => logical(c.page, c.path) === declaration.field,
  );
  const expected = expand(field, snapshots[key] || {});
  const instances = expected.map((concrete) => {
    const found = matching.filter((c) => c.path === concrete);
    const unique = [...new Set(found.map((c) => c.ratio))];
    const missing = [
      ...new Set(["3-2", "2-3", "1-1", recommended[declaration.id]]),
    ].filter((r) => !unique.includes(r));
    const evidence = found.map((c) => ({
      ratio: c.ratio,
      fixture: c.filename,
      mediaId: c.persisted.id,
      metadata: { width: c.persisted.width, height: c.persisted.height },
      receipt: c.receipt,
      screenshots: c.evidence || [],
      creation: !!c.creation,
      measurements: c.public,
    }));
    return {
      path: concrete,
      ratios: unique,
      missing,
      approved:
        missing.length === 0 && found.some((c) => c.savedPreview?.length),
      evidence,
    };
  });
  const tablet = files.find((f) => f === key + "-tablet-results.json");
  const poster = files.find((f) => f === key + "-poster-visible-results.json");
  const creationEvidence = creations
    .filter((c) => logical(c.key, c.field) === declaration.field)
    .map((c) => c.receipt);
  const tabletData = tablet
    ? JSON.parse(await fs.readFile(path.join(directory, tablet), "utf8"))
    : null;
  const tabletComplete =
    !field.includes("[]") ||
    (tabletData &&
      expected.every((p) => tabletData.results.some((m) => m.path === p)));
  const creationComplete =
    !["P15", "P18", "P20", "P22"].includes(declaration.id) ||
    creationEvidence.length > 0;
  const isPoster = field.includes("poster");
  const posterComplete =
    !isPoster ||
    !!poster ||
    matching.every((c) =>
      c.public.every((v) =>
        v.measurements.every(
          (m) =>
            m.tag === "IMG" ||
            (m.videoState &&
              m.videoState.readyState === 0 &&
              m.videoState.videoWidth === 0),
        ),
      ),
    );
  rows.push({
    ...declaration,
    ...(declaration.id === "P29"
      ? { responsiveContractEvidence: "calculator-contract-results.json" }
      : {}),
    ...(declaration.id === "P24"
      ? { independentReceipt: root + "/welcome-qa/final-receipt.json" }
      : {}),
    status:
      declaration.id === "P24"
        ? "independent-QA"
        : instances.length &&
            instances.every((x) => x.approved) &&
            tabletComplete &&
            creationComplete &&
            posterComplete
          ? "approved"
          : "pending",
    instances,
    creationEvidence,
    ...(field.includes("[]")
      ? { tabletEvidence: tablet || null, tabletComplete, creationComplete }
      : {}),
    ...(isPoster
      ? { posterVisibilityEvidence: poster || null, posterComplete }
      : {}),
  });
}
const stable = new Map(),
  stabilityFailures = [];
for (const c of cases) {
  if (c.page === "about" && /^(story|community|certifications)\./.test(c.path))
    continue;
  for (const visit of c.public)
    for (let i = 0; i < visit.measurements.length; i++) {
      const m = visit.measurements[i];
      const w = m.w ?? m.width,
        h = m.h ?? m.height;
      if (!(w > 0 && h > 0)) continue;
      const id = c.page + "." + c.path + "@" + visit.viewport.width + "#" + i;
      const previous = stable.get(id);
      if (
        previous &&
        (Math.abs(w - previous.w) > 1 || Math.abs(h - previous.h) > 1)
      )
        stabilityFailures.push({
          id,
          previous: { w: previous.w, h: previous.h, ratio: previous.ratio },
          actual: { w, h, ratio: c.ratio },
        });
      else stable.set(id, { w, h, ratio: c.ratio });
    }
}
const result = {
  generatedAt: new Date().toISOString(),
  artifactRoot: directory,
  inventoryFile: "docs/specs/guests-welcome-media-inventory.md",
  activePageFieldTypes: 33,
  approved: rows.filter((r) => r.status === "approved").length,
  pending: rows.filter((r) => r.status === "pending").map((r) => r.id),
  independentQA: ["P24"],
  creditedCases: cases.length,
  stabilityFailures,
  rows,
};
await fs.writeFile(
  directory + "/pages-manifest.json",
  JSON.stringify(result, null, 2),
);
console.log(
  JSON.stringify({
    approved: result.approved,
    pending: result.pending,
    creditedCases: result.creditedCases,
    stabilityFailures: stabilityFailures.length,
  }),
);
