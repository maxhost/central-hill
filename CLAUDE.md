# Central Hill — Operating Manual (read this first)

Central Hill is a **premium furnished-rentals catalog** for a Lisbon-based hospitality
company. A fast, SEO/GEO-impeccable **public site** showcases a portfolio of buildings &
apartments (booking is delegated to an embedded **Avantio** engine), plus editorial content
(blog, services, city guides). A custom **backoffice** manages all of it. The site is
multilingual (EN / PT / ES / FR) with an LLM-assisted, human-reviewed translation pipeline.

> **Performance is the product.** Target public TTFB/LCP: < 3s hard ceiling, ~200ms aspiration.
> Public pages are **statically rendered (ISR)** and never hit the database at request time.

This repository is built by **multiple agents working in parallel on vertical slices**.
The rules below exist so that agents never revert each other, never break neighboring
features, and never make unilateral cross-cutting decisions. **Follow them exactly.**

---

## 🟡 The 7 Golden Rules (non-negotiable)

1. **Own your directory.** You may only **write inside the slice you were assigned**
   (`src/slices/<slice>/…`) plus brand-new files. You may **read anything**. You may **never
   edit files owned by another slice or the shared kernel** (`src/core/…`). Need a change
   there? → open a *contract change request* (see `docs/multi-agent-workflow.md`) and stop.

2. **Talk through contracts, not internals.** Slices import each other **only** through the
   public contract a slice exports (`src/slices/<slice>/contract.ts`). Never import another
   slice's internal queries, components, or tables.

3. **The shared kernel is change-controlled.** `src/core/` (DB client, auth, i18n runtime,
   design system, R2, ISR/revalidation helpers, shared types) changes **only** via an ADR
   (`docs/decisions/`). Feature agents do not edit it ad-hoc.

4. **Migrations are additive & forward-only.** Each slice owns its tables. Migrations are
   sequentially numbered, **never edited after creation**, and never destructive without an
   ADR. Cross-slice references point only at *owned* tables.

5. **Never revert or delete code you didn't write.** If another slice blocks you, **stop and
   report an integration issue** — do not work around it by reverting, deleting, or rewriting
   someone else's code. Append, don't overwrite.

6. **Stay in your lane; escalate decisions.** If a task needs a decision outside your slice,
   a kernel change, or contradicts an ADR/convention, **escalate** — do not decide unilaterally.
   Check `docs/decisions/` and `docs/conventions.md` *before* choosing any pattern.

7. **Done means verified.** A slice is done only when: `typecheck` + `lint` + slice tests pass,
   its `contract.ts` is documented, **no files outside the owned dir changed**, the migration is
   additive, **i18n keys exist for all 4 locales**, and (if it renders public content) **ISR
   revalidation is wired**. Every slice passes an adversarial review before merge.

---

## Stack (do not add technologies without an ADR)

- **Framework:** Next.js (App Router, RSC) + TypeScript (strict).
- **Hosting:** Netlify (Next.js runtime; ISR + on-demand revalidation supported).
- **DB:** Neon (Postgres, serverless) via **Drizzle ORM** + drizzle-kit migrations.
- **Auth:** **Better Auth** (Postgres/Neon adapter) — backoffice only.
- **i18n:** **next-intl**, 4 locales `en | pt | es | fr`, all path-prefixed.
- **Storage/media:** Cloudflare **R2** (S3-compatible) + responsive image pipeline.
- **Styling:** Tailwind CSS + a small in-repo design system (`src/core/ui`). Premium/boutique
  feel (refs: ukio.com look, lovelystay.com information architecture).
- **LLM:** translation pipeline (provider behind an interface in `src/core/i18n/translate`).
- **Email:** transactional provider behind `src/core/email` (lead notifications).

See `docs/architecture.md` for the full picture and `docs/decisions/` for *why*.

## Repository shape

```
src/
  app/                 # App Router — thin shell only (routing, locale, layout, composition)
  core/                # SHARED KERNEL — change-controlled (ADR required)
    db/  auth/  i18n/  ui/  media/  email/  seo/  revalidate/  types/
  slices/              # VERTICAL SLICES — each owns its dir end-to-end
    <slice>/
      contract.ts      # public API of the slice (the ONLY thing others may import)
      schema.ts        # Drizzle tables owned by this slice
      server/          # queries, actions, domain logic
      ui/              # components, route segments
      admin/           # backoffice screens for this slice
      messages/        # i18n source strings (en/pt/es/fr)
      tests/
      README.md        # what this slice owns, its contract, its tables
drizzle/               # numbered migrations (append-only)
docs/                  # architecture, data model, workflow, decisions
cliente-docs/          # client content briefs (source of truth for requirements)
```

## Key docs (read before working)

- `docs/architecture.md` — system design, rendering/ISR, i18n, Avantio, translation pipeline.
- `docs/data-model.md` — entities, ownership, schema rules. **The DB source of truth.**
- `docs/vertical-slices.md` — the slice catalog, ownership map, dependency graph.
- `docs/multi-agent-workflow.md` — how agents pick up work safely (contracts, escalation, DoD).
- `docs/conventions.md` — coding conventions / the golden path.
- `docs/seo-i18n.md` — SEO/GEO + i18n implementation rules.
- `docs/decisions/` — ADRs. The record of every cross-cutting decision.
- `docs/content-briefs.md` — synthesized client requirements per page.

## Definition of Done (per slice) — copy into every task

- [ ] Only files inside the assigned slice dir changed (verify with `git status`).
- [ ] `pnpm typecheck && pnpm lint && pnpm test --filter <slice>` all green.
- [ ] No import of another slice's internals; cross-slice access via `contract.ts` only.
- [ ] DB changes are a new, additive, numbered migration; no past migration edited.
- [ ] i18n keys added for **en, pt, es, fr** (source authored; others may be draft).
- [ ] Public-content changes wire ISR `revalidateTag`/`revalidatePath` on publish.
- [ ] `contract.ts` + slice `README.md` updated.
- [ ] Passed adversarial review (boundaries + correctness).
