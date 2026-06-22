-- Owners "numbers" band (#numbers) becomes per-page editable (slice `pages`).
-- Seed `page_content.data.stats` for the owners page with the four figures the band used to
-- hard-code. Each figure: `to` is the count-up target as a digit string (the client counter
-- reads it via Number()); the displayed value is derived as prefix + (optionally grouped) to +
-- suffix, so "400000"+group+"+" → "400,000+" and "55"+"€"+"M+" → "€55M+". Only `label` is
-- translated (block:stats.<i>.label). Guarded by NOT (data ? 'stats') → idempotent / re-runnable.
UPDATE "page_content"
SET "data" = jsonb_set("data", '{stats}', $stats$[
  {"to":"400000","suffix":"+","group":true,"label":"Bookings Completed"},
  {"to":"12","suffix":"+","group":false,"label":"Years of Experience"},
  {"to":"55","prefix":"€","suffix":"M+","group":false,"label":"Revenue Generated"},
  {"to":"5","suffix":"M+","group":false,"label":"Guests Hosted"}
]$stats$::jsonb, true)
WHERE "key" = 'owners' AND NOT ("data" ? 'stats');
