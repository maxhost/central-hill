# Forms

Forms owns reusable, editable form definitions and **staff-only test submissions**.
This arc does not change public page placement, existing Leads forms, the Leads inbox,
or the Avantio booking widget. Templates Contact, Newsletter and Owner estimate are
independent starting blueprints, with stable UUID fields/steps/options.

## Storage and contracts

`form_definition` stores an EN blueprint, internal name, one recipient, revision,
and draft/archived state. `form_test_submission` retains the exact localized blueprint
(including select labels and consent notices), normalized values, staff identity, saved
revision, recipient and provider attempt outcome. Tests are separate from production leads.

`server/queries.ts`: `listForms`, `getFormEditor` (serializable data, target state/staleness).
`server/actions.ts`: `createForm`, `saveForm`, `saveFormLocale`, `archiveForm`, `testForm`.
Every query/action rechecks staff authorization. Saves use optimistic revision checks;
source/target snapshots and revision changes execute atomically through kernel i18n seams.
EN is authoritative. Target locale saves replace the complete target text snapshot;
blank or omitted values clear that target and fall back to EN. Approved stale translations
remain usable, matching current CMS policy, and are marked stale in the editor.

The shared schema validator caps40fields,6steps,30options per field and verifies IDs,
step references, reply-to field type, numeric bounds and all submitted fields across steps.
Recipient must be a valid email before save/test. Test actions only use persisted revision;
archived or stale submissions are rejected before capture and email. Capture precedes the
email attempt. Result distinguishes accepted by provider, logged locally, skipped, failed;
provider acceptance does not guarantee delivery. Resend is behind `core/email`; this slice
never handles credentials or contacts vendor endpoints. No HTML inputs.

Date fields use the browser calendar and store a validated YYYY-MM-DD date without
timezone conversion. File fields attach one PDF or image (JPEG, PNG, GIF, WebP, AVIF)
up to 3 MiB per field; all attachments together may total 3 MiB across every step.
This production budget leaves multipart/answer headroom below Vercel's request cap.
The server validates
the content, type, filename and size before any test capture or email. File bytes
travel as multipart data and are attached through core/email; only verified file
name/type/size metadata is retained in the test answer JSON. No asset upload, public
URL or persistent file storage is created. ADR0086 supersedes ADR0078's original
5/20 MiB size limits for production. Console/disabled email modes
retain their existing behavior; they do not deliver attachments to an inbox.

Admin routes are dynamic/authenticated; no public ISR/SEO changes are introduced.
Other placements, a separate published-release lifecycle and broader retention policies
remain future work. The configured header placement is documented below.

## Verification

Node22: `pnpm exec tsx --test src/slices/forms/tests/forms.test.ts` exercises templates,
stable paths, localization fallback, definition constraints, full-step submitted values
and exact-label notifications. Integrated typecheck/lint/build/db:check and isolated
save/reload/browser QA are orchestrator-owned; see the active execution spec.

## Rows and columns (ADR0079)

New definitions use JSON schemaVersion2: steps contain ordered rows, each with one
or two columns and zero or one field per column. Fields retain their stable identity
in a flat catalog; step ownership and visual order derive from rows. The editor adds
rows and fields at explicit positions, reorders/moves rows, and moves or explicitly
swaps fields. Collapsing two occupied columns creates two consecutive single-column
rows without dropping either field. Empty slots remain editable; the test runtime
omits empty rows, preserves right-only desktop placement and stacks on mobile.

Strictly validated legacy schemaVersion1 definitions normalize deterministically in
memory. Opening a form or saving target-language text does not rewrite its legacy
definition. Explicit EN Save persists v2 through the existing revision guard. Old
clients cannot overwrite v2 with v1, and historical test snapshots remain untouched.
Layout-only changes preserve exact field/step/option texts and translation paths.
Forty fields/rows, six steps and thirty select options are bounded before save.

`layout.ts` owns immutable operations, pure normalization and visual-order traversal,
shared by editor, runtime, validation and notifications. New field/row IDs are stable
across moves and saves. Date/File inputs remain mounted between wizard steps and
retain their validated attachment behavior. No SQL schema or public form placement
change is introduced. See [plan](../../../docs/specs/form-builder/row-column-field-plan.md).

## Configured public header contact (ADR0080)

Settings stores a nullable form ID. No selection keeps the existing contact. Assigned
forms use their latest saved revision and approved locale copy/EN fallback. All three
templates are starting blueprints; this placement always captures kind contact.
Archiving an assigned form is blocked until Settings chooses another form or clears it.

`server-contract.ts` owns server-only options/availability/placement readers;
`schema-contract.ts` exposes only the FK table. Neither poisons the client barrel.
The public DTO contains only ID/revision/locale/fingerprint/definition, never recipient
or test history. The shared renderer uses neutral public controls, retains fields/files
across steps, displays field/stale/rate errors and preserves one key across retries.

The anonymous action checks the current assignment and revision again inside atomic
capture through the Leads server contract. Stable-key retries never capture/notify twice;
changed answers or bytes cannot reuse another capture. Snapshots retain localized
labels/options/accepted notices and file metadata. No file bytes enter lead persistence.

`form_public_rate_limit` shares five logical attempts per ten minutes per HMAC IP key
and a100/minute global ceiling across processes; recent identical keys can retry within
the global ceiling. Old counters are pruned opportunistically. The same transaction
advisory lock serializes assignment, saves, archival and guarded capture, with a fresh
READ COMMITTED statement after the lock. Public cache tags are declared in public-types.

