# Existing harness assessment (2026-10-06)

This project was built with Claude Code agents and carries its own engineering harness. None
of it was removed or changed during GLaDOS onboarding. Classification only.

## KEEP: project-specific knowledge and tools

**Rules and knowledge**
- `CLAUDE.md`: operating manual. The 7 golden rules (slice ownership, contracts only,
  kernel via ADR, additive migrations, never revert others' code, escalate decisions,
  done = verified), the stack and the Definition of Done. Still the primary agent brief.
- `docs/decisions/README.md`: ADRs 0001–0034, all inline in this one file. Source of truth
  for cross-cutting decisions. `docs/parqueado.md` holds **parked, unaccepted** proposals
  (e.g. a dark `SectionHead` variant for the `StatBand` title).
- `docs/data-model.md`: the DB source of truth (entities, ownership, [T] fields, JSON shapes).
- `docs/vertical-slices.md`: the slice catalogue and dependency graph. `src/slices/*/README.md`
  and `contract.ts` document each slice's tables, contract, tags and test command.
- `docs/conventions.md`: the golden path (rendering, DB, server actions, i18n, naming,
  styling, testing, security, git).
- `docs/architecture.md`: system intent. Partly stale; see `system-overview.md` ambiguities.
- `docs/seo-i18n.md`, `docs/design-system.md`, `docs/content-briefs.md` (client requirements),
  `docs/mock-agent-contract.md` (rules for building `mock/*.html`), `mock/` (approved visual
  baselines).
- Runbooks/specs: `docs/specs/r2-runbook.md`, `docs/specs/r2-media-pipeline.md`,
  `docs/specs/migration-journal-ordering-fix.md`, `docs/specs/avantio-search-widget*.md`,
  `docs/specs/guest-page-db-wiring.md`, `docs/specs/home-component-library/`.

**Commands and scripts**
- `pnpm typecheck`, `pnpm lint`, `pnpm build`, and per-slice
  `npx tsx --test src/slices/<slice>/tests/*.test.ts`.
- `pnpm db:check` (journal-ordering guard, filesystem only, run before `db:migrate`),
  `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:studio`.
- `scripts/seed-*.ts`, `scripts/backfill-*.ts`, `scripts/create-admin.ts`,
  `scripts/fix-migration-ledger.ts`, `scripts/probe-*.ts`: manual operational tools. They
  write to the configured DB/R2.
- `.env.example` documents the required environment.

## POTENTIALLY DUPLICATED BY GLADOS (identified only, not removed)

- `docs/multi-agent-workflow.md`: orchestrator/agent roles, task lifecycle,
  contract-change-request escalation, wave scheduling, "adversarial review before merge",
  orchestrator-allocated migration numbers. The *rules* (CCR, anti-revert, DoD) are project
  knowledge; the *orchestration loop* overlaps GLaDOS.
- `docs/component-extraction-workflow.md`: the "coordinator mode" process:
  - background agents in isolated worktrees that never commit;
  - a 2–4 concurrency ceiling;
  - a standardised per-task agent prompt;
  - the coordinator collecting diffs (`git diff` / `git apply`), re-verifying, reviewing and
    committing one commit per section after the owner's OK.

  This is generic worktree/agent/acceptance orchestration. Its page→component mapping
  method, the `.mk` CSS pitfalls and the mock-diff technique are project knowledge.
- `.worktreeinclude` (copies `.env*` into Claude Code worktrees) and `.claude/settings.json`
  (`worktree.baseRef: head`, gitignored, machine-local), plus the eslint ignore of
  `.claude/worktrees/**` in `eslint.config.mjs`. These are agent-worktree plumbing.
- `docs/specs/handoff-*.md`: session-to-session handoff notes. GLaDOS task records may
  replace this context-transfer role. The notes themselves remain historical knowledge.
- CLAUDE.md DoD item "Passed adversarial review (boundaries + correctness)". This is a
  review gate GLaDOS's review/verification may own.

## UNCERTAIN

- `pnpm test` and `pnpm boundary:check` are `echo … && exit 0` placeholders. They could be
  intended future gates or abandoned. Not used by GLaDOS.
- `vercel.json` vs `netlify.toml`: which deploy path is live is unknown.
- Other machine-local Claude Code files under `.claude/` (gitignored): not part of the
  repository, so their role cannot be determined from it.
- `docs/mock-audit.md`: a historical audit (2026-06-08). Its current relevance is unclear.

## Quality baseline (run on `main` @ `ea0863d`, 2026-10-06, clean tree, **Node 24.20.0**)

| Command | Result | Notes |
|---|---|---|
| `pnpm typecheck` | **PASS** (3s) | |
| `pnpm lint` | **PASS** (8s) | 0 errors, 5 warnings (`mock/assets/site.js`, `postcss.config.mjs`, `src/core/i18n/schema.ts`) |
| `npx tsx --test 'src/slices/*/tests/*.test.ts'` | **FAIL** (6s) | 209/225 pass, 16 fail in apartments, buildings, faq, pages and settings admin/save-schema tests. **Pre-existing**: the same 16 fail at `3f3c5c5`. Cause sampled: fixtures miss fields the schemas now require (e.g. buildings `booking_enabled`). |
| `pnpm build` | **PASS** (25s) | Needs `.env.local` + Neon network access (generateStaticParams reads the DB) |
| `pnpm db:check` (not in profile) | PASS | 1 warning: `0008` lacks statement-breakpoint markers |
| `git diff --check` | PASS | |

**Environment mismatch:** the repo requires Node 22.x (`package.json` engines, `netlify.toml`),
but the baseline terminal ran Node 24.20.0, and no Node 22 was installed to re-run it. This is an
environment mismatch, not an application failure. typecheck, lint and build passed anyway. The 16
unit failures were sampled to a fixture/schema mismatch (Zod validation), which is not
Node-version-related, but they have not been re-run on Node 22.

`pnpm test` is **not** a test suite (`echo "(no test runner wired yet)" && exit 0`), so it is not
in the profile. The `unit` check uses the per-slice `tsx --test` command the slice READMEs
document.
