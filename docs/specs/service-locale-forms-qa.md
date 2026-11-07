# Services locale forms — independent functional QA

2026-11-06. Independent QA against the assembled integration worktree
`/private/tmp/central-hill-service-locales-integration`, branch
`service-locales/integration`. Initial executable `30380bd`; corrected executable
`aa6ca10`; final metadata/copy source `54e8073`. **Approved executable `54e8073`.** This report covers source review and the four bounded browser groups in
[execution](service-locale-forms-execution.md). No product edits by QA, nested
agents, main integration, push, deployment or remote writes.

## Environment and isolation

Root supplied the production build on sole `http://localhost:3071`, using existing
local propertylocalesqa Postgres5658/proxy4558 and synthetic storage9077. QA scripts
assert hostname `propertylocalesqa.local` and SQL DB+role `propertylocalesqa` before
mutations. Safe environment is
`/private/tmp/central-hill-building-status-qa/env.sh`; Node22/pnpm. Authentication
uses the existing synthetic staff account, with private state in the artifacts.
No booking/enquiry submissions, email sends or external navigation.

Only new owned e781 Service/category/draft fixtures and UUIDs created through the
new Service form/uploader may change. Their exact identities are recorded in
`/private/tmp/central-hill-service-locales-qa/independent/owned-ids.json`. Protected
hashes cover existing Service/category/media/translation/slug and neighboring
Building/Apartment/Amenity/Blog/Pages/Guides/Forms business data, including composite
relations. e780 backend fixtures are excluded from protection while the writer
owns their cleanup. Auth sessions are deliberately outside business-data hashes.

## Source review

Reviewed the integrated store/model/publication readers, form state/actions,
category read/write seams, additive migration, composition routes and write sets.
Staff guards, request/schema validation, independent publication snapshots,
monotonic locale/shared CAS, EN template revisions and graph locking are present.
Adapted unpublished locale rows never fall back to EN publicly. Shared media and
icons overlay by stable row identity; category names resolve approved targets with
EN fallback. Taxonomy retains field `name` and existing kernel seams. No kernel
implementation changes or cross-slice internal imports were introduced.

Root reports integrated typecheck0, lint0 with seven pre-existing warnings,
90 pure tests0, migration bookkeeping0 and production build0/119pages. After the
scoped correction, root reports the affected eleven state tests0, typecheck0,
lint0 with the same warnings and corrected build0/119pages. Backend DB checks are
documented separately in execution; they complement the browser checks rather
than being counted as independent browser evidence.

## Finding and scoped correction

**Resolved blocking functional finding on `30380bd`:** add a never-saved itinerary
step, pick its image, discard that section, edit another text field and Save draft.
The restored arrays no longer contained the new step, but the complete common map
retained its unuploaded media reference after the queue dequeued it. Save returned
validation `_shared` and wrote no locale content. Reproduced on only e781...003;
`discard-result.json` captures request/response and unchanged zero-row before/after.

Root integrated `aa6ca10`: prune only never-saved common-map keys with no remaining
reference in any locale's working array; preserve every saved shared-history key
and pending references still used by another language. Source-reviewed the precise
two-file correction. Targeted browser confirmation is recorded below; unaffected
approved group1 is carried forward without repeating its matrix.

Initial runtime checks found the pre-existing storage9077 listener had disappeared;
root restored the existing script/files. A group2 navigation then timed out waiting
for full `load` after image-fetch failures; the harness stopped before group2
mutations. Remaining groups use `domcontentloaded` plus actual form readiness.
These environment/harness corrections are not product defects. Two later harness
assumptions were corrected without product changes: session previews may still be
blob URLs until reload, and `innerText` applies the card's uppercase CSS to category
names. Persisted preview checks use reload; category content checks use
`textContent`. Each interrupted run resumes only unfinished cases, preserving
recorded own asset identities and the original protected-data baseline.

## Browser results

1. **Pass, 30380bd:** create/edit expose the retained form and EN/ES/PT/FR; legacy
   GET/tab changes perform no writes, pending ES stays private, localized PT SEO
   and slug remain, EN draft/publication and untouched FR inheritance are separate.
   PT text/booking URL/SEO own Save+Publish survives later EN. An inherited older
   saved draft cannot Publish while newer saved EN is displayed until Save.
