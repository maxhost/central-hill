import { servicesSchema } from "../schemas/services";
import "server-only";
import { getTranslations } from "next-intl/server";
import { blogEditorDefaults, blogInheritedValues } from "./blog-defaults";
import { aboutEditorDefaults } from "./about-defaults";
import { homeRevision } from "./home-save";
import { homeSchema, type HomeContent } from "../schemas/home";
import { normalizeHome, homeIdentityErrors } from "../home-content";
import { aboutRevision } from "./about-save";
import { eq } from "drizzle-orm";
import { db } from "@core/db/client";
import { loadMedia, mediaUrl } from "@core/media";
import type { AdminMediaPreview } from "@slices/backoffice/contract";
import { listFaqGroups } from "@slices/faq/contract";
import { listServiceCategories } from "@slices/services/contract";
import { page_content } from "../schema";
import { type PageKey, pageKey, pageSchemas } from "../schemas";
import { guidesEditorDefaults, type GuidesSourceStatus } from "./guides-defaults";
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
  pageId?: string;
  inheritedValues?: Record<string, string>;
  revision?: string;
  key: PageKey;
  data: Record<string, unknown>;
  ogImageMediaId: string | null;
  previews: Record<string, AdminMediaPreview>;
  sourceStatus?: GuidesSourceStatus;
  sourceInvalid?: boolean;
}

/** The editable record for one page (its source `data` + og image + previews). */
export async function getPageForEdit(key: PageKey): Promise<PageEditBundle> {
  const [row] = await db.select().from(page_content).where(eq(page_content.key, key)).limit(1);
  const data = (row?.data as Record<string, unknown>) ?? {};
  const ogImageMediaId = row?.og_image_media_id ?? null;

  const editorDefaults = key === "blog" ? blogEditorDefaults(row?.data, Boolean(row)) : key === "guides" ? guidesEditorDefaults(row?.data, Boolean(row)) : key === "about" ? aboutEditorDefaults(row?.data, Boolean(row)) : undefined;
  const homeParsed = key === "home" ? homeSchema.safeParse(row?.data) : undefined;
  const homeData = key === "home" ? normalizeHome(
    (homeParsed?.success ? homeParsed.data : applyDefaults(describe(homeSchema), data)) as HomeContent,
  ) : undefined;
  const homeInvalid = key === "home" && Boolean(row) && (!homeParsed?.success || Boolean(homeData && Object.keys(homeIdentityErrors(homeData)).length));
  const editableData = homeData ?? editorDefaults?.data ?? data;
  const ids = homeInvalid ? [] : collectMediaIds(editableData);
  if (ogImageMediaId && !homeInvalid && !editorDefaults?.sourceInvalid) ids.push(ogImageMediaId);
  const previews = await resolvePreviews(ids);

  const englishBlog = key === "blog" ? await getTranslations({ locale: "en", namespace: "blog" }) : undefined;
  return {
    pageId: row?.id,
    inheritedValues: englishBlog ? blogInheritedValues(englishBlog) : undefined,
    revision: key === "home" ? homeRevision(row) : key === "about" ? aboutRevision(row) : undefined,
    key,
    data: editableData,
    sourceStatus: editorDefaults?.sourceStatus,
    sourceInvalid: homeInvalid || editorDefaults?.sourceInvalid || (key === "services" && Boolean(row) && !servicesSchema.safeParse(row?.data).success),
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
 * Build the dropdown catalogues for `select` leaves. Both lists come from the owning
 * slice's contract (golden rule 2 — cross-slice reads via contracts only); the admin
 * authors source content, so we read the source locale `en`.
 *
 * - `faq_group` — a group with 0 published items is still selectable (the page just
 *   renders nothing until items go live), flagged in the label.
 * - `service_category` — the home services carousel's optional category filter (ADR 0032);
 *   blank means "every published service", so the empty option is not an error state.
 */
async function buildSelectOptions(): Promise<SelectOptions> {
  const [groups, categories] = await Promise.all([
    listFaqGroups("en"),
    listServiceCategories("en"),
  ]);
  return {
    faq_group: groups.map((g) => ({
      value: g.key,
      label: g.publishedCount > 0 ? `${g.key} (${g.publishedCount})` : `${g.key} (no live items)`,
    })),
    service_category: categories.map((c) => ({ value: c.slug, label: c.name })),
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
