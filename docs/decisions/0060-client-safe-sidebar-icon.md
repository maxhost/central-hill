# ADR0060 — Client-safe sidebar interface icon

2026-11-06. User reports compilation failure after e8d6d23. AdminShell is exported
through Backoffice's mixed contract, also reached by client components; importing
server-only core/ui/icon there leaks a server-only dependency into that graph.
Passing the rendered icon as a ReactNode does not prevent the import traversal.

Extend the existing generated UiIcon allowlist with Iconoir layout-left. Update
scripts/generate-icons.ts then regenerate src/core/ui/icons/ui-svg.ts with pinned
iconoir7.12.1. Keep full content Icon/ICON_SVG server-only and unchanged. AdminWorkspace
renders UiIcon directly; remove the AdminShell server Icon import and icon slot.
No new icon library, arbitrary SVG, DB/schema/auth or layout behavior changes.

Root owns this narrow kernel addition and generator; adjacent owned files are
backoffice/ui/admin-shell.tsx and admin-workspace.tsx, plus documentation. Public
map/names/sprite generation should remain byte-identical except the small subset.
Verify existing icon tests and the actual failing admin route client/server graph.
This is a functional compilation fix, not another aesthetic QA pass.
