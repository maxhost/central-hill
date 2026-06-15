import { buildLlmsFullTxt } from "@slices/seo/contract";

/** `llms-full.txt` (S13 / ADR 0020, GEO) — every public entity URL by section. */
export const revalidate = 86_400;

export async function GET() {
  return new Response(await buildLlmsFullTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
