# Central Hill agent instructions

## Next: Home contextual editor (scope closed)

Read [closed plan](docs/specs/home-contextual-editor-plan.md) and
[fresh-context handoff](docs/specs/home-contextual-editor-handoff.md) before starting.
Home is the only implementation pilot: shared shell plus per-page adapter, preserving
EN/ES/PT/FR, SEO and ISR. Home has no own form: NO Forms selector/new slot in Home.
Avantio stays external and uneditable. Forms selection/replacement of hardcoded forms
belongs to later page adaptations such as Owners. Proceed screen by screen; no rollout
in this pilot. Current session closes documentation only, no Home implementation yet.
Prepare execution spec/ADR/contracts/write sets before two implementers and independent
normal scoped QA. Preview uses saved content; no live/durable-draft/snapshot expansion.

## Active form-builder arc (2026-10-18)

User authorized the real reusable form builder first. Read [execution/spec](docs/specs/form-builder/00-execution.md) and [ADR0038](docs/decisions/0038-form-builder-and-resend.md). Provider explicitly confirmed **Resend**, not SendGrid. Integration branch `form-builder/integration`, checkout `/private/tmp/central-hill-form-builder-integration`, base377cffd; contracts b0fee3d. Two implementers in separate worktrees completed; independent normal scoped QA approved executable `e33f078` (report `b7d8d4c`). Read [QA](docs/specs/form-builder/01-qa.md) and [handoff](docs/specs/form-builder/02-handoff.md). No public form placement/selection or page-editor conversion in this arc; current public forms and Avantio stay intact. Preserve previews3059–3063 and static concept3070. New isolated formbuilderqa DB/proxy5598/4498, preview3064; final email mode console (no real sends), Resend prepared and QA-tested through a fake transport. Typecheck/lint/28tests/build/db:check passed. Local QA authorized automatically. No main integration, push, deployment, GitHub or Neon production writes.

## Contextual editor concept (2026-10-18)

Current branch `contextual-editor/concept`, checkout
`/private/tmp/central-hill-contextual-editor-concept`, baseline b4c97e4.
Read [spec](docs/specs/contextual-editor/00-spec.md),
[plan/effort](docs/specs/contextual-editor/01-plan.md),
[reusable forms](docs/specs/contextual-editor/02-formularios.md) and
[concept QA](docs/specs/contextual-editor/03-review.md).
User authorized only spec/plan and a standalone HTML/CSS interaction study,
with agents, before polishing/reviewing and later authorizing the React feature.
Prototype: `mock/contextual-editor/`, static local3070, no CMS/DB persistence.
No changes to src, packages, databases or previews3059–3063. Typography polish
and user design feedback remain; concept is not production feature approval.
Home keeps Avantio; reusable Lead forms are a separate future catalog feature.
No main integration, push, deployment, GitHub changes or Neon production writes.

## Current Blog page handoff (2026-10-18)

Read [Blog CMS audit](docs/specs/blog-cms-audit.md) and
[proposed plan/spec](docs/specs/blog-cms-plan.md). Implemented and independently functional-QA-approved on d7fc540 (executable
integration cb1f068; later docs/comment/test alignment only). Read
[execution](docs/specs/blog-page-execution.md), [QA](docs/specs/blog-page-qa.md)
and [handoff](docs/specs/handoff-blog-page.md). New isolated preview3063 uses
blogpageqa DB/storage; no migration. Baseline documentation1c48555/code d4e13c9.
Implementation focuses Pages→Blog on listing header, Featured/Journal
headings, newsletter copy, listing SEO and EN/PT/ES/FR translation wiring, per
the user's four screenshots. Article-editor/search improvements are follow-ups.
Preserve previews3059–3063; delivery stays in blog-page/integration,
/private/tmp/central-hill-blog-page-integration. No main integration, push or deployment.
Verification is normal functional save/reload/public/media/translation checks,
without an expanded adversarial matrix. Local QA is authorized to run automatically;
request access only for GitHub changes or Neon production. Prior handoffs below remain preserved.

Read [CLAUDE.md](CLAUDE.md) for architecture and [docs/multi-agent-workflow.md](docs/multi-agent-workflow.md) for the authoritative execution procedure. Read the active spec in `docs/specs/`, the assigned slice README and relevant ADRs before editing.

## Current handoff

Individual service conditional editor implemented and independently QA-approved on code
`9faffe9`; local delivery recorded in
[Service detail handoff](docs/specs/handoff-service-detail-editor.md).
See the [execution spec](docs/specs/service-detail-editor-execution.md) and
[QA evidence](docs/specs/service-detail-editor-qa.md). Savepoint before implementation:
`a1107f8`, local tag `savepoint/pre-service-detail-editor-2026-10-18`.
Migrations0019/0020 were applied only to isolated local QA databases; no push/deployment.

