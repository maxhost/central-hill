import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { out } from "./qa-common.mjs";
const groups = {
    q4a: ["home", "owners", "guest"],
    q4b: ["about", "real_estate", "buildings"],
    q4c: ["services", "guides", "blog"],
    q5a: ["sidebar-blog", "post"],
    q5b: ["service"],
    q5c: ["guide"],
  },
  rows = [];
for (const [group, keys] of Object.entries(groups))
  for (const key of keys)
    for (const locale of ["en", "es", "pt", "fr"]) {
      const name = (key === "sidebar-blog" ? "sidebar-blog-" : "final-" + key + "-") + locale;
      let row = { group, case: name, status: "pending" };
      try {
        const r = JSON.parse(await fs.readFile(out + "/results/" + name + ".json", "utf8"));
        row = {
          ...row,
          status: r.ok ? (r.stage === "draft-saved-only" ? "draft-pending" : "passed") : "failed",
          publicFields: r.fields?.filter((f) => f.public === true).length || 0,
          exclusions:
            r.fields
              ?.filter((f) => typeof f.public === "string")
              .map((f) => ({ path: f.path, reason: f.public })) || [],
          conditionalPending: r.conditionalPending || [],
          pageErrors: r.pageErrors?.length ?? 0,
          boundaries: r.boundaries ?? [],
          error: r.error,
        };
      } catch (e) {
        if (e.code !== "ENOENT") throw e;
      }
      rows.push(row);
    }
const result = {
  total: rows.length,
  passed: rows.filter((r) => r.status === "passed").length,
  failed: rows.filter((r) => r.status === "failed").length,
  draftPending: rows.filter((r) => r.status === "draft-pending").length,
  groups: Object.fromEntries(
    Object.keys(groups).map((group) => [group, rows.filter((r) => r.group === group)]),
  ),
};
assert.equal(result.total, 52);
await fs.writeFile(out + "/results/final-scoreboard.json", JSON.stringify(result, null, 2));
console.log(
  JSON.stringify({
    total: result.total,
    passed: result.passed,
    failed: result.failed,
    draftPending: result.draftPending,
    groups: Object.fromEntries(
      Object.entries(result.groups).map(([k, v]) => [
        k,
        { passed: v.filter((r) => r.status === "passed").length, total: v.length },
      ]),
    ),
  }),
);
