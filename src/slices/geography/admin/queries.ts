import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import { type ContentRef, loadContent } from "@core/i18n/content";
import { loadMedia, mediaUrl } from "@core/media";
import type { AdminMediaPreview } from "@slices/backoffice/contract";
import { CITY, NEIGHBOURHOOD } from "../contract";
import { city, neighbourhood } from "../schema";

/**
 * Backoffice reads for slice `geography` (S12). Not cache-wrapped (admin is dynamic)
 * and return **all** city statuses + **source-locale** ([T] en) values for editing.
 */

const SOURCE = "en" as const;

type Status = "draft" | "published" | "archived";

export interface CityAdminListItem {
  id: string;
  name: string;
  slug: string;
  status: Status;
  country: string;
  position: number;
  neighbourhoods: number;
}

/** All cities with their neighbourhood counts (every status), in display order. */
export async function listCitiesAdmin(): Promise<CityAdminListItem[]> {
  const rows = await db
    .select({
      id: city.id,
      slug: city.slug,
      status: city.status,
      country: city.country,
      position: city.position,
      neighbourhoods: sql<number>`count(${neighbourhood.id})::int`,
    })
    .from(city)
    .leftJoin(neighbourhood, eq(neighbourhood.city_id, city.id))
    .groupBy(city.id)
    .orderBy(asc(city.position));

  if (rows.length === 0) return [];
  const content = await loadContent(
    rows.map((r) => ({ type: CITY, id: r.id })),
    SOURCE,
  );
  return rows.map((r) => ({
    id: r.id,
    name: content.get(CITY, r.id, "name") ?? r.slug,
    slug: r.slug,
    status: r.status,
    country: r.country,
    position: r.position,
    neighbourhoods: r.neighbourhoods,
  }));
}

export interface NeighbourhoodEdit {
  id: string;
  slug: string;
  name: string;
}

export interface CityEditData {
  id: string;
  slug: string;
  position: number;
  status: Status;
  country: string;
  hero_media_id: string | null;
  name: string;
  intro: string | null;
  neighbourhoods: NeighbourhoodEdit[];
}

export interface CityEditBundle {
  data: CityEditData;
  /** Resolved preview for the hero image, keyed by media id. */
  previews: Record<string, AdminMediaPreview>;
}

/** Full editable record for one city + its neighbourhoods (source values), or null. */
export async function getCityForEdit(id: string): Promise<CityEditBundle | null> {
  const [row] = await db.select().from(city).where(eq(city.id, id)).limit(1);
  if (!row) return null;

  const nbRows = await db
    .select({ id: neighbourhood.id, slug: neighbourhood.slug })
    .from(neighbourhood)
    .where(eq(neighbourhood.city_id, id))
    .orderBy(asc(neighbourhood.position));

  const refs: ContentRef[] = [
    { type: CITY, id },
    ...nbRows.map((n) => ({ type: NEIGHBOURHOOD, id: n.id })),
  ];
  const content = await loadContent(refs, SOURCE);

  const data: CityEditData = {
    id: row.id,
    slug: row.slug,
    position: row.position,
    status: row.status,
    country: row.country,
    hero_media_id: row.hero_media_id,
    name: content.get(CITY, id, "name") ?? "",
    intro: content.get(CITY, id, "intro") ?? null,
    neighbourhoods: nbRows.map((n) => ({
      id: n.id,
      slug: n.slug,
      name: content.get(NEIGHBOURHOOD, n.id, "name") ?? "",
    })),
  };

  const previews = await resolvePreviews([row.hero_media_id]);
  return { data, previews };
}

/** Build admin previews for a set of media ids (drops blanks / missing). */
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
