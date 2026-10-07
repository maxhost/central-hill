# System overview (current state, 2026-10-06)

Describes what exists. Authoritative design docs: `docs/architecture.md` (intent),
`docs/decisions/README.md` (ADRs 0001–0032, all inline in one file), `docs/data-model.md`.
Where those docs and the code disagree, the code was checked and the gap is listed under
**Known architectural ambiguities**.

## Runtime shape

A **single Next.js 16 App Router monolith** (ADR 0004). There are no separate services,
workers or queues.

```
Visitor ─▶ CDN ─▶ /[locale]/…  public RSC pages, ISR-static (revalidate 3600 + tag busts)
                  /sitemap.xml /sitemaps/* /robots.txt /llms.txt   (SEO/GEO artefacts)
Staff   ─▶      ─▶ /admin/…     (admin) route group, own root layout, dynamic,
                                 gated by requireStaff() in (panel)/layout.tsx
                  /api/auth/*   Better Auth handler (the only API route)
                       │
        Server Actions (slices/*/admin/actions.ts) ─▶ Neon Postgres (Drizzle)
                                                   ─▶ Cloudflare R2 (presigned PUT + finalize)
                                                   ─▶ revalidateTag / revalidatePath
```

- **Routing:** `src/proxy.ts` is next-intl's middleware, which handles locale detection and
  prefixes `en|pt|es|fr`. It excludes `api`, `admin`, `sitemaps`, `_next` and files with an
  extension. There is **no host split**: the backoffice lives at the path `/admin` (ADR 0017,
  interim).
- **Two root layouts:** `src/app/[locale]/layout.tsx` (public) and
  `src/app/(admin)/layout.tsx` (admin, English-pinned).

## Frontend / backend boundary

- Public pages are **React Server Components**. Data comes from slice `server/queries.ts`
  read functions, each wrapped in `unstable_cache` with entity/list cache tags. They run at
  build or regeneration time, not per request. Client islands are few and local (forms,
  carousels, galleries, the Avantio search bar).
- The backoffice is RSC + client form islands that post to **Server Actions** (no REST
  API). Every action calls `requireStaff()` and re-validates its input with Zod.
- Slices expose their public surface only through `src/slices/<slice>/contract.ts`. `src/app`
  route files are a thin shell that imports slice UI/contract. A grep on 2026-10-06 found
  **no cross-slice internal imports**.

## Persistence

- Neon Postgres via `src/core/db/client.ts` (Drizzle, `@neondatabase/serverless`).
- Tables are owned per slice (`src/slices/*/schema.ts`) plus kernel tables (`src/core/auth/schema.ts`
  Better Auth + `staff_role`, `src/core/i18n/schema.ts` `translation` + `slug`,
  `src/core/media/schema.ts` `media_asset`).
- Migrations: `drizzle/0000…0014` + `drizzle/meta/_journal.json`. They are applied with
  `pnpm db:migrate` and guarded by `pnpm db:check` (journal ordering; filesystem only). See
  `docs/specs/migration-journal-ordering-fix.md` for why the guard exists.
- **Translatable [T] fields are not columns.** They live in the kernel `translation` table
  keyed `(entity_type, entity_id, field, locale)` with `state`. Per-locale slugs live in `slug`.
  Writes go through `src/core/i18n/content-write.ts` (ADR 0019/0021); reads go through
  `src/core/i18n/content.ts` (only `approved` targets render, otherwise the `en` source).
  Some entities store structured content as one [T] JSON field: the blog post `body`
  (ADR 0013) and the service `detail` (`src/slices/services/detail.ts`). Fixed marketing
  pages use `page_content.data jsonb` + `block:<path>` translations (ADR 0012).

## Rendering, caching, revalidation

- ISR with `revalidate = 3600` on public routes plus **on-demand** busts. Each slice
  declares its tags in `contract.ts` and busts them from `server/publish.ts` after admin
  writes (`src/core/revalidate` helpers).
- Cache keys are hand-written strings in each `unstable_cache` call. A change in the
  read-model shape needs a key bump; `services:getServiceBySlug:v2` is the precedent.

## Background jobs

None. There is no queue or cron. The translation pipeline runs on demand (staff clicks
"generate" in `/admin/translations`). Seeds and backfills in `scripts/` are run manually
with `pnpm tsx --env-file=.env.local --tsconfig scripts/tsconfig.json scripts/<x>.ts`.

## External integrations

| System | Where | Status |
|---|---|---|
| Neon Postgres | `src/core/db`, `drizzle.config.ts` | live |
| Cloudflare R2 (S3 API) | `src/core/media/server/ingest.ts` (presign/finalize/delete, sharp resize, blurhash), `next.config.ts` remotePatterns | live; EU bucket (ADR 0015/0024) |
| Cloudflare Stream | `media_asset.storage='stream'` (ADR 0026) | schema only, no implementation |
| Avantio | `apartments.avantio_id/url`, buildings, `settings` (Avantio account config, `avantio-search-bar-client.tsx`) | embed/deep-link + search widget |
| Better Auth | `src/core/auth`, `src/app/api/auth/[...all]` | live (backoffice only) |
| Email | `src/core/email` | seam only: console (dev) / noop (prod) provider |
| LLM translation | `src/core/i18n/translate.ts` | seam only: identity provider (copies source) |
| jsDelivr CDN | Iconoir stylesheet (`src/app/mock.css` `@import`, services `ServiceCard`) | live, external CSS at runtime |
| Unsplash / Wikimedia / Pexels | `scripts/seed-*.ts` only | build-free; images re-hosted to R2 |

