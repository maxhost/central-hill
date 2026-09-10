-- Guests page becomes fully DB-driven (slice `pages`, key 'guest').
-- Rewrites `page_content.data` for the guest row with the copy of the approved
-- `mock/guest.html` baseline, adds the new `portfolio` / `dual_cta` blocks and the
-- per-section eyebrows, and replaces the demo seed's placeholder `icon_key`s
-- ("spark"/"bell") with real Iconoir names (the page renders `iconoir-<icon_key>`).
--
-- Guard: `NOT (data ? 'portfolio')` — the key exists in no row today, so this fires exactly
-- once and is a no-op on re-run (same technique as 0009). Safe because the Guests page
-- ignored the DB entirely until this change, so nothing authored through the admin was live.
-- Checked before writing: the guest row's `faq_group_key` was "" (no group bound) and there
-- were zero `translation` rows for entity_type='page_content', so nothing is orphaned.
-- The INSERT guarantees the row exists, otherwise the wired renderer would 404.
--
-- Not stored here (composed at render time): portfolio cards → buildings, reviews →
-- testimonials, dual-CTA contact line → company_settings, FAQ → faq slice.

INSERT INTO "page_content" ("key", "data")
VALUES ('guest', '{}'::jsonb)
ON CONFLICT ("key") DO NOTHING;
--> statement-breakpoint
UPDATE "page_content"
SET "data" = $guest$
{
  "hero": {
    "video_media_id": "",
    "eyebrow": "For Guests · Portugal",
    "headline": "Where Every Stay Becomes a Story",
    "subheadline": "Handpicked, professionally managed apartments in the heart of Portugal's most captivating destinations.",
    "cta": { "label": "Browse Our Apartments", "url": "https://www.centralhill.pt/en/buildings" }
  },
  "welcome": {
    "headline": "Welcome to Central Hill",
    "lede": "Every city has a soul — and we'll help you find it.",
    "copy": "At Central Hill, we handpick properties in the heart of Portugal's most captivating destinations, so you wake up where the culture, the food, and the people are. Our team is with you from the first message to the last goodbye.",
    "guarantee_label": "Book directly with us for the best price, guaranteed",
    "image_media_id": ""
  },
  "why": {
    "eyebrow": "Best Price, Guaranteed",
    "headline": "Why Book Directly With Us?",
    "intro": "Book direct and unlock perks you won't get on the big platforms — better prices, more flexibility, and personal care.",
    "benefits": [
      { "icon_key": "percentage-circle", "title": "Get the Best Prices", "description": "You won't find our apartments cheaper anywhere else — enjoy an average saving of €213 per reservation versus Airbnb, Booking and other platforms." },
      { "icon_key": "key", "title": "Early Check-In", "description": "Enter the apartment sooner than everyone else and start your trip the moment you arrive. (Pending availability.)" },
      { "icon_key": "suitcase", "title": "Early Luggage Drop", "description": "Arriving before check-in time? We can let you drop your luggage at the apartment early, hands-free." },
      { "icon_key": "gift", "title": "Special Discounts", "description": "Enjoy exclusive discounts on services and activities booked with us during your stay." }
    ],
    "cta": { "label": "Browse Our Apartments", "url": "https://www.centralhill.pt/en/buildings", "note": "View the full portfolio of available apartments across Portugal." }
  },
  "portfolio": {
    "eyebrow": "The Portfolio",
    "headline": "Explore Our Portfolio",
    "intro": "Carefully selected properties across Portugal's most iconic locations — each chosen for its character and exceptional guest experience.",
    "cta": { "label": "View All Properties", "url": "https://www.centralhill.pt/en/buildings", "note": "Browse our full portfolio across Portugal." }
  },
  "services_teaser": {
    "eyebrow": "Services",
    "headline": "Make the Most of Your Stay",
    "intro": "We go beyond accommodation. From the moment you land to every adventure in between, our team is here to make your Portugal experience unforgettable.",
    "items": [
      { "icon_key": "car", "title": "Private Transfers", "description": "Seamless airport and city transfers, ready the moment you land." },
      { "icon_key": "binocular", "title": "Day Tours", "description": "Guided escapes to Portugal's most iconic sights and hidden corners." },
      { "icon_key": "sea-waves", "title": "Boat Trips", "description": "See the coastline and the Tagus from the water on a private cruise." },
      { "icon_key": "swimming", "title": "Surf Experience", "description": "Catch your first wave with expert local instructors on Atlantic beaches." },
      { "icon_key": "pizza-slice", "title": "Chef at Home", "description": "A private chef cooks Portuguese flavours right in your apartment." },
      { "icon_key": "suitcase", "title": "Luggage Storage", "description": "Drop your bags and explore freely before check-in or after checkout." }
    ],
    "cta": { "label": "Explore All Services", "url": "https://www.centralhill.pt/en/services", "note": "See details, pricing, and availability." }
  },
  "activities_teaser": {
    "eyebrow": "What to Do",
    "headline": "The Best of Portugal",
    "intro": "Whether you're exploring a vibrant city, a medieval village, or a stunning coastline — Portugal never runs out of extraordinary things to discover.",
    "items": [
      { "icon_key": "bank", "title": "Explore Historic Districts", "description": "Wander cobblestone streets and timeless neighbourhoods full of character." },
      { "icon_key": "medal", "title": "Visit UNESCO World Heritage Sites", "description": "From Sintra's palaces to centuries-old monuments and town centres." },
      { "icon_key": "pizza-slice", "title": "Taste Portuguese Food & Wine", "description": "Pastéis de nata, fresh seafood, and world-class wine regions await." },
      { "icon_key": "sea-waves", "title": "Relax on Stunning Beaches", "description": "Golden sands and dramatic Atlantic coastline, never far away." },
      { "icon_key": "music-double-note", "title": "Experience Music & Festivals", "description": "Fado nights, summer festivals, and a year-round cultural calendar." },
      { "icon_key": "map", "title": "Day Trips & Hidden Gems", "description": "Medieval villages and lesser-known spots just beyond the city." }
    ],
    "cta": { "label": "Discover More", "url": "https://www.centralhill.pt/en/guides", "note": "" }
  },
  "dual_cta": {
    "guest": {
      "eyebrow": "Guests",
      "title": "Planning a Stay? Find your perfect apartment.",
      "body": "Browse our full portfolio of professionally managed apartments across Portugal's most sought-after locations — studios to 8-bedrooms, for every type of stay.",
      "cta": { "label": "Browse Our Apartments", "url": "https://www.centralhill.pt/en/buildings" }
    },
    "owner": {
      "eyebrow": "Owners",
      "title": "Own a Property? Start earning more.",
      "body": "Find out what your property could earn with a free, no-obligation profitability analysis. Our team will assess your property and come back within 48 hours.",
      "cta": { "label": "Get Your Free Earnings Estimate", "url": "https://www.centralhill.pt/en/owners" }
    }
  },
  "faq_group_key": ""
}
$guest$::jsonb,
"updated_at" = now()
WHERE "key" = 'guest' AND NOT ("data" ? 'portfolio');
