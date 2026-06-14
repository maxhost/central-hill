import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@core/db/client";
import { type ContentRef, loadContent } from "@core/i18n/content";
import { loadMedia, mediaUrl } from "@core/media";
import type { AdminMediaPreview } from "@slices/backoffice/contract";
import { SERVICE, SERVICE_CATEGORY, type ServiceBookingType } from "../contract";
import { service, service_category, service_media } from "../schema";

/**
 * Backoffice reads for slice `services` (S12). Not cache-wrapped (admin is dynamic)
 * and return **all** statuses + **source-locale** ([T] en) values for editing.
 */

const SOURCE = "en" as const;

type Status = "draft" | "published" | "archived";

// ── Categories ───────────────────────────────────────────────────────────────
export interface ServiceCategoryAdminListItem {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  position: number;
}

/** All service categories (source names), in display order. */
export async function listServiceCategoriesAdmin(): Promise<ServiceCategoryAdminListItem[]> {
  const rows = await db
    .select({
      id: service_category.id,
      slug: service_category.slug,
      icon: service_category.icon,
      position: service_category.position,
    })
    .from(service_category)
    .orderBy(asc(service_category.position));
  if (rows.length === 0) return [];
  const content = await loadContent(
    rows.map((r) => ({ type: SERVICE_CATEGORY, id: r.id })),
    SOURCE,
  );
  return rows.map((r) => ({
    id: r.id,
    name: content.get(SERVICE_CATEGORY, r.id, "name") ?? r.slug,
    slug: r.slug,
    icon: r.icon,
    position: r.position,
  }));
}

export interface ServiceCategoryEditData {
  id: string;
  slug: string;
  icon: string;
  position: number;
  name: string;
}

/** Full editable record for one category (source name), or null. */
export async function getServiceCategoryForEdit(
  id: string,
): Promise<ServiceCategoryEditData | null> {
  const [row] = await db.select().from(service_category).where(eq(service_category.id, id)).limit(1);
  if (!row) return null;
  const content = await loadContent([{ type: SERVICE_CATEGORY, id }], SOURCE);
  return {
    id: row.id,
    slug: row.slug,
    icon: row.icon ?? "",
    position: row.position,
    name: content.get(SERVICE_CATEGORY, id, "name") ?? "",
  };
}

/** Lean `{ id, name }` category options (source names) for the service selector. */
export async function listServiceCategoryOptions(): Promise<{ id: string; name: string }[]> {
  const rows = await db
    .select({ id: service_category.id, slug: service_category.slug })
    .from(service_category)
    .orderBy(asc(service_category.position));
  if (rows.length === 0) return [];
  const content = await loadContent(
    rows.map((r) => ({ type: SERVICE_CATEGORY, id: r.id })),
    SOURCE,
  );
  return rows.map((r) => ({ id: r.id, name: content.get(SERVICE_CATEGORY, r.id, "name") ?? r.slug }));
}

// ── Services ─────────────────────────────────────────────────────────────────
export interface ServiceAdminListItem {
  id: string;
  name: string;
  slug: string;
  status: Status;
  category: string;
  position: number;
}

/** All services (every status), in display order, with category source names. */
export async function listServicesAdmin(): Promise<ServiceAdminListItem[]> {
  const rows = await db
    .select({
      id: service.id,
      slug: service.slug,
      status: service.status,
      category_id: service.category_id,
      position: service.position,
    })
    .from(service)
    .orderBy(asc(service.position));
  if (rows.length === 0) return [];

  const refs: ContentRef[] = rows.flatMap((r) => [
    { type: SERVICE, id: r.id },
    { type: SERVICE_CATEGORY, id: r.category_id },
  ]);
  const content = await loadContent(refs, SOURCE);

  return rows.map((r) => ({
    id: r.id,
    name: content.get(SERVICE, r.id, "name") ?? r.slug,
    slug: r.slug,
    status: r.status,
    category: content.get(SERVICE_CATEGORY, r.category_id, "name") ?? "",
    position: r.position,
  }));
}

export interface ServiceEditData {
  id: string;
  slug: string;
  status: Status;
  position: number;
  category_id: string;
  cover_media_id: string | null;
  og_image_media_id: string | null;
  price_from: number | null;
  booking_type: ServiceBookingType;
  cta_url: string | null;
  name: string;
  excerpt: string;
  body: string;
  duration_label: string | null;
  cta_label: string | null;
  meta_title: string | null;
  meta_description: string | null;
  gallery: string[];
}

export interface ServiceEditBundle {
  data: ServiceEditData;
  previews: Record<string, AdminMediaPreview>;
}

/** Full editable record for one service (source-locale values), or null. */
export async function getServiceForEdit(id: string): Promise<ServiceEditBundle | null> {
  const [row] = await db.select().from(service).where(eq(service.id, id)).limit(1);
  if (!row) return null;

  const galleryRows = await db
    .select({ media_id: service_media.media_id })
    .from(service_media)
    .where(eq(service_media.service_id, id))
    .orderBy(asc(service_media.position));

  const content = await loadContent([{ type: SERVICE, id }], SOURCE);

  const data: ServiceEditData = {
    id: row.id,
    slug: row.slug,
    status: row.status,
    position: row.position,
    category_id: row.category_id,
    cover_media_id: row.cover_media_id,
    og_image_media_id: row.og_image_media_id,
    price_from: row.price_from,
    booking_type: row.booking_type,
    cta_url: row.cta_url,
    name: content.get(SERVICE, id, "name") ?? "",
    excerpt: content.get(SERVICE, id, "excerpt") ?? "",
    body: content.get(SERVICE, id, "body") ?? "",
    duration_label: content.get(SERVICE, id, "duration_label") ?? null,
    cta_label: content.get(SERVICE, id, "cta_label") ?? null,
    meta_title: content.get(SERVICE, id, "meta_title") ?? null,
    meta_description: content.get(SERVICE, id, "meta_description") ?? null,
    gallery: galleryRows.map((g) => g.media_id),
  };

  const previews = await resolvePreviews([row.cover_media_id, row.og_image_media_id, ...data.gallery]);
  return { data, previews };
}

async function resolvePreviews(ids: (string | null)[]): Promise<Record<string, AdminMediaPreview>> {
  const clean = Array.from(new Set(ids.filter((x): x is string => !!x)));
  if (clean.length === 0) return {};
  const assets = await loadMedia(clean);
  const out: Record<string, AdminMediaPreview> = {};
  for (const [mid, a] of assets) {
    out[mid] = { id: mid, url: mediaUrl(a.r2_key), width: a.width, height: a.height, mime: a.mime };
  }
  return out;
}
