-- Slice `pages`: new `page_content` key `buildings` — the Buildings listing page
-- (/<locale>/buildings), spec docs/specs/buildings-admin-editor.md (S1). It holds the listing's
-- editable copy (SEO, hero, owner panel, figures band, earnings calculator); the building cards
-- stay in the `buildings` slice.
--
-- Data only (`key` is a plain unique text column, no enum). The value is `defaultBuildings`
-- (src/slices/pages/schemas/buildings.ts): blank texts (→ the i18n fallbacks) plus the three
-- figures the page shows today, so the editor opens with them and a first save does not hide the
-- band. ON CONFLICT DO NOTHING: an existing row is never overwritten.

INSERT INTO "page_content" ("key", "data")
VALUES
  ('buildings', '{"stats":{"figures":[{"label":"Bookings Completed","to":"400000","suffix":"+","group":true,"description":"Across all managed properties"},{"label":"Years of Experience","to":"12","suffix":"+","group":false,"description":"Optimizing owner returns in Portugal"},{"label":"Revenue Generated","to":"55","prefix":"€","suffix":"M+","group":false,"description":"For our property owners"}]}}'::jsonb)
ON CONFLICT ("key") DO NOTHING;
