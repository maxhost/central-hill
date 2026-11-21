# Footer legal Pages — independent QA

2026-11-21. Implementation/restore context: [plan](legal-pages-plan.md),
[execution](legal-pages-execution.md). Harness: [README](../../scripts/qa/legal-pages/README.md).

## Final result

**APROBADO:** independent QA approves the corrected candidate for the requested local scope.
All three complete BO/public workflows pass (20 logged groups:6+7+7), together with
8 supplemental browser groups and3 state/compatibility groups. Final runs produced zero browser page
errors and zero HTTP5xx observations. No unresolved new product defect remains.

Candidate identity: private `product-source.json` enumerates943 `src`/`messages`
files. Independent comparison found zero mismatches against the delivered workspace.
The manifest SHA256 is
`6355555b9e63900af798e81aa09fe02150a66cfc3fed9a40dc49853408b216f6`.

The production-mode QA runtime is isolated at `http://127.0.0.1:3090`, using only
DB/role `legalpagesqa20261121`. URL/SQL database+role guards and the loopback port
guard were checked before mutations. A new synthetic administrator was created
through Better Auth signup and granted its own staff role. Browser authentication
used only the ordinary login page; no storageState/cookies were used for login or
session transfer. Diagnostic headers collected during the cache investigation were
sanitized to exclude authentication/cookie values and were never used for replay
or authentication.
The login-page video was deleted; delivered videos start with the page workflow.

## Recorded acceptance workflows

One uninterrupted native Playwright WebM recording per page, all from the final
corrected production build. Each recording shows actual BO inputs and public
navigation, without a public-page reload, cache flush, query-string cache bypass,
or extra HTTP warming request to make publication appear.

1. Create EN title and Rich paragraphs; see unsaved private live preview; Save
   Draft and Publish. Navigate through the public footer and verify the EN page.
2. Switch to ES, author/publish the independent translation, navigate through the
   ES public footer and verify translated title/body.
3. Return to EN, change title/body and increase its structure to three paragraphs
   plus a list. Publish and navigate from the footer to the new EN content.
4. Revisit ES through its footer: translated content remains intact. The complete
   stored ES row, including document, revision and timestamps, is also exactly equal
   before/after the EN publication.
5. Follow the PT footer link without publishing a PT translation: the PT URL shows
   the current complete EN title/body, with PT shell language. FR fallback is also
   verified independently. Public assertions additionally run anonymously.

| Page | Final video | Duration | Bytes |
|---|---|---:|---:|
| Privacy Policy | [privacy-policy.webm](/private/tmp/central-hill-legal-pages/qa/videos/2026-11-21t15-19-42-123z/privacy-policy.webm) | 28.08s | 3240773 |
| Cookies Policy | [cookies-policy.webm](/private/tmp/central-hill-legal-pages/qa/videos/2026-11-21t15-19-42-123z/cookies-policy.webm) | 29.44s | 3265185 |
| Complaints Book | [complaints-book.webm](/private/tmp/central-hill-legal-pages/qa/videos/2026-11-21t15-19-42-123z/complaints-book.webm) | 27.60s | 3083680 |

All three files were inspected with the installed Playwright FFmpeg executable:
valid VP8/WebM, 1440×1000,25fps. Metadata evidence is private `qa/video-metadata.json`.
Final workflow results are private `qa/e2e-latest.json` and the three timestamped
case JSON files. Privacy has 6 logged groups because its final run reused its own
earlier QA document; Cookies and Complaints each have 7 groups, including their
initial404, absent footer link and private first draft checks. Those first-publication
checks were not falsely repeated for an already-published Privacy fixture.

## Additional verification

- EN/ES/PT/FR: translated Others heading and all three locale-prefixed links are
  present in the footer; none is present in the navbar.
- All three document pages render at desktop1440×1000 and mobile390×844 with no
  horizontal overflow. Eight screenshots cover all three pages at both sizes and
  the footer separately at both sizes. QA reviewed the shared document layout and
  footer images in a bounded batch; headings wrap, paragraphs/lists remain readable,
  and the new navigation column fits the responsive layout.
  Root independently reviewed the same eight existing images in one batch, without
  recapturing or changing the candidate. The inherited floating Earn With Us and
  WhatsApp controls can overlap the newsletter at some scroll positions; this task
  does not change that shared chrome. Phone numbers wrap visibly rather than truncate
  in the narrower desktop contact columns. This is a scoped review, not a claim that
  every preexisting site UI issue is absent.
- Anonymous access to the BO editor and its private preview redirects to login.
  Public pages expose neither private editor bindings nor duplicate navbar/footer.
- A PT draft was saved through the BO without publication. Anonymous PT still
  showed published EN; neither the EN nor ES stored row changed.
- Two normal BO tabs loaded the same EN revision. The first saved its own draft;
  the stale second Save was rejected with the conflict message and left the winner's
  complete row unchanged. Its already-published content remained unchanged. The
  test's own EN draft was then restored to its prior published text via BO Save and
  Publish; the EN draft ends null and ES remains exactly intact.
- One preexisting Blog post opened successfully with the full Rich editor,
  including image/callout/button controls. No Blog Save or content mutation occurred.

Additional results: private `qa/additional-checks.json` (8/8) and
`qa/state-checks.json` (3/3).

## Conservation

The before/after comparison covers43 protected public business tables and1473
original rows, including all original Page rows, plus all32 migration ledger entries.
Counts and deterministic complete-row hashes are exact. Only the three new legal
Page keys are excluded from Page-table comparisons; normal activity of the own QA
account is outside the business comparison. Private evidence:
`qa/business-before.json` and `qa/business-after.json`.

No SQL schema/migration change was needed. QA made no authored-main writes. All
QA-owned browser pages/contexts were closed and the browser processes awaited on
completion; no browser action remains pending. The orchestrator owns stopping the
isolated QA runtime while preserving main3071 and media9081.

Final own QA publications: EN and ES for all three legal pages; PT/FR publications
remain null. Privacy additionally retains its deliberately private PT test draft.
All fixtures remain only in the isolated QA dataset. No main fixture, production
database/R2 write, real email, deployment or Git push belongs to this QA work.

## Defect found and closed

P2: after a visitor had already opened the EN page, then ES was published and EN
was edited/published, the next same-browser footer navigation could reuse the old
static EN segment. SQL held the new publication, and independent subsequent full
HTML/RSC requests were current. Waiting for the real BO Save/Publish response and
reenabled controls did not resolve the stale navigation, confirming a product issue.

The bounded fix makes only the three new legal routes dynamically rendered. The
explicit tagged published-document getter cache remains in place. The final Privacy
recording reruns the exact warm-browser sequence and passes on the first footer
navigation, followed by the first complete Cookies and Complaints workflows.
Earlier failed recordings and diagnostic evidence are retained privately.

Two harness corrections are separate from the product defect: lowercase timestamp
filenames satisfy the harness artifact-name guard, and browser navigation waits for
the BO mutation to finish after the SQL commit. No reload/poll workaround was added
to the public navigation assertions.

The old media target directories were already empty at checkpoint; restoring old
media was outside scope. Root's broader editorial test run also had8 failures which
were reproduced at baseline29ef542; those are not counted as passing QA here.
