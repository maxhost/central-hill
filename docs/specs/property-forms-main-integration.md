# Property forms — main local and single application localhost

2026-11-06. User explicitly requests applying0026, stopping this environment's
old localhost applications and starting one from local main to try the forms.
This supersedes keeping Properties outside main and preserving old app listeners.
No push/deployment/remote DB write is authorized or performed.

## Prepared candidate

Main base0e72983. Worktree/private/tmp/central-hill-property-forms-main-integration,
branchproperty-forms/main-integration. Selected Property delta from source d896720,
initial commitf558d1f; SQL corrections99c2d80/fed9fb8 (source72f0957/ede4284).
Executable **fed9fb8** exactly matches source2bb313d for src/messages/scripts/drizzle/
package/lock. Blog source and packages unchanged. Kept main's Blog integration
report and AGENTS history; did not copy unrelated Services plan/docs or remove
anything from main. Independent functional QA approvedfed9fb8 before main fast-forward.

## Local schema, environment and process boundary

Migration0026 applied transactionally only in verified DB/rolepropertylocalesqa
via4558. SQL hash0f3c0e00b0faf1209dad023da263658c625680c69be44994a75d360b639a8e7d.
Adds two owned empty common tables; no replay of previous migrations (local DB
has no Drizzle ledger). New e400/e500/e700 fixtures seeded only; old d*/f* data
retained. New browser entities and uploads will be recorded by QA separately.

Old Central Hill Next listeners3071/3072/3073/3075 stopped. Other projects untouched.
The first grouped stop was automatically rejected because it included required
property storage9073(PID11058); no process was stopped by that rejected command.
A safer approved command stopped only apps. Obsolete Blog storages9072/9075 were
then stopped once the new copied storage9077 was active. Preserved9073 and DB/proxy
because they are infrastructure. Only application3071 will remain at delivery.

Root main.env.local now contains only synthetic propertylocalesqa configuration;
original ignored env backed up as.env.before-property-forms-20261106.local(mode600),
without printing or passing remote credentials to agents. Runtime launcher uses
safe env-3071.sh(preload blocks remote Neon) and start-preview.cjs, with runtime
Next image configuration for local storage9077. The product config/kernel is unchanged.
Local untracked public/propertylocalesqa symlinks on candidate/main serve initial
relative SSG images; they point to copied synthetic storage and are not committed.
Final server must start after this link exists so Next indexes those public files.

## Checks on fed9fb8

- pnpm typecheck0, pnpm lint0(7existing warnings).
- 104/104tests0 in main-tests.log, including both actual DB suites and consumers.
- pnpm db:check0,27migrations, historical0008 breakpoint warning only.
- pnpm build0 in main-build-final.log,95static pages. Earlier build was cancelled
  (143) to serialize page generation after tests cleaned their transient fixtures;
  it was not a product failure and is not counted as a pass.
- Initial DB run exposed actual PostgreSQL JSONB precedence errors in both stores
  (22P02, token content invalid). Both localized extraction projections now use
  parentheses before subtraction. Owner suites8/8 and4/4 passed; then integrated
  104/104passed. Name-only production error logs retained; temporary debug removed.
- Independent browser QA approvedfed9fb8:10groups,3scripts exit0, no browser
  exceptions;3realuploads,4locales, livecommon/privatePTdrafts, stats, New/parentgate,
  mobile/focus/guard and oldfixturehashes pass. Screenshots reviewed one round.
  Source-only approval from earlier checkpoint is not reused as functional approval.

Artifacts/config/logs:/private/tmp/central-hill-property-forms-qa. Candidate server
PID84271/session30594, storage9077PID77709/session32815. After QA: stop only this
owned app server, fast-forward actual main, use its same tested build and safe env,
restart3071 from actual main path, confirm login/editor/images and old ports absent.
No extra broad suite after unchanged artifact transfer. Preserve all worktrees/data
and original untracked logo. Record final main hash and app PID below.
