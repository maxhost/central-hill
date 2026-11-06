# Visual editor button labels — 2026-11-05

## Follow-up: all nine Pages editors

User requests the same element distinction throughout Pages. Root reviewed the
nine schema/descriptor/rendering paths in source. The existing contextual helper
already covers `cta.label`, primary/secondary CTA labels and `cta_label`; the
remaining bare Text case is Owners/Buildings `hero.contact.label`. It now reads
Contact button. Guest closing owner/guest CTA objects retain their panel context.

Localized Pages labels now name button elements directly, rather than their text:
Button, Contact button, Card button, Submit button, Back button, Choose button and
Open guide button. Guides' existing form-specific `catalogue.view_label` override
uses the same wording as its Element selector. EN/PT/ES/FR are updated; BO stays
English. Ordinary body/copy, figure labels, badges, accessible search labels and
the city-filter label retain their non-button wording.

| Page | Authored button fields covered |
|---|---|
| Home | Hero primary/secondary, guests pitch, portfolio/card actions, closing panels |
| Owners | Hero contact, why primary/secondary, services/dashboard, helper band, choose/estimate/submit/back, closing CTA |
| Buildings | Hero contact, owner panel, calculator and submit/back |
| Real Estate | Hero/partners primary/secondary, capability/asset/process CTAs, enquiry submit |
| Guest | Why/portfolio/services/activities CTAs and closing owner/guest panels; hero booking remains shared chrome |
| Guides | Open-guide card action, closing CTA and shared aside CTA |
| Services | Closing CTA |
| About | Contact-card action labels |
| Blog | Shared post-aside CTA |

Follow-up write set: `admin/home-contextual.ts`, four `messages/*.json` files,
Pages README, this spec and current visual handoff. All earlier Home localized-URL
and label changes remain pending/preserved, including their new files; unrelated
untracked base-logo PNG remains untouched. No URLs, stored content, schemas,
selection IDs, save/publish/translation behavior or public components change in
this follow-up. Local3071 remains listening, no restart requested or needed.

L0 copy-only refinement: source review only, no automatic tests, typecheck, lint,
build, detector, browser QA or persistence operations. Previous functional Home
verification does not cover these later copy changes. User validates on localhost.
No commit, DB write, push or deployment.

## Original Home label refinement

Small local L0 copy refinement on main, base `509d785`, handled by root. Preserve
the unrelated untracked base-logo PNG and ignored environment configuration.

The Home hero preview selects `hero.cta_primary.label` when clicking Book Now.
The selector previously flattened its parent context away, showing “Text”; the
adjacent generic “Link (URL)” is `hero.cta_primary.url`, consumed directly by
HomePage's primary ButtonLink. It does not configure the navbar booking link.
The secondary hero button has an editable label and a fixed localized Owners URL.

`admin/home-contextual.ts` now supplies path-aware button labels for CTA label/URL
fields, preserving primary/secondary identity. Standalone CTA label fields use
Button; closing owner/guest panels retain panel identity. Ordinary badge/figure
labels retain Text. The same wording is used in selector bindings, nested schema
controls and target-language text fields. Three URL labels exist in EN/PT/ES/FR.
Paths, values, schemas, preview selection and persistence remain unchanged.

Owned files: this spec, current visual handoff, Pages README;
`admin/home-contextual.ts`, `admin/ui/page-contextual-editor.tsx`,
`admin/ui/schema-fields.tsx`, and four `messages/*.json` files.

User requested localhost3071 relaunch for review. No listener was present before
starting. Preserve the old `.next/dev` cache under a unique temporary backup and
start this checkout with Node22. Aesthetic L0: no tests, check suites, automated
browser QA, login submissions, draft saves, publish, media uploads or database writes.
No commit, push or deployment requested. User validates the labels on localhost.

Runtime: Node22 dev server reported Ready on3071 (session11992). Initial sandbox
start could not bind the port (EPERM); authorized escalated relaunch succeeded.
Previous dev cache preserved at
`/private/tmp/central-hill-dev-cache-20261105-114526-769157`.
