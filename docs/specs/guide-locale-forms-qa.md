# Guides locale forms — independent functional QA

2026-11-06. Independent QA on assembled candidate `2ad160d` in
`/private/tmp/central-hill-guide-locales-integration`, branch
`guide-locales/integration`, from main `97fa285`. This report follows the four
bounded groups in [execution](guide-locale-forms-execution.md) and ADR0066.
**Independent functional/source approval: `2ad160d`.** All four bounded browser
groups and the final read-only navigation confirmation pass. QA owns this report and artifacts only, with no product
edits, nested agents, runtime changes, main merge, push or deployment.

## Environment and protected data

Root supplied the production build on sole `http://localhost:3071`, candidate
`2ad160d`, PID99043. Existing synthetic propertylocalesqa DB5658/proxy4558 and
storage9077 are retained. Each harness entry verifies the configured hostname
`propertylocalesqa.local` and SQL database+role `propertylocalesqa` before writes.
Safe environment: `/private/tmp/central-hill-building-status-qa/env.sh`; Node22.
Migration0028 was explicitly authorized/applied by root; QA applies no schema.

Only owned e791 legacy demo rows, fresh browser UUIDs and new uploader assets may
change. Exact identities are recorded in
`/private/tmp/central-hill-guide-locales-qa/independent/owned-ids.json`.
Existing d100 city and d300 image are read-only references. Protected hashes cover
all42public business tables, excluding auth tables, owned rows/relations and e790
backend fixtures whose cleanup belongs to root. Baseline was captured before QA
writes; each completed group compares against it. Original guide translation rows
are also compared separately after aggregate adaptation.

## Source review

Reviewed integrated contracts/additive schema, strict request/envelope validation,
legacy bootstrap, model/store/publication loader, public query consumers, form
state/actions/composition and legacy translation guards/redirects. Staff gates,
selected-locale/shared/template CAS, same-transaction graph locking and child
ownership checks are present. Public loader explicitly selects publications and
never draft JSON. New unpublished locales have no EN publication fallback. Shared
maps overlay root/section/place assets by UUID while localized arrays retain their
own order and parent relations. Saved histories remain; never-saved orphans prune.
Neutral recommendation classification is separate from the translated category.

Legacy reads project public and pending content separately without writes. Old
section CTA columns are not revived. New sections/places are local before the first
Save; child live-save actions and old translation links are removed from the form.
Archive/Restore preserves the four publication/draft units and local unsaved work.
ISR invalidates guide list and sitemap. No new kernel implementation or cross-slice
internal imports were introduced by this change. Four message locales are present.
Old guide translation review URLs redirect to the owning guide and selected locale;
generic translation mutation/generation entry points reject the three guide types.
Global Translations remains available for the remaining roadmap.

Root reports integrated typecheck0, lint0 with seven pre-existing warnings,
67Guides pure regression groups +25consumer groups +14model/DB groups, all pass;
db:check0 with the existing0008warning; production build0/125pages after e790
cleanup. These root checks complement the independent browser results below.

## Browser checks and evidence

Groups run in order1,3,2,4 so legacy public/pending and SEO checks
precede adaptation of the legacy demo. Any interrupted case will resume only the
unfinished work, preserving its original protected-data baseline and owned IDs.
Group1 passes: legacy GET/tab no-write, pending ES private; New starts EN and
allows a stable-ID section/place before any row exists; a complete aggregate draft
saves/reloads, incomplete Publish is rejected, then valid EN Publish yields only EN
and x-default alternates while other unpub URLs404. FR follows saved EN, an older
inherited draft cannot Publish without Save, and customized ES text/SEO survives
later EN Save/Publish and reload. Group3 passes: old root/section/place review URLs
redirect to the owning guide/PT tab, Guides disappear from generic inbox, original
PT SEO/content and EN TOC/CTA survive, retired raw CTA labels remain absent, and
section sitemap includes eligible guides without an unpublished PT URL.

The first group3 harness asserted guide URLs in `/sitemap.xml`, which is the sitemap
index. No product defect: corrected the remaining assertion to `/sitemaps/guides`
and confirmed only that remaining step using `QA_SITEMAP_ONLY=1`, exit0; earlier
passed source/public/redirect checks are carried forward. Root additionally compared
QA baseline's40pre-existing tables to the pre-migration snapshot: all40counts/hashes
match (`store-protected-comparison.json`).

Group2 passes: manual PT text/category/link/SEO remains independent, while saved EN
feeds untouched FR. An intentionally failed queued upload leaves all guide locale
and common snapshots unchanged; retry succeeds with a real normalized local asset.
Hero, section and place photos share stable UUID mappings after EN reorder without
changing PT's text/order/SEO/publication. A PT-only new place photo persists through
Save EN using the complete common map, while its PT tree stays locally unsaved;
PT Save/Publish then publishes its own new section/place. Later EN preserves it.
A discarded never-saved image node is pruned, valid Save still succeeds, and another
language's local work survives. Navigation cancel, mobile390x844 and keyboard tabs
work. PT detail and listing/recommendation show localized content/category and the
new photos. Four new own assets are retained.

Group4 passes: two real editor sessions produce a stale Save conflict without
changing the newer stored data or losing the stale local text. An invalid nested
website URL writes nothing and marks the exact input invalid. A fresh anonymous
browser context redirects to login. Archive makes the PT detail404; Restore brings
back the existing publication while preserving local unsaved PT text and every
locale draft/publication row. Original root/section/place translation values and
states are identical. Existing ownership, corrupt-row, inactive-map and city guards
are independently source-reviewed with root's real DB groups as supporting evidence;
no separate broad browser injection matrix was run.

A group4 harness locator initially matched both the expected inline conflict
banner and its toast. Scoped it to the alert containing Reload and resumed the
unfinished group; this is a harness correction, not a product defect. Completed
groups1/2/3 were not repeated. Upload failure in group2 waits for the uploader's
failed state rather than expecting a guide save action that correctly never runs.

Appearance remains the user's localhost review; no screenshot matrix, geometry
measurement or aesthetic refinement loop is performed.

Harness commands, from the integration worktree after sourcing safeenv:

- `node /private/tmp/central-hill-guide-locales-qa/independent/group1.mjs`
- `node /private/tmp/central-hill-guide-locales-qa/independent/group3.mjs`
- `node /private/tmp/central-hill-guide-locales-qa/independent/group2.mjs`
- `node /private/tmp/central-hill-guide-locales-qa/independent/group4.mjs`
- `node /private/tmp/central-hill-guide-locales-qa/independent/navigation.mjs`

Artifacts retain per-group logs/results, owned IDs, before/after hashes and guide
snapshots under `/private/tmp/central-hill-guide-locales-qa/independent/`.


Final read-only confirmation passes: unsaved PT work still triggers the Back
warning while EN is selected; cancel retains the PT text. View on site has
`_blank` and `noopener noreferrer`, opens the actual PT public URL in another tab
without triggering the unsaved dialog, and preserves the editor's pending work.
`navigation.log` and `group4-navigation-result.json` record exit0. Functional browser
sizes are desktop1440x1000 and mobile390x844; no geometry or aesthetic gate.

Protected before/after JSON matches across all42business tables. Root additionally
compared the final40pre-existing table hashes/counts against its pre-migration
snapshot: all unchanged through migration, store tests, seeding and browser QA
(`final-protected-comparison.json`). Each browser result records an empty pageerror
list. No product correction was required in this QA; only the two harness scopes
above were adjusted. No remote writes, external submissions, email sends or
schema operations were performed by QA. Screenshots/aesthetic validation remain
outside this functional approval.