## Authentication / authorization

Better Auth sessions (Neon adapter). Staff = a user with a `staff_role` row
(`admin|editor|translator`). `requireStaff(roles?)` redirects to `/admin/login` when there is
no session or the user is not staff, and to `/admin/forbidden` when the role doesn't match. It
gates the `(panel)` layout and is called again inside every Server Action. `scripts/create-admin.ts`
bootstraps staff. Public surface has no auth. The **only unauthenticated mutation** is the
leads `submitLead` Server Action (`src/slices/leads/server/actions.ts`). The backoffice media
actions (`src/slices/backoffice/server/media-actions.ts`, presign/finalize/previews) are
`requireStaff`-gated even though they live outside `admin/`.

## Important data flows

1. **Publish:** staff edits → Server Action (Zod) → Drizzle write + `setSourceContent`/`setSlugs`
   → `revalidateTag` → the public page regenerates on its next request.
2. **Media:** browser asks for a presigned PUT → uploads to R2 → finalize (download, normalise
   ≤3000px, re-upload master, blurhash, `media_asset` row). This happens on save, not on pick
   (ADR 0030). Images are served via `next/image` from `R2_PUBLIC_BASE_URL`.
3. **Translation:** source (`en`) row → `generateDrafts` (identity provider today) →
   `needs_review` → staff approve in the review inbox → `approved` renders publicly.
4. **Leads:** public form → `leads` Server Action → `lead` + `lead_field` rows (GDPR consent
   captured, ADR 0014) → best-effort email (currently console/noop) → `/admin/leads` inbox.

## Shared infrastructure (kernel `src/core/`)

`auth`, `db`, `email`, `env` (env parsing), `i18n` (content read/write, translate provider),
`media` (R2 + `MediaImage` + blur), `revalidate`, `seo` (metadata, JSON-LD builders),
`ui` (design system, roughly 50 presentational components; see `src/core/ui/index.ts`),
`validation` (Zod primitives, `tStr` translatable marker, `translatablePaths`).

## Known architectural ambiguities

- **Hosting target is unclear.** ADR 0003 and `netlify.toml` say Netlify. `vercel.json`
  also exists, and `src/app/(admin)/admin/(panel)/layout.tsx` sizes `maxDuration` for a Vercel
  function. Which platform is production is not determinable from
  the repo.
- **Docs describe enforcement that does not exist.** `docs/architecture.md` §9 and
  `docs/multi-agent-workflow.md` describe CI gates (`test`, boundary check). There is no CI
  config in the repo, `pnpm test` and `pnpm boundary:check` are `echo … && exit 0`
  placeholders, and slice tests are only runnable per file via `tsx --test`.
- **`docs/architecture.md` is partly out of date vs. code and ADRs:**
  - It describes a host split `backoffice.*` handled in middleware; ADR 0017 replaced this
    with the `/admin` path and no middleware gate.
  - It describes translation "jobs enqueued on save"; the code runs on demand with an
    identity provider.
  - It references `docs/decisions/0002-rendering-isr.md` and a `core/embeds` wrapper; neither
    exists (ADRs are all inline in `docs/decisions/README.md`).
- **Unit-test drift:** 16 of 225 slice tests fail at HEAD, and the same 16 failed at
  `3f3c5c5`. Fixtures are behind the current admin save schemas (for example, buildings now
  requires `booking_enabled`). Nothing runs them automatically.
- **Three icon systems coexist:** the Iconoir CDN stylesheet, a hand-copied SVG registry in
  `src/slices/pages/ui/components/icon.tsx`, and per-position SVGs in code. A unification
  ADR (0033) is drafted and parked in `docs/parqueado.md`. The Iconoir CSS is an external
  runtime dependency on a performance-critical site.
- **Legacy mock CSS remains in production.** `src/app/mock.css` (a scoped port of
  `mock/assets/site.css`) is still imported by some routes. Pages are being migrated
  section-by-section to `core/ui` components (`docs/component-extraction-workflow.md`), so a
  page may mix `.mk`-scoped raw markup and components.
- **`src/slices/media/`** contains only `validation.ts`, has no README and is not in the
  slice catalog (`docs/vertical-slices.md`). Media behaviour lives in the kernel `src/core/media`.
- **Apartments has no public route** (`src/app/[locale]/` has no apartments page). Apartments
  surface inside the buildings detail page; booking is through Avantio.
- **Seed scripts write to whichever database/bucket the local environment points at.** The
  repo does not document how environments (local, preview, production) are separated.
- **Cache-key versioning is manual.** Any change to a cached read model's shape must bump its
  `unstable_cache` key, or stale entries break rendering. There is no guard; this was observed
  as a 500 on 2026-10-06.
- **Client briefs are deliberately untracked:** `CLAUDE.md` names `cliente-docs/` as the
  requirements source of truth, but `.gitignore` excludes it ("NOT pushed to the public repo")
  and it is absent from this checkout. Agents only have the synthesis `docs/content-briefs.md`.
- **ADR numbering collision:** `docs/decisions/README.md` has an accepted ADR 0033 (Home
  components → `core/ui`), missing from its own index. `docs/parqueado.md` also proposes a
  different "ADR 0033" (icon system).
