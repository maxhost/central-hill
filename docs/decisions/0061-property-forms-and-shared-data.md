# ADR0061 — Property forms, independent language text and live shared data

2026-11-06. User explicitly corrects the previous visual editor and snapshot
policy. Keep language tabs with explicit per-language publication. English fills
untranslated workspaces until first localized edit; customized languages never
follow later English edits. SEO and booking overrides are localized. Images and
physical data are unique shared values and update ALL languages on Save, including
already public content, as explicitly confirmed by the user.

Use existing forms and MediaField controls; no canvas/embedded preview. Add
localeMode metadata to version1 locale envelopes. Existing localized/pending rows
and old edited snapshots remain owned conservatively. No GET initialization.

Add owned building_shared_content/apartment_shared_content tables, versioned
shared JSON + monotonic revision/actor. This avoids mixing shared live state with
a locale's draft/publication and enables CAS without rewriting other languages.
Shared Save and locale draft Save commit atomically under the existing graph lock.
Mirror neutral legacy columns/relations for operational guards. Old envelopes'
shared references remain preserved but are superseded by shared state at read time.
Without a shared row, derive a read-only public baseline from ENpublication (or
first publication/legacy) and preserve old ENdraft common edits privately.

No public locale fallback/publication is introduced: each language still needs
explicit Publish. Publish EN cannot change PTtext/SEO; shared Save can change
photos/specifications everywhere. No new public apartment route. Migration0026 is
additive and will only be applied to an explicitly authorized synthetic DB.
Implementation ownership/contracts/verification: property-form-editors-execution.md.

Later user correction: Building archive is reversible visibility only. Archived
Buildings remain editable; Save retains archive, Restore uses previous publication
without consuming drafts, and explicit Publish activates identity with the selected
locale. Archive/Restore are prominent in the form toolbar. See
building-status-form-correction.md for implementation ownership/acceptance.
