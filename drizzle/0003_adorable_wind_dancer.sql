-- Pages no longer have a draft/published state (owner direction): a page row is live.
ALTER TABLE "page_content" DROP COLUMN "status";
--> statement-breakpoint

-- Home content cleanup (owner direction): the "Story" block was removed from the Home,
-- and the Guests pitch now shows exactly 4 benefits (was 6). Drop the stale `story` key
-- and trim `guests_pitch.benefits` to its first 4 entries so the editor loads the new
-- fixed-count shape. (`dual_cta` + the new image fields are additive — absent rows fall
-- back to the localized chrome / mock photos at render time, so no backfill is needed.)
UPDATE "page_content"
SET "data" = jsonb_set(
  ("data" - 'story'),
  '{guests_pitch,benefits}',
  COALESCE(
    (
      SELECT jsonb_agg(b.elem ORDER BY b.ord)
      FROM jsonb_array_elements("data" #> '{guests_pitch,benefits}')
        WITH ORDINALITY AS b(elem, ord)
      WHERE b.ord <= 4
    ),
    "data" #> '{guests_pitch,benefits}'
  )
)
WHERE "key" = 'home'
  AND jsonb_typeof("data" #> '{guests_pitch,benefits}') = 'array';
