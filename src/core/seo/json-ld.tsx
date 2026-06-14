/**
 * Renders a JSON-LD `<script>` from a builder's output (kernel — `core/seo`).
 * Server component; the payload is produced by typed builders in `./jsonld`.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // Builder output is our own structured data, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
