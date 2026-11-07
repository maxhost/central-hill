# ADR0063 — One localized Apartment booking URL; retire SEO authoring

2026-11-06. User requests one full URL per Apartment language for the card's
booking destination, opened in a new tab. No Apartment public detail route exists,
so remove SEO inputs from the create/edit form.

Optional booking_link:string|null extends existing v1 locale JSON. It is localized,
excluded from APARTMENT_SHARED_KEYS, saved/published explicitly per language and
inherits EN until the first real local edit. No migration or bulk conversion.
Absence preserves old booking_url/default_booking_url resolution; the form projects
the effective old URL without materializing it. Actual input edit sets booking_link;
explicit null clears the unit URL without reviving its hidden legacy default.
With no unit URL, the existing in-page Building booking-section fallback remains.
New documents initialize booking_link:null.

Public ApartmentBooking shape stays unchanged. Its resolved URL feeds the existing
UnitCard external mode (target=_blank, rel=noopener noreferrer) for a configured
HTTP(S) destination. No kernel or Building CTA changes. Preserve all hidden legacy
Avantio/SEO/OG values internally; remove only their authoring controls. No DB deletes.