Previous Services listing editor delivery remains in
[Services handoff 2026-10-18](docs/specs/handoff-services-2026-10-18.md).
Guides listing page editor implemented and independently QA-approved on `fc1daac`.
Local delivery: [Guides handoff](docs/specs/handoff-guides-page-editor.md),
[spec](docs/specs/guides-page-editor.md), [QA](docs/specs/guides-page-editor-qa.md).
Savepoint: `00c836a`, tag `savepoint/pre-guides-page-editor-2026-10-18`.
No migrations, push or deployment. Preview3060 uses isolated synthetic guidespageqa;
previous user preview3059 is preserved. Sidebar work is captured in00c836a.
Individual Guides CMS implementation was subsequently authorized and is integrated
on task branch `guides-cms/integration` in `/private/tmp/central-hill-guides-cms-integration`.
Code `1a2739c` is independently QA-approved; delivery remains on the task branch.
Read [Guides CMS execution](docs/specs/guides-cms-execution.md),
[QA evidence](docs/specs/guides-cms-qa.md) and [handoff](docs/specs/handoff-guides-cms.md).
Savepoint `6a3c1ce`, tag `savepoint/pre-guides-cms-implementation-2026-10-18`.
Migration0021 and synthetic writes are isolated to guidescmsqa/freshqa; preview3061.
No main integration, push, deployment or production writes in this task delivery.
The city-filter collapse follow-up was user-validated; typecheck/lint/build passed,
with no new independent browser QA claim. Preserve both local preview environments.

About CMS follow-up is implemented and independently functional-QA-approved on code
`d4e13c9`, task branch `about-cms/integration` in
`/private/tmp/central-hill-about-cms-integration`. Read
[About handoff](docs/specs/handoff-about-cms.md),
[execution](docs/specs/about-cms-execution.md) and
[functional QA](docs/specs/about-cms-qa.md). Savepoint6849427,
tag `savepoint/pre-about-cms-implementation-2026-10-18`. No new migration;
existing0000..0021 only applied to new isolated aboutcmsqa, preview3062.
Final runtime checkout `/private/tmp/central-hill-about-cms-runtime` on d4e13c9.
The user explicitly narrowed QA to normal form save/reload, public output and media
uploads; do not reopen a broad adversarial matrix as an unfinished delivery gate.
No main integration, push, deployment or production writes. Preserve previews
3059/3060/3061/3062 and their environments.

## Working agreement

- For an authorized agentic implementation: one orchestrator, two implementers with disjoint file assignments, then one independent QA agent reviewing the integrated result. Simple tasks remain with the main agent. Do not start implementation when the request is only for a spec or review.
- The orchestrator records the base commit, branch/worktree paths, exact writable files, contracts, acceptance criteria and verification commands in the active spec before delegating. Shared files have one writer. Contracts land before consumers.
- Subagents may share the same checkout by default. Spawning an agent does not create a worktree. Verify each agent's actual working directory and branch. Use a separate worktree/branch for each parallel writer; if the runtime cannot target them, serialize writes and explain the limitation.
- Worktrees separate working files, not permissions, Git metadata, databases or external services. Use explicit command working directories and isolated test data. Never copy production credentials into agents' environments by default.
- Edit only assigned files, including new files. Request scope changes from the orchestrator. Cross-slice imports use `contract.ts` only. Kernel changes require an ADR and orchestrator ownership.
- Preserve the user's and other agents' changes. No blanket staging, destructive cleanup, reset, forced checkout, history rewriting or killing another agent's processes to make checks pass.
- Use Node 22 and pnpm. Run `pnpm typecheck`, `pnpm lint`, real affected tests through `pnpm exec tsx --test <explicit-test-files>`, and `pnpm build` on the integrated result. Run `pnpm db:check` for migration changes or when the spec requires it. Record actual commands, exit codes and tested commit.
- `pnpm test` and `pnpm boundary:check` currently succeed without checking anything. Do not count them as verification; review boundaries explicitly. Report failed or blocked checks honestly.
- Public changes preserve EN/PT/ES/FR, SEO and ISR revalidation. UI/editor work requires browser checks and actual save/reload tests on an isolated DB when persistence is affected. A localhost URL does not imply an isolated DB.
- QA reports reproducible findings against the integrated candidate. Implementers fix within their scope; QA retests affected behavior. No merge to `main` with unresolved blocking failures or required checks missing.
- For the Services task, local commits and integration into local `main` after QA are authorized by the user's requested workflow. Do not ask again for each routine local step. Push, deployment and production writes require separate authorization. For other tasks, follow the user's stated delivery boundary.
- Keep the active spec current with progress, decisions, verification and remaining work. Handoffs include commit, changed files (including untracked files), checks and limitations. Only the orchestrator integrates; preserve worktrees until their work is safely captured.

## Instruction maintenance

Current user instructions govern the task. These agreements and the canonical workflow supersede conflicting procedural instructions in historical specs, mock guides and component-extraction notes. Historical documents remain useful implementation references; they do not grant extra permissions. Do not claim automatic sandbox or CI enforcement unless it is actually configured and verified.
