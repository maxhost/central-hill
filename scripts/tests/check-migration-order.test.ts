import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const checker = fileURLToPath(
  new URL("../check-migration-order.ts", import.meta.url),
);
const historicalTag = "0008_faq_groups_and_page_faq_key";
const historicalSql = readFileSync(
  new URL(`../../drizzle/${historicalTag}.sql`, import.meta.url),
  "utf8",
);
const tags = ["0000_fixture", historicalTag, "0009_fixture"];

function fixture(run: (root: string) => void) {
  const root = mkdtempSync(
    path.join(os.tmpdir(), "central-hill-migration-check-"),
  );
  try {
    mkdirSync(path.join(root, "drizzle/meta"), { recursive: true });
    writeFileSync(
      path.join(root, "drizzle/meta/_journal.json"),
      JSON.stringify({
        entries: tags.map((tag, idx) => ({
          idx,
          tag,
          version: "7",
          when: idx + 1,
          breakpoints: true,
        })),
      }),
    );
    tags.forEach((tag, idx) => {
      writeFileSync(
        path.join(root, `drizzle/${tag}.sql`),
        tag === historicalTag ? historicalSql : "SELECT 1;\n",
      );
      writeFileSync(
        path.join(root, `drizzle/meta/${tag.split("_")[0]}_snapshot.json`),
        JSON.stringify({
          id: `snapshot-${idx}`,
          prevId: idx ? `snapshot-${idx - 1}` : "0",
        }),
      );
    });
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function check(root: string) {
  const result = spawnSync(
    process.execPath,
    ["--import", import.meta.resolve("tsx"), checker],
    {
      cwd: root,
      encoding: "utf8",
    },
  );
  assert.ifError(result.error);
  return { status: result.status, output: result.stdout + result.stderr };
}

const writeSql = (root: string, sql: string) =>
  writeFileSync(path.join(root, "drizzle/0009_fixture.sql"), sql);

test("M01a: exact historical SQL is accepted with a visible, non-actionable exception", () =>
  fixture((root) => {
    const result = check(root);
    assert.equal(result.status, 0, result.output);
    assert.match(
      result.output,
      /reviewed historical breakpoint exception \(SHA256 73dc6c8dd704099ed5a81d15cb568a2f82950c150e514aee394c7d22d5bb2538\)/,
    );
    assert.match(
      result.output,
      /future driver change requires separate review/,
    );
    assert.doesNotMatch(result.output, /warning\(s\)|  ! |add the marker/);
  }));

test("M01b: changed historical hash fails even if a breakpoint was added", () =>
  fixture((root) => {
    writeFileSync(
      path.join(root, `drizzle/${historicalTag}.sql`),
      historicalSql + "\n--> statement-breakpoint\n",
    );
    const result = check(root);
    assert.equal(result.status, 1, result.output);
    assert.match(result.output, /historical exception hash drift/);
    assert.doesNotMatch(
      result.output,
      /reviewed historical breakpoint exception/,
    );
  }));

test("M01c: another multi-statement SQL still warns", () =>
  fixture((root) => {
    writeSql(root, "SELECT 1; SELECT 2;\n");
    const result = check(root);
    assert.equal(result.status, 0, result.output);
    assert.match(result.output, /0009_fixture.sql looks like 2 statements/);
    assert.match(result.output, /1 warning\(s\)/);
  }));

test("M01d: separators, comments, quoted literals and dollar bodies retain their analysis", () =>
  fixture((root) => {
    for (const sql of [
      "SELECT 1;\n--> statement-breakpoint\nSELECT 2;\n",
      "-- comment with ; ;\nSELECT 'literal; and escaped ''quote;';\n",
      "DO $$ BEGIN PERFORM 1; PERFORM 2; END $$;\n",
      "DO $block$ BEGIN PERFORM 'x;y'; PERFORM 2; END $block$;\n",
    ]) {
      writeSql(root, sql);
      const result = check(root);
      assert.equal(result.status, 0, result.output);
      assert.doesNotMatch(result.output, /warning\(s\)|  ! /);
    }
    writeSql(root, "DO $block$ BEGIN PERFORM 1; END $block$; SELECT 'x;y';\n");
    const result = check(root);
    assert.equal(result.status, 0, result.output);
    assert.match(result.output, /0009_fixture.sql looks like 2 statements/);
  }));

test("M01e: out-of-order journal remains rejected", () =>
  fixture((root) => {
    const p = path.join(root, "drizzle/meta/_journal.json");
    const journal = JSON.parse(readFileSync(p, "utf8"));
    journal.entries[2].when = 1;
    writeFileSync(p, JSON.stringify(journal));
    const result = check(root);
    assert.equal(result.status, 1, result.output);
    assert.match(result.output, /not greater than/);
  }));

test("M01f: missing SQL remains rejected", () =>
  fixture((root) => {
    rmSync(path.join(root, "drizzle/0009_fixture.sql"));
    const result = check(root);
    assert.equal(result.status, 1, result.output);
    assert.match(result.output, /0009_fixture.sql/);
    assert.match(result.output, /ENOENT|has no drizzle/);
  }));

test("M01g: broken snapshot chain remains rejected", () =>
  fixture((root) => {
    writeFileSync(
      path.join(root, "drizzle/meta/0009_snapshot.json"),
      JSON.stringify({ id: "snapshot-2", prevId: "wrong" }),
    );
    const result = check(root);
    assert.equal(result.status, 1, result.output);
    assert.match(result.output, /has prevId=wrong, expected snapshot-1/);
  }));
