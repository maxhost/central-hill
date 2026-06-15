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
