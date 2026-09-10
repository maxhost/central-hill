# Spec — Fix the drizzle migration journal ordering

> **Scope:** `drizzle/meta/_journal.json`, one maintenance script, one `package.json` script.
> **No migration `.sql` file is edited** (golden rule 4) and **no schema changes.**
> **Status:** ✅ IMPLEMENTED (2026-09-10)

---

## 1. The bug

`drizzle-kit migrate` silently applied nothing. It reported success and left the database
unchanged, which is how this was found while shipping `0012`.

The migrator (verified by reading
`node_modules/…/drizzle-orm/neon-http/migrator.js` and `drizzle-orm/migrator.js`, and confirmed
empirically) works like this:

```js
// read ONCE, before the loop
const lastDbMigration = await db.all(
  `select id, hash, created_at from drizzle.__drizzle_migrations order by created_at desc limit 1`
);
for (const migration of migrations) {            // journal array order, never re-sorted
  if (!lastDbMigration || Number(lastDbMigration.created_at) < migration.folderMillis) {
    for (const stmt of migration.sql) await db.execute(stmt);   // split on `--> statement-breakpoint`
    rowsToInsert.push(`insert … values(${migration.hash}, ${migration.folderMillis})`);
  }
}
```

Four consequences that matter here:

1. `folderMillis` is the journal entry's **`when`**. A migration is applied only if its `when`
   is **greater than the single highest `created_at` already in the ledger.**
2. The ledger is read **once**, so the comparison is against a fixed high-water mark, not
   against each migration individually.
3. On an **empty** ledger every entry is applied in array order regardless of `when`. Fresh
   databases were therefore never affected — only databases already past the high-water mark.
4. `hash` is written to the ledger but **never read** for the skip decision. It is not integrity
   protection in this version.

`0011_mature_praxagora` was journaled with `when` = **1782233885128**, which is *older* than
`0010_owners_single_plan_helper` (**1783009807329**). On this database the high-water mark was
already 1783009807329, so `0011` — and every entry after it, including `0012` — fell below the
mark and was skipped in silence.

## 2. Observed state before the fix

Ledger (`drizzle.__drizzle_migrations`), 12 rows for 13 journal entries:

| journal `when` | tag | in ledger |
|---|---|---|
| 1781395944961 → 1783009807329 | `0000` … `0010` | yes (ids 1–11) |
| **1782233885128** | **`0011_mature_praxagora`** | **no — out of order** |
| 1783010807329 | `0012_guest_page_db_wiring` | yes (id 12) |

`0012` is present because it was given a `when` above the high-water mark while shipping the
Guests page. That was a targeted workaround; this spec is the actual fix.

**The schema is not broken.** `0011`'s only statement adds `building.booking_enabled`, and that
column **already exists** in the database (verified via `information_schema.columns`) — it was
applied out of band, most likely by `drizzle-kit push`. So the ledger disagrees with reality for
exactly one migration, and no DDL is missing.

The snapshot chain (`meta/*_snapshot.json`, linked by `prevId`) was verified end to end and is
**intact**, including `0011` → `0012`. Nothing to repair there.

## 3. The fix

Three changes, all additive.

### 3.1 Make the journal strictly increasing

Rewrite **only** `0011`'s `when` to **1783010307329**, which sits between `0010`
(1783009807329) and `0012` (1783010807329). This is metadata, not a migration file.

Effect per environment:

| Environment | Before | After |
|---|---|---|
| This Neon database (high-water mark 1783010807329) | `0011` skipped forever | still skipped — and now correct, because §3.2 records it as applied and the column exists |
| A fresh database (empty ledger) | applied in array order | unchanged, applied in array order |
| A hypothetical database stopped at `0010` | `0011` skipped | `0011` applies, which is the desired behaviour |
| Any future `0013`+ (`when` > 1783010807329) | applied | applied |

### 3.2 Backfill the missing ledger row

Insert the `0011` bookkeeping row on this database with its real file hash and the new `when`,
so drizzle's ledger matches the schema that is actually deployed.

Because 1783010307329 is **below** the existing high-water mark (1783010807329, from `0012`),
this insert cannot change any future skip decision. It is bookkeeping only.

Delivered as a guarded, re-runnable maintenance script — the repo's established pattern for
out-of-band database work (`scripts/create-admin.ts`, `scripts/seed-demo.ts`), not as a
migration, since a migration that writes the migration ledger would be self-referential.

```
npx tsx --tsconfig scripts/tsconfig.json scripts/fix-migration-ledger.ts [--apply]
```

Dry by default: it prints the diagnosis and writes nothing unless `--apply` is passed. It
refuses to run if the column `0011` adds is missing, because then the row would be a lie and the
migration should genuinely be applied instead.

### 3.3 Add a guard so this cannot regress silently

`scripts/check-migration-order.ts`, wired as **`pnpm db:check`**, fails with a non-zero exit on:

1. a journal `when` that is not strictly greater than its predecessor;
2. a journal entry whose `.sql` file is missing, or a `.sql` file with no journal entry;
3. a broken `meta/*_snapshot.json` `prevId` chain, or a missing snapshot;
4. a migration file containing more than one statement but **no `--> statement-breakpoint`** —
   reported as a **warning**, not an error.

On (4): this was initially suspected as a second failure mode, and it is not one. `0008` is a
`DO` block plus three `UPDATE`s with no breakpoints, and all four statements applied (the owners
and real-estate rows carry their `faq_group_key`) — `drizzle-kit migrate` connects over a
websocket Pool, which accepts multi-statement query strings. It stays as a warning because
`drizzle-kit generate` always emits the marker and a switch to the neon-http single-query driver
would silently drop every statement after the first. **The timestamp was the whole bug.**

Run it before every `pnpm db:migrate`.

## 4. What is deliberately not done

- **No migration `.sql` is edited.** Golden rule 4 is forward-only, and the hash column means an
  edit would go unnoticed anyway.
- **`0011_mature_praxagora.sql` is not made idempotent.** `ADD COLUMN` without `IF NOT EXISTS`
  is the file drizzle generated; rewriting it is exactly the edit the rule forbids. §3.2 removes
  the need by making the ledger honest.
- **The ledger is not renumbered or rewritten.** Only the one missing row is added.

## 5. Verification performed

- `pnpm db:check` passes (exit 0): journal strictly increasing, 13 entries ↔ 13 files, snapshot
  chain intact. One warning remains, for `0008`'s missing breakpoint — see above.
- `pnpm db:migrate` is a clean no-op (everything already applied).
- Ledger holds exactly 13 rows, one per journal entry, every hash and `created_at` matching the
  file on disk — verified by diffing the two sets, including a check for extra rows.
- `scripts/fix-migration-ledger.ts` re-run reports "already recorded" (idempotent), and refuses
  to write when the guard column is absent or when the row would raise the high-water mark.
- `pnpm typecheck`, `pnpm lint`, the 13 `pages` slice tests and a full production build are green.

## 6. Note for the next schema migration

Prefer `drizzle-kit generate`, which stamps `when` with `Date.now()` and keeps the sequence
monotonic on its own. When hand-writing a migration (as `0004`–`0010` and `0012` are), copy the
previous entry's `when` and add a small increment — the repo's convention is `+1_000_000` — and
run `pnpm db:check` before applying.
