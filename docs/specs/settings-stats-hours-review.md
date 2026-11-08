# Review — Settings stats and office hours

2026-11-07. User questions the remaining Translation blockers. Code audit on
main7615b58, no product changes, tests/browser/DB writes or runtime restart.

## Statistics: public coverage already complete

Home uses content.stats.figures (ui/home-page.tsx:55); Owners uses content.stats
(ui/owners-page.tsx:197); Buildings listing uses page.content.stats.figures
(ui/components/buildings-sections.tsx:122); About uses c.stats (ui/about-page.tsx:252).
Real Estate's market figures use market.stats (ui/real-estate-page.tsx:437) and its
other figure sections belong to its own page schema. They are authored/localized
in enabled visual Pages editors, not company_settings.stats.

The only reader of globals.stats is pages/ui/components/stats-band.tsx. This
StatsBand composer has no callers/importers and explicitly documents that it is
unused; the similarly named core/ui StatBand is presentational and receives page
figures, not Settings. Settings still exposes six old stat values/labels and writes
translation fields, but that persistence is a legacy surface, not an active public
authoring gap. The previous plan incorrectly treated it as missing translation
coverage. No new stat editor/four-language Settings inputs are needed. Eventual
retirement should close old surfaces/actions while preserving original stored data;
this review does not delete or hide anything.

## Hours: numeric value versus text

A numeric range such as 09:30–18:00 is shared, not translatable. office_hours is
already a shared column (not a [T] field). The existing [T] field is only
office_hours_label. Active consumer: About officeRows (ui/about-office.ts:59),
which uses that label or literal “Office Hours”, and office_hours or the literal
“Monday – Friday · 09:30 – 18:00”. The About page editor has other office row labels
(address/bookings/checkin/email/website), but not the hours label/value.

The actual localization issue is this small heading/day-name text, not the times.
A fixed four-language heading/day template like navigation can replace that
legacy translation dependency without a new editor. Decide how to retain authored
shared free-form office_hours text/legacy labels before changing it; no existing
content is discarded or migrated by this review.

## Corrected closeout inventory

- Public statistics: covered by visual page editors; only legacy technical cleanup.
- Hours: numeric value shared; resolve fixed heading/day-name localization, not a new
  multilingual schedule editor.
- Other pending topics remain image ALT, city.intro policy and legacy generic
  read/write-path closure. No decision on those is implied by this review.

Main localhost3071 PID75584/parent75578/session24974 stays unchanged with the existing
synthetic propertylocalesqa DB5658/proxy4558/storage9077. Original logo/publicmedia
symlink, all worktrees/data/envs/artifacts preserved. No schema/push/deploy/remote actions.
