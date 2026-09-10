/**
 * Migration bookkeeping guard (`pnpm db:check`) — run this BEFORE `pnpm db:migrate`.
 *
 * `drizzle-kit migrate` reads the ledger's highest `created_at` **once**, then applies every
 * journal entry whose `when` is greater than that mark, in array order. So a journal entry with
 * a `when` lower than its predecessor is skipped **in silence** — the command still prints
 * "migrations applied successfully" while changing nothing. That is exactly what happened with
 * `0011_mature_praxagora` (see docs/specs/migration-journal-ordering-fix.md).
 *
 * Reads only the filesystem — no database connection, no env vars — so it is safe in CI.
 * Exits non-zero on the first category that fails.
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const DRIZZLE_DIR = path.resolve(process.cwd(), "drizzle");
const META_DIR = path.join(DRIZZLE_DIR, "meta");

interface JournalEntry {
  idx: number;
  version: string;
  when: number;
  tag: string;
  breakpoints: boolean;
}

const problems: string[] = [];
const warnings: string[] = [];
const fail = (msg: string) => problems.push(msg);
const warn = (msg: string) => warnings.push(msg);

const journal = JSON.parse(readFileSync(path.join(META_DIR, "_journal.json"), "utf8")) as {
  entries: JournalEntry[];
};

// ── 1. `when` must be strictly increasing in array order ────────────────────────
let previous: JournalEntry | null = null;
for (const entry of journal.entries) {
  if (previous && entry.when <= previous.when) {
    fail(
      `journal: "${entry.tag}" has when=${entry.when}, which is not greater than ` +
        `"${previous.tag}" (when=${previous.when}). drizzle-kit would skip it silently.`,
    );
  }
  previous = entry;
}

// ── 2. journal entries and .sql files must correspond one-to-one ────────────────
const sqlFiles = readdirSync(DRIZZLE_DIR)
  .filter((f) => f.endsWith(".sql"))
  .map((f) => f.replace(/\.sql$/, ""));
const tags = new Set(journal.entries.map((e) => e.tag));

for (const entry of journal.entries) {
  if (!sqlFiles.includes(entry.tag)) fail(`journal: "${entry.tag}" has no drizzle/${entry.tag}.sql`);
}
for (const file of sqlFiles) {
  if (!tags.has(file)) fail(`drizzle/${file}.sql has no journal entry — it will never be applied.`);
}

// ── 3. snapshot chain (`prevId`) must be unbroken ───────────────────────────────
let previousSnapshotId: string | null = null;
for (const entry of journal.entries) {
  const prefix = entry.tag.split("_")[0]!;
  const snapshotPath = path.join(META_DIR, `${prefix}_snapshot.json`);
  let snapshot: { id: string; prevId?: string };
  try {
    snapshot = JSON.parse(readFileSync(snapshotPath, "utf8")) as { id: string; prevId?: string };
  } catch {
    fail(`snapshot: meta/${prefix}_snapshot.json is missing or unreadable.`);
    continue;
  }
  if (previousSnapshotId && snapshot.prevId !== previousSnapshotId) {
    fail(
      `snapshot: meta/${prefix}_snapshot.json has prevId=${snapshot.prevId}, ` +
        `expected ${previousSnapshotId}. \`drizzle-kit generate\` would diff against the wrong base.`,
    );
  }
  previousSnapshotId = snapshot.id;
}

// ── 4. multi-statement files SHOULD carry `--> statement-breakpoint` (warning) ──
// `readMigrationFiles` splits a file on that marker only; without it the whole file is handed
// to the driver as a single query string. That currently works — `drizzle-kit migrate` connects
// over a websocket Pool, and `0008_faq_groups_and_page_faq_key.sql` (a DO block plus three
// UPDATEs, no breakpoints) demonstrably applied all four statements. It is a warning, not an
// error, because it depends on driver behaviour: `drizzle-kit generate` always emits the
// marker, and a switch to the neon-http single-query driver would silently drop every
// statement after the first.
for (const entry of journal.entries) {
  const sql = readFileSync(path.join(DRIZZLE_DIR, `${entry.tag}.sql`), "utf8");
  if (sql.includes("--> statement-breakpoint")) continue;

  // Strip line comments, dollar-quoted bodies ($tag$…$tag$) and single-quoted literals before
  // counting `;`, so prose, JSON payloads and PL/pgSQL blocks don't produce false positives.
  const stripped = sql
    .replace(/^\s*--.*$/gm, "")
    .replace(/\$([A-Za-z_]*)\$[\s\S]*?\$\1\$/g, "''")
    .replace(/'(?:[^']|'')*'/g, "''");
  const statements = stripped.split(";").filter((s) => s.trim().length > 0);
  if (statements.length > 1) {
    warn(
      `drizzle/${entry.tag}.sql looks like ${statements.length} statements but has no ` +
        `\`--> statement-breakpoint\`. It works with the current driver; add the marker to ` +
        `match what \`drizzle-kit generate\` emits.`,
    );
  }
}

// ── report ──────────────────────────────────────────────────────────────────────
for (const w of warnings) console.warn(`  ! ${w}`);

if (problems.length > 0) {
  console.error(`✗ ${problems.length} migration bookkeeping problem(s):\n`);
  for (const p of problems) console.error(`  • ${p}`);
  console.error(`\nSee docs/specs/migration-journal-ordering-fix.md`);
  process.exit(1);
}

const last = journal.entries.at(-1)!;
console.log(
  `✓ ${journal.entries.length} migrations: journal strictly increasing, files and snapshots ` +
    `consistent.${warnings.length > 0 ? ` ${warnings.length} warning(s) above.` : ""}`,
);
console.log(`  next migration needs when > ${last.when} (last: ${last.tag})`);
console.log(
  `  hashes: ${journal.entries
    .map((e) => createHash("sha256").update(readFileSync(path.join(DRIZZLE_DIR, `${e.tag}.sql`))).digest("hex").slice(0, 8))
    .join(" ")}`,
);
