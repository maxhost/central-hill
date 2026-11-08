# ADR0075 — Settings hours labels and retired controls

2026-11-07. User requests editable Hours Label EN/ES/PT/FR and removal of Settings
controls already covered or unused. Audit confirms Headline stats, Avantio account/
JSON and Buildings listing toggles have no active public consumers. The Home
Avantio widget uses its fixed bk_centralhill integration, not those fields. Remove
these three UI cards and ignore their submitted values, retaining original columns/
translations exactly. New singleton uses existing DEFAULT_GLOBALS internally.

Keep Site icons: actual globals for header/account/contact/language, Blog metadata/
callouts/search, Guide templates/location and apartment spec icons; page editors
cannot replace them all. Service-specific overrides exist and fall back to global
seven service slots. Hide only three unused services_how_* controls; preserve raw
stored values, merge only editable icon keys on Save. No schema/delete/backfill.

EN Hours Label stays inline office_hours_label; targets reuse existing translations.
Raw authored/pending target inputs blank when absent. Own approved label else
nonblank EN else localized default; own values survive EN edit/clear. Blank target
removes only that locale label; omitted targets preserve them. Never mirror/delete
legacy EN rows. Shared office_hours remains exact text; only blank schedule uses
four-language default weekdays and same numeric hours. About reader receives locale.

All company_settings generic Translation paths now retire: active text has dedicated
Settings controls and stat labels have no public consumer. Redirect old review to
Settings, block single/bulk/generation and exclude inbox/entitymatrix. Preserve
legacy data. Other types/global Translations remain pending. Globals cachev6,
existing revalidation, no PagePublish/SEO/content changes, no kernel API change.