2. **Pass, aa6ca10:** failed queued upload leaves Service snapshots/common data
   unchanged; retry persists a real normalized local asset. Shared cover appears
   across tabs/reload. Nested image/icon edits follow stable identities after EN
   reorder while PT text/order/SEO/publication are retained. A new PT-only step
   image survives Save EN through the complete common map while its PT text stays
   locally unsaved, then persists/publishes only on PT Save/Publish. Conditional
   modules remain present. All-tab unsaved navigation is protected. Targeted
   discard confirmation passes: zero locale rows before, four after valid Save,
   no orphan `_shared` validation, only the two saved legacy step map keys remain.
3. **Pass, aa6ca10:** four category names load raw pending/blank values, one Save
   approves manual targets, EN rename + ES clear resolve fallback on all four public
   listing cards and selectors. The selected category ID, Service snapshots and
   shared revision remain unchanged without republishing Service. Mobile controls
   and arrow-key tabs work.
4. **Pass for unaffected behavior, aa6ca10:** actual create saves an incomplete
   draft, then Save/Publish EN makes only EN public; title metadata persists.
   Later stale Save is rejected without overwriting newer content, invalid external
   URL writes nothing, anonymous access redirects to login, and Archive/Restore
   keeps local pending PT text and existing publications. Original legacy Service
   translation rows remain intact. Protected business hashes match and pageerrors
   are empty. The hreflang exception and its final confirmation are recorded below.

An independent browser check found the public route still emitted all four
hreflangs for an EN-only new publication, even though the slice returned only EN
and the other three URLs returned404. `metadata-result.json` captures the exact
publication flags, links and statuses. Root's scoped route correction uses only
slice-supplied alternates, adding x-default only when EN is present. Source-reviewed
and accepted in `54e8073`. Final production build0/120pages is root-recorded; the
extra page is the newly published EN-only QA Service. Targeted browser confirmation
passes: alternates exactly EN + x-default, EN200 and ES/PT/FR404, no pageerrors.
`metadata-confirmation.json` retains the final publication flags, links and statuses.

Reviewed and accepted the copy-only delta `ed09dea`: twelve existing message values
across four languages now describe manual tabs, independent publication and blank
category-name fallback. No schema/behavior/placeholder change, no matrix repeat.

Artifacts: `/private/tmp/central-hill-service-locales-qa/independent/`.
`check-initial.log` records group1 and the navigation harness interruption;
`check-final.log` records remaining groups. `results.json`, snapshots, common-map
JSON, protected hashes and page errors retain reproducible evidence. The checks
exercise desktop1440x1000 and mobile390x844 functional controls/keyboard, with no
aesthetic measurement, screenshot matrix or open-ended visual QA.


## Commands, final evidence and limits

QA ran the Node Playwright/SQL harness under the safe environment:
`node /private/tmp/central-hill-service-locales-qa/independent/check.mjs`.
Bounded resumptions used `QA_RESUME_FROM=2` with `QA_GROUP2_RESUME=after_nested`,
then `QA_RESUME_FROM=3 QA_GROUP3_RESUME=after_rename`, and finally
`QA_RESUME_FROM=4 QA_GROUP4_RESUME=after_create_publish`. The last command exits0;
`results.json` records all four completed groups, with prior approved cases carried
forward rather than repeated. Separate scoped scripts are `discard-check.mjs`,
`discard-confirm.mjs`, `metadata-check.mjs`, and `metadata-confirm.mjs` in the same
artifact directory. The confirmation commands both exit0.

Final protected-before/after JSON hashes are equal across the covered business
tables. Original Service legacy translation rows are equal before/after. Four new
uploaded media assets and the new Service UUID are recorded in `owned-ids.json`;
no old media or identity was replaced. The extra created Service is
`55f55335-0a39-4f0d-9a5d-29281649116a` (`qa-service-created-20261106`), EN published,
ES/PT/FR unpublished. Synthetic e781 demos and all evidence remain for local review.
`browser-errors.json` and final metadata confirmation both contain zero pageerrors.

No unresolved blocking finding remains for `54e8073`. Approval includes source
review of the twelve copy-only changes in `ed09dea`; functional lineage is
30380bd/group1, aa6ca10/groups2–4 and discard confirmation, 54e8073/metadata
confirmation. Visual appearance remains the user's localhost review; these checks
verify behavior and persistence, not an aesthetic quality claim. Root owns final
local-main integration and the final actual-main read-only opening check.
