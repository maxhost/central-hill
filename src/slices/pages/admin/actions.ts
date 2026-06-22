"use server";

import { requireStaff } from "@core/auth";
import { db } from "@core/db/client";
import { page_content } from "../schema";
import { pageKey, pageSchemas } from "../schemas";
import { revalidatePage } from "../server/publish";

/**
 * Backoffice write action for slice `pages` (S12, ADR 0012). The page's source
 * content is the `data` jsonb, validated against its **fixed per-page schema** — the
 * single source of truth for shape. No translation-table writes: source lives in
 * `data`; target locales are S14's job. On success the page's ISR tag + localized
 * paths are revalidated. `requireStaff`-gated + re-validated.
 */

export type PageSaveResult =
  | { ok: true }
  | { ok: false; error: "validation"; fieldErrors: Record<string, string> }
  | { ok: false; error: "bad_key" }
  | { ok: false; error: "server" };

function fieldErrorsFrom(
  issues: readonly { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

export async function savePage(
  rawKey: string,
  payload: { data: unknown; og_image_media_id: string | null },
): Promise<PageSaveResult> {
  await requireStaff();

  const keyParsed = pageKey.safeParse(rawKey);
  if (!keyParsed.success) return { ok: false, error: "bad_key" };
  const key = keyParsed.data;

  const dataParsed = pageSchemas[key].safeParse(payload.data);
  if (!dataParsed.success) {
    return { ok: false, error: "validation", fieldErrors: fieldErrorsFrom(dataParsed.error.issues) };
  }

  const data = dataParsed.data as Record<string, unknown>;
  const ogImage = payload.og_image_media_id || null;

  try {
    await db
      .insert(page_content)
      .values({ key, data, og_image_media_id: ogImage })
      .onConflictDoUpdate({
        target: page_content.key,
        set: { data, og_image_media_id: ogImage, updated_at: new Date() },
      });
    revalidatePage(key);
    return { ok: true };
  } catch {
    return { ok: false, error: "server" };
  }
}
