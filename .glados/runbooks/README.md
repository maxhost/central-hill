# Runbooks: index

Authoritative documents and commands that already exist. Nothing here is new procedure.

- **Database migrations:** create them with `pnpm db:generate` (new numbered file in
  `drizzle/`; never edit an applied one, ADR 0010). Run **`pnpm db:check` before
  `pnpm db:migrate`**: drizzle-kit silently skips out-of-order journal entries. Background:
  `docs/specs/migration-journal-ordering-fix.md`. Ledger repair: `scripts/fix-migration-ledger.ts`.
- **R2 media provisioning and troubleshooting:** `docs/specs/r2-runbook.md`,
  `docs/specs/r2-media-pipeline.md`. `scripts/probe-r2.ts` and `scripts/probe-admin-upload.ts`
  are diagnostics. `R2_PUBLIC_BASE_URL` must be set at build time (ADR 0024).
- **First staff user:** `scripts/create-admin.ts`.
- **Demo/real content seeds** (they write to the DB and R2 configured in `.env.local`):
  `scripts/seed-demo.ts`, `seed-blog.ts`, `seed-guides.ts`, `seed-services.ts`; backfills
  `scripts/backfill-*.ts`. The convention in their headers is
  `pnpm tsx --env-file=.env.local --tsconfig scripts/tsconfig.json scripts/<name>.ts`, with
  `DRY=1` for report-only where supported. Seeds are idempotent by slug and do not bust ISR,
  so save in the admin or wait for revalidation.
- **Environment:** `.env.example` lists every variable (Neon, R2, Better Auth, Avantio,
  email, LLM translate).
- **Deploy:** `netlify.toml` (`pnpm build`, `@netlify/plugin-nextjs`). `vercel.json` also exists;
  see the hosting ambiguity in `../architecture/system-overview.md`.
