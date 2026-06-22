import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@core/db/client";
import { loadMedia, mediaUrl } from "@core/media";
import type { AdminMediaPreview } from "@slices/backoffice/contract";
import { listFaqGroups } from "@slices/faq/contract";
import { page_content } from "../schema";
import { type PageKey, pageKey, pageSchemas } from "../schemas";
import { type FieldNode, type SelectOptions, applyDefaults, describe } from "./form-model";

/**
 * Backoffice reads for slice `pages` (S12, ADR 0012). The five fixed pages each
 * keep their **source** content in `page_content.data` (jsonb) — so editing is just
 * reading that object; no translation-table reads (targets are S14's job). Not
 * cache-wrapped (admin is dynamic).
 */

export const PAGE_KEYS = pageKey.options as readonly PageKey[];

export interface PageAdminListItem {
  key: PageKey;
  /** Whether the page row has been created (authored) yet. */
  exists: boolean;
}

/** The five fixed pages (pages are always live — no draft/published state). */
export async function listPagesAdmin(): Promise<PageAdminListItem[]> {
  const rows = await db.select({ key: page_content.key }).from(page_content);
  const present = new Set(rows.map((r) => r.key));
  return PAGE_KEYS.map((key) => ({ key, exists: present.has(key) }));
}

export interface PageEditBundle {
  key: PageKey;
  data: Record<string, unknown>;
  ogImageMediaId: string | null;
  previews: Record<string, AdminMediaPreview>;
}

/** The editable record for one page (its source `data` + og image + previews). */
export async function getPageForEdit(key: PageKey): Promise<PageEditBundle> {
  const [row] = await db.select().from(page_content).where(eq(page_content.key, key)).limit(1);
  const data = (row?.data as Record<string, unknown>) ?? {};
  const ogImageMediaId = row?.og_image_media_id ?? null;

  const ids = collectMediaIds(data);
  if (ogImageMediaId) ids.push(ogImageMediaId);
  const previews = await resolvePreviews(ids);

  return {
    key,
    data,
    ogImageMediaId,
    previews,
  };
}

/** Recursively gather every `*_media_id` string value in a data object. */
function collectMediaIds(value: unknown, key = ""): string[] {
  const out: string[] = [];
  if (typeof value === "string") {
    if (key.endsWith("_media_id") && value) out.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) out.push(...collectMediaIds(item, key));
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) out.push(...collectMediaIds(v, k));
  }
  return out;
}

export interface PageEditModel extends PageEditBundle {
  /** The schema-derived field tree the editor renders (computed server-side so Zod
   *  stays out of the client bundle). `data` is scaffolded with defaults. */
  rootNode: FieldNode;
  /** Dropdown catalogues for `select` leaves (e.g. `faq_group` → FAQ groups). */
  options: SelectOptions;
}

/** Edit bundle + the page's `FieldNode` tree (data scaffolded), or null on bad key. */
export async function getPageEditModel(rawKey: string): Promise<PageEditModel | null> {
  const parsed = pageKey.safeParse(rawKey);
  if (!parsed.success) return null;
  const key = parsed.data;
  const bundle = await getPageForEdit(key);
  const rootNode = describe(pageSchemas[key]);
  const data = applyDefaults(rootNode, bundle.data) as Record<string, unknown>;
  const options = await buildSelectOptions();
  return { ...bundle, rootNode, data, options };
}

/**
 * Build the dropdown catalogues for `select` leaves. The FAQ-group list comes from the
 * `faq` slice contract (golden rule 2 — cross-slice reads via contracts only); the admin
 * authors source content, so we read the source locale `en`. A group with 0 published
 * items is still selectable (the page just renders nothing until items go live), flagged
 * in the label.
 */
async function buildSelectOptions(): Promise<SelectOptions> {
  const groups = await listFaqGroups("en");
  return {
    faq_group: groups.map((g) => ({
      value: g.key,
      label: g.publishedCount > 0 ? `${g.key} (${g.publishedCount})` : `${g.key} (no live items)`,
    })),
  };
}

async function resolvePreviews(ids: string[]): Promise<Record<string, AdminMediaPreview>> {
  const clean = Array.from(new Set(ids.filter(Boolean)));
  if (clean.length === 0) return {};
  const assets = await loadMedia(clean);
  const out: Record<string, AdminMediaPreview> = {};
  for (const [mid, a] of assets) {
    out[mid] = { id: mid, url: mediaUrl(a.r2_key), width: a.width, height: a.height, mime: a.mime };
  }
  return out;
}
