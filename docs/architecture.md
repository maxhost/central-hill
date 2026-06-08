# Architecture

> Companion to `CLAUDE.md`. This is the system-level "why" and "how". For the data model see
> `docs/data-model.md`; for slice ownership see `docs/vertical-slices.md`.

## 1. Goals & constraints

| Goal | Implication |
|---|---|
| Public pages load in < 3s (aspire ~200ms) | Static HTML from CDN, **no DB at request time** |
| Impeccable SEO + GEO (generative-engine optimization) | SSR/SSG HTML, JSON-LD, hreflang, sitemaps, `llms.txt`, clean semantics |
| Premium/boutique look & feel | Design-system driven, image-optimized, minimal CLS |
| Multilingual EN/PT/ES/FR | Path-prefixed locales, translation pipeline, per-locale slugs |
| Add features without breaking others | Vertical slices + contracts + additive migrations |
| Clear, scalable, maintainable DB | Slice-owned tables, FKs only to owned tables, forward-only migrations |
| Low traffic, cost-conscious | Netlify + Neon + R2; no over-engineering, no microservices |

**Non-goals:** building a booking engine (Avantio is embedded), high-scale infra, a generic CMS.

## 2. High-level shape

A **single Next.js (App Router) monolith** serving two surfaces, split by host in middleware:

- **Public site** (`centralhill.<tld>`) — statically rendered (ISR), read-only, ultra-fast.
- **Backoffice** (`backoffice.centralhill.<tld>`) — auth-gated (Better Auth), dynamic,
  writes content and triggers revalidation.

```
                    ┌────────────────────────── Netlify (CDN + Next runtime) ──────────────────────────┐
 Visitor ──▶ CDN ──▶│  Public routes  /[locale]/...   ── ISR static, served from edge cache           │
                    │        ▲ revalidateTag on publish                                                │
 Admin  ──▶ Auth ──▶│  /backoffice  ── dynamic RSC + server actions ── reads/writes Neon, R2, email   │
                    └──────────────────────────────────────────────────────────────────────────────────┘
                               │                         │                  │
                            Neon (Postgres)            R2 (media)        Email + LLM (translate)
```

