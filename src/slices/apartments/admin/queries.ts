import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@core/db/client";
import { type ContentRef, loadContent } from "@core/i18n/content";
import { loadMedia, mediaUrl } from "@core/media";
import type { AdminMediaPreview } from "@slices/backoffice/contract";
import { listBuildingOptions } from "@slices/buildings/contract";
import { APARTMENT } from "../contract";
import { apartment, apartment_media } from "../schema";
import { type ApartmentCounts, apartmentListWhere } from "./derive";
import { readApartmentLocaleRows } from "../server/editorial-bootstrap";
import { getApartmentEditorialModel } from "../server/editorial-store";
import { readApartmentSharedState } from "../server/shared-content";
import { overlayApartmentShared } from "../server/editorial-validation";
import type { Locale } from "@core/db/columns";

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
  buildingId: string;
  building: string;
  bedrooms: number;
  maxGuests: number;
  /** Order inside the building (spec building-detail-admin-editor S2). */
  position: number;
  /** [T] source badge, "" when unset. */
  badge: string;
  bedsCount: number;
  sizeM2: number | null;
  /** The unit has its own Avantio URL (else the card falls back to the building's). */
  hasAvantioUrl: boolean;
  /** Cover thumbnail, null when unset (the list draws the placeholder). */
  cover: AdminMediaPreview | null;
  localeStates: Record<Locale, { published: boolean; draft: boolean }>;
}

/**
 * Apartments for the admin lists, every status, ordered by building then position
 * (then id — the same tiebreaker `moveApartment` uses). `buildingId` narrows it to
 * one building (the workspace's Apartments tab); without it every apartment is
 * returned.
 */
export async function listApartmentsAdmin(
  filter: { buildingId?: string } = {},
): Promise<ApartmentAdminListItem[]> {
  const rows = await db
    .select()
    .from(apartment)
    .where(apartmentListWhere(filter.buildingId))
    .orderBy(
      asc(apartment.building_id),
      asc(apartment.position),
      asc(apartment.id),
    );

  const editorial = await Promise.all(
    rows.map((row) => readApartmentLocaleRows(row, false)),
  );
  const common = await Promise.all(
    rows.map((row, index) => readApartmentSharedState(row, editorial[index]!)),
  );
  const savedDocuments = rows.map((row, index) => {
    const en = editorial[index]!.find((value) => value.locale === "en");
    const saved = en?.draft ?? en?.published;
    return saved
      ? overlayApartmentShared(
          saved,
          common[index]!.working ?? common[index]!.content,
        )
      : null;
  });
  const [content, buildings, previews] = await Promise.all([
    loadContent(
      rows.map((r) => ({ type: APARTMENT, id: r.id })),
      SOURCE,
    ),
    listBuildingOptions(),
    resolvePreviews(
      rows.flatMap((r, index) => {
        const saved = savedDocuments[index];
        return [saved ? saved.content.cover_media_id : r.cover_media_id];
      }),
    ),
  ]);
  const buildingName = new Map(buildings.map((b) => [b.id, b.name]));

  return rows.map((r, index) => {
    const localeRows = editorial[index]!;
    const saved = savedDocuments[index];
    const published =
      r.status !== "archived" && localeRows.some((row) => row.published);
    return {
      id: r.id,
      name:
        saved?.content.name || content.get(APARTMENT, r.id, "name") || r.slug,
      slug: r.slug,
      status:
        r.status === "archived"
          ? "archived"
          : published
            ? "published"
            : "draft",
      buildingId: r.building_id,
      building: buildingName.get(r.building_id) ?? "",
      bedrooms: saved?.content.bedrooms ?? r.bedrooms,
      maxGuests: saved?.content.max_guests ?? r.max_guests,
      position: r.position,
      badge: saved
        ? (saved.content.badge ?? "")
        : (content.get(APARTMENT, r.id, "badge") ?? ""),
      bedsCount: saved?.content.beds_count ?? r.beds_count,
      sizeM2: saved ? saved.content.size_m2 : r.size_m2,
      hasAvantioUrl: Boolean(
        saved?.content.booking_url?.trim() ||
        saved?.content.default_booking_url?.trim() ||
        (!saved && r.avantio_url?.trim()),
      ),
      cover: (() => {
        const id = saved ? saved.content.cover_media_id : r.cover_media_id;
        return id ? (previews[id] ?? null) : null;
      })(),
      localeStates: Object.fromEntries(
        localeRows.map((row) => [
          row.locale,
          { published: Boolean(row.published), draft: Boolean(row.draft) },
        ]),
      ) as ApartmentAdminListItem["localeStates"],
    };
  });
}

export type { ApartmentCounts } from "./derive";

/**
 * Apartment counts per building (`buildingId → { total, published }`), every status
 * in `total`. Feeds the buildings list column and the workspace's Apartments tab;
 * buildings without apartments are absent from the map.
 */
export async function countApartmentsByBuilding(): Promise<
  Map<string, ApartmentCounts>
> {
  const rows = await db.select().from(apartment);
  const counts = new Map<string, ApartmentCounts>();
  for (const row of rows) {
    const count = counts.get(row.building_id) ?? { total: 0, published: 0 };
    count.total += 1;
    if (
      row.status !== "archived" &&
      (await readApartmentLocaleRows(row, false)).some(
        (state) => state.published,
      )
    )
      count.published += 1;
    counts.set(row.building_id, count);
  }
  return counts;
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

export async function getApartmentForEdit(
  id: string,
): Promise<ApartmentEditBundle | null> {
  const [row] = await db
    .select()
    .from(apartment)
    .where(eq(apartment.id, id))
    .limit(1);
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

  const previews = await resolvePreviews([
    row.cover_media_id,
    row.og_image_media_id,
    ...data.gallery,
  ]);
  return { data, previews };
}

async function resolvePreviews(
  ids: (string | null)[],
): Promise<Record<string, AdminMediaPreview>> {
  const clean = Array.from(new Set(ids.filter((x): x is string => !!x)));
  if (clean.length === 0) return {};
  const assets = await loadMedia(clean);
  const out: Record<string, AdminMediaPreview> = {};
  for (const [mid, a] of assets) {
    out[mid] = {
      id: mid,
      url: mediaUrl(a.r2_key),
      width: a.width,
      height: a.height,
      mime: a.mime,
    };
  }
  return out;
}

export { getApartmentEditorialModel };
