-- Owners sections reinstated (owner clarification): the request was to drop the per-section
-- *eyebrow* texts, not the whole sections. 0004 had removed services/plans/journey/dashboard;
-- this re-adds their content to the stored owners row so the (soon-to-be-DB-connected) editor
-- opens populated. Additive + idempotent: only runs when the sections are absent.
UPDATE "page_content"
SET "data" = "data" || '{
  "services": {
    "headline": "Everything done for you",
    "subheadline": "A complete operation behind every booking.",
    "items": [
      {"icon_key": "spark", "title": "Listing & marketing", "description": "Professional photography, copy and multi-channel distribution."},
      {"icon_key": "spark", "title": "Dynamic pricing", "description": "Revenue management that adapts daily to demand."},
      {"icon_key": "spark", "title": "Guest communication", "description": "24/7 multilingual support before, during and after stays."},
      {"icon_key": "spark", "title": "Check-in & check-out", "description": "Smooth arrivals and departures, every time."},
      {"icon_key": "spark", "title": "Housekeeping", "description": "Hotel-standard cleaning and linen between stays."},
      {"icon_key": "spark", "title": "Maintenance", "description": "Proactive upkeep and a trusted contractor network."},
      {"icon_key": "spark", "title": "Compliance", "description": "Licensing, taxes and regulations handled for you."},
      {"icon_key": "spark", "title": "Reviews & quality", "description": "We protect your rating with five-star service."},
      {"icon_key": "spark", "title": "Owner reporting", "description": "Clear monthly statements and a live dashboard."}
    ]
  },
  "plans": {
    "headline": "A management plan built around your goals",
    "subheadline": "Cumulative plans — each tier adds to the one before it. Names are ours; the structure mirrors the best in the market.",
    "tiers": [
      {"name": "Core", "tag": "The essentials, done brilliantly", "commission": "15%", "is_popular": false, "features": ["Listing creation & optimisation", "Multi-channel distribution", "Dynamic pricing", "Guest communication", "Secure payment handling"]},
      {"name": "Prime", "tag": "Everything automated", "commission": "18%", "is_popular": true, "features": ["Professional photography", "Premium listing placement", "Review management", "Smart check-in support"]},
      {"name": "Manage", "tag": "Full operations", "commission": "22%", "is_popular": false, "features": ["Housekeeping & linen", "Maintenance coordination", "Restocking of essentials", "On-the-ground support"]},
      {"name": "Complete", "tag": "White-glove, end to end", "commission": "25%", "is_popular": false, "features": ["Dedicated account manager", "Interior styling advice", "Licensing & compliance", "Priority everything"]}
    ],
    "helpers": [
      {"title": "Not sure which plan fits?", "copy": "Tell us about your property and goals — we''ll recommend the right tier and show projected returns.", "cta": {"label": "Get your profitability study", "url": "https://www.centralhill.pt/en/owners"}},
      {"title": "Already managing elsewhere?", "copy": "Switching is simple. We handle the migration and you keep your bookings and reviews.", "cta": {"label": "Talk to us", "url": "https://www.centralhill.pt/en/owners"}}
    ]
  },
  "journey": {
    "headline": "Your growth path",
    "subheadline": "From first call to full performance in five steps.",
    "steps": [
      {"title": "Profitability study", "description": "We assess your property and project its earning potential — free."},
      {"title": "Onboarding", "description": "Photography, listing and pricing set up across all channels."},
      {"title": "Go live", "description": "Your home goes to market and starts taking bookings."},
      {"title": "Operate", "description": "We run day-to-day hosting end to end."},
      {"title": "Optimise", "description": "We refine pricing and service to keep growing your returns."}
    ]
  },
  "dashboard": {
    "headline": "Full visibility from anywhere",
    "subheadline": "Your performance, always at your fingertips.",
    "features": [
      {"icon_key": "spark", "title": "Live bookings", "description": "See every reservation and your calendar in real time."},
      {"icon_key": "spark", "title": "Revenue & payouts", "description": "Track income and upcoming payouts to the cent."},
      {"icon_key": "spark", "title": "Occupancy", "description": "Monitor occupancy and nightly rates at a glance."},
      {"icon_key": "spark", "title": "Statements", "description": "Download clear monthly statements anytime."},
      {"icon_key": "spark", "title": "Reviews", "description": "Keep an eye on guest ratings and feedback."},
      {"icon_key": "spark", "title": "Notifications", "description": "Stay informed with alerts that matter."}
    ]
  }
}'::jsonb
WHERE "key" = 'owners'
  AND NOT ("data" ? 'services');
