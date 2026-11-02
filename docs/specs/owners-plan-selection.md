# Owners plan selection — local implementation

Base: `e5f0f44019f8cc9c4f60df1d86a998f23bce796d`.
Workspace: `/Users/maxi/Documents/claude-workspace/central-hill`, branch `main`.
Existing uncommitted changes: the two plus connectors in PricingCards/Owners
and ADR0045. Preserve those changes.

Simple task, root implementation only. Writable files: `src/core/ui/pricing-cards.tsx`,
`src/slices/pages/ui/owners-page.tsx`, this spec, ADR0046 and Pages README.

Acceptance: first two tiers are mutually exclusive radios; last two are
independent checkboxes. Native selectors and Choose buttons remain synchronized.
Changing base preserves extras; toggling extras preserves the base and the
other extra. No initial selection, persistence or navigation on Choose.
EN/PT/ES/FR use the existing tier copy for control names and button text.

Functional checks: Node22 `pnpm typecheck`, `pnpm lint`, scoped browser actions
on localhost3071 (desktop/mobile and keyboard), and `pnpm build` (production
output is separate from the running `.next/dev` preview). No database changes
or persistence tests. Visual appearance remains for user validation; no aesthetic QA.
No push or deployment.

## Delivery and verification — 2026-10-31

Implemented in the working tree above the recorded base, with the preceding
connectors preserved. No local commit requested for this follow-up.

- Node22 `pnpm typecheck`: exit0.
- Node22 `pnpm lint`: exit0, seven existing warnings outside the edited files.
- Node22 `pnpm build`: exit0, all210 static pages generated. Initial sandbox
  attempt was blocked from opening an internal Turbopack port; approved retry
  outside the sandbox completed successfully.
- Node22 `node /private/tmp/central-hill-owners-selection-qa.cjs`: exit0 after
  approved Chromium execution outside the sandbox (initial launch was blocked).
  At1440px and390px, verified empty initial state, native input/Choose sync,
  exclusive bases, simultaneous extras, independent extra removal, preservation
  of extras on base change, repeated base choice, native arrow/Space keyboard
  behavior, no Choose navigation and empty state after reload. PT/ES/FR render
  two radios/two checkboxes with localized names and working Choose actions.
- Root functional verification only; no independent-agent QA or aesthetic review.
- Existing SEO/ISR, per-language page data and plus connectors are preserved.
  No database writes, migration, submission, push or deployment.

Changed paths including new docs: PricingCards, Owners renderer, Pages README,
ADR0046 and this spec. Pre-existing connector ADR0045 remains untracked as before.
Preview remains `http://localhost:3071/en/owners#plans`.

## Visual follow-up

User requested selectors centered below each Choose button and identical circular
styling for radios and checkboxes. Implemented in PricingCards with native input
types and existing handlers preserved. This is aesthetic L0: no automated tests
or QA for this follow-up; user validates on localhost. The checks above cover
the preceding functional implementation, before this visual adjustment.

## Live total follow-up — 2026-10-31

User supplied a reference for a Total / Service fee / percentage / profitability
CTA band below the cards. Replaces the static helper band and sums the displayed
corner badges (currently10%,14%,+5%,+9%), not hidden legacy commissions. No
selection shows a localized prompt; malformed selected badges show unavailable
copy. CTA uses the existing editable helper label and links to the earnings form.
See ADR0047. Existing circular controls and selection rules are preserved.

Additional root-owned files: `src/slices/pages/ui/plan-percentage.ts`, its test
`src/slices/pages/tests/plan-percentage.test.ts`, messages EN/PT/ES/FR and ADR0047.
No schema or database changes. Functional verification covers percentage parsing,
sum updates after radio/checkbox/Choose actions and decimal precision. Visual
review remains with the user under L0; no automated visual QA.

Latest visual refinements preserve CalloutBand's previous warm palette, border,
10px corners and primary button. The compact summary aligns beneath the last
two desktop cards at `(100% - 40px) / 2`, with24px padding, reduced type and a
small CTA. The latest reference correction keeps three columns: Total / Service
fee left, percentage center, button right. Below681px the CTA spans the row
beneath the total. Mobile keeps the available width.
No automated tests/QA were run for these aesthetic refinements. The new total
follow-up's verification was interrupted by the user; earlier recorded checks
cover the preceding selection implementation, not the live-total additions.

## Package estimate modal — authorized follow-up

Same base/workspace and preserved uncommitted work as above. Simple root-owned
implementation. Additional writable paths: the existing OwnerEstimateForm,
new `src/slices/pages/ui/components/owners-plan-picker.tsx` and ADR0048; existing
PricingCards, Owners renderer, four message catalogs, README and this spec.

Contracts: PricingCards exposes only a generic client renderSummaryAction
callback with selected tiers. The slice wrapper owns the dialog and form;
kernel imports no slice. Share the hero's form copy; modal-only ID prefixes
avoid duplicate IDs. No forms capture, validation, email or database changes.

Acceptance: Total CTA opens a modal with the same three wizard steps and current
selected package names in a brand-colored single row after the properties /
bedrooms pair. Real tier names, plus separators, localized labels and empty copy.
X/Escape/backdrop close; native focus trap, trigger focus restoration, scroll
lock and fresh wizard state on reopen. Changes to selection apply on next open.
Hero wizard and Buildings remain unchanged. No database writes or deployment.

Functional verification: Node22 typecheck/lint, percentage parser tests, local
build, and scoped localhost browser checks for selection totals, dialog actions,
wizard navigation, field isolation, keyboard and mobile. No aesthetic QA.

### Functional verification — modal candidate

Root verification on the working tree above the recorded base; no independent
agent QA claim. Node22 throughout:

- `pnpm typecheck`: exit0.
- `pnpm lint`: exit0, seven existing warnings plus one new ref-cleanup warning;
  the new warning was corrected by capturing the trigger before effect cleanup.
  Targeted ESLint on the corrected wrapper passed with no output.
- `pnpm exec tsx --test src/slices/pages/tests/plan-percentage.test.ts`: exit0,
  two cases covering authoritative visible badges, localized/additive decimals,
  bounds and missing/ambiguous/invalid badge rejection. Approved execution outside
  sandbox because tsx's local IPC channel is restricted.
- `pnpm build`: initial modal candidate and final rebuild after the keyboard-wrap
  correction both exit0, all210 static pages generated. Final targeted ESLint
  and `git diff --check` also exit0.
- `node /private/tmp/central-hill-owners-modal-qa.cjs`: exit0 after one targeted
  correction: native Tab from the last control briefly focused the document;
  explicit visible-control wrapping now keeps focus in the dialog. Rechecked
  at1440px/390px: all eight base/extra fee combinations, extras without a base,
  empty/selected package rows, shared copy, all3 wizard steps and Back, field
  values across steps, fresh state and current packages after reopen, unique
  form IDs/labels, hero value independence, X/Escape/backdrop close, focus return,
  body-scroll restoration and no POST requests. PT/ES/FR dialog/package copy,
  first-step controls and Escape also passed. Chromium ran with approved access.

The wizard still preserves the hero's pre-existing non-submitting behavior;
no capture or email implementation was added. No DB writes, schema changes,
push or deployment. Aesthetic validation remains with the user on3071.

Additional changed/new paths for this follow-up: OwnerEstimateForm,
OwnersPlanPicker, ADR0048; edits to PricingCards, Owners renderer, four locale
catalogs, Pages README, ADR0047 and this spec. Earlier session edits and artifacts
remain preserved. No commit requested for this follow-up.
