# Blog form and rich text — independent scoped QA

2026-11-06. **APPROVED for the requested local functional scope.** Final product
candidate `8064fab`, branch `blog-form/integration`, checkout
`/private/tmp/central-hill-blog-form-integration`. No unresolved blocking finding
remains in the exercised group. This supersedes the source-only report `b7a253a`;
it is not a broad security, stress or production QA claim.

## Authorization, environment and ownership

Automatic approval review originally rejected fixture writes to
`propertylocalesqa`, because the earlier Blog authorization named
`postlocalesqa`. No authenticated/browser/database work occurred during the
source-only stage. The user subsequently explicitly approved:
“Sí, autorizo esas pruebas sintéticas en propertylocalesqa”.

Root verified and seeded the new Blog fixtures. The independent harness also
asserted `current_database() = current_user = 'propertylocalesqa'` before its
functional mutations. Postgres5658/proxy4558, separate synthetic storage9075,
preview localhost3075. Final runtime is root-owned PID61394/session90409.
No migration, remote Neon write, main merge, push or deployment occurred.
Previous3071/3072/3073 and their fixtures/storage/processes were untouched.

Fixture post `f4000000-0000-4000-8000-000000000001` and related article
`f4000000-0000-4000-8000-000000000002`; category `f1000000-0000-4000-8000-000000000001`,
author `f2000000-0000-4000-8000-000000000001`. Only these task-owned Blog fixtures,
a new task-owned article, new media and the synthetic login session were mutated.
The original shared media `d3000000-0000-4000-8000-000000000001` was referenced
without replacing its bytes.

The only repository write by this reviewer is this report. Product fixes were
reported to the orchestrator and implemented by their assigned owners. Root-owned
dirty documents/README/AGENTS and untracked `public/propertylocalesqa` were
preserved. Artifacts are under
`/private/tmp/central-hill-blog-form-qa/independent/`; auth state stays there.

## Candidates and successful cases

Initial source review: `5ec115a`, then the draft-list correction `f207abb`.
The first browser baseline ran on `f207abb`. Label associations and the two
uploads were checked on `52f61b6`. The false-dirty retest and remaining
publication/mobile/New cases ran on final `8064fab`. Only affected checks were
repeated after corrections; baseline/media were not rerun on the final state-only
correction.

| Exercised behavior | Result and evidence |
| --- | --- |
| Separate title input; named multiline body textbox and toolbar; EN/ES/PT/FR tabs; excerpt, metadata, cover, SEO/social, CTA and related controls; no iframe/PageEditorShell | Pass, `baseline-results.json` |
| First actual Save preserves all eight legacy blocks exactly, including heading number, list order, image caption/alt, quote attribution, callout variant, divider and CTA fields; reload retains content | Pass, `legacy-before.json`, `baseline-results.json`, `baseline-final.json` |
| Continuous paragraph typing and Enter keep body focus; bold/italic/safe link and undo/redo; table paste rejected without changing body; supported semantic paste accepted | Pass, `baseline-results.json` |
| New bulleted list items and quotation survive Save/reload; named caption/alt/attribution/callout/CTA/link controls and heading-number association work | Pass, `quote-resume-results.json`, `quote-resume-final.json` |
| Two real uploads through MediaField/scoped queue: cover and inserted inline image; stored bytes/dimensions are present; normalized URLs replace all blob previews immediately after Save and survive reload | Pass, `new-media.json`, `normalized-after-save.json`, `continuation-false-dirty-blocker-results.json` first successful group |
| Saved EN draft reload stays clean and Publish is enabled; FR mount adds no change beyond server-provided working state and writes no locale revision | Pass, `retest-clean-results.json`, `retest-clean-en-state.json`, `retest-clean-fr-state.json` |
| EN Save/Publish preserves hidden ES local title; ES/PT/FR each Save/Publish/reload preserves own body/title/SEO; each Publish changes only its selected locale's stored row and clears only that draft | Pass, `continuation-results.json`, `continuation-final.json` |
| Actual public article renders strong/em/safe anchor/image elements and normalized image URLs; public localized titles and SEO reflect publication | Pass, `continuation-results.json`, `public-rich-text.png` |
| Desktop1600×1100 and mobile390×844: toolbar/actions wrap, no horizontal overflow, body typing retains focus, hidden-locale dirty navigation opens warning and Cancel retains local work | Pass, `continuation-results.json`, screenshots below |
| New first Save navigates to a stable Edit identity without losing title/body; language targets unlock; second Save uses same identity, reaches revision2 and survives reload | Pass, `new-post-results.json`, `new-post-identity.json` |

The group contains 18 successful bounded checks across the retained result files;
this is a grouping count, not an expanded test matrix. Successful harness exits
were0. Browser page-error arrays for the successful baseline, quote/labels,
directed retest, continuation and New cases are `[]`.

New article: `7a6b4af0-52cc-4afd-8cfb-47b926b3648d`, EN draft revision2,
unpublished. The main fixture finishes with all four locales published. Mobile
unsaved test text was left only in a discarded browser context, never saved.

New media:
- Cover `13257f9a-d691-452d-9aac-fdbc95e63241`.
- Inline `063dfa7f-fe6d-4498-b7fe-62c89a73a010`.

