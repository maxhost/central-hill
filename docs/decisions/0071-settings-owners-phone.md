# ADR0071 — Separate Owners phone in Settings and Footer

2026-11-07. User requests input and footer row for +351 910 438 062.

Add nullable company_settings.owners_phone with user-supplied default. The new
field initializes independently; bookings/check-in/WhatsApp/contact data untouched.
Shared across languages, labels localized. No new About/Owners CTA behavior.
Existing singleton absent uses DEFAULT_GLOBALS.ownersPhone. Existing persisted
null/blank hides only Owners row, never revives default. Optional admin payload
preserves old clients: omitted key leaves saved field unchanged; explicit null clears.
Expose ownersPhone optional in SiteGlobals for backward consumer compatibility;
public reader always supplies string|null. Bump getGlobals cache shape v2→v3.

core/ui/FooterContact gains optional ownersPhone/ownersLabel and conditional tel
row after Bookings using existing phone icon/layout. Core is presentational; the
Settings composer owns reading/labels. Existing Save global-tag/layout invalidation
refreshes all locales without page republishing. No other phone substitution.
Additive migration0029 only after explicit schema authorization on synthetic local
propertylocalesqa; no remote migration/deploy. No unrelated role/locale refactor.
