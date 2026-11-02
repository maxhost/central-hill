# ADR0050 — Optional links on photo feature cards

Accepted2026-11-01, user requests synchronized service detail links in Guests.

PhotoFeatureGrid accepts optional item id and href. An href renders a normal
Next Link around the card, with no target (same-tab navigation); otherwise the
existing div card remains. Stable IDs avoid index keys for dynamic catalogues.
Links expose a visible keyboard focus outline. The kernel stays presentational:
no catalogue queries, slice imports or route/locale decisions.

Pages' Guests renderer reads listServices(locale) from the Services contract and
passes every published service's localized content and detail URL to the grid.
Services owns status/order/content/media and cache invalidation; the obsolete
manual Guests card array is hidden/preserved in BO. No schema migration or DB
write. Activities retain unlinked cards. See guests-service-catalogue spec.
