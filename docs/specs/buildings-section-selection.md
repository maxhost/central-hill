# Buildings: one Element entry per section — 2026-11-05

User requests the same section consolidation as Home/Owners and explicitly asks
to verify that local changes render in preview. Base509d785/main in the shared
checkout; all previous tracked/untracked work and running3071 preserved.

Root owns `src/slices/pages/admin/home-contextual.ts`, Pages README, this report
and visual handoff. Reuse selectAsGroup for Buildings only: Hero, owner panel,
Figures, calculator and external catalogue each have one Element option. All
child fields stay in their complete section inspector, including child preview
selections; SEO keeps its separate toolbar. No schema, content, locale, public,
persistence or transport change. Catalogue stays external, managed in Buildings CMS.

Verification: narrow source inspection plus explicitly requested functional
preview browser check with synthetic data/isolated backend, without DB writes,
save/publish/uploads or an authenticated3071 session. No aesthetic QA/check suites,
commit/push/deploy/restart. Acceptance: one Element option per section, nested
fields remain accessible; editable blocks update unsaved in EN/ES/PT/FR and
Refresh resends local state. Prior missing-media preview fallback remains active.

## Verification

Scoped Next16.2.9 webpack fixture on3196 uses actual PageContextualEditor, shell,
bridges/live wrapper, renderPageLivePreview, Buildings adapter and complete
BuildingsListingRenderer (including the actual four editorial section renderers).
Auth/media resolution/settings/catalogue query are synthetic, with no DB/backend
access; Save/Publish/upload explicitly disabled. Initial content has default
figures but no Hero/owner panel/calculator, exercising the first optional-group edit.

Playwright verifies exactly five Element options (hero/owner_panel/stats/calculator/
catalogue), no optgroup/duplicate child options, editable headings in four blocks
for EN/ES/PT/FR, owner/calculator button copy, Figures labels/descriptions and EN
shared counter987+, plus Refresh per locale preserving iframe URL and current
copy. Catalogue has no fields; mobile FR Hero and child canvas selection pass.
SEO remains excluded from Element by the unchanged shared toolbar policy.

The initial grouped run confirmed all EN blocks/Refresh then timed out waiting
for the ES owner button text; no browser error was reported. A targeted diagnostic
confirmed that button renders, and the bounded ES/PT/FR continuation passed all
blocks/buttons/Refresh (25preview POSTs only), mobile and child selection with
zero browser errors. The continuation checks canvas selection after the editing
sequence rather than interleaving asynchronous selection with the next block.
No renderer/transport product change was needed; initial timeout cause is not
independently established. Both run records retained, no blanket QA claim.

Artifacts: `/private/tmp/central-hill-buildings-groups-fixture/`, including
`browser-result.json`/`browser.log` (initial partial run),
`browser-targeted-result.json`/`browser-targeted.log` (passing continuation),
`check-initial.mjs`, `check.mjs`, `debug-cta.mjs` and fixture source/config.
No full check suite, DB writes, saves/publication, production browser session or
independent QA was run for this small UI change. `git diff --check` passes.
The owned3196fixture is stopped after verification; original3071 remains active.
