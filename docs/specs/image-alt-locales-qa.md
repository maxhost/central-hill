# Image ALT locales — independent QA

2026-11-08. Product candidate `004c089`, corrected product `f434afe`.
Integration branch `image-alt/integration`; correction served from the separate
`/private/tmp/central-hill-image-alt-corrected-runtime` checkout. Root owns runtime
and compilation. QA changed no product code and started no server.

## Scope and environment

Reviewed the executable spec, ADR0076, source diff, validation, localized/shared
projections and actual public/private readers. Verified workspace/branch/commit and
clean tracked candidate before starting. Synthetic hostname, SQL database and role
all `propertylocalesqa`; DB5658/proxy4558/storage9077. No remote DB, migration,
push or deployment. Existing authenticated local Admin session reused.

Own guarded-absent fixtures use `e866f000-0000-4000-8000-*` only: Services/category,
Guide/section/place, Blog/category/author, Building/Apartment, City, Settings and
the absent fixed Owners page. Existing photos and the existing Guide city were
read-only. No existing Page, metadata, translation, slug or media write. The
original baseline contains 42 protected business tables and no Settings singleton.
Manifest and scripts: `/private/tmp/central-hill-image-alt-qa/independent/`.

## Four bounded functional groups

| Group | Exercised behavior | Result |
| --- | --- | --- |
| Services / Guides | Four Service ALTs including gallery, itinerary and OG; ES Save/reload/Publish; draft privacy; later EN Publish preserves ES; another Service reusing the same photo stays independent. Guide hero/OG plus expanded section/place ALTs, ES own draft/publication and actual public images; PT/FR tabs and 390px viewport. | Pass |
| Blog / properties | Blog body keeps its one existing ALT control, with separate cover/OG controls; ES cover and body Save/Publish/public output. Building same-photo cover/gallery controls stay synchronized by UUID, draft remains private, EN and FR publications work. Apartment PT Save/Publish, actual required-instance private preview and public card inside its own PT-published Building. Existing shared-photo control policy preserved. | Pass |
| Pages | Own Owners page ALT updates ephemeral live preview before Save; actual EN/ES Save/Publish and private drafts; later EN publication leaves own ES ALT public and unchanged. Target photo controls remain locked while ALT is enabled; OG ALT editable in PT. Existing About stock-photo ALT restored after the correction, no duplicate generated field, local edit/restoration and 390px viewport without Save. | Pass |
| Non-tab forms / boundaries | Four raw inputs in Author/City/Settings, actual Save/reload, own target survives EN changes, blank target uses EN, EN clear keeps approved FR. Settings OG ALT checked in four public locales. Anonymous replay of a real Settings action redirects/denies with exact unchanged ALT rows; unauthenticated Settings redirects to Login. New Service photo reservation exposes editable ALT before first Save, with zero PUT requests, zero new media rows and zero new Service rows; queued browser context discarded. | Pass |

Final group artifacts `group1.json`–`group4.json` all record `ok:true` and zero
browser `pageerror` events. DOM/state/persistence checks only; no screenshots,
geometry review or aesthetic iteration. Author avatar and City hero retain their
existing unused public placement; no invented renderer or new placement was added.

## Finding and correction

**P2, resolved — existing Page ALT hidden without an uploaded image.** In the
initial candidate the target inspector removed every paired sibling ALT from the
text controls, including siblings whose image preview did not render. About ES
therefore lost its existing `hero.image_alt` control while using the stock photo.
Root independently identified the same issue; read-only browser confirmation is
`about-target-before-fix.json`. Root correction `f434afe` computes the exclusion
from the actual rendered preview set. Corrected About ES shows “Image alt text”,
permits edit/restoration and works on mobile. No About Save or data mutation.
Evidence: `about-target-after-fix.json` and `group3-seo-about.json`.

The corrected build used a separate checkout and never overwrote the running
candidate's `.next`. Unaffected browser cases were retained; only pending cases
and the confirmed Page fallback defect were checked on the corrected runtime.

## Harness adjustments and cache timing

Harness-only corrections: use `guide_id` in the SQL observer, declare a continuation
variable, wait for Tiptap hydration, respect the incumbent Apartment shared-media
policy, use the real nested public Apartment card and required preview `instance`,
match “EN English source”/“SEO EN” and the existing About Field container, and
continue a completed Settings Save after its 25-second observer window. These
caused no product correction and already completed writes were not reset/repeated.

Owners was absent when the first build ran, so its initial public404 remained the
baseline until ordinary Publish. The corrected build later captured the new ES
fixture before its subsequent ES publication, producing an older public snapshot.
With root coordination, one ordinary own ES Save/Publish established the corrected
runtime baseline, followed by an EN ALT edit/Save/Publish and an actual ES public
isolation assertion. No cache flush, manual invalidation, restart, existing Page
write or broad matrix repeat was used to resolve this fixture/build timing.

## Data preservation and closeout

Only the manifest's own fixtures and their translation/slug references were cleaned;
the queued upload was never finalized. Independent `protect.mjs` returned0 after
cleanup: **all 42 protected business-table hashes exactly match the original
baseline**, Settings returns0 and Owners is again absent in both Page tables.
Evidence: `protected-after-cleanup.json`, independently compared with root's
`protected-before.json`. No old singleton/Page snapshot-delete-restore operation.

Root retains sole3071 ownership (corrected production PID42111/parent42105 at QA
completion) and handles actual-main opening and integration. Global Translations
retirement remains outside this task.

**Status: approved `f434afe`.** Four bounded functional groups passed, zero captured
browser page errors, confirmed P2 fixed/retested, no open product finding and
protected data exact after own cleanup.
