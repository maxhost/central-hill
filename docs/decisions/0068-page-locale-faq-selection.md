# ADR0068 — FAQ group reference owned by each page locale

2026-11-07. Accepted for authorized local implementation.

Keep faq_group_key in existing page locale snapshots, making its selection local
to EN/ES/PT/FR for the five pages that already expose FAQ. Add optional descriptor
localeReferencePaths metadata. A reference is not translatable prose: do not add
it to [T]/textPatterns or write it through the translation pipeline. Targets retain
their own stored selection/empty/absence; absent target never adopts EN's FAQ.
Exclude declared references from shared-envelope comparison so targets may edit
the same select control while media/list/structure constraints remain enforced.

Preserve historical published/draft selections and read-only legacy output; no
eager migration/backfill or GET writes. Empty means no FAQ for that locale, with
no English fallback. Save draft/Publish and revision/CAS scope stay per language.
Existing public/private renderers already read each locale's envelope reference.

FAQ groups/content keep existing ownership, status and locale resolution. Admins
may create separate language-specific groups then choose them per page locale.
Do not introduce FAQ translation tabs, language tagging, a new table/kernel seam
or generic Translation retirement in this change.
