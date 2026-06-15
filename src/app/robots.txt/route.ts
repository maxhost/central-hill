import { buildRobots } from "@slices/seo/contract";

/** `robots.txt` (S13 / ADR 0020) — fully static; references the sitemap index. */
export const dynamic = "force-static";

export function GET() {
  return new Response(buildRobots(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
