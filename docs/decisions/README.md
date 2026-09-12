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
- [0018 — Media R2 upload: presigned direct PUT + serve-time resizing](#0018)
- [0019 — `core/i18n` content + slug write seam (admin write path)](#0019)
- [0020 — S13 seo-geo: sitemaps/robots/llms.txt as root routes + kernel JSON-LD/slug additions](#0020)
- [0021 — S14 translation-pipeline: kernel target-write/read seam + provider interface + review inbox](#0021)
- [0022 — Home restored to the approved mockup; Warm Editorial locked as the production palette](#0022)
- [0023 — Pages drop draft/published state; Home editor gains the dual-CTA block + optional images](#0023)
- [0024 — R2 provisioning: EU bucket, endpoint from env, immutable signed cache policy](#0024)
- [0027 — Optimised delivery: blurhash placeholders + `mediaImgTag()` for HTML-string builders](#0027)
- [0025 — Upload-time normalisation: cap the master at 3000px, bake in orientation](#0025)
- [0026 — `media_asset` becomes two-backend (R2 | Stream); Stream vendor still unratified](#0026)

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

## 0018 — Media R2 upload: presigned direct PUT + serve-time resizing <a id="0018"></a>
**Context:** `core/media` ships only the **read** half (`loadMedia`, `mediaUrl`, `MediaImage`) and the
`media_asset` table (migration `0000`). The **upload/ingest** half is unbuilt and is a kernel addition
(golden rule 3 → ADR). Three forks needed deciding: (1) **how bytes reach R2** — through our
Next/Netlify function (server action) vs. **directly from the admin browser**; (2) **whether we
pre-generate a responsive derivative ladder** in R2 or resize at request time; (3) **what we add as
dependencies** (no S3/image deps exist yet; "no tech without an ADR"). Constraints: media includes
**video heroes** (schema chooses the player by `mime`), so files can be tens of MB — past Netlify's
synchronous-function body limit (~6 MB); the admin is **low-volume, staff-only** (ADR 0009/0017);
performance is the product (CLS≈0 needs `width`/`height`; LCP wants a blurhash placeholder); EU data
residency is the default (ADR 0015); the public hot path stays DB-free/CDN-served (ADR 0002/0003).

**Decision:**
1. **Upload = presigned direct PUT, browser → R2, two-phase**, uniform for images *and* video.
   (a) **Presign:** a `requireStaff`-gated server action mints the `media_asset` **id** (uuid) and an
   `r2_key = "${id}/${safeFilename}"`, then returns a short-lived **S3 presigned PUT URL** scoped to
   that key with a pinned `Content-Type` and a **max size** constraint; mime is checked against a
   server-side allowlist (`image/*` subset + `video/mp4`,`video/webm`). (b) The browser **PUTs the
   file straight to R2** — bytes never transit our functions, so the ~6 MB limit is irrelevant and
   video heroes upload fine. (c) **Finalize:** the browser calls a second `requireStaff` server action
   (`finalizeUpload`) which verifies the object exists (HEAD) and **inserts the `media_asset` row**.
2. **No derivative ladder is stored.** Only the **original** lands in R2. Responsive `srcset` resizing
   is delegated to **Next/Image** at request time, from the original — consistent with the existing
   `MediaImage` (`next/image` + explicit dims). The R2 public host is added to `next.config.ts`
   `images.remotePatterns`. **Portability rationale:** `next/image` is a *Next.js* abstraction, not a
   host feature — on Netlify it uses Netlify's optimizer, and a future **Netlify→Vercel** migration
   (ADR 0003 is "revisit-only") swaps to Vercel's optimizer with **zero code/content change**. A
   pre-baked ladder would remove all host-optimizer dependency but reimplements what the platform gives
   free (incl. per-browser AVIF/WebP) at extra storage+code cost. If full host-independence is ever
   wanted, the `MediaImage` component is the **single seam** to plug a **custom Cloudflare Image
   Resizing loader** (optimizer next to the R2 bytes, host-neutral) — an **additive** change needing no
   schema/content migration. So serve-time resizing is both production-grade and the lowest-friction
   portable default.
3. **Derived metadata is computed server-side on finalize**, not trusted from the client: the finalize
   action **re-reads the object from R2** (R2 egress is free) and, for images, uses **`sharp`** to read
   `width`/`height` and a downscaled pixel buffer, then **`blurhash`** to encode the placeholder; these
   populate `media_asset.width/height/blurhash`. For video, those stay `null` (a poster/blurhash flow
   is deferred). `alt` is authored later in admin and translated via the `translation` table (existing).
4. **Dependencies added** (the tech this ADR authorizes): **`@aws-sdk/client-s3`** +
   **`@aws-sdk/s3-request-presigner`** (R2 is S3-compatible), **`sharp`**, **`blurhash`**. All are
   **server-only**, imported under `core/media/server/` — never by public render code.
5. **Kernel surface added to `core/media`** (additive; read API unchanged): `server/r2.ts` (the S3
   client built from existing `R2_*` env vars, EU-jurisdiction bucket per ADR 0015) and three functions
   exported from `index.ts` — `presignUpload(input)`, `finalizeUpload(input)`, `deleteMedia(id)`
   (removes row + object). The **media admin UI** that calls these lives in the **S12 backoffice** /
   each slice's `admin/` (consumers), not in the kernel. No new migration (`media_asset` already exists).

**Consequences:** One upload path for all media; large video heroes work without a server relay; our
functions stay light (sign + HEAD + small re-read, no multi-MB request bodies). The hot path is
unchanged and DB-free; correctness-critical metadata (dims/blurhash) is server-computed, not
client-trusted. Cost is a presign + a finalize round trip and one server-side re-read per asset
(acceptable at staff volume; R2 egress free). Trade-offs accepted: **no pre-baked size ladder** (we
lean on the Image CDN — revisit only if a derivative-cache need appears); **video poster/blurhash
deferred**; **R2 CORS must allow PUT from the admin origin** (ops config); **orphan/refcount GC is
deferred** (`deleteMedia` is explicit; safe-delete checks belong to the admin slices). The R2 bucket
must be created **EU-jurisdiction** with a public base domain (`R2_PUBLIC_BASE_URL`). **Status:**
Accepted.

## 0019 — `core/i18n` content + slug write seam (admin write path) <a id="0019"></a>
**Context:** `core/i18n` (the cross-cutting `translation` + `slug` tables) shipped **read-only**
(`loadContent`, `resolveSlug`, `loadSlugs`, `loadAlternateSlugs`). But the catalog admin (S12 for
S2 buildings / S3 apartments) must **persist** the source-locale (`en`) values of every **[T]** field —
those entities have *no* `name`/`headline`/… columns; the source text is a `translation` row
(`locale='en'`) — and must create the per-locale `slug` rows that make a detail page resolvable
(`resolveSlug` reads the slug table; no row ⇒ 404). Three options were weighed: (a) add a small write
seam to the kernel; (b) do pages admin first and defer; (c) let each slice write the kernel tables
directly. (c) violates golden rule 4 (writing another owner's tables) and would scatter the
`source_hash`/state-machine/slug-collision invariants into every slice, diverging from what the S14
translation pipeline assumes. (b) only delays the core product. **Decision:** add an **additive,
server-only write seam** to `core/i18n` (`server/content-write.ts`, exported from a new `index.ts`),
the single authorized path that writes the translation/slug tables:
- `setSourceContent(type, id, fields, opts?)` — upsert the **source-locale** (`en`) value of each [T]
  field as `state='draft'` (one multi-row `onConflictDoUpdate` on `translation_key`); a field set to
  `null`/empty is **cleared** (its rows for all locales deleted). Source rows carry **no `source_hash`**
  — staleness is detected by S14 hashing the live source against each *target* row's `source_hash`.
- `setSlug(type, id, locale, value)` / `setSlugs(type, id, slugByLocale)` — upsert one slug row per
  `(type, id, locale)`, **collision-checked** against other entities (throws `SlugConflictError`; the
  DB `slug_key` unique backstops races).
- `deleteContent(type, id)` / `deleteSlugs(type, id)` — remove all rows for an entity (polymorphic
  tables have no FK cascade from the owning entity, so admin delete must clean them up).

Writes are gated at the **slice admin action** (`requireStaff`, ADR 0009) and use sequential
statements (Neon HTTP driver — no interactive transactions, matching the existing write style); the
per-statement upserts are atomic and the unique constraints backstop concurrency. **Target-locale**
writes (LLM draft → `needs_review` → `approved`) are **out of scope here** — they remain S14's job,
through this same seam later. **Consequences:** one write path for all multilingual content, reused by
S14; the kernel surface grows by one small server-only module (read API unchanged); **no migration**
(tables already exist). Trade-offs: slug **history/redirects** are not modelled (one live slug per
entity/locale — re-slugging overwrites; a redirect table is a future additive ADR); admin sets the
source slug and may copy it across locales (localized slugs are an editor refinement, not required for
reachability). **Status:** Accepted.

## 0020 — S13 seo-geo: sitemaps/robots/llms.txt as root routes + kernel JSON-LD/slug additions <a id="0020"></a>
**Context:** S13 (`seo-geo`, `docs/seo-i18n.md`) is the last cross-cutting slice. The page-level
foundation already exists — every public page builds canonical + hreflang via `core/seo`
`buildMetadata`, and blog/building/guide/service pages emit `BlogPosting`/`BreadcrumbList`
JSON-LD. What is still missing and genuinely cross-slice: (a) **sitemaps** (index + per-entity,
per-locale, with `<xhtml:link>` alternates), **`robots.txt`**, and **`llms.txt`/`llms-full.txt`**;
(b) **site-wide `Organization` + `LocalBusiness` JSON-LD**; (c) the **richer JSON-LD builders**
two earlier slices explicitly deferred to S13 via escalation notes (`buildings/ui/building-detail.tsx`
→ `LodgingBusiness`; `pages/ui/components/faq-section.tsx` → `FAQPage`) — golden rule 3 says these
builders belong in the kernel `core/seo`, not hand-written in components. Enumerating per-locale
alternates for the sitemap also needs to group an entity's slugs across locales, which the existing
`list*Params()` (flat `{locale,slug}`) cannot do alone.

**Decision:** This is an orchestrator-level cross-cutting decision (golden rule 6) authorizing:
1. **New slice `src/slices/seo/`** (S13). Owns **no tables / no migration**. Enumerates public URLs by
   calling each public slice's **contract** (`listBuildingParams`, `listPostParams`,
   `listServiceParams`, `listGuideParams` + the fixed marketing/index routes) and builds the sitemap
   index, per-section urlsets, `robots.txt`, and `llms.txt`/`llms-full.txt` from the slice catalog.
   Reads are wrapped in `unstable_cache` tagged `cacheTags.sitemap` (already defined in
   `core/revalidate`) with a daily time-based fallback, so the hot path stays DB-free (ADR 0002).
2. **Brand-new root (non-locale-prefixed) app routes** (route handlers in dot-named folders for full
   control of content-type + caching): `/sitemap.xml`, `/sitemaps/[section]`, `/robots.txt`,
   `/llms.txt`, `/llms-full.txt`. These are new files (golden rule 1 allows brand-new files).
3. **Additive kernel additions** (golden rule 3 → this ADR):
   - `core/seo` JSON-LD builders: `organizationLd`, `localBusinessLd`, `faqPageLd`, `lodgingBusinessLd`
     (pure functions, same shape as the existing `blogPostingLd`/`breadcrumbLd`; re-exported from
     `core/seo`). Read API otherwise unchanged.
   - `core/i18n` read helper `loadAllSlugs(type)` → `{entity_id, locale, slug}[]` (joins the existing
     `slug` table only; lets S13 group an entity's slugs across locales for `<xhtml:link>` alternates).
     Mirrors the existing `loadAlternateSlugs`/`loadSlugs` family; read-only; **no migration**.
4. **Site-wide `Organization` + `LocalBusiness` JSON-LD** composed into the public root layout
   `src/app/[locale]/layout.tsx` (the app shell's explicit composition job, CLAUDE.md → repo shape;
   analogous to S11 composing the header/footer there). Data from `settings.getGlobals` (the org name
   is the constant "Central Hill" — `SiteGlobals` carries no name field). Component lives in the seo
   slice; only a `<SiteJsonLd/>` line is added to the layout.
5. **Resolution of the two pre-existing S13 escalation notes** (a documented handoff per
   `docs/multi-agent-workflow.md`): append `lodgingBusinessLd(...)` to the existing `ld` array in
   `buildings/ui/building-detail.tsx` and add a `faqPageLd(...)` `<JsonLd/>` to
   `pages/ui/components/faq-section.tsx`. Both are **append-only** (no existing line changed/removed),
   using the now-available kernel builders — exactly what those notes requested.

A new env var **`SITE_URL`** (fallback `NEXT_PUBLIC_SITE_URL`, default `https://centralhill.pt`)
supplies the absolute origin sitemaps/robots/JSON-LD require; added to `.env.example`.

**Consequences:** classic SEO (sitemaps/robots/canonical/hreflang) and GEO (`llms.txt`, full
server-rendered structured data incl. Organization/LocalBusiness/LodgingBusiness/FAQPage) are
complete and host-agnostic (ADR 0003). The kernel grows by pure additive read/builder functions
(no behaviour change to existing callers). Sitemap freshness rides the existing `sitemap` cache tag
plus a daily fallback; wiring each slice's `publish()` to also bust `cacheTags.sitemap` on
create/delete is a small future per-slice follow-up (noted in the seo README) — until then the daily
revalidate keeps it correct within a day. Apartments and cities have **no standalone public route**
today (apartments render inside building detail; cities inside the guides index), so they are
intentionally absent from the sitemap; adding their routes later is an additive section. **Status:**
Accepted.

## 0021 — S14 translation-pipeline: kernel target-write/read seam + provider interface + review inbox <a id="0021"></a>
**Context:** S14 implements the workflow ADR 0007 promised: on source save an LLM drafts each target
locale → backoffice **review** (`needs_review`) → **`approved`** → publish revalidates; source edits
mark targets stale. The substrate already exists — the `translation` table (`state` ∈
`draft|needs_review|approved`, `source_hash` for staleness; `core/i18n/schema.ts`), the read render
policy (`loadContent`: approved target else source fallback; `core/i18n/content.ts`), and the
**source-locale** write seam (`setSourceContent`/`setSlug…`; ADR 0019, which explicitly deferred
*target-locale* writes to S14 "through this same seam later"). CLAUDE.md also reserves the LLM
**provider behind an interface in `src/core/i18n/translate`**, which S0 never created. Golden rule 4
forbids a slice touching the kernel `translation` table directly, so S14's data access **must** live
in `core/i18n` (kernel) → this ADR. The shell already reserves the `translation` nav group, the
`translator` `StaffRole`, and a `TranslationFieldRow` primitive for exactly this slice.

**Decision:** Orchestrator-level decision (golden rule 6) authorizing:
1. **New slice `src/slices/translation/`** (S14). Owns **no tables / no migration** — it operates on
   the existing kernel `translation` table **generically by `entity_type`** (it never imports another
   content slice's internals; the translatable universe *is* the set of source-locale rows). Holds the
   pipeline orchestration, the backoffice **review inbox + per-entity review screen**, and pure derive
   helpers. Backoffice-only; not on the public ISR path.
2. **Additive kernel additions to `core/i18n`** (golden rule 3 → this ADR; read API for existing
   callers unchanged):
   - **`translate.ts`** (new) — the LLM **provider interface** `TranslateProvider` +
     `getTranslateProvider()` resolver + `hashSource(value)` (stable content hash for `source_hash`).
     Default provider is a **pass-through identity** stub (returns the source verbatim as a
     `needs_review` draft for the reviewer to refine) when no real provider is configured; a concrete
     LLM client is a pluggable follow-up (`TRANSLATE_API_KEY` already in `.env.example`). This is the
     "provider behind an interface" CLAUDE.md/ADR 0007 require — never called from public pages.
   - **`content.ts`** — one generic reader `loadTranslationRows(filter?)` → the raw `translation`
     rows (`{entity_type, entity_id, field, locale, value, state, source_hash, updated_at}`) optionally
     filtered by `{type,id,locale,state}`. S14 derives the whole inbox (source vs targets, staleness,
     per-state counts) in memory from this — the dataset is the boutique CMS's content, small, and read
     in the dynamic admin (not ISR). Mirrors the existing read family; read-only; **no migration**.
   - **`content-write.ts`** — **target-locale** writes (the part ADR 0019 deferred):
     `setTargetTranslation(type, id, field, locale, value, {sourceValue, state?, updatedBy?})` (upsert a
     non-`en` row, stamping `source_hash = hashSource(sourceValue)`, default `state='needs_review'`);
     `setTranslationState(type, id, field, locale, state)` (value-preserving transition — approve /
     reset-to-review); `deleteTranslation(type, id, field, locale)`. Same constraints as ADR 0019:
     `requireStaff`-gated at the slice action, sequential statements (Neon HTTP — no interactive tx),
     `translation_key` unique backstops races; `locale='en'` is rejected (source is ADR-0019's job).
   - Barrel re-exports in `core/i18n/index.ts`.
3. **Brand-new admin app routes** under the gated `(panel)` group: `/admin/translations` (inbox) and
   `/admin/translations/[type]/[id]` (per-entity review). New files (golden rule 1).
4. **Backoffice registration** — `translationAdminScreens` (the reserved `translation` nav group),
   spread into `composeAdminNav` in `app/(admin)/admin/(panel)/layout.tsx` (the app shell's existing
   composition job, like every other slice). Visible to any staff (incl. the `translator` role).
5. **i18n keys** — a new root `translation` message namespace + `backoffice.nav.translations` label,
   authored for **en/pt/es/fr** (the established additive per-slice convention; messages are
   consolidated in root `messages/<locale>.json`).

**Publish/revalidation:** approving (or resetting) a target is a Server Action that, after the kernel
write, busts the affected entity's public ISR cache best-effort via `updateTag(cacheTags.entity(type,
id))` + `updateTag(cacheTags.list(type))` (covers both the per-entity and list-tag conventions slices
use) so the now-approved locale appears; the daily ISR fallback backstops any slice using a different
tag. **Consequences:** the multilingual workflow is end-to-end (author source → draft → review →
approve → live), reusing one kernel seam for all content; the kernel grows by pure additive
read/write/provider functions with no behaviour change to existing callers; **no migration** (table
exists). Trade-offs: the default translate provider is an identity stub (a real LLM client is a
follow-up behind the same interface); staleness is surfaced (source_hash mismatch) and re-draftable but
not auto-re-translated; cross-slice cache busting on approve is best-effort + daily fallback (mirrors
S13). **Status:** Accepted.

## 0022 — Home restored to the approved mockup; Warm Editorial locked as the production palette <a id="0022"></a>
**Context:** The live home had drifted from the client-approved design preview
(`mock/home.html`, theme `warm-editorial`): the stats sat on a light band instead of the dark
feature band, benefit cards had no icons, testimonials were a dark auto-rotating carousel rather
than the restrained light grid, the portfolio cards lost their bordered look, the **Our Story**
section (present in the `home` schema and seed) was never rendered, the owner column of the dual
CTA was light instead of dark, and the hero's secondary CTA used the `outline` variant (dark ink
text — near-invisible over the dark hero). `design-system.md` already named Warm Editorial the
default but as a *recommendation*; nothing **locked** it, and the dark-band tokens it needs
(`feature-accent`, `on-feature`) were missing from `core`.

**Decision:**
1. **Warm Editorial is the locked production palette.** No runtime palette switching ships; the
   other five mock palettes remain design-exploration only. Changing the palette requires a new ADR.
2. **Kernel additions (this ADR authorizes them):** add `--color-feature-accent`, `--color-on-feature`,
   `--color-on-feature-soft` to `app/globals.css @theme`, and a `light` variant to
   `core/ui/button.tsx` (white hairline → solid-on-hover) for CTAs over dark media/bands. Existing
   token *values* are unchanged; `surface` stays `#fffdf8` (the documented "never pure #fff").
3. **Re-skin the home in slice `pages`** to match the mockup section-for-section, keeping the
   architecture intact: content from `page_content`, stats/contact from settings, featured
   buildings + testimonials via slice contracts, i18n chrome, and ISR (`page:home`). Benefit cards
   render line icons by `icon_key` (new in-repo icon set); testimonials become the static light
   grid (the dark carousel island is removed — owner-directed; data stays dynamic, capped at 6);
   the Story section is now rendered from existing `story` content. (Owner-directed follow-up: the
   home's per-section terracotta eyebrows — owners/guests/portfolio/reviews/story — were later
   removed, the hero eyebrow reworded, and the `StatsBand` heading folded into its dark cacao band
   with the title in cream; `FeaturedPortfolio`/`TestimonialsRow` keep their eyebrows on the other
   pages via a `showEyebrow` prop. The home owners/guests pitches were then redesigned away from the
   shared `SectionHeading`+`FeatureGrid` block into bespoke layouts — **owners = "Editorial Split"**
   (`owners-section.tsx`: sticky text + dual-CTA column beside a hairline-divided benefit list);
   **guests = "Image Showcase"** (`guests-section.tsx`: lifestyle image + floating reassurance badge,
   compact benefit highlights, single CTA on the `altBg` band). These were picked by the owner from a
   temporary in-page variant switcher harness, which has since been removed. The benefit-card line
   icons were re-sourced from **Iconoir** (MIT, iconoir.com) — official `regular` 24×24/1.5-stroke
   paths inlined in `pages/ui/components/icon.tsx`, no new dependency; the home's only icon surface is
   the owners/guests benefit lists, so testimonial stars and CTA arrows stay typographic per the mock.
   The two showcase images are TEMP external hotlinks until real photos are uploaded to R2. Further
   owner-directed home tweaks: testimonials became a **full-bleed infinite marquee** (CSS-only,
   pause-on-hover, `prefers-reduced-motion` safe; `testimonials-marquee.tsx`) with rating stars 3×
   larger; the **"Portugal's trusted hospitality management company" story band was removed**; all
   booking CTAs now **open in a new tab** — `ButtonLink` auto-targets absolute http(s) URLs, and the
   header/mobile booking + account links already carried `target="_blank"`; the header **"Account"
   icon** now deep-links to the Avantio PMS login (`AVANTIO_OWNERS_LOGIN_URL` in settings `booking.ts`).)

**Consequences:** the public home matches the approved preview and is protected from silent drift
by a locked palette + this record; the shared `FeatureGrid`/testimonials/`StatsBand` blocks change
once and keep the sibling marketing pages (owners/guests/about/real-estate) visually consistent
with the same mock design system. Trade-offs: distinct card icons only appear where content carries
a real `icon_key` — the seed is updated, but already-seeded/production rows show the fallback icon
until re-seeded or edited in the backoffice. No migration; no schema change.

**Nav chrome (follow-up under this ADR):** the app-shell header is `fixed` and overlays a page's
hero. A page opts in by rendering a `[data-hero]` section; pure CSS in `globals.css`
(`body:has([data-hero]) [data-site-header]:not(.scrolled)`) makes the bar transparent with white
content over the hero and reserves the nav height on hero-less pages — no layout shift, no JS for
the initial paint. A minimal client island (`settings/ui/components/header-scroll.tsx`) only toggles
`.scrolled` to frost the bar past the top (mirrors the mock's `site.js`). The header is laid out in
three sections — logo / menu (with a ghost **Book Now** CTA) / utilities (account icon, contact
icon, language dropdown). The Book Now CTA inverts over the hero via the same chrome block keyed by
`data-cta="ghost"` (white hairline → white fill on hover), reverting to the dark default when
scrolled or on hero-less pages. Top-level nav items with sub-tabs reveal them as a full-width
frosted bar under the header on hover/focus (pure CSS, mirrors the mock owner sub-nav). Light
popovers (dropdown, sub-bar, mobile drawer, contact modal) carry `[data-chrome-keep]` to opt out of
the white inversion. The hero
video is, temporarily, an external hotlink fallback (`mock/home.html`'s clip) until a real video is
uploaded to R2 and set on the home page.

**Chrome follow-ups (owner-directed, under this ADR):** a floating **WhatsApp** button
(`settings/ui/components/whatsapp-fab.tsx`, mounted in the app-shell layout) is fixed bottom-right
and deep-links to `wa.me/351910075725` in a new tab; its brand green (`#25d366`) is a scoped,
intentional exception to the locked palette (third-party brand chip, confined to that one element).
The featured-portfolio section ("Explore Our Portfolio") is now a **carousel showing three
properties at a time** (two on tablet, one on mobile) via a thin client island
(`pages/ui/components/portfolio-carousel.tsx`): cards are server-rendered in `FeaturedPortfolio`
(now fetching up to 9 featured buildings) and passed in as slides; the island only drives
scroll-snap + prev/next controls and honors `prefers-reduced-motion`. The final owner/guest
dual-CTA band (`pages/ui/components/dual-cta.tsx`) is now the **"Immersive Panels"** layout
(owner-chosen from a temporary 3-way preview switcher, since removed): two full-bleed image panels
with a dark scrim + white overlaid copy and a gentle hover zoom (CSS only, stays a server
component) — owner side a warm Lisbon facade, guest side a balcony-stay moment. Both images are
TEMP external Pexels hotlinks (free license) until final art is uploaded to R2. **Status:** Accepted.

**Owners page rebuilt to `mock/owners.html` (owner-directed, under this ADR):** `pages/ui/owners-page.tsx`
now follows the mock's order — hero with an **embedded earnings-estimate card** (the leads-slice
`EarningsEstimateForm` slotted into the hero), a sticky anchor sub-nav, the business-proof
**stats band moved up** to sit right after the hero, why · services · plans · growth path · owner
dashboard, owner testimonials, an **accordion FAQ**, and a **dark final CTA** that routes back to the
hero form. Content still comes from `getOwnersPage` (DB) + settings/testimonials/faq slices; only
section eyebrows + the final-CTA copy were added as i18n chrome (`pages.owners.*`, all 4 locales).
Per-section source was confirmed with the owner (mock-vs-DB): **copy stays from the DB** (paraphrased
but localized 4-up); **stats stay from settings**; **testimonials + FAQ stay from their live slices**;
the **plan cards use the mock's three tiers verbatim** (Essential/Premium/Concierge, no commission %),
overriding the DB's four-tier B8 variant — hardcoded English brand terms in `OWNER_PLANS`. The hero
**badge** renders the mock's "★ Earn +25%" pill (i18n `pages.owners.heroBadge`, localized; seed badge
aligned). The hero **image** is the mock's approved photo as a TEMP external hotlink via the new
`PageHero` `imageUrl` escape hatch, because the seeded `image_media_id` is a placeholder that was
never uploaded to R2 — swap to the R2 asset when uploaded. Three shared pages-slice components gained
**additive, backward-compatible** options to support this without touching other pages: `PageHero`
(`aside` form slot, `compact` headline sizing, `imageUrl` fallback, `eyebrowPill`), `StatsBand`
(`showTitle` for a bare proof band), and `FaqSection` (now a CSS-only `<details>` accordion, reused by
real-estate too — JSON-LD unchanged). Navbar/footer are the shared chrome, reused unchanged via the
app layout. **Status:** Accepted.

## 0023 — Pages drop draft/published state; Home editor gains the dual-CTA block + optional images <a id="0023"></a>

**Context.** Owner direction while hardening the page backoffice (`/admin/pages`): the five fixed
pages have no real editorial workflow — a page either exists and is live or it doesn't — so the
draft/published toggle was noise. The Home editor was also missing two things the live Home renders:
the Guests-pitch section image, and the closing owner/guest dual-CTA band (background images +
per-panel copy + CTA labels). Owner asked to remove anything no longer used "without leaving traces"
(code **and** DB). This narrows ADR 0012 and is a deliberate, owner-approved exception to ADR 0010
(additive, forward-only migrations).

**Decision.**
- **Drop `page_content.status`** (migration `0003`, a destructive `DROP COLUMN` — exception to ADR
  0010, owner-approved). `getXPage` returns a row whenever it exists; the admin list/editor lose the
  status column/selector; `savePage` no longer takes a status.
- **Remove the Home `story` block** from `home` schema + seed; `0003` strips the stale `story` key
  and trims `guests_pitch.benefits` from 6 → **4** in the existing row.
- **Home schema additions** (`schemas/home.ts`): `guests_pitch.image_media_id` and a new
  `dual_cta: { owner, guest }` block (each panel = `image_media_id` + eyebrow/title/body/cta_label).
  Image fields are an **optional image** type (`z.union([z.literal(""), mediaId])`) — `""` means "no
  asset yet" and the render falls back to an approved mock photo, so the section never renders empty
  (R2 upload not wired yet). `dual-cta.tsx` reads the editable block, falling back to the localized
  `pages.dualCta.*` chrome for unset fields / legacy rows (so non-EN locales keep their copy until
  the owner edits). The owner CTA still routes to `/owners`, the guest CTA to the Avantio engine.
- **Media uploader hints**: a `.describe()` on a page-schema media field becomes recommended
  size/format guidance in the editor (`form-model` reads it, `schema-fields` renders it); the
  social-share (OG) image hint now states the recommended dimensions/format too.

**Consequences.** Forward-only is preserved (new numbered migration; no past migration edited) but
this one is destructive, hence this ADR. New render code is backward-compatible with un-migrated
rows (status ignored, `dual_cta`/image absent → chrome + mock fallbacks), so it is safe to deploy
the code before running `0003`; running `0003` against the **old** code would break it (status
filter), so **deploy first, migrate second**. Slice `pages` only. **Status:** Accepted.

**Update (owners page slimmed, migration `0004`).** Same owner direction, applied to `/owners`:
the page is now a focused conversion landing — **hero + earnings form + animated "numbers" band +
closing CTA**. The marketing sections `why / services / plans / journey / dashboard` were removed
from the public page, the `owners` schema, and the stored row (data-only migration `0004` drops
those keys "without leaving traces"). The "★ Earn +25%" badge moved from the hero into the
earnings-form card (highlighted) → authored under `earnings_form.badge`; `0004` drops the stale,
never-rendered `hero.badge` and sets `earnings_form.badge` to the shown value ("Earn +25%"). The numbers count up on scroll (`owner-stats-counter.tsx`, honours
`prefers-reduced-motion`). `0004` is data-only and backward-compatible (extra keys are ignored /
stripped on next save), so deploy order is not load-bearing here. Slice `pages` only.

**Update 2 (owners "why" kept but redesigned, migration `0005`).** Follow-up owner direction: the
`why` grid removed by `0004` should instead **stay, restyled** to the home's Editorial-Split layout
(sticky headline + CTAs beside a hairline benefit list), and be **editable in the back office**.
The owners page is a static `.mk` embed and `mock.css` styles bare `.mk h2/h3/a/section`, so the
home's Tailwind `OwnersSection` component would leak styles if dropped inside it — the layout is
instead **reproduced as scoped `.mk` HTML/CSS** using the same design tokens (identical look, no
leak). `ownersSchema` regains a `why{headline, subheadline?, benefits[×6], cta_primary, cta_secondary}`
section so the editor is ready for when the page is wired to the DB; `0005` (data-only, additive)
re-adds the `why` content to the stored row. The page itself stays static for now. Slice `pages` only.

**Update 3 (sections restored, eyebrows dropped, migration `0006`).** Clarification: the original
"eliminate" request meant the per-section **eyebrow** labels, not the whole sections. So all owners
sections (`services / plans / journey / dashboard / testimonials / faq`) were **restored** to the page,
schema, and stored row (`0006`, data-only/additive), keeping the three deltas that stand: the hero
badge inside the form, the animated numbers, and the `why` Editorial-Split. Only the eyebrow `<span>`s
were removed (section titles stay). The owners header mega-menu (settings slice) was restored to link
all sections (anchors kept in sync with the page). Touches slices `pages` + `settings` (owner-authorized
nav edits).

**Update 4 (services/dashboard → Image-Showcase, migration `0007`).** Owner direction: restyle the
owners `services` ("Everything Handled. Nothing Overlooked.") and `dashboard`/#technology ("Your
Property, Always in Sight") blocks to the home guests-pitch **Image-Showcase** layout — 4 benefit
highlights + CTA beside a 4:5 image with a floating reassurance badge — `dashboard` **mirrored** (image
on the left). Reproduced as scoped `.mk` CSS (`.owner-showcase` / `.owner-showcase.reverse`), same
leak-avoidance rationale as `why`. Both schema blocks were reshaped (`benefits[×4]` + editable
`image_media_id` + `cta`, dropping the old `items[×9]`/`features[×6]` grids) so the editor can manage
each block with its own image; the stored row was migrated to match (`0007`, data-only/idempotent).

**Update 5 (owners testimonials → shared marquee; plans capped at 4).** Owner direction: replace the
owners static "Trusted by Property Owners Across Portugal" grid with the **same** infinite carousel as
the home "We Care About Our Partners & Guests" section. Done by rendering the shared `<TestimonialsRow>`
island in `OwnersPage` — the static body is split around it and the marquee renders **outside** the
`.mk` wrapper (so `mock.css` bare-element rules don't leak into its Tailwind markup); a wrapper `<div
id="testimonials">` keeps the sub-nav anchor. This makes the owners page read the DB for the first time
(testimonials slice, ISR-cached/tagged — the page still prerenders). Also: the `plans` grid now fits
**up to 4** pricing cards (added a "Starter" tier; `tiers` schema max 6 → 4) and the gap before the two
plan-helper blocks was widened for breathing room. No migration (stored row already has ≤4 tiers).

**Update 6 (FAQ becomes page-selectable across all five pages, migration `0008`).** Owner direction:
let FAQs be authored in `/admin/faq` and **chosen per page from a dropdown** (blank = no FAQ, on any
page). Implemented as: (a) every page schema gains an optional `faq_group_key` (the language-neutral
`faq_group.key`, not a [T] field); (b) a new **`select`** `FieldNode` in the pages form-model —
detected by key (`SELECT_SOURCES`, mirroring the `*_media_id` → media-picker heuristic) — whose options
are filled server-side in `getPageEditModel` and threaded to the renderer like media `previews`;
(c) an **authorized contract change** to slice `faq`: a new public, cached `listFaqGroups(locale)` read
(`{key, publishedCount}[]`) feeds the dropdown so a newly-authored group appears automatically — added
to `faq/contract.ts` per golden rule 2 (cross-slice reads via contracts only); (d) all five pages now
render the chosen group through the shared `FaqSection` island (outside `.mk`, like the testimonials
marquee), so Owners/Real-Estate's formerly hard-coded `#faq` markup is removed. Migration `0008` seeds
the `owners` + `real_estate` groups from that former static Q&A (source `en`, published) and binds each
page via `data.faq_group_key`; Home/Guest/About default to blank. This makes Guest/Real-Estate/About
read the DB for the first time (page row, ISR-cached) — they still prerender.


---

## 0027 — Optimised delivery: blurhash placeholders + `mediaImgTag()` for HTML-string builders <a id="0027"></a>
**Context:** ADR 0018 delegates responsive resizing to `next/image` and stores a **blurhash** per
asset for the LCP placeholder. The media-pipeline spec (`docs/specs/r2-media-pipeline.md`, §2 and
§9.1) found both halves of that promise unkept on the render side:

1. The blurhash is encoded on finalize, stored, selected by **every** slice into `MediaImageData`, and
   serialised into every page's RSC payload — and `core/media/image.tsx` **never reads it**. We pay
   the encode, the column, the join and the bytes, and the visitor still sees a blank box.
2. Nine public pages are built as **HTML strings** injected with `dangerouslySetInnerHTML` (the 1:1
   `mock/*.html` embeds). Inside them images are raw `<img src="${url}">`, and **13 of those take
   their `src` straight from a `media_asset`** — owners hero/services/dashboard, real-estate
   hero + section helper, guest welcome, every building card cover, the whole building-detail
   gallery, plus `dual-cta` and `guests-section` on Home. So **every photo the client uploads for
   the portfolio bypasses the optimizer**: no `srcset`, no AVIF/WebP, no `width`/`height` (→ CLS),
   no blurhash, no `loading`/`fetchpriority` control — and with the public R2 host being the managed
   `pub-*.r2.dev` URL, those `<img>`s are the only thing that would hit r2.dev directly.

Both fixes live in the kernel (`core/media`) → golden rule 3 → this ADR.

**Decision:**
1. **Decode the blurhash at render time, in pure JS, synchronously.** New kernel module
   `core/media/blur.ts` exports `blurDataUrl(hash, width, height)`, which decodes to a **12 px
   (longest side, aspect-preserved) raster** and hand-rolls an **uncompressed (stored-block) PNG**
   data URI; `MediaImage` passes it to `next/image` as `placeholder="blur"` + `blurDataURL`.
   *Not* `sharp`: `sharp` is native, async, and is deliberately lazy-imported everywhere else in this
   kernel because its `dlopen` crashed the serverless runtime (ADR 0018 consequences) — using it here
   would force `MediaImage`, a synchronous component every slice renders, to become async. Pure JS
   keeps the component synchronous and client-safe. Deflate is skipped on purpose: at 12×12 it saves
   a few hundred bytes and costs a dependency; a placeholder is ~500–700 chars. Public pages are ISR,
   so the decode runs at build/revalidate, not per request. A missing or undecodable hash returns
   `null` → no placeholder, never a broken image.
2. **Optimised `<img>` *as an HTML string*, via `getImageProps()`.** Rewriting nine pages back into
   JSX is large, risky, touches several slices and buys the user nothing. Instead the kernel gains
   `mediaImgTag()`, built on `next/image`'s official `getImageProps()` — so we get the real optimizer
   `src`/`srcSet`/`sizes` without hand-assembling `/_next/image` URLs or coupling to that URL format.
   It emits `srcset` + `sizes` + explicit `width`/`height` + `loading`/`decoding`/`fetchpriority`,
   escapes attributes exactly as the pages' existing `esc`/`escAttr` do, **passes external fallback
   URLs (Unsplash/Pexels) through untouched** — they already arrive pre-sized from their own CDN, so
   re-optimising costs money and gains nothing — and falls back to `public/placeholders/*.svg` when
   there is neither an asset nor a fallback. The two JSX call sites (`dual-cta`, `guests-section`)
   use `<MediaImage>` directly instead, raw `<img>` only on the external-fallback branch.

**Consequences:** `MediaImage` stays synchronous and gains no dependency (`blurhash` was already a
dependency, used by `finalizeUpload`). Every backoffice-uploaded image on the public site goes through
the optimizer, which is also what keeps the `pub-*.r2.dev` host off the critical path (spec §1.2).
`mediaImgTag()` is a kernel export, so the nine page builders change only at the `<img>` line. The
blurhash path is **inert until real uploads exist** — the seeded demo asset has no hash — so the
visible win arrives with the first R2 upload, while the correctness win (dimensions, srcset) is
immediate. Rendering an `<img>` from a string keeps these pages outside React's control; that is
already true and this ADR does not widen it.

One cost is recorded deliberately: the blur placeholder is an inline `style` of ~1.3 KB per image
(Next wraps `blurDataURL` in a gaussian-blur SVG), so a dense grid — a 30-building listing — adds
tens of KB to the **document**, which is itself on the LCP path. It is left **on everywhere**, for
parity with `<MediaImage>`; spec §12 step 11 is an LCP/format audit *with measurements*, and that is
where to decide whether card grids should opt out — not here, by guessing. Two behaviours differ
from the React component and are accepted: the placeholder background is never cleared on load
(harmless — every call site is `object-fit: cover`, so the loaded photo covers it), and `priority`
cannot emit a `<link rel=preload>` from inside a string, so `fetchpriority="high"` stands in.

**Status:** Accepted (2026-09-12). Both parts implemented. Supersedes nothing; amends ADR 0018's
render half.


---

## 0024 — R2 provisioning: EU bucket, endpoint from env, immutable signed cache policy <a id="0024"></a>
**Context:** ADR 0018 designed the upload pipeline but nothing was ever provisioned. Turning it on
forced three decisions and exposed three defects — two predicted by the media-pipeline spec, one
found only by probing the real bucket.

**Decision:**
1. **Bucket `central-hill-media`, EU jurisdiction** (ADR 0015 data residency). Jurisdiction is
   immutable after creation. Access is an R2 API token scoped to **Object Read & Write on this one
   bucket** — never account-wide, because the credential backs a browser-facing presign path.
2. **Public host = the managed `pub-*.r2.dev` development URL**, not a custom domain. The client's
   domain still points at Avantio and there is no Cloudflare zone. This is safe *because*
   `next/image` shields R2: the optimizer fetches each original once per (image, width, format), so
   visitors never hit `r2.dev`. Migrating to a custom domain later is one env var + a redeploy,
   since we store `r2_key` and never absolute URLs. **Verified**: the r2.dev public URL *is* offered
   for an EU-jurisdiction bucket — this was the spec's day-one unknown and it is now closed.
3. **The S3 endpoint comes from `R2_S3_ENDPOINT`**, copied from the dashboard, with the old
   hardcoded host kept only as a fallback for a non-jurisdictional bucket. `core/media/server/r2.ts`
   built `https://<account>.r2.cloudflarestorage.com`; an EU bucket is not there. Confirmed against
   the live bucket: that host returns `NotFound` while `<account>.eu.r2.cloudflarestorage.com`
   works. Presign would have minted signed URLs pointing nowhere and **every** upload would have
   failed.
4. **Every upload is stored with `Cache-Control: public, max-age=31536000, immutable`, and both
   `content-type` and `cache-control` are added to `signableHeaders`.** `r2_key` is
   `${uuid}/${filename}`, so a key is immutable by construction — replacing a photo mints a new
   uuid — and a one-year immutable cache is a fact about the naming scheme, not a bet.
   The spec assumed setting `CacheControl` on the `PutObjectCommand` was enough and that R2 would
   *reject* a PUT omitting a signed header. **Both are wrong**, and probing the real bucket was the
   only way to find out: by default the presigner signs `host` alone
   (`X-Amz-SignedHeaders=host`), hoists nothing into the query string, and a PUT with **no headers
   at all** returns 200 and stores the object **with no cache directive**. The directive is whatever
   the browser sends. Signing both headers converts that silent, permanent misconfiguration into a
   403 at upload time. Verified: correct PUT → 200 and the directive is stored and served; omitted
   `Cache-Control` → 403; tampered `Content-Type` → 403.
5. **CORS `AllowedHeaders` must list `content-type` and `cache-control`.** This is now load-bearing,
   not hygiene: the browser sends both, so the preflight fails without them. `AllowedOrigins` cannot
   be wildcarded mid-string, so uploads work from localhost and production but **not from a Vercel
   preview deployment**, whose URL changes every deploy. Accepted — the backoffice is staff-only.
6. **`R2_PUBLIC_BASE_URL` is asserted at build time** (`PHASE_PRODUCTION_BUILD` in
   `next.config.ts`). Next computes `images.remotePatterns` from it *during the build*; absent then,
   the list is `[]` and every optimised image returns 400 at runtime while the dashboard shows the
   variable present and correct — it merely arrived too late. A production build without it now
   fails with an actionable message instead of shipping broken images.

**Consequences:** `R2_S3_ENDPOINT` joins the env schema and `.env.example`; it must be set wherever
the app runs or builds. The presigned URL now carries `X-Amz-SignedHeaders=cache-control;
content-type;host`, so the upload island and the presign action are coupled — the island echoes the
`cacheControl` that presign returns rather than hardcoding it, and changing the directive is a
one-line server change. A build can now fail for an environment reason; that is the point. Nothing
about the *signature* protects the bytes: `finalizeUpload` still HEADs the object and validates mime
and size server-side (ADR 0018), which remains the real gate.

**Status:** Accepted (2026-09-12). Bucket live and the full round trip — presign → PUT → finalize →
public GET → delete — verified end to end against it. Runbook: `docs/specs/r2-runbook.md`.


---

## 0025 — Upload-time normalisation: cap the master at 3000px, bake in orientation <a id="0025"></a>
**Context:** ADR 0018 decided that **only the original lands in R2** and that all resizing is
delegated to `next/image` at request time. That is right for a 2 MB export and wrong for what a
hospitality photographer actually sends. The optimizer re-reads the **whole** original for every
single `(width, format)` it has never served before, so one 5000×3324 4 MB JPEG is decoded from
scratch for each of ~4 widths × 2 formats. Two related defects came out of looking at the same
code: `width`/`height` were recorded straight from `sharp.metadata()`, which reports the *raw*
buffer, and the blurhash was encoded without `.rotate()`. EXIF orientations 5–8 transpose an image,
so any phone-shot portrait was stored with **transposed dimensions** — handing the browser a wrong
aspect ratio, i.e. layout shift on exactly the images the placeholder exists to stabilise — and a
**sideways blurhash** that visibly snaps upright on load.

**Decision:** `finalizeUpload` normalises images in place before inserting the row.
1. **Cap the longest edge at 3000px**, comfortably above the largest width we ever request, and
   re-encode **in the same format** so the key's extension and the row's `mime` keep describing the
   bytes. Master quality is deliberately above delivery quality (JPEG q82 mozjpeg, WebP q82, AVIF
   q70, PNG level 9) — the optimizer re-encodes *from* this, so its artefacts would compound.
2. **Apply EXIF orientation and drop the EXIF block; keep the ICC profile** (`.rotate()` +
   `keepIccProfile()`). Colours must survive; the orientation tag must not, or it would be applied
   twice.
3. **An image already within budget is left byte-for-byte alone** — a hand-tuned export is never
   recompressed — and **a re-encode that comes out larger than the original is discarded**.
   Normalisation must never make a file worse.
4. `width`/`height` are recorded as the **visual** dimensions in both branches, and `bytes` records
   what is actually stored.

**Consequences:** One extra GET + PUT per oversized image, at staff volume. Measured on a real
5000×3324 interior photo: **4.0 MB → 979 KB, 76% smaller**, and the optimizer's source shrinks with
it. Overwriting a live key looks like it contradicts ADR 0024's `immutable` directive; it does not,
because this runs *inside* finalize and an asset's public URL is only ever constructed from a
finalized row — no cache anywhere can be holding the pre-normalisation bytes. The admin preview is
served from that same post-finalize URL, so it sees the normalised master too.

⚠️ **Finalize is now a heavy request: 3.5 s locally for an 11.5 MB upload** (download, decode,
resize, re-encode, upload, blurhash). Locally that is a fast machine close to the bucket; on a
Vercel function in `iad1` talking to an EU bucket it will be slower, and the image ceiling is 15 MB.
No `maxDuration` is configured in `vercel.json`, so this runs on the platform default. **If staff
report failed uploads of very large photos, that is the first thing to check** — the fix is either
a raised `maxDuration` or moving the functions to an EU region (which also matches ADR 0015 but
would move them away from the current us-east-1 Neon, so it is not a free change).

**Status:** Accepted (2026-09-12). Implemented in `core/media/server/ingest.ts` and verified against
the live bucket: an oversized export is capped at 3000px and shrinks 76%; an in-budget file comes
back byte-for-byte identical; a 4000×2500 buffer tagged orientation=6 is stored upright, with the
EXIF stripped, and recorded as portrait. Amends ADR 0018.

---

## 0026 — `media_asset` becomes two-backend (R2 | Stream); Stream vendor still unratified <a id="0026"></a>
**Context:** `media_asset` assumed one backend: `r2_key NOT NULL`. Video on Cloudflare Stream stores
no object of ours at all — only a `stream_uid` — so the table cannot describe it. The schema change
is needed now (migrations are append-only and additive, and `bytes` is wanted immediately by ADR
0025 and by the media library), while the Stream vendor decision itself still depends on a spike
that has not run.

**Decision:** One additive migration, `0013_media_asset_two_backends`:
`storage text NOT NULL DEFAULT 'r2'`, `stream_uid`, `bytes`, `duration_seconds`, `poster_media_id`;
`r2_key` **widened to nullable**; plus a CHECK that exactly one locator matches the declared
backend — `(storage='r2' AND r2_key IS NOT NULL) OR (storage='stream' AND stream_uid IS NOT NULL)`.
Widening a column is not additive, which is why golden rule 4 requires this ADR; no data is lost and
every existing row is `'r2'`, which the default preserves.

`poster_media_id` is a **bare uuid with no FK**, matching all 18 `*_media_id` references across the
slices. Referential safety for all of them is enforced in one place — the reference-safe delete in
the media library (runbook D4) — rather than by one inconsistent FK here.

Nullability is **not** propagated to the render path: `loadMedia` drops rows without an `r2_key`, so
`MediaAsset.r2_key` stays non-null. A Stream asset can never produce an `<img>`, so pushing a null
check into 18 slice call sites would buy nothing. `deleteMedia` skips the R2 delete for such rows.

**What this ADR does NOT decide:** that Cloudflare Stream is the vendor, how a Stream asset is
rendered as a muted autoplay background loop, or the async `processing` UX. Those wait on the spike
(spec §7.1). This ADR only makes the schema able to *express* a second backend.

**Consequences:** The CHECK makes a row pointing at nothing unrepresentable, at the cost of every
future writer having to set `storage` coherently — `finalizeUpload` now sets `storage: 'r2'`
explicitly rather than leaning on the default. Five columns sit unused until the Stream track
starts; that is the deliberate price of not editing a migration later.

**Status:** Accepted (2026-09-12). Migration applied and verified against the database: columns and
default present, `r2_key` nullable, and the constraint proven in both directions — it rejects
`storage='stream'` with no uid and accepts a valid Stream row.
