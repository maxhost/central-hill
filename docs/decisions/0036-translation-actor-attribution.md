# 0036 — Preserve textual auth IDs in translation attribution

Status: accepted for local implementation, 2026-10-18. Owner: orchestrator.

The normal `scripts/create-admin.ts` uses Better Auth signup without a UUID ID policy.
Auth users and staff IDs are text; `translation.updated_by` is UUID. Services previously
passed that text into the UUID column after already updating its row. The previous QA
handoff reproduced this incompatibility. Rejecting textual IDs safely avoids partial
writes, but cannot deliver editing for users created through the normal bootstrap.

Add nullable `translation.updated_by_user_id` text (migration 0020). The kernel write seam
stores the authenticated ID verbatim there for source and target writes. It also preserves
the legacy UUID field when the supplied ID is a valid UUID, otherwise sets that legacy
field null. Never invent a UUID or omit the actor's real identity to make a save succeed.
When reading attribution, prefer the new text column, falling back to the legacy UUID
as text for old rows. No existing rows, identifiers or auth policy change; no backfill or
foreign key is required, preserving attribution even after an auth user is removed.

Only the orchestrator edits kernel schema/write seam and its pure helper/tests. Services
removes its temporary UUID-only rejection after the migration is present. Staff gating
remains unchanged. The migration is applied only to isolated QA databases in this task;
remote migration/deployment is a separately authorized operation.

Validation: pure actor helper tests; actual source save with UUID and textual staff and
target translation write using text staff in isolated DB, verifying both columns. Existing
translation/read behavior, slice contracts, reviews and source hashes remain unchanged.
