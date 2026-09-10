import { Container } from "@core/ui";
import {
  AVANTIO_FRAMEWORK_SRC,
  AVANTIO_JQUERY_SRC,
  LOAD_FRAMEWORK_BUNDLE,
  AVANTIO_WIDGET_STYLESHEETS,
  getAvantioSearchBar,
} from "../../server/avantio-widget";
import { AvantioSearchBarClient } from "./avantio-search-bar-client";

/**
 * Avantio availability search bar (vendor doc: `docs/Widget Externo Avantio.pdf`).
 *
 * Server half: fetches the localized widget through the ISR-cached reader and renders the
 * vendor's two stylesheets. React 19 hoists `<link rel="stylesheet">` and `<meta>` into
 * `<head>`, which is what the doc's step 1 asks for, without touching the app layout — and it
 * keeps the cost on the pages that actually show the widget. The client half mounts the markup
 * and replays the scripts.
 *
 * Renders nothing when Avantio is unreachable, so a vendor outage degrades to a missing
 * section instead of a failed build.
 *
 * The widget arrives with Avantio's own styling (`flexible-search.css` plus the two sheets
 * below), so it does not yet match the Warm Editorial palette. Restyling it is a separate,
 * deliberate task — see `docs/specs/avantio-search-widget.md`.
 */
export async function AvantioSearchBar({ locale }: { locale: string }) {
  const widget = await getAvantioSearchBar(locale);
  if (!widget) return null;

  return (
    <section className="border-b border-line bg-surface py-6 md:py-8" data-avantio="search-bar">
      {/* Hoisted into <head> by React 19 — the integration doc's step 1. */}
      <meta name="avantio-integration" content="FrameworkITS" />
      {AVANTIO_WIDGET_STYLESHEETS.map((href) => (
        <link key={href} rel="stylesheet" href={href} />
      ))}
      <Container>
        <AvantioSearchBarClient
          html={widget.html}
          scripts={widget.scripts}
          jquerySrc={AVANTIO_JQUERY_SRC}
          frameworkSrc={LOAD_FRAMEWORK_BUNDLE ? AVANTIO_FRAMEWORK_SRC : undefined}
        />
      </Container>
    </section>
  );
}
