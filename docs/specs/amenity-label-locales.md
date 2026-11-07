# Amenity labels and localized Building selector —2026-11-06

User requests four Label inputs (EN/ES/PT/FR) in Amenity create/edit, then translated
checkbox names in the matching Building editor language with the same selections
across languages. Base main5c66aee, tracked clean except preserved logo/publicmedia
symlink. Integration amenity-locales/integration at
/private/tmp/central-hill-amenity-locales-integration. Local main/3071 delivery;
no push/deploy/remote writes/new DB/schema. Existing synthetic propertylocalesqa
test permission persists. No follow-up Services/Apartment lifecycle work.

## Contract and acceptance

ADR0064 uses existing amenity translation rows. AmenitySaveInput retains EN label
and adds optional translations:{es,pt,fr}, strings trimmed/max80; EN required1–80.
Omitted translations preserve older-client targets; present blank target removes
only that target label, falling back to English. One existing Save applies labels
immediately; nonblank manual targets approved through core i18n seam. No automatic
translation, separate target Publish or new kernel API/migration. Pending authored
targets load raw into form; absent values stay blank (not copied fallback). EN
change must preserve custom target values. Existing sequential action writes are
retained, no new atomicity claim. Slug/icon/group/usage/delete behavior stays.

AmenityOption optionally adds labels:Record<Locale,string> (actual query fills all
four, English/slug fallback). Existing label remains English compatibility. Edit
data adds translations raw record. Shared type amenity-types.ts. Selector uses
labels[locale] with label fallback for older fixtures; checked state still uses
stable shared amenity_ids. Selecting in EN appears selected ES/PT/FR before/after
Save and reload. Text/SEO/publications unaffected; existing common Save semantics.
Public Building amenities use already localized approved reader and taxonomy Save
invalidates relevant Building/Apartment/Home tags and admin Building edit layouts.

## File ownership

Root: this spec, ADR0064/index, amenity-types.ts, initial admin/validation.ts schema,
initial optional query-interface additions, messages4locales, AGENTS.md,
docs/data-model.md if documentation alignment needed, integration/runtime.

Backend: amenity-locales/backend at /private/tmp/central-hill-amenity-locales-backend.
Writable src/slices/buildings/admin/actions.ts (Amenity save only);
admin/queries.ts (Amenity reads only, other queries preserved);
server/amenity-labels.ts new helper to persist validated labels through existing
core seams, invoked by staff-gated action; tests/amenity-locales.integration.test.ts;
README.md. Revalidate Building admin routes as well as public cached reads after
Save. No kernel/schema/UI/messages edits. Request needed scope changes.

UI: amenity-locales/ui at /private/tmp/central-hill-amenity-locales-ui. Writable
src/slices/buildings/admin/ui/amenity-form.tsx; ui/amenity-payload.ts;
ui/building-locale-editor.tsx; tests/amenity-admin.test.ts. Four explicitly labelled
stacked text fields Label EN/ES/PT/FR, ENrequired, target fallback hint, proper ids,
maxlength80 and disabled pending. Keep slug/icon/group and existing page styling.
Form state owns EN label plus target record; payload sends all trimmed targets.
Selector picks option.labels?.[locale]??option.label, no new selection state.
No new tests mirroring markup; extend pure payload/schema cases meaningfully.

Independent QA: docs/specs/amenity-label-locales-qa.md and private artifacts under
/private/tmp/central-hill-amenity-locales-qa/independent only. No nested delegation.
Review integrated candidate, 3bounded normal desktop/mobile browser groups:
four-label Save/reload/manual approved/fallback and EN preserves custom targets;
Building tabs label change/shared selection Save/reload/public locale names;
taxonomy rename updates published amenities without republishing Building text.
No broad/aesthetic screenshot matrix; root manages sole frontend3071.

## Environment and verification

Node22/pnpm, same /private/tmp/central-hill-building-status-qa/env.sh and real
propertylocalesqa DB5658/proxy4558/storage9077. Verify SQL DB+role before any writes.
Store tests own e770 amenity/Building identities; browser root seeds e771 new
Amenity/Building only. No mutations to d/f/e751/e761/user fixtures. Clean own store
fixtures, retain browser demo. Do not change DB schema or use remote Neon.
No production credentials copied. Preserve actual-main3071PID58039/session64126
until candidate build ready; root swaps onto3071 and returns main after approval.

Checks: pnpm typecheck; pnpm lint; pnpm exec tsx --import
/private/tmp/central-hill-property-forms-qa/test-runtime.mjs --test
src/slices/buildings/tests/amenity-admin.test.ts
src/slices/buildings/tests/amenity-locales.integration.test.ts
src/slices/buildings/tests/property-locale-state.test.ts (safeenv+node-runtime.cjs).
Integrated pure checks and actual browser persistence/public ISR; identical writer
DB tests need not duplicate. pnpm build after store fixture cleanup; use local
CIRCLE_NODE_TOTAL=3 for2workers to avoid earlier high-machine-load timeouts, without
tracked config changes. db:check unnecessary without migration. Explicit boundary,
four-locale copy/fallback and cache review. Record commands/exits/hash/limits.

## Progress

Root contracts land before consumers. Results and final runtime follow.
