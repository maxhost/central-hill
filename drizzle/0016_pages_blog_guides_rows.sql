-- Slice `pages`: two new `page_content` keys, `blog` and `guides` (session 5 of
-- docs/plan-iconos-y-detalles.md). They hold the copy the blog post and guide detail pages show
-- outside the post/guide: the CTA at the bottom of each sticky aside. Destinations are fixed in
-- code (/owners, /buildings), so only the copy (and the guide photo) is stored.
--
-- Data only (`key` is a plain unique text column, no enum). The values are `defaultBlog` /
-- `defaultGuides` (src/slices/pages/schemas/{blog,guides}.ts), so the editor opens on what the
-- page shows. ON CONFLICT DO NOTHING: an existing row (e.g. from the seed) is never overwritten.

INSERT INTO "page_content" ("key", "data")
VALUES
  ('blog', '{"post_aside":{"eyebrow":"Own a property in Lisbon?","title":"See what your apartment could earn","body":"A free, no-obligation estimate based on your neighbourhood, size and season.","cta_label":"Get a free estimate →"}}'::jsonb),
  ('guides', '{"guide_aside":{"image_media_id":"","eyebrow":"Stay in Lisbon","title":"Your base for exploring","body":"Furnished apartments in Bairro Alto and Chiado, close to everything in this guide.","cta_label":"Browse apartments →"}}'::jsonb)
ON CONFLICT ("key") DO NOTHING;