Both are local synthetic JPEGs,1400×900,7793stored bytes each. No further uploads
or prior-fixture byte changes were needed.

## Findings and targeted corrections

**Blocking false dirty — fixed and retested.** On `52f61b6`, the saved EN draft
at the fixture Edit URL reloaded as “Unsaved changes”, disabling Publish without
a user edit. Captured working and draft envelopes passed Node
`assert.deepEqual`, but raw `JSON.stringify` differed because JSONB and the
codec ordered object keys differently. Editor editability/normalization updates
also emitted non-authored changes.

Reproduction/evidence: `continuation-false-dirty-blocker.log`,
`continuation-failure.png`, `diagnose-rows.json`,
`diagnose-react-state.json`. The orchestrator integrated semantic object equality
while retaining array-order significance (`a2a954e`), suppression of non-document
updates (`3f3b9ec`) and a semantic no-op guard before target preparation
(`8064fab`). Directed final retest confirmed clean EN reload, enabled Publish,
unchanged target mount state and unchanged locale rows; real edited titles/body
still become dirty, save and publish successfully. Subsequent four-locale and
New cases passed on that final candidate.

Root source findings were also corrected: blank formatted list item runs now
serialize as `[]` while Publish still rejects incomplete content (`f207abb`);
rich-text field labels now associate with stable IDs (`52f61b6`). Label
associations were checked in the browser. The blank-item edge was source/unit
verified by root; it was not separately exercised through a browser.

**Preserved server target preparation.** A target without a draft already gets
shared EN fields prepared by `postLocaleModel` before it reaches the editor.
Consequently a direct FR load can show pre-existing unsaved prepared references
when EN differs from FR's frozen publication. This behavior was confirmed with
the orchestrator and retained within this form-correction scope. The final
mount check compares the client working model to the server initial model,
not to the older published snapshot; those models were deeply equal and no
revision changed. FR's stored publication stayed unchanged until its real Publish.
See `target-model-diagnostic.json/.log` and `retest-clean-fr-state.json`.

## Commands, attempts and verification limits

Commands ran from the named integration checkout with the task's isolated
`env.sh` sourced; environment values/credentials were not printed. Main successful
entry points were:

- `node .../independent/inspect.mjs`: synthetic login and initial form inspection.
- `node .../independent/baseline.mjs`.
- `node .../independent/quote-resume.mjs`.
- `SKIP_STRUCTURES=1 node .../independent/continuation.mjs`: media group passed,
  then the false-dirty blocker stopped publication.
- `node .../independent/retest-clean.mjs`.
- `SKIP_STRUCTURES=1 SKIP_MEDIA=1 node .../independent/continuation.mjs`:
  final locale/public/mobile continuation, exit0.
- `node .../independent/new-post.mjs`, exit0.

The abbreviated prefix above is
`/private/tmp/central-hill-blog-form-qa`. Harnesses wait for the real matching
Next-Action response and settled UI, then query actual draft/revision/publication
state; they do not infer publication from an already-existing “Published” label.

Initial sandbox Chromium launch failed with macOS MachPort permission denial;
the approved local QA commands then ran with narrowly reviewed process/network
access. No content mutation occurred in the failed launch.

Retained harness-only failed attempts are named
`baseline-input-type-assumption*`, `baseline-bootstrap-assumption*`,
`continuation-editor-quote-selector-assumption*`,
`continuation-wrapper-count-assumption*`,
`continuation-quote-toggle-assumption*`,
`quote-resume-callout-scope-assumption*` and
`retest-clean-server-preparation-assumption*`. Corrections covered HTML's default
input type, snapshots initialized on first Save, React editor node-view wrappers,
a mistakenly toggled-off quotation, a toolbar/control naming collision and the
preserved server policy above. Mac Meta+End retained the prior link selection;
the harness switched to an explicit collapsed end-of-body selection and added
a fresh link before checking public anchors. These attempts are not product
failures or additional successful cases.

Source review covered the codec, Tiptap/custom nodes, locale state integration,
body validation, safe React inline rendering and contract imports. No product
code was silently changed by QA. The reviewer did not repeat global checks.
Root reports: initial typecheck/lint (seven existing warnings),43focused tests
and build exit0; final candidate typecheck, scoped lint,16focused state/codec/
render tests and `build-echo-fixed.log` exit0. Those remain root verification,
not independent reruns. No migration/db:check was required.

Scope excludes broad adversarial/stress/security cases, remote content or sends,
and retesting unchanged neighboring editors. The successful earlier baseline/
media evidence carries forward through the narrowly scoped state correction;
there is no claim that every case was rerun on every intermediate commit.

## Screenshots reviewed

All paths use the artifact directory above.

- `desktop-form-final-viewport.png`:1600×1100, separate title/body, wrapped
  toolbar, details/cover column and enabled Publish after the clean reload.
- `mobile-form-viewport.png`:390×844, wrapped actions/languages/toolbar.
- `mobile-form.png`: full mobile form with the intentional local dirty state.
- `normalized-after-save.png`: persisted media previews before reload.
- `public-rich-text.png`: actual public article.

The independent reviewer inspected desktop and mobile viewport images. Root also
reviewed the same pair and requested no visual correction. Files, fixtures,
worktrees and runtime remain available for local review.
