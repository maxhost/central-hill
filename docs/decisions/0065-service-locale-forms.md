# ADR0065 — Service locale forms and shared nested assets

2026-11-06. User requests incumbent Service forms with EN/ES/PT/FR, English
inheritance until first localized edit, independent drafts/publications, shared
media/category/icons and manual four-language category names.

Add slice-owned service_locale_content and service_shared_content tables (0027).
Use the established versioned JSON/graph-lock/CAS pattern, text actor attribution,
lazy legacy bootstrap and read-only GET projection. No kernel changes. Shared Save
is live across published languages and commits with selected draft atomically.
Public localized text always uses its own publication; pending EN cannot leak.
Legacy published fallback remains until lazy adaptation, without remote/backfill.

Add optional stable ids to detail facts/itinerary; legacy positions receive stable
keys once, new rows UUIDs. Shared nested icon/media maps use those ids, retain old
keys and never rewrite localized arrays by current index. Preserve independent
text/structure and hidden fields. Root booking label/URL, duration and all SEO are
localized; Service public detail remains. Category/icons are chosen in EN and
enforced server-side. No visual-editor conversion or booking provider change.

Category name translations reuse existing core seams and manual approved taxonomy
behavior of ADR0064. Blank targets use EN, raw pending targets remain editable,
omitted targets preserve older clients. No automatic translations/review UI.

See service-locale-forms-execution.md for inventory, contracts, ownership,
permissions, acceptance and actual verification. Migration execution requires
explicit authorization for the existing synthetic DB; no production writes.
