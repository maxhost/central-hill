-- Owners page slimmed to a focused conversion landing (owner direction; see ADR 0023 note
-- + the `owners` schema). The marketing sections "why / services / plans / journey /
-- dashboard" were removed from the public page AND the back-office schema, so drop their
-- stored keys to leave no traces. The hero "★ Earn +25%" badge now lives inside the
-- earnings-form card (moved + highlighted), so relocate `hero.badge` → `earnings_form.badge`.
-- Data-only migration: the `page_content.data` jsonb shape is unchanged at the column level.
UPDATE "page_content"
SET "data" = jsonb_set(
  ("data" - 'why' - 'services' - 'plans' - 'journey' - 'dashboard') #- '{hero,badge}',
  '{earnings_form,badge}',
  COALESCE("data" #> '{hero,badge}', '"Earn +25%"'::jsonb),
  true
)
WHERE "key" = 'owners'
  AND jsonb_typeof("data" #> '{earnings_form}') = 'object';
