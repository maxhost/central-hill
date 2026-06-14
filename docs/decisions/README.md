# Architecture Decision Records (ADRs)

ADRs are the **record of every cross-cutting decision**. Agents must consult these before choosing
a pattern, dependency, or schema shape. New cross-cutting decisions → add a numbered ADR here;
they are made by the **orchestrator**, not by feature agents mid-task.

Format per ADR: Context · Decision · Consequences · Status. Keep them short.

## Index
- [0001 — Custom build, not WordPress/Webflow](#0001)
- [0002 — Rendering: Next.js ISR, not a hand-rolled JSON snapshot layer](#0002)
- [0003 — Hosting: Netlify (not Vercel) + Neon + R2](#0003)
- [0004 — Monolith Next.js app, host-split public vs backoffice](#0004)
- [0005 — Vertical slices with directory ownership + typed contracts](#0005)
- [0006 — i18n: 4 locales path-prefixed; field-level translation table](#0006)
- [0007 — LLM translation pipeline with human review](#0007)
- [0008 — Booking via embedded Avantio; Apartment is our entity, booking is not](#0008)
- [0009 — Auth: Better Auth on Neon](#0009)
- [0010 — Additive, forward-only migrations; slice-owned tables](#0010)
- [0011 — Leads: persist in Neon + email notify + backoffice inbox](#0011)
- [0012 — Editable fixed pages via `page_content`; no generic block builder](#0012)
- [0013 — Blog post body as a constrained portable-JSON block set](#0013)
- [0014 — Lead capture shape: `lead` + `lead_field` KV + explicit GDPR consent](#0014)
- [0015 — Data residency: production Neon project in an EU region](#0015)
- [0016 — `core/email`: provider-interface seam, vendor deferred](#0016)
- [0017 — Backoffice routing: interim path `/admin`; host split deferred](#0017)

---

## 0001 — Custom build, not WordPress/Webflow <a id="0001"></a>
**Context:** Client considered WordPress/Webflow; needs premium feel, ~200ms loads, multilingual
LLM translation, a bespoke catalog + backoffice, and room to scale features safely.
**Decision:** Build custom on Next.js. **Consequences:** Full control over performance, data model,
i18n, and the multi-agent workflow; more upfront engineering, mitigated by slices + this doc set.
**Status:** Accepted.

## 0002 — Rendering: Next.js ISR <a id="0002"></a>
**Context:** Goal is DB-free, CDN-fast public pages. Client proposed generating a JSON per property
change. **Decision:** Use Next.js **ISR** (static generation + on-demand `revalidateTag` on
publish) instead of a custom JSON-snapshot store. **Consequences:** Native, production-grade
DB-free hot path; no bespoke invalidation/consistency code. Backoffice triggers revalidation on
publish. **Status:** Accepted.

## 0003 — Hosting: Netlify + Neon + R2 <a id="0003"></a>
**Context:** Low-traffic niche site; cost matters; Next.js stack. **Decision:** Netlify (runs
Next.js incl. ISR/on-demand revalidation + image opt), Neon Postgres, Cloudflare R2 for media.
SEO/GEO is hosting-agnostic, so no Vercel premium needed. **Consequences:** Lower cost, coherent
with R2; keep render/data layer reasonably host-agnostic for cheap future migration. **Status:**
Accepted. *(Revisit only if a hard Next.js feature gap on Netlify appears.)*

## 0004 — Monolith, host-split surfaces <a id="0004"></a>
**Context:** One team, one repo, modest scale. **Decision:** Single Next.js app; middleware splits
`backoffice.*` (auth-gated, dynamic) from the public host (ISR). No microservices. **Consequences:**
Simple deploy/ops; shared types/kernel; boundaries enforced *logically* by slices, not by network.
**Status:** Accepted.

## 0005 — Vertical slices + ownership + contracts <a id="0005"></a>
**Context:** Multiple agents in parallel must not revert/break each other. **Decision:** Organize by
vertical slice; each owns a dir + its tables; cross-slice access only via `contract.ts`; kernel is
change-controlled; migrations additive. **Consequences:** Parallel-safe, scalable, additive feature
growth; requires discipline + boundary check in CI. See `docs/multi-agent-workflow.md`. **Status:**
Accepted.

## 0006 — i18n model <a id="0006"></a>
**Context:** EN/PT/ES/FR, more later; premium SEO across locales. **Decision:** All locales
path-prefixed; root redirects by Accept-Language (default `en`); UI via next-intl; **content via a
field-level `translation` table** with per-locale state + per-locale slugs. **Consequences:** Adding
a locale is data, not schema; full hreflang/canonical control. **Status:** Accepted.

## 0007 — LLM translation pipeline + human review <a id="0007"></a>
**Context:** Premium brand can't ship raw machine translation. **Decision:** On source save, LLM
generates `draft` per locale → backoffice review → `approved` → publish revalidates. Provider behind
an interface; never called from public pages; source edits mark targets stale. **Consequences:**
Quality control + scalability; a review inbox is required (S14). **Status:** Accepted.

## 0008 — Booking via Avantio; Apartment is ours <a id="0008"></a>
**Context:** Client uses Avantio; we won't build booking. **Decision:** **Apartment** is a
first-class entity we model (pages, photos, bedrooms, capacity, amenities, FAQ) with an
`avantio_id`/`avantio_url`; the booking widget is **embedded**. Building 1—N Apartment.
**Consequences:** Full catalog SEO/content control; live availability/pricing stays in Avantio;
embed isolated + lazy to protect LCP. **Status:** Accepted.

## 0009 — Auth: Better Auth on Neon <a id="0009"></a>
**Context:** Small set of internal staff; backoffice only. **Decision:** Better Auth with the
Postgres/Neon adapter; roles `admin`/`editor` + capabilities (e.g. translation review). **Consequences:**
Native to our DB, no extra vendor; RBAC centralized in `core/auth`. **Status:** Accepted.

## 0010 — Additive, forward-only migrations <a id="0010"></a>
**Context:** Parallel agents + a DB that must stay clean/scalable. **Decision:** Drizzle migrations
are numbered, append-only, never edited after creation; slice-owned tables; cross-slice FKs only to
*public* entities; destructive changes require a new ADR. Migration numbers allocated by the
orchestrator. **Consequences:** No clobbered migrations; safe parallel schema growth. **Status:**
Accepted.

## 0011 — Leads handling <a id="0011"></a>
**Context:** Earnings-estimate, deal-enquiry, contact, newsletter forms. **Decision:** Persist in
Neon, notify staff by email (`core/email`), and expose a backoffice inbox with status/assignment.
**Consequences:** Nothing lost, follow-up possible; optional CRM export later behind an interface.
**Status:** Accepted.

## 0012 — Editable fixed pages via `page_content`; no generic block builder <a id="0012"></a>
**Context:** Marketing pages (`home`, `owners`, `real-estate`, `about`, `guests`) have **fixed,
designer-controlled layouts**, but the client must edit their copy/media without a developer. The
question was whether to build a generic drag-and-drop block/page builder. The client explicitly does
not want one. **Decision:** Split editable content into **three buckets**: (1) **dynamic entities**
(buildings, apartments, blog, services, guides…) via list+form CMS in their slices; (2) **editable
fixed pages** via a single `page_content` table — one row per page `key`, with a **fixed per-page
schema** stored in `data jsonb` and rendered by a bespoke template (fixed-count arrays where the
design repeats, e.g. owner steps); (3) **`company_settings`** singleton for global/NAP/Avantio/social
data. Truly static UI chrome (labels, nav verbs) lives in **next-intl message files**, not the DB.
Page copy is translated through the generic `translation` table keyed `entity_type='page_content'`,
`field='block:<dot.path>'`. Publish revalidates the page's ISR tag. **Consequences:** Client edits
every page via simple forms; layout/structure stays type-safe (Zod-validated per-page schema) and
designer-owned. Adding a fundamentally new page section is a dev task (extend schema + template) —
the intended trade-off vs. an unconstrained builder. **Status:** Accepted. *(Supersedes the earlier
draft's generic `page_block` builder.)*

## 0013 — Blog post body as a constrained portable-JSON block set <a id="0013"></a>
**Context:** Unlike fixed marketing pages, **blog posts need variable-structure editorial layout**
(headings, images, quotes, callouts, CTAs in any order). **Decision:** Store the post body as an
**ordered array of typed blocks in JSON** (portable-text-style), with a **closed, versioned block
set**: `heading · paragraph · list · image · quote · callout · divider · cta`. Each block type has a
Zod schema; the editor exposes only these types; the renderer is a typed switch over known types (no
arbitrary HTML). Translatable text within blocks flows through the `translation` table per block
path. **Consequences:** Rich but bounded authoring; safe, consistent styling and SEO; new block
types are an additive, reviewed change. This is the **opposite trade-off from 0012 on purpose** —
blog earns blocks because its content is genuinely variable-structure; marketing pages do not.
**Status:** Accepted.

## 0014 — Lead capture shape: `lead` + `lead_field` KV + explicit GDPR consent <a id="0014"></a>
**Context:** Refines **0011**. Several forms (earnings estimate, owner/deal enquiry, contact,
newsletter) share one pipeline but carry **different fields**, and EU/Portugal operation requires
**auditable GDPR consent**. **Decision:** One **`lead`** table (`kind`, `status`, `locale`,
source page, contact basics, assignment) plus a **`lead_field`** key/value child table for
kind-specific fields (documented keys per `kind`) — avoiding both a wide sparse table and per-form
tables. **Consent is first-class on `lead`**: `marketing_consent`, `consent_text` (verbatim snapshot
of the wording shown), `consent_at`, plus `ip_address` + `user_agent` as proof. **Consequences:** A
single backoffice inbox/pipeline for all forms; a new form = a new `kind` + documented keys, **no
migration per form**; consent is provable and the displayed text is preserved even if form copy later
changes. **Status:** Accepted.

## 0015 — Data residency: production Neon project in an EU region <a id="0015"></a>
**Context:** The site operates from Portugal and captures **personal data with auditable consent**
(leads: name/email/phone, `ip_address`, `user_agent`, consent snapshot — ADR 0014). Under GDPR,
keeping EU personal data in the EU is the low-risk default. The scaffold's Neon project was created
in **`aws-us-east-1`** because the create-project tooling (Neon MCP) does not expose a region
parameter. **Decision:** **Production** data lives in a Neon project in the **client's own account**,
provisioned in an **EU region (Frankfurt, `aws-eu-central-1`)**. We keep our `us-east-1` project as a
**throwaway dev sandbox** (no real personal data). Neon regions are fixed at project creation, so prod
is a **new** project created in the client's account (console or `neonctl --region-id aws-eu-central-1`);
the schema is reproduced by **running the `drizzle/` migrations as the portable SQL artifact**
(`0000…` + `0001…`, append-only). **RLS / row-level policies are a separate, still-open decision** (own
ADR): the access path is server-only (Drizzle via the DB-owner role; no untrusted client→DB), so RLS is
defense-in-depth rather than load-bearing — to be settled when the client DB is provisioned (esp. if Neon
Auth / a data API is ever exposed). **Consequences:** GDPR residency satisfied and data sits with the
client; clean dev/prod split; prod creation is a one-time manual step outside the MCP. R2 buckets and the
email/LLM processors should likewise prefer EU. **Status:** Accepted. *(Dev sandbox
`weathered-cake-89640915` in `us-east-1`; prod = client account, EU, from the `drizzle/` SQL.)*

## 0016 — `core/email`: provider-interface seam, vendor deferred <a id="0016"></a>
**Context:** Refines **0011**. S10 leads must "persist → `core/email` notifies staff → backoffice
inbox". The kernel slot `core/email` was specified (CLAUDE.md) but unbuilt, and no transactional
vendor/dep has been chosen. We needed a kernel email capability now without (a) prematurely picking
a vendor + adding a dependency, or (b) letting a mail failure ever lose a captured lead.
**Decision:** Add `core/email` as a **thin provider-interface seam** (mirrors `core/i18n/translate`):
a typed `EmailMessage` + `EmailProvider` interface and a single `sendEmail()` entry point that
**never throws** (returns `{ ok:false, error }`). Provider selection is dependency-free for now —
**dev** logs to the console (so local lead notifications are visible), **prod-without-a-vendor**
no-ops. Email is **best-effort**: leads are durably persisted in Neon + the inbox (S12) regardless.
A staff recipient is read from a new optional env var `LEAD_NOTIFY_TO`; sender from existing
`EMAIL_FROM`. **Consequences:** S10 ships against a stable kernel contract with no new dependency.
Wiring a real transactional vendor (Resend/Postmark/SES, **EU region** per ADR 0015) is a later
additive step — add the dep + an `EmailProvider` impl + select it when `EMAIL_API_KEY`/`EMAIL_FROM`
are set — with **no call-site changes**. **Status:** Accepted.

## 0017 — Backoffice routing: interim path `/admin`; host split deferred <a id="0017"></a>
**Context:** Implements **0004** (host-split `backoffice.*` vs public) and **0009** (Better Auth +
RBAC) for the S12 shell. A subdomain split needs `backoffice.localhost`/hosts fiddling locally, and
introducing host-splitting middleware now would also sit in front of the working public ISR routes —
risk for no near-term gain. **Decision:** Ship the backoffice at the **path `/admin`** via a new
`(admin)` Next route group with **its own root layout** (`<html>`), coexisting with the public
`[locale]/layout.tsx` (two root layouts, no shared `app/layout.tsx`). **No middleware** is added:
the public surface is untouched, and the gate is enforced server-side in the `(panel)` layout via
`requireStaff()`. Admin is **not locale-prefixed** and renders in English for now (pinned with
`setRequestLocale`), though i18n keys exist for all four locales. RBAC helpers
(`getSession`/`getStaff`/`requireStaff`) live in `core/auth` as **0009** mandates ("RBAC centralized
in core/auth"); no new kernel ADR is needed for them. **Consequences:** Zero-risk to public ISR;
works on localhost with no setup. The eventual `backoffice.*` host split (0004) becomes a thin,
additive middleware rewrite of `backoffice.*` → `/admin/*` with **no change to these routes**. The
backoffice owns no tables (auth tables belong to `core/auth`), so there is no migration.
**Status:** Accepted.
