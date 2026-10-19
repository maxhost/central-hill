# Home contextual editor — independent scoped QA

2026-10-18. Initial executable255f3e2, reviewed HEAD47d5742 (test-only alignment).
Final candidate6359b6d295c7cae15eb0b80a47831f6364132092. **APPROVED** after the normal functional pass and affected correction confirmation.
No unresolved blocking findings.

## Environment and scope

`/private/tmp/central-hill-home-contextual-integration`, `home-contextual/integration`.
Production-mode local preview3065; isolated PostgreSQL5608/proxy4508,
DB and role `homecontextualqa` verified by SQL; synthetic staff
`homecontextualqa@example.test`. S3rver9065, bucket `homecontextualqa`;
actual browser PNG upload stored only there. Email console. No production
credentials, production writes, public form sends, main integration, push or deployment.
Earlier previews remain separate. Artifacts/harness under
`/private/tmp/central-hill-home-contextual-qa`.

Normal functional scope only, one grouped desktop/mobile pass and affected-fix
confirmation. No expanded locale/browser matrix.

## Findings and corrections

- P2: Hero background normal click selected `hero`, rather than background media
  binding. `media-click.cjs`/`.log` records ordinary visual-position click600,100
  and nearest hit-test bindings; `media-click.png` is evidence. Inspector selector
  still allowed media editing. Root correction6359b6d adds optional Hero bindings,
  with public calls unchanged. Ordinary background click now selects video; retest passed.
- P2: Fixed-size Benefits/Assurances arrays retained move controls but positional
  translation keys. Root static review identified mismatch risk after reorder;
  correction extends existing stable identities to all three reorderable Home
  arrays. Approved ES translations now follow Benefits and Assurances reorder/save/reload;
  independent affected confirmation passed.
- P2: Standalone authenticated preview skipped interaction blocking when no parent
  window. Root static review identified this; correction899e669 blocks direct
  preview interactions while limiting postMessage to embedded instances.
  Independent direct-preview CTA click remains on the same URL, submission is canceled,
  and noindex is present; confirmation passed.

## Functional evidence

- Anonymous private preview redirects to staff login. Authenticated iframe loads
  shared Home and noindex route is force-dynamic/revalidate0.
- Browser `innerWidth` verifies1440/768/390. Ordinary Hero headline selection
  opens matching inspector. Pending source edits leave saved preview unchanged.
- Actual source headline/button edits and PNG poster upload save, reload and appear
  on public EN. Persisted media picker renders image after reload. Public response
  has no editor annotations and retains canonical.
- ES local text draft survives PT→ES tab switch. Save for review keeps public EN
  fallback; Approve translation makes ES public. Source change shows stale status
  while approved ES remains public.
- Stats labels approved in ES, source rows reordered; translated labels follow stable
  item identity in both inspector and public order (`QA Anos`, `QA Edificios`).
- Two source editors: first save succeeds; second stale source save displays conflict
  and leaves saved source unchanged.
- Empty Services/FAQ sections remain reachable through inspector/outline; SEO title,
  description and OG accessible. Avantio inspector has no editable inputs; private
  preview contains no booking iframe.
- Manual boundaries: changed cross-slice imports use contracts. Editor message keys
  match EN/PT/ES/FR. Source/target save paths retain Home tag and all locale routes;
  public renderer stays shared with preview. No new migration.

## Commands and harness notes

Root owns integrated typecheck/lint/tests/build logs and will record final exit codes
in execution/delivery. Independent browser commands use Node22 after sourcing isolated
`env.sh`: `node qa.cjs`, `node functional.cjs`, `node followup.cjs`,
`node remaining.cjs`, `node media-click.cjs`.

Initial harness attempts failed on iframe replacement, an incorrect button name,
matching an empty global live alert, CSS-uppercase public text comparison,
and title-vs-description target ordering in the benefits harness.
These were harness errors; corrected waits reacquire iframe, wait version changes,
match the inspector conflict alert and normalize public text. Their partial logs
are retained; only explicitly confirmed behavior above is counted as evidence.
Final commands: `node qa.cjs` exit0; `node navigation-mobile.cjs` exit0;
`node corrections.cjs` exit0. Other partial harness attempts logged the stated
assertion/timeout errors and their six owned browser/Node processes were closed
explicitly; they are not reported as complete passing commands.


## Integrated verification on6359b6d

Root ran Node22/pnpm against the isolated environment; inspected final logs and
confirmed reported exits:

| Command | Exit / result | Evidence |
| --- | --- | --- |
| `pnpm typecheck` | 0 | typecheck-final.log |
| `pnpm lint` | 0, 7 existing warnings | lint-final.log |
| `pnpm exec tsx --test src/slices/pages/tests/home-contextual.test.ts src/slices/backoffice/tests/page-editor-bridge.test.ts src/slices/pages/tests/pages-admin.test.ts src/slices/pages/tests/pages.test.ts` | 0,149/149 | tests-final.log |
| `pnpm build` | 0 | build-final.log |

No migration changed, so db:check is not a required new check. Placeholder
`pnpm test`/`boundary:check` were not counted as verification.


## Final affected confirmation and limits

`corrections.log` records all corrections passing on6359b6d: ordinary Hero media
selection, approved ES Benefits and Assurances identity after reorder/save/reload,
standalone navigation/submission cancellation, noindex, and public instrumentation
absence. `media-corrected.png` records the corrected selection. Initial grouped
screenshots `desktop.png`/`mobile.png` were reviewed;390px has no horizontal overflow,
and the inspector stacks below the canvas with accessible controls.

The synthetic image deliberately contains a screenshot, proving the real upload
path rather than visual art direction. Dynamic Services/Buildings catalogues were
empty in this environment; their hidden section controls and ownership links were
verified, not catalogue editing. PT/FR editor keys were statically checked; the
normal translation workflow was exercised in ES. No real email or Avantio submission
was attempted. Saved-content-only preview, lack of durable drafts and future page
adaptations are the closed-plan scope, not incomplete QA gates.
