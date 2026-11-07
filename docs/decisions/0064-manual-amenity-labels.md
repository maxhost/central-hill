# ADR0064 — Manual Amenity labels in four languages

2026-11-06. User requests EN/ES/PT/FR inputs in Amenity create/edit and localized
names in the Building selector while selected amenity identities remain shared.

Reuse existing translation storage/read/write seams. EN label is required (1–80);
target labels optional (maximum80). One taxonomy Save applies all four labels
immediately, as the existing EN Save does. Manual targets become approved; blank
targets are removed so public/selector reads fall back to English. An older request
without translations preserves all targets. No auto-translation, new review flow,
locale publication snapshots or migration. Existing pending targets are loaded
as their own editable values, never replaced with English fallback copies.

All writes go through existing core i18n seams: source upsert, approved target
upserts or individual target clears. Existing sequential taxonomy write behavior
is retained; no new atomic multi-locale transaction guarantee. No kernel changes.
Source edits never translate or replace authored target text.

Selector options carry resolved names for all four locales. Switching Building
language only changes the checkbox label; stable amenity_ids stay common per
ADR0061 and selected in every language. Existing public Building renderer already
reads approved names by locale; taxonomy Save invalidates its caches and editor
routes so labels update without republishing Building text/SEO.
