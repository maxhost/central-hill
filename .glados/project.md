# Project — Central Hill

## Purpose

Public website and custom backoffice for Central Hill, a Lisbon-based furnished-rentals /
hospitality company. The public site is a fast, SEO/GEO-focused **catalogue** of buildings and
apartments plus editorial content (blog, guest services, city guides, marketing pages).
Booking is **not** built here: it is delegated to the embedded **Avantio** engine. The site is
multilingual (EN / PT / ES / FR). Sources: `CLAUDE.md`, `docs/architecture.md`.

## Users / actors

- **Visitors**: guests looking for apartments/services/guides, property owners (earnings
  estimate, owner services), real-estate prospects. Public, anonymous, read-only, except
  lead forms (contact, earnings estimate, deal enquiry, newsletter).
- **Staff** (backoffice, `/admin`): roles `admin | editor | translator`
  (`src/core/auth/session.ts`). They edit content, review translations and read the leads inbox.
- **External systems**: Avantio (booking widget/search), Neon, Cloudflare R2, Netlify/Vercel.

## Stack

- Next.js 16 (App Router, RSC, ISR) + React 19 + TypeScript (strict), pnpm 10.
- **Node 22.x is required** (`package.json` `engines.node: 22.x`; `netlify.toml`
  `NODE_VERSION = "22"`). Running another major (e.g. 24.x) is an environment mismatch: pnpm
  warns "Unsupported engine".
- Tailwind CSS v4 + in-repo design system `src/core/ui` (palette locked to "Warm Editorial",
  ADR 0022).
- Postgres on **Neon** via **Drizzle ORM** + drizzle-kit migrations (`drizzle/`).
- **Better Auth** (backoffice only), **next-intl** (4 path-prefixed locales), **Zod 4**.
- **Cloudflare R2** (S3 API, `@aws-sdk/client-s3`) + `sharp`/`blurhash` media pipeline.
- Hosting: Netlify per ADR 0003 / `netlify.toml`, but `vercel.json` also exists. See
  ambiguities in `architecture/system-overview.md`.

## Repository structure

| Path | Role |
|---|---|
| `src/app/` | App Router shell: `[locale]/…` public routes, `(admin)/admin/…` backoffice routes, `api/auth`, SEO files (sitemaps, robots, llms.txt) |
| `src/core/` | **Shared kernel**, change-controlled by ADR: `auth db email env i18n media revalidate seo ui validation` |
| `src/slices/<slice>/` | **Vertical slices**, each owning `contract.ts`, `schema.ts`, `server/`, `ui/`, `admin/`, `tests/`, `README.md` |
| `src/proxy.ts`, `src/i18n/` | next-intl locale routing (Next 16 "proxy" = middleware) |
| `messages/{en,pt,es,fr}.json` | UI strings, namespaced per slice |
| `drizzle/` | Numbered, append-only SQL migrations + journal |
| `scripts/` | Seeds, backfills, admin creation, migration-order check (`pnpm db:check`) |
| `mock/` | Approved static HTML design baselines (`mock/home.html`, `mock/service-detail.html`, …) |
| `docs/` | Architecture, data model, slices, conventions, ADRs (`docs/decisions/README.md`), specs/handoffs |

## External systems

Neon Postgres · Cloudflare R2 (media; Cloudflare Stream is modelled in `media_asset` but not
implemented) · Avantio (booking widget/search) · Better Auth · jsDelivr CDN (Iconoir icon
stylesheet) · Unsplash / Wikimedia / Pexels (seed-script image sources only) · Email and LLM
translation **seams exist but no vendor is wired**: console/noop email, identity translate
provider.

## Verification

`pnpm typecheck`, `pnpm lint`, the slice unit suites (`npx tsx --test …`, see
`project.yaml`; **not** `pnpm test`, which is an `echo` placeholder), `pnpm build`. Use
Node 22.x. `pnpm db:check` validates the migration journal (filesystem
only). There is **no CI config** in the repo, and `pnpm test` / `pnpm boundary:check` are
placeholders. Baseline: `architecture/existing-harness.md`.

## Important constraints (from CLAUDE.md / docs)

- **Performance is the product:** public pages are ISR-static and must not hit the DB at
  request time.
- **Slice ownership:** write only inside your slice; cross-slice access only via
  `contract.ts`; `src/core/` changes require an ADR.
- **Migrations** are additive, forward-only and never edited after creation (ADR 0010).
- **i18n:** every UI string in all 4 locales; content translated per field via the
  `translation` table. Public pages render only `approved` targets, with fallback to `en`.
- **Public-content changes must wire ISR revalidation** (`revalidateTag`/`revalidatePath`).
- **Design:** Warm Editorial tokens only (no raw hex); approved mocks are the visual baseline.
  Consistency with a sibling page's component config beats pixel fidelity to a mock.
- No commits/pushes without the owner's go-ahead (`docs/component-extraction-workflow.md`,
  step 10).
