# Safe multi-agent workflow

Updated 2026-10-18. This is the authoritative execution procedure for Central Hill.
Read it with [AGENTS.md](../AGENTS.md), [CLAUDE.md](../CLAUDE.md), the active spec and
[architecture decisions](decisions/README.md). Current user instructions take precedence.
Historical specs retain their implementation context, but their conflicting procedural rules
are superseded by this workflow. This applies to Codex and other coding-agent runtimes.

## Roles and delivery boundary

For an authorized agentic implementation, use one orchestrator, two implementers working
in parallel where safe, and one independent QA agent after integration. Keep simple work
with the main agent. Planning alone does not authorize starting the implementation.

| Role | Responsibility | Restrictions |
|---|---|---|
| Orchestrator | Audit, spec, contracts, file assignments, shared files, integration and final verification | Preserve unrelated work; respect delivery scope |
| Implementer A and B | Assigned implementation, meaningful focused checks, documented handoff | No foreign files, integration into main, push or production changes |
| QA | Adversarial review and browser/persistence checks of the integrated candidate | Report defects; do not silently implement fixes or approve untested behavior |

For Services, the user has requested local commits and integration into local `main` after
QA passes, without push. Routine local steps within that scope do not require repeated
approval. Push, deployment, production migrations and production content/media writes are
separate actions requiring authorization. Other tasks follow their user's stated boundary.

## 1 Audit before delegation

Record in the active spec:

- Base commit, branch and pre-existing tracked/untracked changes; do not absorb unrelated work.
- Current implementation, owning slices, contracts, cache tags, i18n and SEO requirements.
- Exact acceptance criteria and real verification commands. Audit package scripts before relying on them.
- Environment identity without secrets: DB is test or production, media storage isolation,
  test user availability, server working directory and port.
- Task dependencies, expected deliverables, explicit writable files and the single owner of
  every shared file. Include new files and docs. A directory assignment may be used only
  when no other agent writes there.

The slice is the default ownership boundary, not proof that tasks are independent.
Two tasks within one slice can run in parallel with disjoint file sets. A cross-slice task
needs explicitly named files assigned by the orchestrator; it must still respect public contracts.

## 2 Stabilize contracts and isolate writers

The orchestrator defines and commits the schema/types, fallback behavior and contract
exports needed by both implementers before branching consumers from the same base.
Register types and shared entry points coherently so the base is reviewable.

Create a named branch and separate worktree for each parallel writer and an integration
branch/worktree for assembly. Choose locations permitted by the actual sandbox, preferably
outside the main checkout to avoid nested lint/build scans. Record the exact paths.
Pass each agent its absolute working directory, branch and base commit; require it to verify
`pwd`, `git branch --show-current`, `git rev-parse HEAD` and `git status --short` before editing.

Spawning a subagent does not imply worktree isolation. Verify the available tool's behavior;
use explicit `workdir` arguments for shell commands. If the runtime cannot direct writes to
separate worktrees, serialize implementation writes and report that limitation. Do not
launch concurrent writers in one checkout on the assumption that prompts provide isolation.

Worktrees share Git metadata and do not isolate permissions, processes, databases or remote
services. Do not copy production credentials by default. Provision only the ignored test
environment files needed for each task. Verify the target before writes, including `build`
steps that read a database. Install dependencies using the existing lockfile when needed;
never assume a new worktree contains node_modules or local environment files.
Assign each server a distinct port; record PID and owner. Stop only owned processes.

## 3 Delegate bounded tasks

Each implementer receives this handoff contract:

```text
Task and active spec:
Role and expected outcome:
Worktree absolute path / branch / base commit:
Writable existing and new files:
Read-only/shared files and their owner:
Contracts available and dependencies already landed:
Required behavior, fallbacks, i18n, SEO and cache tags:
Environment and allowed mutations:
Tests and acceptance criteria:
Return: commit, changed paths including new files, commands/exit codes, risks and blockers.
Delivery boundary: local task branch only; no main merge, push or deployment.
```

Shared files (messages, registries, contracts, app shell, migration journal and lockfile)
have one owner, normally the orchestrator. Agents send requested additions to that owner.
No nested delegation unless assigned by the orchestrator. Limit this workflow to two
implementation writers; QA can use the freed slot after their handoffs.

