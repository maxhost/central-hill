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
