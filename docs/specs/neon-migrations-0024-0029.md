# Neon migration execution: 0024–0029

Executed on 2026-11-08 America/Guayaquil (2026-11-09 UTC), from local main
`937b40c`. The user explicitly requested reviewing Neon through MCP and applying
the local migrations to Neon. This task authorizes that remote schema update.

## Target and preflight

- Project: `central-hill`, `weathered-cake-89640915`.
- Branch: `main`, `br-little-heart-aihh9v63`, the project's sole/default branch.
- Database/role verified through SQL: `neondb` / `neondb_owner`.
- Existing Drizzle ledger: 24 entries, `0000` through `0023`, each SHA-256 hash and
  journal timestamp exactly matching the local files.
- All nine target tables and `company_settings.owners_phone` were absent.
- Captured row counts and deterministic aggregate fingerprints for all 33 existing
  public business tables. Excluded auth tables `account`, `session`, `verification`,
  `user`, and `staff_role`; compared Settings with `owners_phone` excluded so its
  additive default would not obscure changes to pre-existing fields.
- Filesystem-only `pnpm db:check`: exit 0, 30 consistent migrations. Historical
  `0008` statement-breakpoint warning remains. This command ran with installed
  Node24.20.0 and pnpm10.8.0, producing the existing Node22 engine warning.

## Applied transaction

Used Neon MCP `run_sql_transaction`, explicitly targeting the verified project,
branch and database. Applied these original local files without edits:

| Migration | Added objects |
| --- | --- |
| 0024 | `blog_post_locale_content` |
| 0025 | `building_locale_content`, `apartment_locale_content` |
| 0026 | `building_shared_content`, `apartment_shared_content` |
| 0027 | `service_locale_content`, `service_shared_content` |
| 0028 | `guide_locale_content`, `guide_shared_content` |
| 0029 | `company_settings.owners_phone`, nullable text, default `+351 910 438 062` |

SQL was split at the files' existing `--> statement-breakpoint` markers. Each file
was followed by its Drizzle ledger INSERT using its full original SHA-256 hash and
the exact local journal `when`. All six migrations and six ledger inserts committed
as one transaction; the MCP response reported success.

Transaction guards: 5-second lock timeout, 60-second statement timeout, migration
ledger lock, transaction-scoped advisory lock, database identity assertion and an
exact check that the existing ledger still matched the 24 verified entries.
No historical ledger entry was changed.

## Postflight

- Ledger: exactly 30 entries, `0000` through `0029`; every hash and timestamp
  matches the local journal and unchanged SQL files.
- Nine new tables present and empty, with 83 columns total; their 41 primary-key,
  foreign-key, uniqueness and CHECK constraints are present and validated.
- `owners_phone`: nullable text with the expected default; existing Settings row
  reads `+351 910 438 062`.
- All 33 business table row counts and fingerprints exactly match preflight,
  excluding only the newly added Settings attribute as described above.
- No content or fixtures copied from local QA databases. No source SQL edits,
  application changes, deployment, runtime restart, cache intervention or local
  database/environment changes. Verification covers this migration range and
  ledger alignment; no application browser QA or full-schema comparison claimed.

Evidence (metadata, hashes and SQL; no connection credentials or content export):

- `/private/tmp/central-hill-neon-migrations-0024-0029/preflight-and-plan.json`
- `/private/tmp/central-hill-neon-migrations-0024-0029/result.json`

Follow-up: the user requested pushing GitHub again to trigger Vercel after the
Neon schema update. The release commit captures this execution record and its
AGENTS.md entry; application source and migration SQL remain unchanged.