Cross-slice imports use `contract.ts` only. Table ownership stays with its slice. A needed
foreign change goes to the orchestrator as a CCR: purpose, proposed addition, consumers
and affected files. Kernel changes/new technologies need an ADR and orchestrator ownership.
Migration numbers are allocated centrally; migrations are additive and previous ones remain intact.

## 4 Implement and hand off

Modify existing code within the assigned scope when the task requires it. Preserve unrelated
behavior and other contributors' changes. Never reset/revert another task, use forced checkout,
blanket staging, delete foreign work or rewrite history to obtain passing checks.

Each implementer runs relevant checks in its worktree and commits only assigned paths when
local commits are authorized. Report actual changed files, commands, exit codes and commit.
Document failures without disguising them as success. A missing dependency or contract is
an integration issue; do independent work and escalate the dependent step.

Keep progress, decisions, changed contracts and remaining work in the active spec. Do not
rely on chat memory as the only handoff record. If commits are explicitly prohibited, hand
off a reviewed patch plus all new files; a plain `git diff` omits untracked files. Do not
mix patch copying and commit integration for the same changes.

## 5 Assemble and verify the candidate

Only the orchestrator integrates commits into the integration branch, sequentially.
Review each diff against its write set and resolve conflicts with the owners. After any
shared-contract change, identify and verify affected consumers.

Run the real checks on the integrated candidate:

- `pnpm typecheck` and `pnpm lint`.
- `pnpm exec tsx --test <explicit-test-files>` for changed behavior and relevant consumers;
  use documented test tsconfig options when a suite requires them.
- `pnpm build` using the verified environment.
- `pnpm db:check` for migration changes or when the active spec requires it.
- Explicit import/ownership review, four-locale coverage, ISR and SEO checks as applicable.

At this revision `pnpm test` and `pnpm boundary:check` are placeholders, and the ESLint config
has no custom slice-boundary enforcement. Their successful exits prove no tests or boundary
checks. Do not describe manual policy as a sandbox, hook or CI guarantee. Adding enforcement
is separate implementation work; update these statements when it actually exists.

## 6 Independent QA and corrections

QA tests the assembled result, not only isolated branches. Record candidate commit, test
environment, commands with exit codes, exercised cases and evidence. UI work requires
desktop/mobile checks; persistence changes require actual save/reload and public revalidation
on an isolated test DB. Exercise failures, fallbacks, unauthorized access and media cases
required by the spec. A local server can still write production data.

Findings include severity, reproducible steps, expected/actual behavior and file or screenshot
evidence. The orchestrator assigns corrections to the appropriate owner. QA retests affected
cases after fixes; no repeated broad runs without changed code or an unresolved concern.
Missing required verification is a blocker to completion, not a pass. If no isolated DB is
available, continue read-only checks, report what is missing and obtain a suitable environment
before dependent writes or final QA approval.

## 7 Integrate locally and close

After QA approval, compare `main` with the recorded base and preserve any new user work.
Merge the tested integration candidate into local `main` within the authorized scope.
If conflict resolution changes the candidate, rerun affected verification before declaring done.
Record the final commit and checks, update the spec and affected READMEs/data-model docs,
and report remaining limitations. Never push or deploy as a side effect of a local merge.

Keep worktrees/branches until commits and any untracked artifacts are safely captured.
Cleanup must not discard unmerged work or unrelated files. End with a clear Git status;
identify existing unrelated changes separately from the task's result.

## Definition of done

- Assigned scope respected; no cross-slice internal imports or unreviewed kernel changes.
- Requested behavior works, including four locales, SEO and revalidation where relevant.
- Real relevant tests, typecheck, lint and integrated build passed with recorded evidence.
- Independent QA approved the final candidate; required checks are not missing.
- Active spec, affected contracts and documentation match the delivered behavior.
- Local integration completed when requested; external delivery boundary respected.

## Official references

Reviewed 2026-10-18. These explain tool behavior; the two-implementer/QA arrangement and
local-only delivery are project decisions, not universal OpenAI requirements.

- [OpenAI custom instructions with AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md): persistent repository guidance.
- [OpenAI Git worktrees](https://learn.chatgpt.com/docs/environments/git-worktrees): separate checkouts sharing Git metadata.
- [OpenAI multi-agent guide](https://developers.openai.com/api/docs/guides/agents-api/multi-agent): bounded independent tasks and explicit coordination.