### Why ISR instead of a hand-rolled JSON-snapshot layer
The original instinct ("generate a JSON on every property change so the public site never calls
the DB") is correct in spirit — but Next.js ISR delivers exactly that, natively and safely:

- Public pages are **pre-rendered to static HTML** and served from the CDN (no DB on the hot path).
- On content **publish** in the backoffice, we call `revalidateTag(...)` / `revalidatePath(...)`
  for just the affected entity → that page (and its locale variants) regenerate.
- No bespoke snapshot store, no manual cache-invalidation bugs, no consistency drift.

This is recorded in `docs/decisions/0002-rendering-isr.md`.

## 3. Rendering & caching strategy

- **Public pages:** Server Components, statically generated, cached by tag. Default to
  `generateStaticParams` for known entities (buildings, apartments, blog posts, services,
  guide pages) × 4 locales. Long `revalidate` + **on-demand `revalidateTag`** on publish.
- **Cache tags** are entity-scoped, e.g. `building:<id>`, `building-list`, `apartment:<id>`,
  `blog:<slug>`, `blog-list`, `city:<id>`, `guide:<id>`, `globals`, `nav`, `<locale>` overlays.
  Each slice declares its tags in its `contract.ts`. Publishing an entity revalidates its tag
  + any list/aggregation tag it appears in (the slice owns this mapping).
- **No DB at public request time.** If a public RSC needs data it doesn't have at build, that's
  a design smell — surface it, don't add a runtime query.
- **Backoffice pages:** dynamic, `no-store`; read live from Neon.
- **Images:** stored in R2, served through the image pipeline (responsive `srcset`, AVIF/WebP,
  lazy, explicit dimensions to keep CLS ~0). See `src/core/media`.

## 4. Internationalization

- Locales: `en | pt | es | fr`. **All path-prefixed** (`/en/...`, `/pt/...`, `/es/...`, `/fr/...`).
  Root `/` performs a redirect using `Accept-Language` / geo, defaulting to `en`.
- **next-intl** drives UI strings (per-slice `messages/`) and locale routing.
- **Content** (buildings, posts, services, guides, page blocks…) is translated at the **field
  level** in the DB — see the translation model in `docs/data-model.md`. Translatable fields
  carry a per-locale value with a **state**: `missing → draft → needs_review → approved`.
  Public pages render only `approved` (with documented fallback policy to source locale).
- **Per-locale slugs** for every public entity, with `hreflang` alternates and a canonical URL.
- Full SEO/i18n rules: `docs/seo-i18n.md`.

## 5. Translation pipeline (LLM + human review)

Cross-cutting service in `src/core/i18n/translate`, consumed by content slices.

```
Author writes source field (e.g. EN)
      │  on save
      ▼
Enqueue translation job (per target locale, per field)
      │
      ▼  LLM provider (behind interface)
Draft translation written  ── state: draft → needs_review
      │
      ▼  Backoffice "Translation review" inbox
Reviewer edits/approves  ── state: approved
      │
      ▼  Publish ⇒ revalidateTag(entity + locale)
Public page regenerates with approved translation
```

- The LLM provider sits behind an interface so it's swappable; no public page ever calls it.
- Jobs are idempotent and re-runnable; re-editing the source resets dependent locales to `draft`.
- Glossary / do-not-translate list (brand names, street addresses, proper nouns) lives in config.

## 6. Booking (Avantio) integration

- We **embed** Avantio; we do **not** build booking, availability, or payments.
- Each **Apartment** (and optionally Building) stores an **external booking reference**
  (`avantio_id` / `avantio_url`). The "Book" CTA mounts the Avantio widget/deep-link for that ref.
- The embed is isolated in `src/slices/apartments` (and a small `core/embeds` wrapper) so the
  third-party script never leaks into global scope or hurts public LCP (lazy, post-interaction).
- No Avantio data is required at build time → catalog content (photos, descriptions, amenities)
  is ours; live availability/pricing stays in the widget.

## 7. Backoffice & auth

- Backoffice is part of the monolith, gated by **Better Auth** (Neon adapter), resolved in
  middleware by host (`backoffice.*`) → all routes require an authenticated staff session.
- Roles: start with `admin` and `editor`; translation review is a capability. RBAC lives in
  `src/core/auth` (kernel) and is referenced by slices, never re-implemented.
- Each feature slice contributes its **admin screens** under `src/slices/<slice>/admin` and
  registers them with the backoffice shell via the slice contract — the shell composes, slices own.

## 8. Data flow summary

1. Editor creates/edits an entity in the backoffice (writes to Neon, uploads media to R2).
2. On **publish**, a server action validates, persists, enqueues translations, and calls
   `revalidateTag` for the entity + affected lists/locales.
3. Netlify regenerates the affected static pages in the background.
4. Visitors are served static HTML from the CDN — fast, DB-free, fully translated.

## 9. Environments & delivery

- **Branch-per-slice** → preview deploy on Netlify → adversarial review → merge to `main` → prod.
- Neon **branch databases** per preview where schema changes are involved (isolated migrations).
- CI gates: `typecheck`, `lint`, `test`, `build`, and a **boundary check** (no cross-slice
  internal imports, no edits outside the PR's declared slice, no edited past migrations).

## 10. Cross-cutting concerns (built in the kernel, consumed by slices)

| Concern | Home | Notes |
|---|---|---|
| DB client & migrations | `core/db` | Drizzle + Neon; slices add `schema.ts`, kernel wires the registry |
| Auth & RBAC | `core/auth` | Better Auth; slices check capabilities |
| i18n runtime + translate | `core/i18n` | next-intl + LLM translation service |
| Design system | `core/ui` | premium primitives, tokens, layout |
| Media | `core/media` | R2 upload + responsive images |
| Email | `core/email` | lead notifications |
| SEO | `core/seo` | metadata, JSON-LD builders, sitemap/hreflang helpers |
| Revalidation | `core/revalidate` | tag/path helpers, publish hooks |
