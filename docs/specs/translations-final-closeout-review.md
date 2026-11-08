# Review — final Translations retirement readiness

2026-11-08. Read-only source audit at main0abdf0b after Settings cleanup, no product,
DB/schema/browser/test/runtime changes. User asks whether global UI can now retire.

## Covered editorial content

Pages, Blog/Properties/Services/Guides, taxonomy names, author/category/testimonial
labels, per-language FAQ selection and Settings/manual global labels have dedicated
surfaces. Remaining legacy S14 permissions for service/amenity/service_category/
city/neighbourhood/faq_item require technical closure/old-link redirects, not new
full editors. Retain translation/kernel data and public locale readers.

## city.intro is legacy, not a missing public editor

Geography mapCity reads intro into CityRef, and City form exposes EN. However,
getCityBySlug's only public consumer is Guides, which reduces it to GuideCityRef
{id,slug,name}. listCities consumers similarly use identity/name/slug or maps;
no public renderer uses CityRef.intro. Guide hero/teaser intro is guide_page.intro,
a separate field already localized in Guide editor. Thus city.intro needs a legacy
retention/retirement policy, not new authoring to preserve current public output.
Never remove its stored EN/target rows merely to close S14.

## ALT is the remaining product choice

Some Pages images have their own image_alt fields and Blog body images have alt.
Shared asset ALT still feeds actual public covers/galleries/Guide media/OG through
loadContent(media_asset,id,alt): see pages/server/resolve.ts:69,
blog/server/queries.ts:109, services/server/queries.ts:290,
guides/server/queries.ts:409 and buildings/server/queries.ts:71. Those consumers
render MediaImageData.alt or a localized content-title/name fallback when absent.
MediaField and upload finalize currently edit media identity/bytes, not asset ALT.
S14 can translate existing ALT source rows; it does not provide a new source ALT
field on upload. No claim that every uploaded image currently has manual ALT.

To preserve manual ALT translation editing, give uncovered image fields an ALT
surface before removing S14. Alternatively explicitly retain existing ALT reads/
rows and automatic fallbacks without that manual UI. This is a product policy
choice; do not silently build an entire media library or mandate another editor.

After that decision, implement bounded technical retirement: remove sidebar,
redirect old routes to owners, reject stale generic actions/generation and preserve
all historical translations. No permission to delete translation tables, values,
slugs or live media follows from UI retirement. This review starts none of it.

Main dev3071 PID13559/parent13553/session19738 retained, safe propertylocalesqa
DB5658/proxy4558/storage9077 and all worktrees/files/artifacts/envs preserved.
