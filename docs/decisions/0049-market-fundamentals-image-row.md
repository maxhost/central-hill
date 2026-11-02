# ADR0049 — Market Fundamentals image row

Accepted: explicit user request,2026-11-01.

Add a small two-image row above Market Fundamentals, inside its feature card.
The row has the same inner width as the three-stat strip and two equal columns.
StatBento accepts optional caller-owned `feature.media: ReactNode`, rendered
before the heading. The kernel remains presentation-only with no slice imports.

Real Estate adds optional left/right image references and alt text inside
`market.fundamentals`. The schema-derived BO displays both image pickers. Nested
media slots, MIME validation and preview collection include both images, and
local-media capacity increases11→13. Older snapshots remain valid.

Fallback photos come from Pexels, retained as temporary remote images:
- https://www.pexels.com/photo/roof-top-view-on-city-buildings-6391897/
- https://www.pexels.com/photo/cityscape-of-lisbon-portugal-16343720/

No database writes, media uploads, migration or deployment. Existing market text,
stat values and card ordering stay intact. Aesthetic review is L0/user-owned;
functional schema/descriptor/media checks run without database writes.
