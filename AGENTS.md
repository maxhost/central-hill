# Central Hill agent instructions

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
Individual guide CMS is a later task; no next implementation is assigned yet.

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
