# Apartment booking URL and SEO form correction —2026-11-06

User requests exactly one full booking URL per language in Apartment editor,
opening the public unit card in a new tab, and removal of SEO-for-this-language
section because there is no public Apartment detail page. Base main55ff629,
tracked clean; preserve original untracked logo and synthetic publicmedia symlink.
Integration apartment-booking/integration at
/private/tmp/central-hill-apartment-booking-integration. Local main/3071 delivery
only, no push/deploy/remote DB/schema changes. Existing synthetic propertylocalesqa
authorization applies; no repeated permission question for scoped synthetic tests.

## Contract / acceptance

ADR0063 optional localized booking_link:string|null in existing v1 JSON. Root
lands type/schema before consumers. Public ApartmentBooking shape unchanged.
Resolver uses explicit booking_link (including null), else retains old
booking_url/default_booking_url fallback. New empty documents set booking_link:null.
Opening/unchanged input/unrelated Save must not materialize this optional field.
Use HTTP(S) validation/max2048. On real input edit, write selected locale only.
Preserve text ownership/inheritance and explicit language Save/Publish; custom PT
must survive later EN edits. No language is auto-published.

UI has one Booking URL input in localized content; remove Avantio ID/default URL
controls and entire SEO section, preserving their hidden document values. Tabs,
physical fields/media and current archive behavior stay unchanged. No public
Apartment route added. Blank URL retains existing #book fallback; configured full
URL uses existing UnitCard target=_blank and rel=noopener noreferrer. No kernel
or public Building renderer change expected. Preserve public names/photos/stats.

## Ownership / execution

Root owns this spec, ADR0063/index, editorial-types.ts, initial optional validation
schema, contract.ts documentation, messages4locales, AGENTS, integration/runtime.

Backend writer apartment-booking/backend at
/private/tmp/central-hill-apartment-booking-backend. Writable:
src/slices/apartments/server/editorial-validation.ts after root contract;
admin/queries.ts (existing EN list link indicator must use the same resolver);
tests/apartment-booking.test.ts; tests/apartment-booking.integration.test.ts;
tests/property-locale-editor.test.ts; tests/property-locale-store.integration.test.ts
only if adapting constructor-based legacy expectations is necessary; README.md.
Implement resolver/new default, meaningful legacy/new/null validation/state and
real store Save/Publish tests. Other files read-only, request expansion if needed.

UI writer apartment-booking/ui at /private/tmp/central-hill-apartment-booking-ui.
Writable only src/slices/apartments/admin/ui/apartment-locale-editor.tsx.
Use existing resolveApartmentBooking pure helper for displayed effective URL;
guard no-op edit before setting booking_link. type=url, maxlength2048, existing
44px form primitive minimum; localized error. Remove unused SEO-only imports.
No unrelated form layout/Building/public/kernel edits. No nested delegation.

Independent QA owns docs/specs/apartment-booking-qa.md and private artifacts under
/private/tmp/central-hill-apartment-booking-qa/independent. Root manages single
frontend3071. Source review plus normal bounded desktop/mobile Save/reload/Publish
EN/PT, public card href/target/rel, independence, clear/no-default-revival, SEO
absence and legacy data retention. No broad matrix/aesthetic screenshot loop.

## Environment / verification

Node22/pnpm. Safe env /private/tmp/central-hill-building-status-qa/env.sh,
propertylocalesqa DB5658/proxy4558, storage9077. SQL DB+role check before writes.
New tests own e760 identities; browser owns e761 Building+Apartment fixtures only.
Existing regression tests e420/e520 can run under their original guards/cleanup;
do not modify d/f/e410/e640/e740/e750/e751/user fixtures. No migrations.
Preserve actual-main3071 PID35045/session3504 until candidate is ready; root
temporarily swaps candidate onto3071 then restores actual main after QA approval.

Commands: pnpm typecheck; pnpm lint; pnpm exec tsx --import
/private/tmp/central-hill-property-forms-qa/test-runtime.mjs --test
src/slices/apartments/tests/apartment-booking.test.ts
src/slices/apartments/tests/apartment-booking.integration.test.ts
src/slices/apartments/tests/property-locale-editor.test.ts
(safeenv plus existing node-runtime.cjs AsyncLocalStorage shim); pnpm build after
test cleanup. Full build uses verified synthetic env. Existing affected DB tests
need not be duplicated if identical after integration; integrated pure tests and
actual browser persistence/public ISR verify assembled candidate. db:check not
needed without migrations. Review boundaries/i18n/ISR explicitly.

## Progress

Root contract lands before writer branches; results and final runtime follow.

UI follow-up: localized Apartment ownership hint must omit retired SEO; root adds
apartments.admin.customLocaleHint4locales, UIwriter changes its single consumer.
Shared Building hint stays intact. Necessary admin EN-list link indicator also uses
updated resolver (backend owner scope expansion above).
