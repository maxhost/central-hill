import { Container } from "@core/ui";
import {
  AVANTIO_FRAMEWORK_SRC,
  AVANTIO_JQUERY_SRC,
  LOAD_FRAMEWORK_BUNDLE,
  getAvantioSearchBar,
} from "../../server/avantio-widget";
import { AvantioSearchBarClient } from "./avantio-search-bar-client";
import { AVANTIO_STYLE } from "./avantio-styles";

/**
 * Avantio availability search bar (vendor doc: `docs/Widget Externo Avantio.pdf`), restyled to
 * Warm Editorial and floated on the hero / stats-band seam.
 * Specs: `docs/specs/avantio-search-widget.md`, `docs/specs/avantio-search-widget-restyle.md`.
 *
 * Server half: fetches the localized widget through the ISR-cached reader, then lays out the
 * cascade by hand. React 19 hoists `<link rel="stylesheet">` into `<head>` — the integration
 * doc's step 1 — while a plain `<style>` stays put in the body, so rendering all three vendor
 * sheets here and `AVANTIO_STYLE` after them puts our overrides last in document order and lets
 * them win on order rather than on `!important`. The third sheet used to ride inside the fetched
 * fragment and get injected at mount, landing after everything; the server module now strips it
 * and hands it back as data, which also removes the flash of unstyled widget.
 *
 * Renders nothing when Avantio is unreachable, so a vendor outage degrades to a missing section
 * instead of a failed build.
 */
export async function AvantioSearchBar({ locale }: { locale: string }) {
  const widget = await getAvantioSearchBar(locale);
  if (!widget) return null;

  return (
    // The seam overlap lives in AVANTIO_STYLE next to the card metrics it is derived from, so
    // the offset and the height it is half of cannot drift apart.
    <section data-avantio="search-bar">
      {/* Hoisted into <head> by React 19 — the integration doc's step 1. */}
      <meta name="avantio-integration" content="FrameworkITS" />
      {widget.stylesheets.map((href) => (
        <link key={href} rel="stylesheet" href={href} />
      ))}
      <style dangerouslySetInnerHTML={{ __html: AVANTIO_STYLE }} />
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
