# Content Briefs — synthesized requirements

> Distilled from the client's 10 `.docx` briefs in `cliente-docs/`. This is the requirements
> source of truth per page. All copy is authored in **English**; it becomes the source locale for
> translation. Open questions are flagged ❓ for the client. Persistent **top nav** (Logo · Owners ·
> Buildings · Real Estate · Guests · About Us · Blog · [Book Now] · [List Your Property →]) and
> **footer** (Brand/contact · For Owners · Guests & Company) appear on every page → owned by `globals`.

## 0 · Home  → slice `pages` (key `home`)
Dual-audience landing (owners + guests). Blocks: Hero (video/GIF bg) · Owner value-prop (6 benefit
cards) · Company stats band (bookings/years/guests/revenue) · Guest value-prop (6 cards) · **Featured
portfolio (3 buildings, `is_featured`, View All)** · Testimonials (6, owner/guest) · Company story ·
Dual conversion (owner estimate / guest browse).
- Dynamic: featured buildings (name, cover, bedrooms→capacity, link), testimonials, company stats.
- ❓ Featured selection = manual flag vs ranked; fixed at 3? Stats = manual settings vs computed.

## 1 · Owners  → slice `pages` (key `owners`) + `leads` + `faq`
Lead-gen for property owners. Anchored sub-nav. Blocks: Hero + **earnings-estimate form** (address,
#properties, #bedrooms) · stats · 6 "why choose us" · 9 included services · **3 commission plans**
(Essential/Premium★/Concierge, feature lists) · 5-step journey · 6 dashboard-tech features · 4 owner
testimonials · 7-item FAQ · final CTA.
- Lead: `earnings_estimate`. ❓ Calculator logic (real estimate vs lead capture); plan prices TBD.

## 2 · Real Estate  → slice `pages` (key `real_estate`) + `leads` + `faq`
**B2B institutional** landing (funds, developers, operators, corporate) — NOT a listing page.
Blocks: Hero (+ "Capability Statement" PDF download) · partner types (4) · capabilities (3) · asset
classes (6) · **3 partnership models** (Fixed Rent / Management Commission / Hybrid) · Why-Portugal ·
track-record stats (6) · 5-step process · 7-item institutional FAQ · **Deal Enquiry form**.
- Lead: `deal_enquiry` (company, contact, jurisdiction, asset type/units/status, target model,
  timeline, notes). ❓ Canonical contact (realestate@… vs info@centralhill.pt); PDF gated?

## 2 + 2.1 · Buildings  → slice `buildings` (CORE)
Listing page = grid of **Building cards** (image, ★NEW badge, name, street, city, ~180-char teaser,
View More). Detail page (LovelyStay-style) = hero (name + address) · long description (intro +
"The Neighbourhood") · stats (**Nº apartments · total capacity · Nº beds**) · "Book an Apartment in
This Building" CTA. ~14 buildings, all Lisbon. Each building is its own page/slug.
- ❓ Capacity/beds source (manual vs aggregated from apartments — we chose **aggregated**, recomputed
  on apartment publish). Building gallery spec not given (mirror LovelyStay).

## 2.x · Apartments  → slice `apartments`  *(not in briefs — confirmed in scope)*
The bookable unit inside a building. Our entity: name, slug, bedrooms, bathrooms, max guests, beds,
size, floor, gallery, **amenities** (taxonomy), **per-apartment FAQ**, `avantio_id`/`avantio_url`.
"Book" CTA embeds the Avantio widget/deep-link. Drives building stat aggregation.

## 4 · Guests landing  → slice `pages` (key `guest`)
Traveler marketing. Blocks: Hero (GIF) · Welcome · **Why book direct** (best price, ~€213 avg saving,
early check-in, luggage, discounts) · **Featured portfolio** (3 buildings) · **Services teaser** (6) ·
**Best of Portugal teaser** (links to guides) · guest testimonials · dual CTA.
- ❓ €213 figure source/config; early check-in conditional logic informational only.

## 4.1 · Services  → slice `services`
Guest services: index + **one detail page per service** (Airport Transfer, Sintra Tour, Fátima Tour,
Boat Tour, Surf, Chef at Home, Luggage Storage…). CRUD-managed; flat list (no categories given).
Fields: name, excerpt, body, gallery, optional price_from, CTA. Content authored fresh in backoffice.
- ❓ Full/complete service list; pricing shown?; booking CTA behavior.

## 4.2 · What to Do  → slice `guides`
Hierarchical city guide: **City selector → GuidePage(s) → GuideSection(s) → Place(s)**. Templates per
sub-page type (landing / eat / beaches / events / secrets / families / groups / travellers). Must be
**fully extensible** (add cities, pages, sections at will). Lisbon first; Porto later. Place fields
vary by template (address, phone, price tier €/€€/€€€, map URL, website, image). Authored fresh.

## 5 · About Us  → slice `pages` (key `about`) + `leads`
Brand/trust page. Blocks: Hero (mission, since 2012) · Our Story (3 paras + 5 stats) · Who We Serve
(3 audiences) · Values (4) · **"How we're organised" = 6 departments, NOT named people** · Certifications
(ALEP, Clean&Safe, I-PRAC) · Community · Get-in-touch (3 CTAs + office block + **contact form**).
- Lead: `contact`. ❓ Real team bios/photos ever needed (would be a new `TeamMember` entity).

## 6 · Blog  → slice `blog`
Listing (hero + search + featured post + **category tabs** + 3-col card grid + load-more + newsletter)
and article detail (header, hero image, numbered sections with inline images, closing, **per-post CTA
block**, **3 related posts**). 9 launch articles authored. **5 fixed categories with colors**: Owner
Guides (teal), STR Tips (blue), Portugal Regulations (red), Lisbon (gold), Portugal (grey). Author =
brand byline. Reading time shown. Newsletter → `leads`.
- ❓ Per-language slugs (yes), categories CRUD vs fixed, related auto-fallback, search scope.

---

## Cross-page entities (do not duplicate per page)
- **globals:** nav, footer, contact (phones/email/WhatsApp), social, company stats, office.
- **testimonials:** shared (audience = owner|guest), used by Home/Owners/Guests.
- **faq:** grouped by audience/page (owners, real_estate, …).
- **leads:** earnings_estimate, deal_enquiry, contact, newsletter → DB + email + inbox.
- **media:** all images via R2 `media_asset`; emoji in briefs are placeholders for a real icon set.

## Global open questions for the client (consolidated)
1. Featured-building selection logic + count. 2. Which company stats are computed vs manual.
3. Earnings calculator: real estimate engine or lead capture only. 4. Commission/plan pricing.
5. Canonical Real-Estate contact + whether Capability Statement is gated/localized.
6. Building gallery spec + whether building names/addresses are translated or kept constant.
7. Complete Services list + whether services have pricing/booking. 8. Real team bios/photos (About).
9. Blog: categories extensible?, related-posts auto-fallback?, newsletter provider.
10. €213 guest-saving figure: static config or computed/substantiated.
