/**
 * One-off ledger repair (NOT a migration; idempotent, dry by default).
 *
 * `0011_mature_praxagora` was journaled with a `when` older than `0010`, so `drizzle-kit
 * migrate` skipped it in silence on this database (it compares against the single highest
 * `created_at` already recorded). Its one statement — `building.booking_enabled` — was applied
 * out of band, most likely by `drizzle-kit push`, so the schema is correct while
 * `drizzle.__drizzle_migrations` is missing the corresponding row.
 *
 * `docs/specs/migration-journal-ordering-fix.md` fixes the journal ordering; this script makes
 * the ledger agree with the schema that is actually deployed, so `0011` is never re-attempted
 * here. The inserted `created_at` is below the existing high-water mark, so it cannot change
 * any future skip decision — this is bookkeeping only.
 *
 * Refuses to write if the column is absent: then the ledger row would be a lie and the
 * migration genuinely needs to run instead.
 *
 * Run:
 *   npx tsx --tsconfig scripts/tsconfig.json scripts/fix-migration-ledger.ts          # diagnose
 *   npx tsx --tsconfig scripts/tsconfig.json scripts/fix-migration-ledger.ts --apply  # write
 */
import "dotenv/config";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

/** The journal entry this script reconciles, and the column its SQL adds. */
const TAG = "0011_mature_praxagora";
const GUARD = { table: "building", column: "booking_enabled" } as const;

interface JournalEntry {
  when: number;
  tag: string;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const sql = neon(process.env.DATABASE_URL!);

  const journal = JSON.parse(
    readFileSync(path.resolve(process.cwd(), "drizzle/meta/_journal.json"), "utf8"),
  ) as { entries: JournalEntry[] };
  const entry = journal.entries.find((e) => e.tag === TAG);
  if (!entry) throw new Error(`journal has no entry for ${TAG}`);

  const fileSql = readFileSync(path.resolve(process.cwd(), `drizzle/${TAG}.sql`));
  const hash = createHash("sha256").update(fileSql).digest("hex");

  const existing = await sql`
    SELECT id, created_at::text AS created_at FROM drizzle.__drizzle_migrations WHERE hash = ${hash}
  `;
  if (existing.length > 0) {
    console.log(`✓ ${TAG} is already recorded (id=${(existing[0] as { id: number }).id}). Nothing to do.`);
    return;
  }

  const column = await sql`
    SELECT 1 FROM information_schema.columns
    WHERE table_name = ${GUARD.table} AND column_name = ${GUARD.column}
  `;
  if (column.length === 0) {
    console.error(
      `✗ ${GUARD.table}.${GUARD.column} does not exist, so ${TAG} was never applied here.\n` +
        `  Do NOT backfill the ledger — run \`pnpm db:migrate\` so the migration actually runs.`,
    );
    process.exit(1);
  }

  const [high] = await sql`SELECT max(created_at)::text AS m FROM drizzle.__drizzle_migrations`;
  const highWater = Number((high as { m: string | null }).m ?? 0);

  console.log(`${TAG}`);
  console.log(`  hash            ${hash}`);
  console.log(`  created_at      ${entry.when}   (journal \`when\`)`);
  console.log(`  high-water mark ${highWater}`);
  console.log(`  ${GUARD.table}.${GUARD.column} present, ledger row missing → safe to backfill`);
  if (entry.when >= highWater) {
    console.error(
      `✗ refusing: created_at ${entry.when} is not below the high-water mark ${highWater}.\n` +
        `  Inserting it would raise the mark and could make drizzle skip a pending migration.`,
    );
    process.exit(1);
  }

  if (!apply) {
    console.log(`\n(dry run — re-run with --apply to insert the row)`);
    return;
  }

  await sql`
    INSERT INTO drizzle.__drizzle_migrations ("hash", "created_at") VALUES (${hash}, ${entry.when})
  `;
  console.log(`\n✓ inserted. Ledger now matches the deployed schema.`);
}

main();
