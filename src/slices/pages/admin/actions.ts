"use server";

import { eq } from "drizzle-orm";
import { guidesSchema, type GuidesContent } from "../schemas/guides";
import { guidesMediaErrors, guidesMediaReferences } from "./guides-media-validation";
import { loadMedia } from "@core/media";
import { uuid } from "@core/validation/primitives";
import type { ServicesContent } from "../schemas/services";
import { servicesMediaErrors, servicesMediaReferences } from "./services-media-validation";
import { requireStaff } from "@core/auth";
import { db } from "@core/db/client";
import { page_content } from "../schema";
import { pageKey, pageSchemas } from "../schemas";
import { revalidatePage } from "../server/publish";
import { saveBlog } from "./blog-save";
import type { BlogContent } from "../schemas/blog";
import { saveAbout } from "./about-save";
import type { AboutContent } from "../schemas/about";

/**
 * Backoffice write action for slice `pages` (S12, ADR 0012). The page's source
 * content is the `data` jsonb, validated against its **fixed per-page schema** — the
 * single source of truth for shape. Blog and About atomically sync source fields
 * through the i18n contract; target locales remain S14's responsibility. On success the page's ISR tag + localized
 * paths are revalidated. `requireStaff`-gated + re-validated.
 */

export type PageSaveResult =
  | { ok: true; revision?: string }
  | { ok: false; error: "validation"; fieldErrors: Record<string, string> }
  | { ok: false; error: "bad_key" }
  | { ok: false; error: "conflict" }
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
  payload: { data: unknown; og_image_media_id: string | null; revision?: string },
): Promise<PageSaveResult> {
  const staff = await requireStaff();

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
    if (key === "blog") {
      const result = await saveBlog(dataParsed.data as BlogContent, ogImage, staff.userId);
      if (result.ok) revalidatePage("blog");
      return result;
    }
    if (key === "about") {
      const result = await saveAbout(dataParsed.data as AboutContent, ogImage, payload.revision, staff.userId);
      if (result.ok) revalidatePage("about");
      return result;
    }
    if (key === "guides") {
      // A stale editor must not silently replace a newly corrupted persisted row.
      const [existing] = await db.select({ data: page_content.data }).from(page_content).where(eq(page_content.key, "guides")).limit(1);
      if (existing && !guidesSchema.safeParse(existing.data).success) {
        return { ok: false, error: "validation", fieldErrors: { _source: "The saved Guides content is invalid. Repair it before saving." } };
      }
      if (ogImage && !uuid.safeParse(ogImage).success) {
        return { ok: false, error: "validation", fieldErrors: { og_image_media_id: "Select an uploaded image." } };
      }
      const content = dataParsed.data as GuidesContent;
      const references = guidesMediaReferences(content, ogImage);
      const assets = await loadMedia(references.map((ref) => ref.id));
      const fieldErrors = guidesMediaErrors(content, ogImage, assets);
      if (Object.keys(fieldErrors).length) return { ok: false, error: "validation", fieldErrors };
    }
    if (key === "services") {
      if (ogImage && !uuid.safeParse(ogImage).success) {
        return { ok: false, error: "validation", fieldErrors: { og_image_media_id: "Select an uploaded still image." } };
      }
      const content = dataParsed.data as ServicesContent;
      const ids = servicesMediaReferences(content, ogImage).map((ref) => ref.id);
      const assets = await loadMedia(ids);
      const fieldErrors = servicesMediaErrors(content, ogImage, assets);
      if (Object.keys(fieldErrors).length) return { ok: false, error: "validation", fieldErrors };
    }
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
