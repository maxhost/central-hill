# Apartment booking URL and SEO removal — independent QA

2026-11-06. **Approved** executable `37a8fe1` on
`apartment-booking/integration`, checkout
`/private/tmp/central-hill-apartment-booking-integration`. No product blockers found.
Root supplied the compiled production candidate on the single localhost3071;
QA did not start or stop servers and did not edit product code.

## Environment and scope

Before browser mutations, SQL verified both database and role as
`propertylocalesqa` (existing local DB/proxy5658/4558, storage9077). Only the
root-created Apartment `e7610000-0000-4000-8000-000000000002` was edited through
its actual form; its parent Building `e7610000-0000-4000-8000-000000000001` was
read publicly and received normal owned-parent statistics updates on publication.
No migration, direct content SQL mutation, fixture reset or upload was needed.
No remote content writes or external booking navigation occurred.

Production rendering exercised real Save/Publish invalidation against the public
Building's UnitCard, rather than relying on development rendering. This is a
normal bounded functional check, not a wider visual or adversarial matrix.

## Browser evidence — three groups passed

1. Opening the editor writes no locale rows. It presents one Booking URL input,
   shows the existing effective URL, and omits Avantio ID, base/old-override URL,
   SEO heading, metadata and OG controls. An unrelated Badge Save preserves the
   absent new field and all legacy data. An actual EN URL Save survives reload
   while the public card keeps its previous URL; explicit EN Publish changes its
   href and retains `target="_blank"`, `rel="noopener noreferrer"`. PT publication
   remains on the old destination.
2. PT working URL follows saved English until its first local change. PT URL
   Save/reload/Publish preserves and publishes its own destination. Later EN URL
   changes remain private until EN Publish, and do not overwrite PT working or
   published values. PT and ES/FR locale rows/revisions remain unchanged after
   that later EN publication.
3. At390px, language controls work through native keyboard focus/Enter and the URL
   field stays usable. Clearing EN URL, Save and Publish changes its public card
   to `#book` without reviving the stored legacy URL. PT keeps its own URL. Both
   Building-owned booking buttons retain their separate parent destination.

Every saved/published document inspected retains its existing Avantio handle,
legacy default URL, SEO title/description, OG image, retired description, cover
and physical facts. Final identity physical/common columns equal their initial
values. Hashes/counts for existing Building/Apartment identities, locale/common
rows, translations, slugs, Pages and Blog remain unchanged, excluding the expressly
owned e760/e761 fixtures. Zero page errors. No screenshots, geometry assertions
or aesthetic automation; user validates appearance on localhost.

## Source review and other verification

The optional localized `booking_link` is excluded from common keys. Its absence
uses legacy resolution; explicit null wins over the hidden default. New documents
initialize null. The form guards no-op edits, preserves complete existing payloads
and removes the entire SEO subtree. The English admin link indicator now uses the
same resolver with its existing saved-draft-first semantics. Public UnitCard and
Building rendering stay unchanged. Existing cache invalidation covers the parent;
no public Apartment route, kernel, package or schema change was introduced.
All four locale messages and the Apartment-specific ownership hint are present.

Root reports integrated typecheck0, lint0,13 pure tests and8 identical backend DB
checks, plus final full build0 with110 pages. The initial build was interrupted by
root with exit130 after prerender timeouts during high machine load. The identical
source then built successfully using `CIRCLE_NODE_TOTAL=3`, which limits this
installed Next version to two workers; no product/config-source change was used.
Those global checks were not independently rerun by QA.

QA commands: source the safe `building-status-qa/env.sh`, then
`node /private/tmp/central-hill-apartment-booking-qa/independent/check.mjs` — exit0,
`FUNCTIONAL_QA_PASS 3`. `node --check` for the script and
`git diff --check 55ff629` also exit0.

Artifacts under `/private/tmp/central-hill-apartment-booking-qa/independent`:
`check.mjs`, `check.log`, `results.json`, `protected-before.json`,
`final-snapshots.json`, `browser-errors.json` and private `auth.json`.
Auth state was saved after synthetic login200 for root's one read-only final main
check. Final sample: EN explicitly clears its URL, PT publishes
`https://example.test/apartment-portugues`, ES/FR retain legacy publications.
Local main integration/runtime restoration belongs to root; QA performed no push
or deployment.
