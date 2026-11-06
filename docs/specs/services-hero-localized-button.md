# Services Hero booking label and URL per locale — 2026-11-05

User explicitly requests editing Hero Book Now label/link per translation language.
Base509d785/main/current checkout; preserve all prior pending work, logo, remote
Neon env and3071. Root-only bounded functional change, no kernel/Settings change.

Add optional localized hero.cta_label and hero.cta_url (HTTP(S) or blank) to Services,
following Guest's override pattern. Blank/absent keeps the existing Settings
localized Book Now and original booking URL, so untouched published pages remain
unchanged. Both fields stay in the complete Hero inspector; target locales get
a URL input. Actual preview/public ServicesHero consumes selected-locale values;
actual private button anchor uses existing ButtonLink.editorBinding seam.

Preserve absent target overrides when preparing from an EN template, including
legacy missing Hero groups, so targets do not inherit a new EN override or acquire
false pending changes. Other Services copy/media/links and the individual Services
CMS are outside scope. No SQL migration, backfill or content/Settings DB write.

Root write set: Pages schemas/services.ts, editorial-content.ts,
admin/ui/page-contextual-editor.tsx, ui/components/services-sections.tsx,
tests/services-hero-button.test.ts, README/data-model, this report and visual handoff.
Acceptance: independent EN/ES/PT/FR values survive switches/Refresh and render in
preview/public anchor; blank/legacy fallback intact; unsafe URLs rejected; private
anchor selects whole Hero. Node22 focused tests/typecheck/lint/compile with
unreachable synthetic DB and isolated actual editor/action/full-renderer browser
checks. No staff login/real Save/Publish/DB/upload/send/commit/push/deploy/restart.

Implemented optional [T] schema leaves, per-target URL input, absent-target
preservation and shared preview/public Hero consumption with private anchor binding.
No adapter/Settings/kernel changes were needed. Both draft/publish schemas inherit
URL validation; existing translation paths are derived from the schema.

Verification on the pending working tree, Node22:
- Focused `tsx --test` Services Hero, Guest Hero, Home button links and backoffice
  bridge files:18/18 pass (4 new Services cases). The sparse legacy test compares
  editor-normalized snapshots, matching actual baseline scaffolding.
- `pnpm typecheck`:0; `pnpm lint`:0 with7pre-existing warnings.
- `pnpm build --experimental-build-mode compile`:0, synthetic unreachable DB URL;
  no database/prerender operation. Actual isolated fixture `next build --webpack`:0
  including TypeScript and static generation.
- Production-mode fixture3188 uses actual PageContextualEditor, server action,
  live-preview bridge and ServicesListingRenderer; auth/media/catalogue/Settings
  are DB-free stubs, Save/Publish/upload disabled. Chromium passes label+URL edits,
  Refresh with stable iframe, reopening all4locale tabs, mobile390px and clicking
  the actual button to select the whole Hero without navigation. Public rendering
  with4injected locale snapshots gives exact labels/hrefs and no private annotation;
  both blank and legacy snapshots retain the existing booking fallback. No browser
  errors;13POSTs only to the synthetic preview route.

Artifacts `/private/tmp/central-hill-services-hero-button-fixture/`:
tests.log, typecheck.log, lint.log, build-product.log, build-fixture.log,
check.mjs and browser-final-result.json. This verifies injected public snapshots,
not real publication/persistence. Temporary3188fixture stopped after verification;
existing3071listener7039 and remote Neon env preserved. No content writes or commit.
