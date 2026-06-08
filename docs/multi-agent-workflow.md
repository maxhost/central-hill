# Multi-Agent Workflow — how to build safely in parallel

> This is the operating procedure for agents (and humans) contributing to Central Hill. It exists
> to guarantee three properties: **(1) no agent reverts or overwrites another's work, (2) no slice
> breaks a neighboring slice, (3) no agent makes a cross-cutting decision alone.** Read with
> `CLAUDE.md` (the 7 golden rules) and `docs/vertical-slices.md` (the slice catalog).

## Mental model: a slice is a vertical, not a layer

A **vertical slice** owns its full stack for one capability: route(s) + UI + server logic +
domain + its own DB tables + admin screens + i18n strings + tests, all under
`src/slices/<slice>/`. Agents are assigned **one slice (or one task within a slice)** at a time.
Two agents never touch the same files because slices are disjoint by construction.

```
src/slices/buildings/
  contract.ts   ← the ONLY surface other slices may import
  schema.ts     ← Drizzle tables this slice owns
  server/       ← queries, server actions, domain rules, revalidation
  ui/           ← route segments + components (public)
  admin/        ← backoffice CRUD for this slice
  messages/     ← en/pt/es/fr source strings
  tests/
  README.md     ← what it owns, its contract, its tables, its cache tags
```

## The boundary system (why agents can't break each other)

1. **Write boundary.** An agent may create/modify files **only under its assigned slice dir**.
   Everything else is read-only to it. Enforced in review and (optionally) by a pre-edit hook.
2. **Import boundary.** Cross-slice code flows through `contract.ts` only. Importing
   `slices/other/server/...` or `slices/other/ui/...` is a **boundary violation** → rejected.
3. **Schema boundary.** A slice's tables are private unless its contract marks an entity *public*.
   FKs and joins across slices use only public entities. No reaching into another slice's tables.
4. **Kernel boundary.** `src/core/**` is change-controlled. A feature agent **never** edits it.
   Need a kernel change? → Contract Change Request (below).

## Contracts: the unit of integration

A `contract.ts` exports:
- **Types** other slices may depend on (e.g. `BuildingSummary`, `CityRef`).
- **Read functions** other slices may call (e.g. `listBuildings`, `getBuildingBySlug`).
- **Cache tags** the slice owns and the **publish hooks** that revalidate them.
- A **version** (`export const CONTRACT_VERSION = 1`). Breaking changes bump it + ADR.

Rules:
- Internals can be refactored freely **as long as the contract holds** — that's the whole point.
- A consumer codes against the contract, never the implementation. If Buildings changes its
  internal query, Home's "featured buildings" widget keeps working.
- Adding to a contract = minor (safe). Changing/removing = breaking → **ADR + version bump +
  notify dependents** (listed in the slice README's "Consumers" section).

### Contract Change Request (CCR) — when you need something you don't own
If your slice needs a new field/function from another slice or a kernel change:
1. **Stop.** Do not edit the other slice or the kernel.
2. Write a short CCR note: what you need, why, proposed contract addition (additive preferred).
3. Escalate to the orchestrator (or open an issue). The **owning** slice's agent makes the change.
4. Resume once the contract addition lands. Meanwhile, stub against the proposed type if needed.

## The anti-revert rule (your specific fear, addressed)

- **Never** `git checkout`/`reset`/`revert`, delete, or rewrite code you didn't author to make
  your task pass. If a neighbor's code blocks you, it is an **integration issue to report**, not
  an obstacle to bulldoze.
- **Never** "fix" failing tests in another slice by changing that slice — escalate instead.
- **Append, don't overwrite.** New behavior = new file/function/migration, not mutation of
  someone else's working code.
- Branch-per-slice + small PRs make accidental clobbering structurally hard; the boundary check
  in CI fails any PR that modifies files outside its declared slice.

## Avoiding wrong decisions

- **Check before you choose.** Before picking a library, pattern, or schema shape, read
  `docs/decisions/` (ADRs) and `docs/conventions.md`. If it's already decided, follow it.
- **Decisions have a home.** Anything cross-cutting (new dependency, kernel change, schema
  pattern, auth/i18n/SEO approach) → **ADR required**, decided by the orchestrator, not a feature
  agent mid-task.
- **Escalate ambiguity.** If the brief is unclear or two interpretations are plausible, surface
  the question with a recommendation — don't guess on irreversible things (schema, URLs, public
  contracts).
