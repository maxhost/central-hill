# Home selector: exclude noneditable booking integration — 2026-11-05

User explicitly requests removing Avantio from Element because the booking engine
is managed by its script and is not configurable in this page editor.

Root removes the synthetic Avantio outline section, its Home descriptor external
section entry and private binding allowlist entry. The private preview keeps its
external-integration notice but no selectable annotation. The public
AvantioSearchBar and booking script/settings are untouched. Other sections with
editable surrounding copy (portfolio, services, FAQ) stay available.

If an old selection no longer belongs to any section, PageContextualEditor resolves
it to the first valid section for the inspector/selector, preserving current local
content rather than showing an empty inspector or forcing a reload.

Owned paths: Pages admin/home-contextual.ts, adapters/home.ts, ui/home-page.tsx,
admin/ui/page-contextual-editor.tsx; Pages README, this spec and current handoff.
Local main/509d785 plus prior pending changes, all preserved. UI L0: source review
only, user validates on running3071. No tests/check suites/automatic browser QA,
DB writes/save/publish/upload, commit, push, deployment or restart. Preserve the
unrelated base-logo PNG and all earlier artifacts. Previous functional checks
do not cover this later selector refinement.
