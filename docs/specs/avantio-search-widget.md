# Spec — Avantio search bar on the Home page

> **Vendor doc:** `docs/Widget Externo Avantio.pdf` (account `bk_centralhill`)
> **Slice:** `settings` (owns Avantio config and `booking.ts`) · **Consumer:** `pages` (Home)
> **Status:** ✅ IMPLEMENTED (2026-09-10)

---

## 1. What was asked

Put Avantio's availability search bar ("barra de pesquisa") on the Home page, directly below
the hero.

## 2. Why the vendor instructions could not be followed literally

The PDF is written for a PHP site served from `www.centralhill.pt`. It says: fetch a PHP
endpoint server-side with cURL, `echo` the result inside `<div id="miniformulario_slider">`,
then `echo` a second endpoint before `</body>`. Four things in that recipe break on a Next.js
app served from another origin. Each was verified against the live endpoints, not assumed.

| # | Problem | Evidence | Fix |
|---|---|---|---|
| 1 | The form's `action` is root-relative, `/formularioMiniOptimized.php` | That path returns **404**; only the language-segment path returns 200 | Rewrite to the absolute segment URL server-side |
| 2 | Inline `<script>` does not execute when markup is assigned via `innerHTML` | The fragment carries the `xajaxRequestUri` config the search button depends on | Extract the scripts server-side, replay them in the client island in document order |
| 3 | `includeJs.php` is built on `document.write` | It `document.write`s jQuery and, conditionally, jQuery-UI — `document.write` after parsing erases the document | Keep only its real `<script src>` tags; load jQuery 3.4.1 explicitly instead |
| 4 | The fragment ships an `alert()` debug timer | Pops a native dialog on the homepage if xajax is slow to load | Dropped during extraction |

**Cross-origin was the main risk and it is not a problem.** Both endpoints answer
`Access-Control-Allow-Origin: *`, so the widget's xajax calls to `gestorFormulario.php` work
from the Vercel domain exactly as they will from production.

## 3. Implementation

```
src/slices/settings/server/avantio-widget.ts              fetch + transform (server-only, ISR)
src/slices/settings/ui/components/avantio-search-bar.tsx        server half: <head> tags + shell
src/slices/settings/ui/components/avantio-search-bar-client.tsx client half: mount + script order
src/slices/settings/contract.ts                           exports AvantioSearchBar
src/slices/pages/ui/home-page.tsx                         renders it below <PageHero>
```

- **Fetching** happens on the server with `next: { revalidate: 86400 }`, so the public page
  never blocks on Avantio at request time and the markup is baked into the ISR output.
- **`<head>` tags** (the `avantio-integration` meta and the two vendor stylesheets) are rendered
  by the component itself; React 19 hoists them into `<head>`. This keeps the app layout
  untouched and confines the cost to pages that actually show the widget.
- **Script order** is the whole job of the client island: `CRS_DOMAIN` → markup →
  jQuery 3.4.1 → fetched scripts in document order (awaiting each external one, so `xajax.js`
  cannot run before the inline block that defines `xajaxRequestUri`) → optional framework bundle.
- **Localisation** maps each app locale to Avantio's own path segment and language code:
  `es → alquiler/ES`, `en → rentals/EN`, `fr → location/FR`, `pt → aluguer/PT`, falling back to
  English like `booking.ts` does.
- **Failure** returns `null` and the section renders nothing, so an Avantio outage degrades to a
  missing search bar rather than a failed build.

## 4. The framework bundle is deliberately not loaded

The vendor's step 4 appends `its--scripts.js`. It is **off** (`LOAD_FRAMEWORK_BUNDLE = false`),
for two reasons.

It throws. The bundle calls `jQuery.cookie` but does not ship the plugin, so it raised
`Uncaught TypeError: jQuery.cookie is not a function` on every home page load.

Supplying the plugin fixes the error but starts a worse one. The call site is Avantio's own
cookie-consent banner, and the branch that then runs is `guarda_cookie()`:

```js
jQuery.cookie("acepta_cookie", "acepta", { expires: 360, path: "/", secure: secureCookie })
```

That writes a 360-day "consent accepted" cookie on our domain, with no prompt, for a banner
element (`#its--container_cook`) this site never renders. For a Portugal/EU business that is a
consent decision to take deliberately, not a side effect of adding a search widget.

Nothing is lost. The search button calls `validaForm()` and `enviaForm()`, both defined by
`formulario_miniselects.js`, which **is** loaded. The rest of the bundle targets elements we do
not render: a Bootstrap popover, a `#multimoneda` currency dropdown, and a parallax gated on
`#miniformulario_slider.enable` (our container has no `.enable` class).

Re-enable it by flipping the constant — and load `jquery.cookie` first if you do.

## 5. Verification performed

Driven in a real headless Chrome against the production build, on `/en` and `/pt`:

| Check | Result |
|---|---|
| Document survives (no `document.write` wipe) | yes |
| Form present in the DOM, input count | yes, 62 |
| Form action | absolute, correct per-locale segment |
| jQuery version | 3.4.1 |
| `xajaxLoaded` / `xajaxRequestUri` | `true` / correct per-locale endpoint |
| `validaForm` / `enviaForm` | both defined |
| Console errors and uncaught exceptions | **none** |

Also confirmed: the meta and both stylesheets land inside `<head>` in the built HTML; the four
locales resolve to their own Avantio segments; the `alert()` timer is absent from the output.
`pnpm typecheck`, `pnpm lint` and a full production build are green, and a screenshot confirms
the bar renders between the hero and the stats band.

## 6. Known follow-ups (not done here)

1. **Visual harmonisation.** The widget arrives with Avantio's stylesheets, so the search button
   is their teal rather than the Warm Editorial terracotta. Restyling means overriding vendor
   CSS and is a deliberate design task, not a side effect of the integration.
2. **Hardcoded account.** `bk_centralhill` and the `www.centralhill.pt` base live in the module.
   `company_settings` already has `avantio_account_id` and `avantio_widget_config`; moving them
   there would make the widget configurable from `/admin/settings`.
3. **Other pages.** The component takes only a `locale`, so dropping it on Buildings or the
   Guests landing is a one-line change if wanted.

For reference, the PDF's booking-engine links use per-language paths
(`/alquiler/…`, `/aluguer/…`) while `booking.ts` builds `/{lang}/rentals/…`. Both forms were
checked and **both return 200**, so no change is needed.
