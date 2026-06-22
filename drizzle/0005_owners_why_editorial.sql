-- Owners "why" section reinstated, redesigned (owner direction; extends drizzle/0004).
-- 0004 removed the `why` grid; the owner asked to keep it but restyle it to the home's
-- Editorial-Split layout (sticky headline + CTAs beside a hairline benefit list), and to
-- make it editable in the back office (owners schema → `why`). This data-only migration
-- re-adds the `why` content to the stored owners row so the (soon-to-be-DB-connected)
-- editor opens populated. Additive: only sets `why` when it is absent.
UPDATE "page_content"
SET "data" = jsonb_set(
  "data",
  '{why}',
  '{
    "headline": "Why property owners trust Central Hill Apartments",
    "subheadline": "We turn your property into a high-performing asset — fully managed, transparent, and optimised for maximum returns.",
    "benefits": [
      {"icon_key": "chart", "title": "AI-powered pricing", "description": "Our dynamic pricing engine analyses market data in real time, adjusting your rates daily for maximum occupancy at the best possible price."},
      {"icon_key": "trophy", "title": "Profit-first management", "description": "Every decision is guided by one goal: maximising your returns — from listing optimisation to upsell strategies, we leave no revenue on the table."},
      {"icon_key": "bell", "title": "24/7 owner dashboard", "description": "Monitor your property''s performance in real time — bookings, revenue, occupancy and guest reviews — from anywhere in the world."},
      {"icon_key": "user", "title": "Dedicated account manager", "description": "A named point of contact who knows your property personally. No call centres, no uncertainty — just reliable, expert support."},
      {"icon_key": "map-pin", "title": "Deep local expertise", "description": "We operate on the ground in Portugal, with an unmatched understanding of seasonal trends, regulations and the best channels for your property."},
      {"icon_key": "search", "title": "Full transparency", "description": "Detailed monthly reports, real-time dashboards and complete financial visibility. You stay in control, even when we handle everything."}
    ],
    "cta_primary": {"label": "Get your free estimate", "url": "https://www.centralhill.pt/en/owners", "note": "Free, no obligation — reply within 48h."},
    "cta_secondary": {"label": "Talk to us", "url": "https://www.centralhill.pt/en/owners"}
  }'::jsonb,
  true
)
WHERE "key" = 'owners'
  AND NOT ("data" ? 'why');
