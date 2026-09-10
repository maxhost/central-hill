import "server-only";
import { AVANTIO_LOCALES } from "../booking";

/**
 * Avantio "barra de pesquisa" external search widget (vendor doc:
 * `docs/Widget Externo Avantio.pdf`, account `bk_centralhill`).
 *
 * The vendor ships PHP: `echo file_get_contents_curl(<form url>)` inside a
 * `<div id="miniformulario_slider">`, plus `echo file_get_contents_curl(<includeJs url>)`
 * before `</body>`. This module is the Next.js equivalent — it fetches both documents on the
 * server (ISR-cached, so the public page never blocks on Avantio at request time) and hands
 * the client island a ready-to-mount payload.
 *
 * Four things the raw vendor markup gets wrong outside of `www.centralhill.pt`, all fixed here:
 *
 * 1. **The form action is root-relative** (`/formularioMiniOptimized.php`). On our domain that
 *    posts to our own origin, and even on theirs the root path is a 404 — only the
 *    language-segment path resolves. Rewritten to the absolute segment URL.
 * 2. **Inline `<script>` never runs** when markup is assigned through `innerHTML`, so the xajax
 *    configuration that powers the search button would silently not exist. The scripts are
 *    extracted here and replayed by the island in document order.
 * 3. **`includeJs.php` is built around `document.write`**, which erases the whole document when
 *    it runs after parsing. Only its real `<script src>` tags are kept; the `document.write`
 *    branches are dropped, and jQuery (the one that branch would have injected) is loaded
 *    explicitly instead.
 * 4. **An `alert()` debug timer** ships inside the fragment — it pops a native dialog on the
 *    marketing homepage if xajax is slow. Dropped.
 *
 * Cross-origin is fine: both endpoints answer `Access-Control-Allow-Origin: *`, so the widget's
 * xajax calls work from the Vercel domain as well as from production.
 */

/** Avantio's per-language path segment. The form only exists under these, never at the root. */
const SEGMENT: Record<(typeof AVANTIO_LOCALES)[number], string> = {
  es: "alquiler",
  en: "rentals",
  fr: "location",
  pt: "aluguer",
};

const BASE = "https://www.centralhill.pt";
const ACCOUNT = "bk_centralhill";

/** Stylesheets the vendor asks for in `<head>` (step 1 of the integration doc). */
export const AVANTIO_WIDGET_STYLESHEETS = [
  `https://crs.avantio.com/datosBroker/${ACCOUNT}/css/formulario-style.css`,
  "https://fwk.avantio.com/assets/core-7.0/fonts/fontlibrary/css/fontlibrary.css",
] as const;

/** jQuery build the widget requires; `includeJs.php` `document.write`s this same URL. */
export const AVANTIO_JQUERY_SRC = "https://crs.avantio.com/default/js/jquery-3.4.1.min.js";

/**
 * Framework bundle the vendor appends before `</body>` (step 4) — **deliberately not loaded.**
 *
 * The search bar does not need it: `enviaForm` / `validaForm`, the two functions the search
 * button calls, come from `formulario_miniselects.js`, and everything this bundle adds targets
 * elements we do not render — Avantio's own cookie banner (`#its--container_cook`), a Bootstrap
 * popover, a `#multimoneda` currency dropdown, and a parallax that requires
 * `#miniformulario_slider.enable`.
 *
 * It also misbehaves here. It calls `jQuery.cookie`, a plugin the bundle does not ship, so it
 * throws `jQuery.cookie is not a function` on load. Supplying the plugin silences the error but
 * then `guarda_cookie()` runs and writes `acepta_cookie=acepta` with a 360-day expiry — Avantio
 * accepting its own cookie notice on the visitor's behalf, on our domain, with no prompt. That
 * is a consent decision for a Portugal/EU site to make deliberately, not a side effect of a
 * search widget.
 *
 * Flip `LOAD_FRAMEWORK_BUNDLE` to re-enable it; `jQuery.cookie` must then be loaded first.
 * See `docs/specs/avantio-search-widget.md`.
 */
export const AVANTIO_FRAMEWORK_SRC = "https://fwk.avantio.com/assets/core-7.0/js/its--scripts.js";
export const LOAD_FRAMEWORK_BUNDLE = false;

/** Re-fetch Avantio at most once a day; the markup is a static form, not live inventory. */
const REVALIDATE_SECONDS = 86_400;

/** One `<script>` from the fetched markup: either an external `src` or an inline body. */
export interface AvantioScript {
  src?: string;
  code?: string;
}

export interface AvantioWidget {
  /** Form markup with the action absolutised and every `<script>` stripped out. */
  html: string;
  /** Scripts to replay, in the order they must execute. */
  scripts: AvantioScript[];
}

/** Map any app locale onto an Avantio language, falling back to English like `booking.ts`. */
function avantioLang(locale: string): (typeof AVANTIO_LOCALES)[number] {
  return (AVANTIO_LOCALES as readonly string[]).includes(locale)
    ? (locale as (typeof AVANTIO_LOCALES)[number])
    : "en";
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

const SCRIPT_RE = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const SRC_RE = /\bsrc\s*=\s*["']([^"']+)["']/i;

/**
 * Pull every `<script>` out of `markup`, returning the script-free markup alongside the
 * scripts in document order. `document.write` bodies are discarded (they would blow away the
 * page), as is the vendor's `alert()` debug timer.
 */
function extractScripts(markup: string): { html: string; scripts: AvantioScript[] } {
  const scripts: AvantioScript[] = [];
  const html = markup.replace(SCRIPT_RE, (_full, attrs: string, body: string) => {
    const src = SRC_RE.exec(attrs)?.[1];
    if (src) {
      scripts.push({ src });
      return "";
    }
    const code = body.trim();
    if (code && !code.includes("document.write") && !code.includes("alert(")) {
      scripts.push({ code });
    }
    return "";
  });
  return { html, scripts };
}

/**
 * The localized search bar, or `null` when Avantio is unreachable — the caller then renders
 * nothing rather than failing the build or shipping a broken widget.
 */
export async function getAvantioSearchBar(locale: string): Promise<AvantioWidget | null> {
  const lang = avantioLang(locale);
  const segment = SEGMENT[lang];
  const formUrl =
    `${BASE}/${segment}/formularioMiniOptimized.php` +
    `?bk=${ACCOUNT}&Idioma=${lang.toUpperCase()}&Fajax=1&formato=1`;
  const includeJsUrl = `${BASE}/${segment}/includeJs.php?bk=${ACCOUNT}&tipo=formulario`;

  const [rawForm, rawIncludeJs] = await Promise.all([
    fetchText(formUrl),
    fetchText(includeJsUrl),
  ]);
  if (!rawForm) return null;

  const { html, scripts } = extractScripts(rawForm);

  // `includeJs.php` contributes the widget's runtime helpers. Only its real `<script src>` tags
  // survive extraction — the jQuery and autosuggest branches live inside `document.write`
  // strings and are dropped, jQuery being loaded explicitly by the island instead.
  const runtime = rawIncludeJs ? extractScripts(rawIncludeJs).scripts.filter((s) => s.src) : [];

  return {
    // Absolutise the form target: the root path 404s, only the segment path resolves.
    html: html.replace(
      /\baction\s*=\s*["']\/formularioMiniOptimized\.php["']/i,
      `action="${BASE}/${segment}/formularioMiniOptimized.php"`,
    ),
    // Fragment scripts first (they define `xajaxRequestUri` and the xajax bridge), then the
    // helpers that bind behaviour to the form that is now in the DOM.
    scripts: [...scripts, ...runtime],
  };
}
