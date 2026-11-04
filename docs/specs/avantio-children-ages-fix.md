# Avantio children-ages panel — 2026-11-04

User authorized restoring the children-age panel after source inspection found a missing
framework dependency. Local delivery only, main base `0547d67`; root handles this small
Settings-only correction. Pre-existing untracked Central Hill base-logo PNG is untouched.
No database changes or new dependencies are included. After local delivery, the user
replied "Listo" and explicitly authorized committing/pushing to `maxhost/central-hill`.
Use the supplied token transiently; saved credentials remain unchanged. No additional
automatic tests or browser QA are included in publication. Resolve the final commit via
`git log -1` and check its GitHub/Vercel status rather than assuming deployment success.

## Cause

`formulario_miniselects.js` receives the age fields from `gestorEdadesNinyos.php` and
calls `abroPopupNinyosWebPlus` in FrameworkITS mode (set by our integration meta).
That callback is defined in `its--scripts.js`, deliberately disabled because of its
cookie errors and automatic consent cookie. The earlier assessment that the entire
framework was unnecessary missed the children-age callback.

## Local change

- New Settings-internal `ui/components/avantio-children-ages.ts` registers the expected
  global callback before widget scripts load. It displays the returned fields in the
  original form, preserves their names/IDs/options and uses Avantio's `validaEdades`.
- The existing OK label becomes a native non-submit button. Outside click or Escape
  dismisses the panel; OK validates first and returns focus to Children. Hidden controls
  remain serialized. Click Children again or press Enter to reopen the same count.
- When count changes, matching previous ages survive; a response for a different count
  is ignored. Clearing Children removes age fields and resets `EdadesNinyos`.
- `avantio-search-bar-client.tsx` installs/removes the hook with its effect; removes the
  one-shot ref that previously prevented initialization after Strict Mode cleanup.
- `avantio-styles.ts` positions the panel below Children, bounds it to the viewport width,
  preserves the current palette and provides an explicit hidden state/button focus ring.
- Corrected comments in `server/avantio-widget.ts`, Settings README and original spec.
  `LOAD_FRAMEWORK_BUNDLE` stays false. No public contract, cache, SEO or locale changes;
  labels and age options continue coming from the provider in EN/PT/ES/FR.

## Review boundary

Per the user's existing instructions, no automatic tests, build/typecheck/lint suites,
browser QA, searches, reservations or newsletter submissions run. Implementation/source
review only; runtime behavior awaits user review at `http://localhost:3071/en`.

User review: choose one or more children and enter ages, confirm with OK, reopen, change
the count, dismiss with Escape/outside click, then clear Children. No Search click is
needed to review this panel. No runtime verification claim is made here.
