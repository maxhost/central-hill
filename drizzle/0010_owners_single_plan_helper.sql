-- Owners plans: collapse the two helper blocks into a single full-width highlighted band
-- (slice `pages`). The "Already managing elsewhere?" helper is dropped per owner direction; the
-- remaining "Not sure which plan fits?" helper now spans full width and is design-highlighted.
-- The owners schema changed `plans.helpers` from a fixed array of 2 → 1, so trim the stored row
-- to keep just the first helper. Content-only reshape of an owned JSON field (no table/column
-- change); guarded by length > 1 → idempotent / re-runnable / forward-only.
UPDATE "page_content"
SET "data" = jsonb_set(
  "data",
  '{plans,helpers}',
  jsonb_build_array("data" #> '{plans,helpers,0}'),
  true
)
WHERE "key" = 'owners'
  AND jsonb_array_length("data" #> '{plans,helpers}') > 1;
