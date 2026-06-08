# Conventions — the Golden Path

> Follow these so agents converge on one way of doing things. Deviations need an ADR.
> If something here is unclear or seems wrong for a case, **escalate** — don't improvise silently.

## Language & tooling
- **TypeScript strict.** No `any` (use `unknown` + narrowing). No non-null `!` on external data.
- **pnpm** workspace. Scripts: `dev`, `build`, `start`, `typecheck`, `lint`, `test`, `db:generate`,
  `db:migrate`, `boundary:check`.
- **ESLint + Prettier**; import boundaries enforced by lint rule (no `slices/*/server|ui|admin`
  imports across slices) + the `boundary:check` script.

## Next.js / rendering
- Public routes live under `app/[locale]/...` and are **Server Components by default**. Add
  `"use client"` only for genuinely interactive leaves (forms, embeds, carousels).
- **Never fetch from the DB in a public route at request time.** Use static generation +
  `generateStaticParams` + tag-based revalidation. Backoffice routes are dynamic.
- Co-locate route segments in the owning slice's `ui/` and re-export to `app/` via thin wrappers;
  `app/` stays a composition shell.
- Always set explicit image dimensions and use the `core/media` image component (CLS ≈ 0).

## Data & DB
- One ORM: **Drizzle**. Schema in each slice's `schema.ts`, registered with `core/db`.
- Migrations via drizzle-kit, **numbered, append-only**. Generate, review the SQL, commit it.
- Reads for public pages go through the slice's `server/` query functions (typed, cache-tagged).
- Validate all external input (forms, params) with **Zod** at the boundary.

## Server actions & mutations
- Mutations are **server actions** in `server/actions.ts`, guarded by auth/RBAC (`core/auth`).
- On content publish: validate → persist → enqueue translations → `revalidateTag(...)`. Encapsulate
  this in a slice `publish()` helper; don't scatter `revalidateTag` calls.

## i18n
- UI strings via `next-intl`, namespaced per slice in `messages/{en,pt,es,fr}.json`. Every key
  exists in all four files (source authored; others may start as drafts).
- Content translation goes through the `translation` table + pipeline, never hardcoded per locale.
- Never concatenate translated fragments; use full ICU messages with placeholders.
- Do-not-translate: brand names, street addresses, proper nouns (glossary in `core/i18n/config`).

## Naming
- Files `kebab-case`; React components `PascalCase`; functions/vars `camelCase`; DB tables/columns
  `snake_case`; slice dirs `kebab-case` matching `docs/vertical-slices.md`.
- Cache tags: `entity:<id>`, `entity-list`, `globals`, `nav`. Declared in the slice contract.

## Styling / design system
- Tailwind + tokens from `core/ui` (color, type scale, spacing, radius, shadow). No raw hex in
  components. Premium/boutique aesthetic — restraint, whitespace, high-quality imagery, subtle motion.
- Shared primitives (Button, Card, Section, Container, Heading, Field…) live in `core/ui`; slices
  compose them, don't re-implement.

## Testing
- Unit-test domain logic and contract functions. Component-test interactive UI. Each slice owns its
  `tests/`. A slice's tests must pass in isolation (`test --filter <slice>`).
- Public pages get a build-time smoke + (later) Lighthouse budget check in CI.

## Errors & resilience
- No silent catches. Surface and log via `core/observability` (added in S0). Forms return typed
  field errors. Third-party embeds (Avantio) load lazily and fail soft (never block LCP).

## Security
- Backoffice behind Better Auth + RBAC on every action. Validate/escape all rich text on render.
- Secrets only via env (`core/env` validates them at boot). Never commit secrets; R2/Neon/email/LLM
  keys are server-only.

## Git / PRs
- Branch per slice/task. Small PRs. Commit messages: `<slice>: <what>`. PR body lists the slice,
  the migration number(s), contracts touched, and the DoD checklist.
- CI must be green incl. `boundary:check` before merge.
