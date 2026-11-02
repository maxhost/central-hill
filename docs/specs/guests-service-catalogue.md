# Guests services — synchronized catalogue, 2026-11-01

User requests same-tab links from every “Make the Most of Your Stay” card to
its service, with automatic addition/removal when the service catalogue changes.

Bounded root-owned implementation in the current workspace/main, basee5f0f44.
Preserve all preceding uncommitted edits. Writable: shared PhotoFeatureGrid and
ADR0050, Guests renderer/schema/descriptor, new guest-service-cards component
and focused tests/JSX test config, Pages admin layout/README, EN/PT/ES/FR editor notes,
this spec and visual handoff. No database/storage writes, migration, packages,
commit, push or deployment. No delegates needed for this small sequential change.

Contract: use published Services listServices(locale) through its public contract.
Follow-up request: display groups of at most six cards (3×2 on desktop), using
the same shared Carousel controls as Portfolio to reach every published service.
Keep Explore All Services linked to the full catalogue, with its note below
the button. Cards consume the catalogue's localized name/excerpt/cover/category
icon/slug and catalogue order. Real internal Next links open in the current tab.
No service means no public section; staff preview can retain the editable heading.
PhotoFeatureGrid gains optional item id/href, retaining unlinked cards elsewhere.
Hide/preserve the obsolete services_teaser.items BO array; section heading/intro/
CTA remain editable. Existing legacy identities/media remain compatible, without
copying/deleting catalogue data. Service-list cache dependency flows through the
Guest renderer's public read, using the existing Services invalidation contract.

Acceptance: catalogue additions/removals/reorder and translated slugs flow into
the rendered cards; all cards have same-tab service detail links, distinct from
external booking CTAs inside those service pages. Existing activities cards stay
unlinked. Node22 typecheck/lint/build and focused React-rendered functional tests;
no automatic visual QA or real BO/catalogue mutations against the remote DB.

## Progress

Inspected contracts and existing published build: ten services currently listed
in EN/PT/ES/FR. Dynamic section will reflect all published services, replacing
the old manually maintained six-card subset, displayed six per carousel page.

## Delivered behavior and verification

Implemented in the current working tree, with preceding changes preserved.
New files: ADR0050, this spec, guest-service-cards.tsx, its functional test and
Pages tests/tsconfig.json (automatic JSX for rendered-component tests).
Legacy manual service card values/identities/media remain preserved but hidden
in BO. Staff use the Services link in the section note to manage catalogue cards;
Guests continues to own the section heading, intro, button and helper copy.

Node22 commands on the integrated working tree:

- `pnpm typecheck`: exit0.
- `pnpm lint`: exit0, seven existing unrelated warnings.
- `pnpm exec tsx --tsconfig src/slices/pages/tests/tsconfig.json --test
  src/slices/pages/tests/guest-service-cards.test.ts
  src/slices/pages/tests/guest-editorial-adapter.test.ts`: exit0,7 cases.
  Covers groups of6/4, no truncation, same-tab detail URLs, catalogue additions/
  removals/order/localized slugs, cover images, helper below listing CTA, hidden
  legacy fields and unchanged unlinked Activities. Initial runner attempts with
  JSX-preserve/partial includes failed; the scoped automatic-JSX config fixes
  test execution without changing product imports for the runner.
- `pnpm build`: exit0,210 static pages generated.
- `git diff --check`: exit0.

Read-only functional browser check at1440px on localhost3071: pass. Ten current
services appear in groups6/4; next and previous scroll correctly; all card links
have internal detail destinations without a target; Explore All Services points
to/en/services; helper is a paragraph below its button. Clicking the first card
opened/en/services/private-airport-transfer in the same browser tab.
Script retained at/private/tmp/central-hill-guest-services-functional.cjs.
Chromium and tsx needed approved sandbox access for their local processes/sockets.

No automatic visual QA/screenshots, real service creation/deletion, BO saves,
media uploads, database/storage writes, migration, commit, push or deployment.
Addition/removal behavior is covered by injected catalogue fixtures; actual
mutations were intentionally not exercised against the remote database. Source
review confirms Services save/delete call revalidateServices/service-list, and
Guest rendering now depends on that cached list through the public contract.

Later Guides follow-up: Activities now also consumes its published catalogue
through the shared Guests carousel, replacing the manual unlinked cards noted
in this delivery. See guests-guide-catalogue.md. Services component tests remain
included in the11-case integrated follow-up run.
