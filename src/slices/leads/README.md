# Slice `leads` (S10)

Form capture for the public site. Four form **kinds** — earnings estimate, deal enquiry,
contact, newsletter — share **one pipeline** (ADR 0011 / 0014): a public submission is
validated, persisted to `lead` + `lead_field`, and triggers a best-effort staff email; the
follow-up workflow lives in the backoffice inbox (**S12**). Lead field values are
**user-entered data — never [T]** (not translated). See `docs/vertical-slices.md` → S10.

## Owns

**Tables** (`schema.ts`, migration `0000`):
- `lead` — `kind (earnings_estimate|deal_enquiry|contact|newsletter), status
  (new|in_progress|closed), locale, source_page, assigned_to?` + first-class GDPR consent:
  `marketing_consent, consent_text` (verbatim snapshot of the notice shown), `consent_at`,
  `ip_address`, `user_agent` (ADR 0014).
- `lead_field` — `lead_id → lead (cascade), key, value` KV child. Documented keys per kind
  (data-model.md): earnings `property_address, num_properties, num_bedrooms`; deal
  `company_name, contact_name, contact_title?, email, phone?, country, asset_type,
  units_count?, locations?, …`; contact `name, email, subject, message`; newsletter `email`.

No new migration: both tables already ship in `0000`.

## Contract (`contract.ts`)

- `submitLead(input, honeypot?) → LeadActionResult` — the single public server action.
  Re-validates the `leadSubmission` discriminated union server-side, stamps consent proof,
  persists, notifies. Returns `{ ok: true }` or `{ ok: false, error, fieldErrors? }`.
- `EarningsEstimateForm`, `DealEnquiryForm`, `ContactForm`, `NewsletterForm` — ready-to-embed
  client islands. Props: `LeadFormProps { source, className? }` (`source` → `lead.source_page`).
- Types/values: `LeadKind`, `LeadSubmission`, `LeadActionResult`, `leadKind`, `leadStatus`,
  `LEAD`.

Leads are **not public content** — this slice declares **no ISR cache tags** and wires no
`revalidate`. (The backoffice inbox in S12 reads its own data.)

## Pipeline (`server/`)

`actions.ts` (`"use server"`) → `submitLead`:
1. **honeypot** — a non-empty hidden field ⇒ treat as bot, return `ok` without persisting.
2. **validate** — `leadSubmission.safeParse`; on failure return per-field messages
   (path stripped of the `fields.` prefix so keys match the form inputs).
3. **consent proof** — server-stamped `consent_at = now`, `ip_address` (`x-forwarded-for`),
   `user_agent` — never trusted from the client.
4. **persist** — insert `lead`, then the flattened `lead_field` rows.
5. **notify** — `notifyStaff` (best-effort; see below).

Pure, unit-tested helpers (no DB / no `server-only`, so they run under `tsx --test`):
- `fields.ts` `flattenFields` — typed `fields` → `{key,value}[]` (drops blank optionals,
  trims, stringifies numbers).
- `notify-message.ts` `buildLeadNotification` — submission → `EmailMessage` (type-only import
  of `@core/email`, so it stays testable). `notify.ts` `notifyStaff` performs the send.

## Email (kernel seam — ADR 0016)

`core/email` was added as a thin provider-interface seam: `sendEmail()` never throws, dev
logs to the console, prod-without-a-vendor no-ops. Lead notification is therefore
**best-effort** — leads are durably captured regardless. Recipient = `LEAD_NOTIFY_TO`,
sender = `EMAIL_FROM` (both optional env). Wiring a real EU transactional vendor is a future
additive step (ADR 0016) with no call-site changes.

## UI (`ui/`)

`*-form.tsx` (client) — one per kind; each reads labels via `useTranslations("leads")`,
collects controlled state, and posts through `submitLead` inside a transition (pending /
success / inline field errors). Shared primitives + the `useLeadForm` hook (injects `locale`
+ `source_page`) live in `ui/components/fields.tsx`. Forms render **no surrounding heading** —
the embedder supplies the section copy.

## i18n

UI-chrome strings live in the root `messages/<locale>.json` under the `leads` namespace
(authored en/pt/es/fr): field labels, submit/submitting/success/error copy, and the two
consent notices. The consent notice the user sees is sent back as `consent_text` and stored
verbatim, so the proof survives later copy changes (ADR 0014).

## Backoffice (`admin/`) — leads inbox (S12)

Plugs into the backoffice shell (S12 plug-in framework). The slice contributes one
sidebar screen and mounts its own routes; the shell owns only the gate + chrome.

- `admin/screens.ts` — `leadsAdminScreens: AdminScreen[]` (one screen, `crm` group,
  label key `nav.leads` in the **backoffice** namespace). Re-exported from `contract.ts`;
  the app panel layout spreads it into `composeAdminNav`.
- `admin/queries.ts` (server-only) — `listLeads(filters)` (status/kind filter, newest
  first, capped at `LEAD_LIST_LIMIT`, single grouped `lead_field` fetch — no N+1),
  `getLead(id)` (full record + fields for the audit view), `leadStatusCounts(kind?)`.
- `admin/actions.ts` (`"use server"`) — `setLeadStatus`, `assignLeadToMe`, `unassignLead`.
  Each **re-gates with `requireStaff()`** (defence in depth — not relying on the layout
  gate), re-validates input, and `revalidatePath`s the affected admin routes.
- `admin/derive.ts` (pure, unit-tested) — `deriveLeadTitle`, `groupFields`, `statusTone`,
  `formatAdminDate` (Lisbon, locale-independent), `LEAD_KINDS`.
- `admin/ui/` — `inbox.tsx` (list + URL-driven filter chips), `lead-detail.tsx`
  (fields + GDPR consent audit trail verbatim), and the `status-control` / `assign-control`
  client islands.

Routes (app composition, sanctioned integration): `app/(admin)/admin/(panel)/leads/page.tsx`
and `…/leads/[id]/page.tsx`. Backoffice routes are **dynamic** (auth) — no ISR / cache tags;
mutations refresh via `revalidatePath`. Admin strings live under the `leads.admin.*` keys
(en/pt/es/fr), the sidebar label under `backoffice.nav.leads`.

Assignment is a pragmatic claim/release (assign-to-me / unassign) keyed on `assigned_to →
user.id` — no staff directory lookup (that would cross into `core/auth` user data).

## Integration handoffs (other slices)

- **S9 pages** — ✅ done: `lead-cta.tsx` embeds `EarningsEstimateForm` (Owners), and the
  Real Estate / About blocks embed `DealEnquiryForm` / `ContactForm` via this contract.
- **S5 blog** — ✅ done: `newsletter-signup.tsx` wraps `NewsletterForm` (`theme="dark"`).
- **S12 backoffice** — ✅ done: leads inbox (`admin/`) — list/filter by `kind`/`status`,
  claim/release assignment, and the consent audit trail. Reads `lead` + `lead_field` directly.

## Tests

`tests/leads.test.ts` — validation union (accept each kind; reject unknown kind, bad email,
non-positive count, empty consent, mismatched fields), `flattenFields`, and
`buildLeadNotification`. Run:
`npx tsx --test src/slices/leads/tests/leads.test.ts`.
