# Guests guide catalogue carousel — 2026-11-01

User requests the Services carousel treatment for “The Best of Portugal”, with
same-tab links to each guide, six cards per group, forward/back controls when
more guides exist, and Discover more linking to the full available guide listing.

Bounded root-owned follow-up in current workspace/main, basee5f0f44. Preserve
all preceding uncommitted changes. Writable: new shared slice component
guest-catalogue-carousel.tsx, guest-guide-cards.tsx and its tests, existing
guest-service-cards.tsx/tests, Guests renderer/schema/descriptor/admin layout,
EN/PT/ES/FR carousel/editor copy, Pages README, visual handoff and this spec.
No shared-kernel changes, database/storage writes, migration, dependency,
commit, push or deployment. No delegation needed.

Use Guides' public listGuideCityGroups(locale), already restricted to published
guides in published cities and tagged guide-list/geography. Flatten in catalogue
order, retaining only guides with both city and guide slugs. Cards use translated
title/intro/hero and Settings guide-template icons; links include locale/city/slug.
Share the Services layout through a slice-owned carousel of PhotoFeatureGrid
groups of up to6, with the listing CTA and optional note below it. Keep existing
section heading/intro/CTA editing; hide/preserve obsolete manual activities cards
and link staff to Guides. New publications/removals flow through existing cache
dependencies. Empty public catalogue hides the section; private preview keeps
heading editing available. Preserve70px section padding and hero/footer.

Verify Node22 typecheck/lint/build, focused Services+Guides component/adapter
tests and a read-only browser control/link check. No automatic visual QA,
screenshots, actual catalogue/BO save/delete or production/database writes.

## Delivery and verification

Implemented in the current working tree. Both Guests catalogues now share
guest-catalogue-carousel.tsx; Services keeps its verified behavior. Guides maps
published GuidePageSummary values into that same component. EN/PT/ES/FR carousel
labels and BO guidance are present. Legacy activities cards remain in snapshots
but have no editor controls or public consumption; staff edit the catalogue in
Guides through the new BO link. Discover More retains its editable CTA label
and targets the complete locale-relative Guides listing.

Node22 integrated checks:

- `pnpm typecheck`: exit0.
- `pnpm lint`: exit0, seven existing unrelated warnings.
- `pnpm exec tsx --tsconfig src/slices/pages/tests/tsconfig.json --test
  src/slices/pages/tests/guest-guide-cards.test.ts
  src/slices/pages/tests/guest-service-cards.test.ts
  src/slices/pages/tests/guest-editorial-adapter.test.ts`: exit0,11 cases.
  Includes shared6/2 and6/4 paging, same-tab routes, full-list CTAs, dynamic
  addition/removal/order, translated city/guide slugs, covers, missing routes,
  empty/one-page catalogues and hidden/preserved BO data. An initial test import
  unnecessarily loaded Settings' server environment; replaced only the test
  import with injected icon fixtures, keeping tests isolated from the database.
- `pnpm build`: exit0,210 static pages generated.
- `git diff --check`: exit0.

Read-only functional browser checks on localhost3071 at1440px and390px passed:8 guides
in6/2 groups, forward/back controls, same-tab detail navigation to
/en/guides/lisbon/things-to-do-in-lisbon, and Discover More→/en/guides.
Browser script:/private/tmp/central-hill-guest-services-functional.cjs --guides
(add --mobile for390px).
This checks behavior without screenshots or aesthetic review.

No actual publication/deletion, BO persistence or database/storage mutation was
performed. Catalogue changes are tested with fixtures; source review confirms
the published-only query filters city status and subscribes to guide-list and
geography tags, with Guides mutations invalidating guide-list. No migration,
commit, push or deployment. User reviews appearance in localhost3071.