- **Prefer additive & reversible.** When unsure, choose the option that's easy to extend and hard
  to break (new column over altered column; new contract method over changed signature).

## Sequencing & parallelism

Slices have a **dependency graph** (`docs/vertical-slices.md`). The orchestrator schedules so that:
- **Foundation first** (S0 kernel + app shell + design system + i18n + auth + media + ISR helpers).
  Until the kernel's contracts are stable, feature slices are blocked on what they consume.
- **Contracts before consumers.** A slice that *produces* a contract (e.g. `geography`,
  `buildings`) lands before slices that *consume* it (e.g. `pages` featured widgets).
- **Disjoint slices run in parallel.** Slices with no shared files/tables/contract edges are
  dispatched concurrently to multiple agents.
- **Worktree isolation** for any task that must touch a shared area or run migrations, so parallel
  agents never collide on the working tree or the migration sequence. Migration numbers are
  allocated by the orchestrator to avoid clashes.

## The lifecycle of a slice task

1. **Assign.** Orchestrator gives the agent: slice name, the task, the contracts it may consume,
   the migration number(s) reserved for it, and the Definition of Done.
2. **Read.** Agent reads `CLAUDE.md`, the slice `README.md`, relevant ADRs, the briefs in
   `cliente-docs/` / `docs/content-briefs.md`, and the contracts it depends on.
3. **Build.** Implements end-to-end within the slice dir: schema → migration → server → ui →
   admin → i18n → tests. Wires ISR revalidation for public content.
4. **Self-verify.** `typecheck`, `lint`, `test`, `build`; `git status` shows only owned files.
5. **Review (adversarial).** A reviewer agent checks: boundary compliance (no foreign edits, no
   internal imports, no edited migration), correctness vs brief, i18n completeness, ISR wiring,
   contract/README updated. Findings are verified before being accepted.
6. **Integrate.** Orchestrator merges; the app shell mounts any new routes/admin screens via the
   contract. Dependent slices are notified if a contract grew.

## Definition of Done (authoritative copy)

- [ ] Only files inside the assigned slice changed (`git status` clean of foreign paths).
- [ ] `pnpm typecheck && pnpm lint && pnpm test --filter <slice> && pnpm build` green.
- [ ] No cross-slice internal imports; consumed slices accessed via `contract.ts` only.
- [ ] DB change is a new, additive, numbered migration; no applied migration edited.
- [ ] i18n keys present for **en, pt, es, fr** (source authored; targets may be draft).
- [ ] Public-content writes call the correct `revalidateTag`/`revalidatePath` on publish.
- [ ] `contract.ts` (+ `CONTRACT_VERSION` if changed) and slice `README.md` updated.
- [ ] Passed adversarial review (boundaries + correctness + verified findings).

## Roles

- **Orchestrator** (you, the main loop): owns the slice plan, sequencing, migration-number
  allocation, ADRs, kernel changes, and merges. Resolves CCRs and escalations.
- **Slice agent:** implements one slice/task within its boundary. Escalates rather than deciding
  cross-cutting matters or reverting foreign code.
- **Reviewer agent:** adversarially verifies a finished slice against the DoD before merge.

## Optional hard enforcement (recommended once code exists)

The boundary rules can be enforced mechanically (so a misbehaving agent is *blocked*, not just
reviewed): a CI **boundary check** script + a Claude Code **PreToolUse hook** that rejects `Edit`/
`Write` outside the active slice dir and any edit to `drizzle/` files that already exist. Wiring
this is tracked as an ADR/task; until then, boundaries are enforced at review.
