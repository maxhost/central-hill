# Amenity labels and shared Building selector — independent QA

2026-11-06. **Approved** executable `cdab195` on `amenity-locales/integration`,
checkout `/private/tmp/central-hill-amenity-locales-integration`.
No product blockers found. Root provided the compiled production application on
localhost3071. QA did not start/stop servers or change implementation files.

## Environment and scope

SQL verified database and role both `propertylocalesqa` before mutations. Existing
local DB/proxy5658/4558 and storage9077 only; no migration or remote write.
Only root-created Building `e7710000-0000-4000-8000-000000000001` and Amenity
`e7710000-0000-4000-8000-000000000002` were changed through their real forms.
QA created no new catalogue identity and used no direct content SQL writes,
fixture resets or media uploads. The New Amenity form received a read-only control check.

## Three normal functional groups passed

1. Create and Edit expose Label EN/ES/PT/FR. Reads do not write. Edit loads raw ES
   pending work, existing approved PT and absent FR as blank; before manual Save,
   the Building selector shows English for pending ES, approved PT and English
   for absent FR. One taxonomy Save stores EN/ES/PT labels, approves both manual
   targets and leaves FR absent. Reload preserves authored values and FR blank.
   Existing slug, wifi icon and group remain unchanged.
2. Selecting the amenity in Building EN checks the same identity across ES/PT/FR
   immediately, while each checkbox shows its language's resolved name. Common
   Save and reload preserve those checked states. Its shared amenity_ids and
   relation contain only that UUID. **All four public Building pages show the
   expected localized names**, with English fallback for blank FR. No Building
   Publish action is used. Existing Building name, teaser and SEO stay intact;
   target locale revisions/publications remain unchanged.
3. Renaming EN in taxonomy updates the EN and fallback FR public labels while ES
   and PT custom values remain. Clearing ES then updates its public label to the
   English fallback, retains PT custom text and leaves selection intact. Both
   changes reach all four public DOMs without Building republish. Building locale
   snapshots/revisions and shared document/revision equal their pre-rename values.
   At390px the four fields stay enabled, keyboard Tab moves EN→ES, and Building
   language tabs/checked checkbox remain functional.

The public checks ran against the compiled production candidate after actual
Save actions, exercising its existing cache invalidation. Final protected hashes
for previous amenities, Building/Apartment identities, relations, locale/common
rows, translations, slugs, Pages and Blog match their initial values, excluding
expressly owned e770/e771 fixtures. Zero page errors. No screenshots, geometry
assertions or aesthetic automation; appearance remains user-reviewed.

## Source review

Form reads distinguish raw authored target values from English fallback. The
selector loads approved localized content and retains an optional English label
compatibility path. Checkbox state still uses shared stable IDs. Staff-gated Save
validates trimmed EN/target bounds, uses existing source/target seams and clears
only an expressly blank target; omitted translations preserve older-client data.
Manual target writes are approved. Existing sequential writes remain sequential;
no new atomicity guarantee is claimed. Public and Building-admin invalidation is
present. Four message sets are complete. No kernel, schema, dependency or public
renderer change, and no new foreign-slice internal import was introduced.

Root reports integrated typecheck0, lint0 (seven existing warnings),16 pure groups,
three backend DB groups and full build0 with114 pages/two workers. Those global
checks were not independently duplicated by QA. `git diff --check 5c66aee` and
`node --check` for the QA script pass.

## Command, harness correction and artifacts

With safe `building-status-qa/env.sh`, the final command
`node /private/tmp/central-hill-amenity-locales-qa/independent/check.mjs` exits0 with
`FUNCTIONAL_QA_PASS 3`. An initial read-only hash preflight exited1 because the
harness assumed an id column in the composite-key building_amenity table. It
stopped before browser startup or mutations. Ordering hashes by stable row JSON
fixed only that harness; the subsequent functional run passed without reset or
product changes.

Artifacts under `/private/tmp/central-hill-amenity-locales-qa/independent`:
`check.mjs`, `check.log`, `results.json`, `protected-before.json`,
`final-translations.json`, `final-snapshots.json`, `browser-errors.json` and private
`auth.json` (synthetic login200, ready for root's one final main read check).
Final demo: EN label “EN Renamed amenity”, PT “PT Comodidade própria”; ES/FR blank
and publicly falling back to English. That same amenity remains checked in every
Building language. Main integration/runtime restoration belongs to root; QA did
not push or deploy.
