# ADR0072 — Website URLs EN/ES/PT/FR in Settings

2026-11-07. User requests Website per language in the same Settings Contact ficha,
used by the About office panel in the corresponding public locale.

Keep company_settings.website_url as canonical EN, preserving legacy data. Three
manual target URLs reuse translation(company_settings,id,website_url,es|pt|fr).
No schema/migration, no duplicated EN translation row or backfill. Raw target
inputs include pending values; absent targets blank. Save approves nonblank targets,
blank removes only that field/locale for EN-column fallback. Omitted target payload
preserves legacy clients. Later EN changes/clear do not erase own targets. Target
URL may exist with empty EN. Existing HTTPS/max300 validation retained for new URLs.
Public resolver ignores legacy EN translation rows; the inline column remains
canonical. Only approved, valid HTTPS target URLs render, otherwise EN column.

getGlobals(locale).website is already consumed by About's officeRows; its value
becomes locale-aware, cache shape v4. Existing global/layout invalidation refreshes
About without changing its labels/content/SEO/snapshots or republishing Pages.
No change to site canonical domain, booking destinations or other contact fields.

Website is excluded as a field (not the whole company_settings type) from generic
Translation inbox/review/actions/bulk approval/generation. Stats/hours and other
pending Settings copy retain that workflow. Existing rows remain intact. No kernel
API or role changes, no remote writes/deployment.
