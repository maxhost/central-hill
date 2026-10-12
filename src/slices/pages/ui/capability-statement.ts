import { isDocumentMime } from "@core/media/mime";

/**
 * Where the Real Estate hero's secondary button points (spec real-estate-admin-editor S4).
 * Pure, so it is unit-testable.
 *
 * Only an uploaded **PDF** with a URL becomes the link (opened in a new tab); anything else —
 * no asset, an unresolved id, or a non-PDF row picked before the field took `document` — keeps
 * the design's in-page `#deal-enquiry` anchor (`null` here).
 */
export function capabilityStatementHref(
  m: { url?: string | null; mime?: string | null } | undefined,
): string | null {
  return m?.url && isDocumentMime(m.mime) ? m.url : null;
}
