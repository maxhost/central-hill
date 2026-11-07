import "server-only";
import { unstable_cache } from "next/cache";
import { asc, ne } from "drizzle-orm";
import { db } from "@core/db/client";
import type { Locale } from "@core/db/columns";
import { loadContent, loadAlternateSlugs, resolveSlug } from "@core/i18n";
import { loadMedia, mediaUrl, type MediaImageData } from "@core/media";
import {
  type CityRef,
  type NeighbourhoodRef,
  GEO_TAGS,
  listCities,
  listNeighbourhoods,
} from "@slices/geography/contract";
import {
  APARTMENT_TAGS,
  getPublishedApartmentStats,
} from "@slices/apartments/contract";
import {
  BUILDING_TAGS,
  type BuildingDetail,
  type BuildingFilter,
  type BuildingSummary,
} from "../contract";
import type { BuildingEnvelope } from "../editorial-types";
import { building, amenity } from "../schema";
import {
  readBuildingIdentity,
  readBuildingLocaleRows,
  buildingSlugMap,
} from "./editorial-bootstrap";
import {
  effectiveBuildingBooking,
  buildingMediaIds,
} from "./editorial-validation";
import {
  readBuildingSharedState,
  overlayBuildingShared,
} from "./shared-content";
/** Resolve an explicit immutable document. Used by public and private renderers. */
export async function resolveBuildingDocument(
  id: string,
  envelope: BuildingEnvelope,
  locale: Locale,
  slug: string,
): Promise<BuildingDetail> {
  const c = envelope.content;
  const [cities, neighbourhoods, assets, amenities, slugs, stats] =
    await Promise.all([
      listCities(locale),
      listNeighbourhoods(locale),
      loadMedia(buildingMediaIds(envelope)),
      db.select().from(amenity).orderBy(asc(amenity.slug)),
      loadAlternateSlugs("building", id),
      getPublishedApartmentStats(id, locale),
    ]);
  const content = await loadContent(
    [
      ...c.amenity_ids.map((id) => ({ type: "amenity", id })),
      ...buildingMediaIds(envelope).map((id) => ({ type: "media_asset", id })),
    ],
    locale,
  );
  const image = (id: string | null): MediaImageData | null => {
    const asset = id ? assets.get(id) : null;
    return asset
      ? {
          url: mediaUrl(asset.r2_key),
          width: asset.width ?? 1600,
          height: asset.height ?? 1200,
          alt: content.get("media_asset", id!, "alt") ?? c.name,
          blurhash: asset.blurhash,
        }
      : null;
  };
  const city = cities.find((city: CityRef) => city.id === c.city_id);
  const neighbourhood = neighbourhoods.find(
    (n: NeighbourhoodRef) => n.id === c.neighbourhood_id,
  );
  const location = (
    v: { id: string; slug: string; name: string } | undefined,
    fallback: string,
  ) => ({ id: v?.id ?? fallback, slug: v?.slug ?? "", name: v?.name ?? "" });
  const allRows = await readBuildingIdentity(id);
  const publishedSlugs: Partial<Record<Locale, string>> = {};
  if (allRows) {
    for (const row of await readBuildingLocaleRows(allRows, false))
      if (row.published && slugs[row.locale])
        publishedSlugs[row.locale] = slugs[row.locale];
  }
  const url = effectiveBuildingBooking(c);
  const cover = image(c.cover_media_id);
  return {
    id,
    slug,
    name: c.name,
    headline: c.headline,
    teaser: c.teaser,
    streetAddress: c.street_address,
    city: location(city, c.city_id),
    neighbourhood: c.neighbourhood_id
      ? location(neighbourhood, c.neighbourhood_id)
      : null,
    cover,
    isNew: c.is_new,
    isFeatured: c.is_featured,
    booking: {
      enabled: c.booking_enabled,
      url,
      ...(c.booking_button ? { label: c.booking_button.label } : {}),
    },
    stats,
    descriptionIntro: c.description_intro,
    descriptionNeighbourhood: c.description_neighbourhood,
    latitude: c.latitude,
    longitude: c.longitude,
    gallery: c.gallery.flatMap((id) => {
      const img = image(id);
      return img ? [img] : [];
    }),
    amenities: c.amenity_ids.flatMap((id) => {
      const a = amenities.find((a: typeof amenity.$inferSelect) => a.id === id);
      return a
        ? [
            {
              id: a.id,
              slug: a.slug,
              icon: a.icon,
              group: a.group,
              label: content.get("amenity", a.id, "label") ?? a.slug,
            },
          ]
        : [];
    }),
    faq: c.faq.filter((f) => f.question && f.answer),
    avantio: { id: c.avantio_id, url },
    metaTitle: c.meta_title ?? undefined,
    metaDescription: c.meta_description ?? undefined,
    ogImage: image(c.og_image_media_id) ?? cover,
    alternateSlugs: publishedSlugs,
  };
}
async function publishedDocument(
  id: string,
  locale: Locale,
): Promise<BuildingDetail | null> {
  const identity = await readBuildingIdentity(id);
  if (!identity || identity.status === "archived") return null;
  const rows = await readBuildingLocaleRows(identity, false);
  const snapshot = rows.find((row) => row.locale === locale)?.published;
  if (!snapshot) return null;
  const slugs = await buildingSlugMap(id);
  return resolveBuildingDocument(
    id,
    overlayBuildingShared(
      snapshot,
      (await readBuildingSharedState(identity, rows)).content,
    ),
    locale,
    slugs[locale] ?? identity.slug,
  );
}
async function listDocuments(
  locale: Locale,
  filter?: BuildingFilter,
): Promise<BuildingSummary[]> {
  const identities = await db
    .select({ id: building.id })
    .from(building)
    .where(ne(building.status, "archived"))
    .orderBy(asc(building.position));
  const docs = await Promise.all(
    identities.map(async (row) => {
      const identity = await readBuildingIdentity(row.id);
      if (!identity) return null;
      const rows = await readBuildingLocaleRows(identity, false);
      const snapshot = rows.find((r) => r.locale === locale)?.published;
      if (!snapshot) return null;
      const c = overlayBuildingShared(
        snapshot,
        (await readBuildingSharedState(identity, rows)).content,
      ).content;
      if (
        (filter?.cityId && filter.cityId !== c.city_id) ||
        (filter?.neighbourhoodId &&
          filter.neighbourhoodId !== c.neighbourhood_id) ||
        (filter?.isNew !== undefined && filter.isNew !== c.is_new) ||
        (filter?.isFeatured !== undefined &&
          filter.isFeatured !== c.is_featured)
      )
        return null;
      return {
        position: c.position,
        document: await publishedDocument(row.id, locale),
      };
    }),
  );
  return docs
    .filter((v): v is { position: number; document: BuildingDetail } =>
      Boolean(v?.document),
    )
    .sort((a, b) => a.position - b.position)
    .map((v) => v.document);
}
const tags = () => [BUILDING_TAGS.list, GEO_TAGS.list, APARTMENT_TAGS.list];
export function listBuildings(
  locale: Locale,
  filter?: BuildingFilter,
): Promise<BuildingSummary[]> {
  return unstable_cache(
    () => listDocuments(locale, filter),
    ["buildings:locale-list", locale, JSON.stringify(filter ?? {})],
    { tags: tags() },
  )();
}
export function getFeaturedBuildings(
  locale: Locale,
  limit = 3,
): Promise<BuildingSummary[]> {
  return unstable_cache(
    async () =>
      (await listDocuments(locale, { isFeatured: true })).slice(0, limit),
    ["buildings:locale-featured", locale, String(limit)],
    { tags: tags() },
  )();
}
export function getBuildingBySlug(
  locale: Locale,
  slug: string,
): Promise<BuildingDetail | null> {
  return unstable_cache(
    async () => {
      const id = await resolveSlug("building", locale, slug);
      return id ? publishedDocument(id, locale) : null;
    },
    ["buildings:locale-detail", locale, slug],
    { tags: tags() },
  )();
}
export async function listBuildingParams(): Promise<
  Array<{ locale: Locale; slug: string }>
> {
  const identities = await db
    .select()
    .from(building)
    .where(ne(building.status, "archived"));
  return (
    await Promise.all(
      identities.map(async (identity) => {
        const [rows, slugs] = await Promise.all([
          readBuildingLocaleRows(identity, false),
          buildingSlugMap(identity.id),
        ]);
        return rows.flatMap((row) =>
          row.published && slugs[row.locale]
            ? [{ locale: row.locale, slug: slugs[row.locale]! }]
            : [],
        );
      }),
    )
  ).flat();
}
