# ADR0069 — Geography names in four inputs

2026-11-07. Accepted for authorized local implementation.

City and inline neighbourhood names use EN/ES/PT/FR fields in one existing Save
form, like Amenities. Reuse translation rows: targets saved manually approved,
blank target clears only its name for EN fallback; omitted payload preserves old
clients. Read raw pending/authored inputs. Share identities, slugs, image/physical
data; only labels change by active locale in selectors and public consumers.

Preserve existing per-locale slug rows on saves that do not edit the sole shared
slug field; create initializes four equal slugs and real shared edits retain the
old behavior. Omit unchanged city intro writes; actual EN intro edits use existing
source-only clear option to retain prior target intro data. No intro translation
fields or migration. Return optional neighbourhoodIds in successful Save so UI
keeps freshly created row identities on subsequent saves.

Geography's existing public locale readers and GEO cache invalidation remain
authoritative; no Building/Guide republishing or document changes. Generic
Translation retirement is deferred (city intro coverage is outside this change).
