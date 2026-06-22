-- Owners `services` + `dashboard` reshaped to the home Image-Showcase layout (owner direction):
-- "Everything Handled. Nothing Overlooked." and "Your Property, Always in Sight" now render as a
-- 4-benefit highlight list + CTA beside a 4:5 image (the dashboard block mirrored, image left).
-- The stored row is reshaped to match the new owners schema so the editor opens populated and the
-- new `image_media_id` fields are editable. Replaces the whole `services`/`dashboard` sub-objects
-- (drops the old `items`/`features` arrays). Idempotent: re-running sets the same value.
UPDATE "page_content"
SET "data" = jsonb_set(
  jsonb_set("data", '{services}', '{
    "headline": "Everything handled. Nothing overlooked.",
    "subheadline": "From the first listing to each guest''s departure, we manage every detail so you don''t have to.",
    "benefits": [
      {"icon_key": "search", "title": "Listing & marketing", "description": "Professional photography, copy and multi-channel distribution across Airbnb, Booking.com and direct."},
      {"icon_key": "bell", "title": "Reservations & guest care", "description": "24/7 multilingual communication, calendar and seamless check-in/out — every stay runs smoothly."},
      {"icon_key": "spark", "title": "Housekeeping & maintenance", "description": "Hotel-standard cleaning, premium linen and proactive upkeep keep your home guest-ready."},
      {"icon_key": "chart", "title": "Revenue & compliance", "description": "AI-driven pricing, monthly reporting and full Alojamento Local licensing & tax support."}
    ],
    "image_media_id": "",
    "cta": {"label": "See how we manage your home", "url": "https://www.centralhill.pt/en/owners", "note": "Fully managed, end to end — you stay informed, we do the work."}
  }'::jsonb, true),
  '{dashboard}', '{
    "headline": "Your property, always in sight",
    "subheadline": "Our owner dashboard gives you real-time visibility into every aspect of your property''s performance — from anywhere in the world.",
    "benefits": [
      {"icon_key": "chart", "title": "Live revenue tracking", "description": "Your earnings and projected monthly income at a glance, updated in real time."},
      {"icon_key": "bell", "title": "Booking calendar", "description": "Full visibility of reservations, blocked dates and availability across all platforms."},
      {"icon_key": "search", "title": "Occupancy & performance", "description": "Track occupancy rates, average nightly rate and review scores over any period."},
      {"icon_key": "key", "title": "Alerts & statements", "description": "Instant alerts for bookings and check-ins, plus downloadable monthly statements anytime."}
    ],
    "image_media_id": "",
    "cta": {"label": "Explore the owner dashboard", "url": "https://www.centralhill.pt/en/owners", "note": "Real-time visibility into your property, 24/7."}
  }'::jsonb, true)
WHERE "key" = 'owners';
