"use client";

import { useEffect, useRef, useState } from "react";
import type { AvantioScript } from "../../server/avantio-widget";

/**
 * Mounts the Avantio search widget and brings it to life.
 *
 * Assigning markup through `innerHTML` leaves its `<script>` tags inert, so the server module
 * hands us the markup and the scripts separately and we replay them here, in order, after the
 * form exists in the DOM. Sequencing matters and is the whole point of this island:
 *
 *   1. `window.CRS_DOMAIN` — `includeJs.php` sets it before anything else reads it.
 *   2. the form markup, so the helpers in step 4 have `#formBusquedaAlquileres` to bind to.
 *   3. jQuery 3.4.1 — the vendor pins this exact build. Loaded explicitly because the branch
 *      that would have injected it uses `document.write`, which we refuse to run.
 *   4. every fetched script in document order, awaiting each external one so `xajax.js` cannot
 *      execute before the inline block that defines `xajaxRequestUri`.
 *   5. optionally the Avantio framework bundle. It is off by default — see
 *      `LOAD_FRAMEWORK_BUNDLE` in `server/avantio-widget.ts` for why.
 *
 * Runs once per mount and is idempotent across React strict-mode double-effects. Shared script
 * URLs are de-duplicated globally, so a second widget on the same page reuses them.
 */

/** Resolves when `src` has loaded. Repeat calls for the same URL share one promise. */
const loading = new Map<string, Promise<void>>();

function loadScript(src: string): Promise<void> {
  const cached = loading.get(src);
  if (cached) return cached;

  const promise = new Promise<void>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${CSS.escape(src)}"]`);
    if (existing?.dataset.avantioLoaded === "true") {
      resolve();
      return;
    }
    const el = document.createElement("script");
    el.src = src;
    el.async = false; // preserve execution order across sequential loads
    el.dataset.avantioLoaded = "false";
    // A blocked or missing dependency must not wedge the chain — resolve either way and let
    // the widget degrade to a plain form rather than hanging half-initialised.
    el.onload = () => {
      el.dataset.avantioLoaded = "true";
      resolve();
    };
    el.onerror = () => resolve();
    document.body.appendChild(el);
  });

  loading.set(src, promise);
  return promise;
}

/** Re-create an inline block so the browser actually evaluates it. */
function runInline(code: string): void {
  const el = document.createElement("script");
  el.textContent = code;
  document.body.appendChild(el);
}

export function AvantioSearchBarClient({
  html,
  scripts,
  jquerySrc,
  frameworkSrc,
}: {
  html: string;
  scripts: AvantioScript[];
  jquerySrc: string;
  /** Omitted by default; see `LOAD_FRAMEWORK_BUNDLE`. */
  frameworkSrc?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (startedRef.current) return;
    const container = containerRef.current;
    if (!container) return;
    startedRef.current = true;

    let cancelled = false;

    void (async () => {
      const w = window as unknown as { CRS_DOMAIN?: string; jQuery?: unknown };
      w.CRS_DOMAIN ??= "crs.avantio.com";

      container.innerHTML = html;
      setReady(true);

      if (!w.jQuery) await loadScript(jquerySrc);
      if (cancelled) return;

      for (const script of scripts) {
        if (cancelled) return;
        if (script.src) await loadScript(script.src);
        else if (script.code) runInline(script.code);
      }
      if (cancelled) return;

      if (frameworkSrc) void loadScript(frameworkSrc);
    })();

    return () => {
      cancelled = true;
    };
  }, [html, scripts, jquerySrc, frameworkSrc]);

  return (
    <div
      // The id the vendor's integration doc requires; some of its scripts look for it.
      id="miniformulario_slider"
      ref={containerRef}
      // Reserve height before the markup lands so the section below the hero does not jump.
      style={ready ? undefined : { minHeight: 96 }}
    />
  );
}
