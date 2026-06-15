import { buildLlmsTxt } from "@slices/seo/contract";

/**
 * `llms.txt` (S13 / ADR 0020, GEO) — concise markdown digest for answer engines.
 * Static + ISR (cached enumeration, daily fallback; busts on the `sitemap` tag).
 */
export const revalidate = 86_400;

export async function GET() {
  return new Response(await buildLlmsTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
