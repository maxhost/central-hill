import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@core/db/client";
import { type ContentRef, loadContent } from "@core/i18n/content";
import { loadMedia, mediaUrl } from "@core/media";
import type { AdminMediaPreview } from "@slices/backoffice/contract";
import { listBuildingOptions } from "@slices/buildings/contract";
import { APARTMENT } from "../contract";
import { apartment, apartment_media } from "../schema";

/**
 * Backoffice reads for slice `apartments` (S12). Not cache-wrapped, all statuses,
 * source-locale ([T] en) values for editing. Building names come from the buildings
 * contract (golden rule 2 — we never read the building table).
 */

const SOURCE = "en" as const;
type ApartmentStatus = "draft" | "published" | "archived";

export interface ApartmentAdminListItem {
  id: string;
  name: string;
  slug: string;
  status: ApartmentStatus;
  building: string;
  bedrooms: number;
  maxGuests: number;
}

export async function listApartmentsAdmin(): Promise<ApartmentAdminListItem[]> {
  const rows = await db
    .select({
      id: apartment.id,
      slug: apartment.slug,
      status: apartment.status,
      building_id: apartment.building_id,
      bedrooms: apartment.bedrooms,
      max_guests: apartment.max_guests,
      position: apartment.position,
    })
    .from(apartment)
    .orderBy(asc(apartment.building_id), asc(apartment.position));

  const [content, buildings] = await Promise.all([
    loadContent(
      rows.map((r) => ({ type: APARTMENT, id: r.id })),
      SOURCE,
    ),
    listBuildingOptions(),
  ]);
  const buildingName = new Map(buildings.map((b) => [b.id, b.name]));

  return rows.map((r) => ({
    id: r.id,
    name: content.get(APARTMENT, r.id, "name") ?? r.slug,
    slug: r.slug,
    status: r.status,
    building: buildingName.get(r.building_id) ?? "",
    bedrooms: r.bedrooms,
    maxGuests: r.max_guests,
  }));
}

export interface ApartmentEditData {
  id: string;
  slug: string;
  status: ApartmentStatus;
  position: number;
  building_id: string;
  badge: string;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  beds_count: number;
  size_m2: number | null;
  floor: number | null;
  cover_media_id: string | null;
  og_image_media_id: string | null;
  avantio_id: string;
  avantio_url: string;
  name: string;
  description: string;
  meta_title: string;
  meta_description: string;
  gallery: string[];
}

export interface ApartmentEditBundle {
  data: ApartmentEditData;
  previews: Record<string, AdminMediaPreview>;
}

export async function getApartmentForEdit(id: string): Promise<ApartmentEditBundle | null> {
  const [row] = await db.select().from(apartment).where(eq(apartment.id, id)).limit(1);
  if (!row) return null;

  const galleryRows = await db
    .select({ media_id: apartment_media.media_id })
    .from(apartment_media)
    .where(eq(apartment_media.apartment_id, id))
    .orderBy(asc(apartment_media.position));

  const refs: ContentRef[] = [{ type: APARTMENT, id }];
  const content = await loadContent(refs, SOURCE);

  const data: ApartmentEditData = {
    id: row.id,
    slug: row.slug,
    status: row.status,
    position: row.position,
    building_id: row.building_id,
    badge: content.get(APARTMENT, id, "badge") ?? "",
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    max_guests: row.max_guests,
    beds_count: row.beds_count,
    size_m2: row.size_m2,
    floor: row.floor,
    cover_media_id: row.cover_media_id,
    og_image_media_id: row.og_image_media_id,
    avantio_id: row.avantio_id ?? "",
    avantio_url: row.avantio_url ?? "",
    name: content.get(APARTMENT, id, "name") ?? "",
    description: content.get(APARTMENT, id, "description") ?? "",
    meta_title: content.get(APARTMENT, id, "meta_title") ?? "",
    meta_description: content.get(APARTMENT, id, "meta_description") ?? "",
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