Notifications use the saved recipient and validated reply-to through core/email/Resend.
Local delivery remains console pending Resend configuration; neither console nor a provider
ID proves inbox reception. A failed email preserves the captured lead. Attachments are
not persisted for later retries; their names/types/sizes remain visible in Leads.

See [execution](../../../docs/specs/form-builder/header-contact-assignment-execution.md),
[plan](../../../docs/specs/form-builder/header-contact-assignment-plan.md) and
[QA](../../../docs/specs/form-builder/header-contact-assignment-qa.md).

## About Contact shared placement

Pages → About → Contact owns one optional form selection, exclusively in EN draft
and published JSON. The public reader follows published EN for all four languages;
explicit staff-preview overrides read saved definitions without becoming public
assignment authority. PublicContactForm `preview` is inert and has no submission
path. The selected blueprint supplies fields and responses; About keeps its own
heading and subtitle. Invalid/unset references preserve the original contact form.

The About action verifies the published assignment identity and form revision,
then shares the header validator, attachment policy, durable global/personal rate
counters, atomic Leads capture and core/email notification. About always captures
`contact`/`about-contact`, regardless of the definition's starting template. Its
payload hash binds published assignment and placement; capture also compares the
stored lead source. Original header hashes and valid historical retries remain
compatible. Both insert and replay recheck assignment/revision under the shared
serialized lock. Draft saves do not alter the published assignment identity.

About EN draft and published uses independently block archive; target snapshot
copies create no additional use. Form Save/Approve invalidates all four About
routes as well as the independent header when applicable. Cross-slice SQL readers
and guards live in server-only contracts, outside client-consumed barrels.
Resend remains unconfigured; console and simulated transport checks do not prove
inbox receipt or attachment delivery. No new schema or backfill is required.

## Guest owner dialog shared placement

Guest → Closing dual CTA → Owner contact selects one saved Form from the common
catalog. Its public authority is exclusively the Guest EN published assignment;
About and header retain independent selections. `readGuestContactForm` returns
approved locale copy with EN fallback and no recipient or test data. Explicit
preview overrides require staff and stay fresh/private; the runtime remains inert.
Guest keeps its own dialog title and intro, while Forms contributes only its body.

The dedicated Guest owner action fixes `contact`/`guests-dual-cta`, validates the
published identity and current definition, and shares all durable rate counters,
attachment limits, capture guards and core/email notification with About/header.
Guest snapshot hashes bind location and published identity without changing either
historical About hash shape or legacy header hashes. Stored lead source prevents
cross-location key replay even when snapshots are otherwise identical.

Guest EN draft OR published use blocks archive alongside About and Settings;
messages identify every active location. Guest target copies create no independent
use. Form Save/Approve invalidates all four `/guests` routes when used there and
retains existing About/header invalidations. No schema, external service setup or
real email delivery is introduced; Resend remains unconfigured.

## Real Estate Enquiry placement

Real Estate → Enquiry selects one saved Form from published EN for all four
languages; staff preview explicitly supplies the current EN working selection.
`readRealEstateEnquiryForm` uses approved locale copy/EN fallback and excludes
recipient, tests and pending translations. PublicContactForm routes this model to
`submitRealEstateEnquiryForm`; its private preview remains inert. Pages retains the
section/contact copy and the original static fallback when no Form is selected.

The configured placement fixes source `real-estate-enquiry`. Trusted Leads capture
derives existing kind `deal_enquiry` for this source alone; Header/About/Guest
remain `contact`. Replay checks expected kind as well as source, payload, form and
revision. Existing three-placement hash seeds and notifications remain unchanged;
Real Estate uses a `[Deal enquiry]` notification. All four share the same durable
admission counters, validation, attachment limits and unique-winner notification.

Real Estate EN draft OR published use blocks archive alongside the three earlier
placements, with every active location named. Form Save/Approve invalidates four
`/real-estate` routes when used there and preserves other placement invalidations.
No schema/backfill, external setup or email delivery verification is introduced.
Resend remains unconfigured; console/simulated transport cannot prove inbox receipt.

## Individual Service enquiry placement

Each Service chooses a saved Form from its EN editorial snapshot. The shared
Services data is live on Save, so this reference deliberately stays outside it:
EN draft is private, and EN Publish activates the common selection in all four
languages without publishing target copy. Target references never own assignment.
Services preserves its `enquiry` / `external` / `none` routing and original contact
fallback. `readServiceEnquiryForm(serviceId, locale)` also verifies that the service
and requested locale remain public and enquiry-enabled before returning a model.

`submitServiceEnquiryForm` requires a stable service UUID and the published
assignment identity. Services supplies the fresh SQL guard; Forms derives canonical
`source_page=service:<UUID>` on the server, with kind `contact` for every template.
The historical snapshot stores the service UUID, source and assignment identity;
its payload hash separates two services sharing one Form and prevents replays
across the four older placements. Their hash seeds and notifications are unchanged.
Public DTOs include only identity and localized blueprint, never the recipient or
private tests. Service notifications name the stable UUID. All five placements
share validation, durable quotas, atomic capture and unique-winner notification.

Forms Archive also checks EN draft OR published use by any Service, including
archived and non-enquiry services; target references do not reserve Forms. Save and
translation approval invalidate actual localized Service routes and service-list
alongside existing Header/About/Guest/Real Estate caches. No schema or backfill,
private preview system, external setup or real email delivery is introduced.
