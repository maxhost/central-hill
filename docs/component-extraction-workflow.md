# Component Extraction Workflow (piloted 2026-10-05 — adopted)

> **Status:** piloted successfully 2026-10-05 (3 agents, cross-file, all merged to `main`).
> Written earlier the same day after a solo (single-thread) session doing this work
> page-by-page, section-by-section; revised after a research pass against Claude Code's
> official docs (`worktrees`, `sub-agents`, `agents`, `commands`) and Anthropic's "How we built
> our multi-agent research system" engineering post (see "What the research changed" below);
> then piloted end-to-end, coordinator-merged, and revised again with real findings (see "Pilot
> results" below). Treat this as the working process for this task type going forward, not a
> proposal.

## What the research changed

Sources: [Claude Code docs — Run parallel sessions with worktrees](https://code.claude.com/docs/en/worktrees),
[Create custom subagents](https://code.claude.com/docs/en/sub-agents),
[Run agents in parallel](https://code.claude.com/docs/en/agents),
[Commands reference](https://code.claude.com/docs/en/commands),
[Anthropic — How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system).

1. **`isolation: "worktree"` on the `Agent` tool call is a documented, platform-enforced
   mechanism, not something we're assembling ourselves.** Claude Code actively blocks any
   `Edit`/`Write`/`Bash` from an isolated agent that targets the main checkout — this gives
   Golden Rule 1 ("own your directory") a technical backstop, not just a prompt instruction.
   The worktree auto-cleans if the agent made no changes, and persists on disk if it did — which
   is exactly what step 10 ("don't commit, leave it in the worktree") needs.
2. **`node_modules` is confirmed NOT shared automatically** — a worktree is a fresh checkout.
   Resolves the first open question below: every task prompt must run `pnpm install` as step 0,
   not assume it's there. Cost is low in practice (pnpm's content-addressable store mostly
   hardlinks), but it's a required step, not a maybe.
3. **New prerequisite found that the original plan missed:** add a `.worktreeinclude` file
   (gitignore syntax) at the repo root listing `.env`/`.env.local` so every new worktree gets
   the Neon/R2 credentials copied in automatically. Without it, every single agent's dev server
   either fails to boot or boots against the wrong env — a footgun as serious as Lesson 1 below,
   just not yet hit because this session never ran two worktrees at once.
4. **Concurrency ceiling, made explicit policy, not just a pilot number.** Anthropic's own
   engineering post says plainly that coding tasks are a *weaker* fit for multi-agent than
   research — "most coding tasks involve fewer truly parallelizable tasks than research,"
   agents don't coordinate well with each other in real time, and running multi-agent costs
   roughly **15x the tokens** of a single session. Their effort-scaling guidance for anything
   coding-shaped tops out around **2–4 subagents** for parallel/comparison-style work (10+ is
   reserved for research-style fan-out with trivially separable units, which this task is not —
   see the file-collision and duplication risks already identified below). **Adopted as a hard
   ceiling for this workflow, not just the pilot's starting point:** no more than 2–4 agents
   running concurrently, ever, for this task type. This also matches the plan's own
   already-identified bottleneck — the coordinator review step (responsibility 3 below) doesn't
   parallelize, so more concurrent builders just queues up unreviewed work.
5. **Considered and rejected (for now): the built-in `/batch` command.** `/batch <instruction>`
   is a bundled skill that researches the codebase, decomposes work into **5–30** independent
   units, and spawns one subagent per unit in its own worktree — mechanically the same primitive
   this doc already proposes. Not adopting it today because: (a) its default decomposition size
   blows past the 2–4 ceiling above; (b) each subagent **publishes its change** when done, which
   conflicts with this project's explicit no-commit-without-go-ahead rule (step 10 below, and
   CLAUDE.md's standing rule on commits/pushes); (c) its automatic decomposition doesn't carry
   this project's tribal knowledge (the `.mk` trap, the live-computed-style diff against
   `mock/*.html`, duplicate-component detection against `core/ui`) unless we hand it the full
   standardized prompt anyway, at which point we've reconstructed the manual process. Worth
   revisiting once the manual loop has a track record and if a future need (e.g. a
   purely-mechanical pass with no design judgment calls) actually fits `/batch`'s shape.

## Pilot results (2026-10-05)

3 agents, cross-file, within the ceiling (services' "How It Works" → `IconFeatureGrid`,
guides' city filter bar → `ChipBar`, About's values grid → `NumberedFeatureGrid`), all merged
to `main`. Mechanics worked end to end; a few things the research pass couldn't have predicted:

1. **Agents don't commit (correctly, per step 10) — so "merge" isn't `git merge`.** Nothing to
   fast-forward: the worktree's changes are uncommitted working-tree diffs on a branch with no
   commits ahead of its base. The actual coordinator merge step is: `git -C <worktree> diff` →
   `git apply` (or `--check` first) on the main checkout → copy over any new untracked files the
   diff doesn't carry (`git diff` skips untracked files; `git status --porcelain` in the worktree
   finds them) → re-verify → `git add` the specific paths → commit on `main` directly. Updated
   "Coordinator responsibilities" and "The standardized per-task agent prompt" below to stop
   implying a plain `git merge` will work.
2. **New one-time prerequisite found: `.claude/worktrees/**` must be in `eslint.config.mjs`'s
   `ignores`.** Worktrees live inside the repo tree by default, and this project's flat-config
   `.next/**`/`node_modules/**` globs only match at the repo root, not nested under
   `.claude/worktrees/<id>/`. Running the coordinator's own `pnpm lint` on `main` after the pilot
   swept all three worktrees' own `.next` build output into the scan — ~21,600 false-positive
   problems, nothing to do with any agent's actual code. Fixed in `eslint.config.mjs`
   (commit `eb8f6f8`) before merging the pilot's branches; this is now a required one-time setup
   step alongside `.worktreeinclude`, not optional.
3. **`worktree.baseRef: "head"` (added to `.claude/settings.json` for this pilot) was load-bearing,
   not theoretical.** All three agents correctly found and referenced the `core/ui` components
   from the prior solo session (`Hero`, `SpecStrip`, `StepGallery`, etc.) when deciding whether to
   reuse or build new — confirming they actually branched from local `main`, not a stale
   `origin/main`. Caveat: `.claude/` is fully gitignored in this repo, so this setting is
   machine-local — it won't travel with a fresh clone. Worth a separate decision (not made here)
   on whether to carve a `.gitignore` exception for `.claude/settings.json` so this travels with
   the repo.
4. **`node_modules`-per-worktree and `.worktreeinclude` env-copying both worked with zero
   reported issues** across all three agents — resolves the plan's original open question
   definitively, not just in theory.
5. **Confirmed real token/time cost, as an anchor for the 2–4 ceiling:** each agent used
   ~180–190k tokens and 103–114 tool calls, ~12–16 minutes wall-clock. In line with Anthropic's
   ~15x multi-agent cost warning — 2–4 concurrent reads as well-calibrated, not overly cautious.
6. **Even "cross-file-only" sections share incidental touchpoints.** None of the three picked
   sections shared a target file, but all three touched `src/core/ui/index.ts` (the barrel
   export) and one touched the shared `messages/*.json` locale files — both expected, both
   trivial one-line-per-agent conflicts to resolve by hand at merge time, exactly the "same file,
   serialize the merge" cost the plan predicted, just showing up in shared infrastructure files
   rather than the target components themselves. Budget for this on every batch, not just when
   sections are deliberately same-file.
7. **The coordinator's own shell can accidentally inherit worktree isolation.** Mid-review, a
   `cd` into a worktree as part of a combined Bash command left the coordinator's *own* session
   working-directory inside that worktree for subsequent commands (Bash cwd persists across
   calls), and Claude Code began enforcing worktree isolation on the coordinator session itself.
   Recovered with a plain `cd` back to the repo root. Lesson: never combine `cd <worktree-path>`
   with other work in the same Bash call when acting as coordinator — treat it as a context
   switch that needs its own, dedicated command, and verify you're back at repo root afterward.
8. **`next dev` refuses a second instance against the same project directory**, even on a
   different port, if one is already running there (prints `Another next dev server is already
   running` and names the existing PID/port). Not a problem for worktree agents (each worktree is
   a distinct directory), but means a coordinator doing a post-merge spot-check on `main` itself
   should check for an already-running dev server first and reuse it, rather than assuming a new
   `-p <port>` invocation will succeed.

### Round 2 (same day, 2026-10-05): 3 more agents, cross-file, all merged

Different pages this time (Buildings' "THE BUILDING" intro → `ProseSection`, Real Estate's "Why
Portugal" bento → `StatBento`, Guests' services teaser → `PhotoFeatureGrid`), same process.
Confirms round 1 wasn't a fluke and adds a few things:

9. **A pilot agent caught a real regression in *previously merged* code, from a different
   agent's prior task.** The agent extracting Real Estate's bento noticed About's `#values`
   sec-head wrapper (merged the round before, `82d4229`) was missing `data-page="about"` —
   checked it specifically because it was about to reuse the same raw-wrapper-next-to-a-new-
   component pattern for its own section, and compared against every other `.mk` wrapper on
   that page first rather than copying the nearest example blindly. Not hidden content (the
   opacity rule that would've hidden it is scoped the same way, so the fragment just never
   animated), but a real, confirmed, now-fixed bug (`1c1f9c8`) that neither of that prior round's
   agents nor the coordinator caught at the time. Emergent benefit of running more than one
   round: later agents re-derive context from the live page rather than trusting a prior
   extraction's precedent at face value, and that habit pays off even outside their own task.
10. **The coordinator got stuck inside a worktree a second time** — same mistake as item 7
    above (a `cd` into a worktree as part of a combined command), confirming it's a real
    recurring risk for this coordinator role, not a one-off. Worth being more deliberate about:
    always run `cd <repo-root> && pwd` as its own standalone command immediately after any
    command that touches a worktree path, rather than trusting yourself to remember not to
    combine it with other work next time.
11. **Real cost held steady**: ~180k–237k tokens per agent this round (the Real Estate bento,
    the most structurally complex of the six sections extracted so far across both rounds, used
    the most — 237k). Still consistent with round 1's numbers and the 2–4 ceiling's rationale.
12. **New coordinator step worth formalizing: after merging a batch, clear `.next` and relaunch
    the dev server cold, then re-check every touched route.** Hot-reload through a long dev
    session (worktree agents' own servers, then the coordinator's incremental rebuilds across
    two rounds of merges) can mask a stale-cache false pass. A full cache-clear + relaunch +
    re-verify (all N touched routes return 200 with expected content, plus a fresh
    `typecheck`/`lint`) is cheap and catches what incremental rebuilds might paper over — added
    as the closing step of "Coordinator responsibilities" below.

## What this covers

Central Hill's public pages were first built as locked static HTML/CSS mocks (`mock/*.html`,
see `docs/mock-agent-contract.md` — that phase is over) and then embedded verbatim into the
live Next.js app behind a `.mk`-scoped wrapper + `dangerouslySetInnerHTML` (see
`src/app/mock.css`, the `.mk` convention). The current, ongoing phase is **porting that locked
design, section by section, into real React/Tailwind components** that replace the raw HTML —
pixel-identical to the original, but real, composable, typed UI.

This is a *different* activity from `docs/multi-agent-workflow.md`'s general vertical-slice
build process (new schema/contract/admin-screen work) — there's usually no schema, no
migration, no contract change. It's narrow, repetitive, high-volume UI porting work across
many pages, which is exactly why it's a good candidate to parallelize, and exactly why doing
it carelessly in parallel is risky (see below). This doc is the companion process for *that*
specific task type. It assumes and does not repeat `CLAUDE.md`'s 7 golden rules or
`multi-agent-workflow.md`'s boundary/contract rules — both still apply in full.

## Why not just "spin up N agents"

Three concrete failure modes observed or anticipated from this session's single-threaded work:

1. **File collisions.** Multiple sections of the *same* page often live in the *same* file
   (e.g. `building-detail.tsx` has hero, gallery, spec strip, building prose, apartments grid,
   amenities, FAQ, book band all in one file today). Two agents editing it concurrently on the
   same working tree will clobber each other.
2. **Silent duplication / drift.** Without one thread tracking the whole design system, two
   agents can build two different components for the same visual pattern (this session nearly
   did: a new "spec strip" component could easily have been a sloppy copy of `StatBand` instead
   of recognizing it needed to be a genuinely different, simpler primitive — see Lesson 2
   below). Caught here only because one person was looking at the whole picture.
3. **Shared, fragile legacy CSS.** `mock.css`'s `.mk` wrapper has at least one serious footgun
   (Lesson 1 below) that silently breaks any new Tailwind component nested inside it. An agent
   unaware of this will ship visually-broken-but-"typecheck-clean" work with high confidence.
   This is exactly the kind of subtle, cross-cutting bug that a fleet of isolated agents is bad
   at catching and a single continuous reviewer is good at catching.

None of these are arguments against parallelizing — they're the specific things the system
below has to defend against.

## Two lessons from this session (bake into every agent's instructions)

**Lesson 1 — the `.mk * { margin:0; padding:0 }` trap.** `mock.css` is imported directly in
route `page.tsx` files, not through `globals.css`'s `@import "tailwindcss"` pipeline — so its
rules are **not** wrapped in any CSS `@layer`. Tailwind's own utilities, by contrast, *are* all
inside `@layer` (via `@import "tailwindcss"`). Per the CSS cascade-layers spec, an **un-layered
rule always beats a layered rule, regardless of selector specificity**. `mock.css` has
`.mk * { box-sizing: border-box; margin: 0; padding: 0; }` — so *any* Tailwind
padding/margin utility (`py-[34px]`, `mt-2.5`, …) applied to a React component nested inside an
element with class `.mk` gets silently zeroed, no error, no warning. Font-size, color, and
other non-margin/padding properties are unaffected. **Rule: a newly-extracted component must
render outside any `.mk`-scoped subtree.** If it needs to sit next to markup that's still raw
HTML (and therefore still needs `.mk` for its own CSS selectors to match), give that *raw*
markup its own small, dedicated `.mk` wrapper — don't wrap the new component in `.mk`.

**Lesson 2 — verify against the live render, not just the mock file.** `mock/*.html` is the
approved design baseline, but the code that actually ships (`PAGE_STYLE` template literals
inside already-DB-driven pages) can have **drifted** from it over past edits — this session
found a page's ported CSS silently missing a `margin-top` and using the wrong `padding`
strategy versus the original mock file, predating this session's own work. Always diff the
**live computed styles** (`getBoundingClientRect` + `getComputedStyle` via Playwright) of the
section before extraction against **both** `mock/<page>.html`'s source CSS **and** the current
rendered page — a mismatch between those two is itself a finding to flag, not something to
silently copy forward.

## Proposed architecture

**Isolation unit:** one Claude Code `Agent` call with `isolation: "worktree"` per task. This
creates an isolated git worktree + branch per agent automatically, so parallel agents never
share a working tree and can't clobber each other's edits. Confirmed against the official docs
(see "What the research changed" above): this isolation is platform-enforced, not just a
convention, and branches from the repo's default branch (`main`) by default.

**Concurrency ceiling: 2–4 agents running at once, no exceptions.** Not a pilot-only number —
adopted as standing policy per Anthropic's own coding-task guidance (see above). If more than
4 sections need extraction, queue them in batches rather than widening a single batch.

**Task granularity: one agent = one page section = one component.** Not one agent per page,
not one agent per slice — the section is the unit, matching how this session has actually been
working (hero, then grid, then stats band, then spec strip, as separate verified steps).

**Where parallelism is cheap vs. where it costs a merge pass:**
- **Different files/pages → parallelize freely.** Zero overlap, trivial to merge (e.g. Owners'
  testimonials band + Real Estate's stats band + Home's featured carousel, run concurrently).
- **Same file, multiple sections → parallelize the *work*, serialize the *merge*.** Agents can
  still investigate/build/verify concurrently in their own worktrees, but merging N branches
  that all touched `building-detail.tsx` needs a human/coordinator pass afterward — git will
  not cleanly auto-merge this most of the time even when the edited line ranges don't literally
  overlap, because the shared `PAGE_STYLE` template literal and import block are touched by
  every one of them. Still a net time win (the slow part — investigation, building, pixel
  verification — happened in parallel); just don't expect a free `git merge`.

**Per-agent setup — two separate concerns, one confirmed, one still to pilot.**

1. **`node_modules` — confirmed, not a maybe.** A worktree is a fresh checkout; it does **not**
   inherit `node_modules`. Every task prompt's step 0 must run `pnpm install` in its own
   worktree before anything else. Expect this to be fast (pnpm's content-addressable store
   mostly hardlinks rather than re-downloading), but it is a required step in every prompt, not
   an assumption to drop.
2. **Dev-server ports — still unverified, pilot required.** Each worktree needs its own
   `next dev -p <port>` so agents don't fight over port 3011 or kill each other's servers (this
   session repeatedly did `pkill -f "next dev"` between steps — fine solo, actively hostile to a
   concurrent agent). Validate in the pilot: pick a port-assignment scheme (e.g. 3012, 3013,
   3014…) and make sure each task's instructions hardcode its own port everywhere (dev server
   start, Playwright `goto`, curl checks) so copy-paste from this session's single-port history
   doesn't leak in.
3. **`.env`/`.env.local` — new prerequisite, not yet done.** Add a `.worktreeinclude` file at
   the repo root (gitignore syntax) listing `.env` and `.env.local` so every new worktree gets
   Neon/R2 credentials copied in automatically. Do this once, before the pilot — without it,
   every agent's dev server either fails to boot or runs against a missing/wrong env.

## The standardized per-task agent prompt

```
Contexto: estás extrayendo UNA sección de http://localhost:<PORT>/<locale>/<ruta>
a un componente React/Tailwind reutilizable, reemplazando el HTML original.
Trabajás en tu propio git worktree/branch — no toques nada fuera de él.

Sección a extraer: "<texto/identificador visual de la sección>"

Pasos obligatorios, en orden:

0. Tu worktree es un checkout nuevo: NO asumas que node_modules existe.
   Corré `pnpm install` ahí antes que nada. Después, leé CLAUDE.md,
   docs/component-extraction-workflow.md (este doc), y el README.md del
   slice dueño de la página. Trabajás SOLO dentro de ese slice (o core/ui
   si el componente es genuinamente reutilizable entre slices — documentá
   el contrato si es así).

1. Arrancá tu propio dev server en tu puerto asignado. Localizá la sección:
   en el navegador (Playwright) y en el código fuente (el archivo de la
   página, su PAGE_STYLE / mock.css si aplica).

2. ANTES de tocar código, capturá tu punto de retorno seguro:
   - Screenshot de la sección (desktop 1440, tablet 834, mobile 390).
   - Computed styles (getBoundingClientRect + getComputedStyle) de cada
     elemento clave: font-size, color, padding, margin, border.
   - El fragmento exacto de HTML/CSS crudo involucrado.
   - Compará ese CSS vivo CONTRA mock/<page>.html — si no coinciden, es un
     hallazgo a reportar, no algo para copiar en silencio (ver Lección 2
     del doc de workflow).
   Guardá todo en tu scratchpad.

3. Buscá si ya existe un componente reutilizable (core/ui o el contract de
   otro slice) para este patrón ANTES de crear uno nuevo. Si existe algo
   parecido pero no idéntico, decidí con criterio si extenderlo (props
   aditivas, nunca romper consumidores existentes) o crear uno nuevo —
   documentá por qué en el docstring del componente.

4. Construí el componente Tailwind, portando los valores EXACTOS del CSS
   vivo (rigor a nivel píxel). Usá los tokens del design system
   (text-ink, text-ink-soft, border-line, font-serif, etc.), nunca var()
   crudas del mock, para que el componente sea portable fuera de .mk.

5. TRAMPA A EVITAR (Lección 1 del doc de workflow): si la sección va a
   convivir con markup crudo todavía envuelto en .mk, el componente nuevo
   DEBE renderizar FUERA de .mk. Si necesitás que el markup crudo vecino
   siga funcionando, dale su propio wrapper .mk chiquito y dedicado — NO
   el componente nuevo.

6. Reemplazá el original: sacá el HTML/CSS viejo (muerto), metele el
   componente nuevo.

7. Verificá visualmente con Playwright (desktop/tablet/mobile) CONTRA el
   snapshot del paso 2 — comparación numérica de bounding boxes/colores/
   font-sizes/márgenes/paddings, no solo "se ve bien a ojo".

8. `pnpm typecheck && pnpm lint` — 0 errores, no negociable.

9. Actualizá el README.md del slice + el docstring del componente nuevo
   (qué es, por qué no es X componente existente, qué props son nuevas
   y por qué, cualquier desviación deliberada del diseño original).

10. NO hagas commit. Dejá los cambios sin commitear en tu branch/worktree.

11. Reportá en tu respuesta final: qué extrajiste, qué archivos tocaste,
    resultado de typecheck/lint, y CUALQUIER desviación del diseño
    original que hayas notado (con tu razonamiento) para que el
    coordinador decida si está bien o hay que ajustar.
```

## Coordinator responsibilities (the human or the orchestrating Claude session)

1. Decompose the target page(s) into sections, assign one per task, pick ports, confirm no two
   concurrent tasks target the *same* file unless accepting the manual-merge cost above.
2. Launch tasks in batches of **2–4 concurrent agents max** (parallel `Agent` tool calls,
   `isolation: "worktree"`, one message per batch) — this is a hard ceiling per "What the
   research changed" above, not a soft target. More sections than that in flight means more
   batches, not a wider one.
3. **Re-verify, don't just trust the self-report** — this session's own standing practice.
   For each finished branch: re-run the before/after computed-style diff myself, re-run
   typecheck/lint on that branch, spot-check the three breakpoints.
4. Check for duplicate/near-duplicate components across branches before merging any of them —
   this is the one failure mode isolation *cannot* catch by construction, since the agents
   never see each other's work.
5. Apply branches into `main` one at a time (not all at once), re-running typecheck/lint/visual
   spot-check after each, before the next — catches integration-order bugs early. **Not a plain
   `git merge`** — per "Pilot results" above, agents correctly leave their branch with no
   commits (step 10), so there's nothing to fast-forward. Per branch: `git -C <worktree> diff`,
   `git apply --check` then `git apply` on `main`, copy over any new files `git status
   --porcelain` in the worktree shows as `??` (untracked files don't appear in a plain `diff`),
   re-verify (step 3 above), `git add` the touched paths, commit on `main`. Expect a trivial
   hand-resolved conflict in shared files every batch touches incidentally (`core/ui/index.ts`,
   `messages/*.json`) even when the target sections themselves don't share a file.
6. Never commit or push to `main`/shared branches without the user's explicit go-ahead, per the
   project's standing rule (reconfirmed throughout this whole session).
7. After the whole batch is merged: stop whatever dev server is running on `main`, delete
   `.next`, relaunch cold, and re-check every touched route (HTTP 200 + expected content) plus a
   fresh `typecheck`/`lint` — don't rely on an incrementally hot-reloaded server as the final
   check (see "Round 2" in "Pilot results" above for why).

## Open questions still open after the pilot

- ~~Does `git worktree add` + this repo's pnpm setup give a working `node_modules`?~~
  **Resolved:** no, confirmed against the official worktree docs and the pilot — a worktree is
  always a fresh checkout. `pnpm install` is step 0 of the standardized prompt above.
- ~~Does `.worktreeinclude` env-copy work end to end?~~ **Resolved:** yes, zero env-related
  issues across all 3 pilot agents.
- ~~Does worktree-isolation enforcement actually block stray edits?~~ Not deliberately tested —
  no agent attempted to stray in this pilot, so this remains trust-but-unverified; worth a
  one-off deliberate test if it matters before scaling further.
- Still open: is coordinator review bandwidth actually the binding constraint at 2–4 concurrent
  agents, or does something else dominate first (dev-server flakiness, merge conflicts in shared
  files)? This pilot's coordinator overhead was dominated by the `eslint.config.mjs` discovery
  and the manual merge mechanics (both one-time/per-batch fixed costs, not per-agent review time)
  — not enough data yet to say which bottleneck wins at scale.
- Should the "same-file multi-section" case instead be handled by *one* agent per file working
  through its sections sequentially (less parallel, zero merge pain), reserving true concurrency
  for cross-file work only? Still untested — this pilot deliberately avoided it.
- Whether to formalize the "before" snapshot (step 2) as a committed artifact (e.g. a scratch
  JSON/markdown per section under a gitignored dir) so a reviewer can re-check it without
  re-deriving it. Still open — not needed this time since the coordinator re-derived checks live.
- New from the pilot: should `.claude/settings.json` (specifically `worktree.baseRef: "head"`)
  get a `.gitignore` exception so it travels with the repo instead of being machine-local? Not
  decided — flagged in "Pilot results" above.

## Next pilot (same-file case)

The validated-safe case (cross-file, 2–4 agents) is done; not yet piloted: **one agent per file,
working through multiple sections of that file sequentially**, which the plan always said avoids
true concurrent-edit conflict by construction. `building-detail.tsx` (hero/gallery/spec-strip
already done solo; apartments grid/amenities/FAQ/book band still raw) is the natural next
candidate — still single-worktree-per-file, but validates whether this "serialize within a file,
parallelize across files" split actually wins wall-clock time over solo work, per the still-open
question above.
