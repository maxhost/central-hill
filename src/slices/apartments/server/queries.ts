import { resolveMediaAlt } from "@core/media/alt";
import "server-only";
import { unstable_cache } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@core/db/client";
import type { Locale } from "@core/db/columns";
import {
  loadAlternateSlugs,
  loadContent,
  loadSlugs,
  resolveSlug,
} from "@core/i18n";
import { loadMedia, mediaUrl, type MediaImageData } from "@core/media";
import {
  BUILDING_TAGS,
  getBuildingLocaleScope,
} from "@slices/buildings/contract";
import type { AdminMediaPreview } from "@slices/backoffice/contract";
import {
  APARTMENT_TAGS,
  type ApartmentDetail,
  type ApartmentSummary,
} from "../contract";
import type { ApartmentEnvelope } from "../editorial-types";
import { apartment } from "../schema";
import {
  readApartmentIdentity,
  readApartmentLocaleRows,
} from "./editorial-bootstrap";
import { readPublishedApartmentDocuments } from "./editorial-store";
import { readApartmentSharedState } from "./shared-content";
import {
  apartmentMediaIds,
  resolveApartmentBooking,
  overlayApartmentShared,
} from "./editorial-validation";
/** One mapping for public content and the actual private unit preview. */
export async function resolveApartmentDocument(
  id: string,
  buildingId: string,
  envelope: ApartmentEnvelope,
  locale: Locale,
  slugValue: string,
  localMedia: Record<string, AdminMediaPreview> = {},
): Promise<ApartmentDetail> {
  const c = envelope.content;
  const ids = apartmentMediaIds(envelope);
  const [assets, alts, alternateSlugs] = await Promise.all([
    loadMedia(ids),
    loadContent(
      ids.map((id) => ({ type: "media_asset", id })),
      locale,
    ),
    loadAlternateSlugs("apartment", id),
  ]);
  function image(mid: string | null): MediaImageData | null {
    if (!mid) return null;
    const stored = assets.get(mid),
      local = localMedia[mid];
    if (!stored && !local) return null;
    return {
      url: stored ? mediaUrl(stored.r2_key) : local!.url,
      width: stored?.width ?? local?.width ?? 1600,
      height: stored?.height ?? local?.height ?? 1200,
      alt: resolveMediaAlt(c.media_alts, mid, alts.get("media_asset", mid, "alt") ?? c.name),
      blurhash: stored?.blurhash ?? null,
    };
  }
  return {
    id,
    buildingId,
    slug: slugValue,
    name: c.name,
    badge: c.badge,
    bedrooms: c.bedrooms,
    bathrooms: c.bathrooms,
    maxGuests: c.max_guests,
    bedsCount: c.beds_count,
    sizeM2: c.size_m2,
    floor: c.floor,
    cover: image(c.cover_media_id),
    avantio: { id: c.avantio_id, url: resolveApartmentBooking(envelope) },
    description: c.description,
    gallery: c.gallery
      .filter((mid) => mid !== c.cover_media_id)
      .flatMap((mid) => {
        const value = image(mid);
        return value ? [value] : [];
      }),
    metaTitle: c.meta_title ?? undefined,
    metaDescription: c.meta_description ?? undefined,
    ogImage: image(c.og_image_media_id) ?? image(c.cover_media_id),
    alternateSlugs,
  };
}
/** No parent gate, for the private full-parent composition only. */
export async function listApartmentPreviewSiblings(
  locale: Locale,
  buildingId: string,
): Promise<ApartmentSummary[]> {
  const documents = await readPublishedApartmentDocuments(buildingId, locale);
  const slugs = await loadSlugs(
    "apartment",
    documents.map((unit) => unit.identity.id),
    locale,
  );
  return Promise.all(
    documents.map(({ identity, envelope }) =>
      resolveApartmentDocument(
        identity.id,
        buildingId,
        envelope,
        locale,
        slugs.get(identity.id) ?? identity.slug,
      ),
    ),
  );
}
export async function listPublishedApartments(
  locale: Locale,
  buildingId: string,
): Promise<ApartmentSummary[]> {
  const parent = await getBuildingLocaleScope(buildingId, locale);
  if (!parent?.published || parent.archived) return [];
  return listApartmentPreviewSiblings(locale, buildingId);
}
export function listByBuilding(
  locale: Locale,
  buildingId: string,
): Promise<ApartmentSummary[]> {
  return unstable_cache(
    () => listPublishedApartments(locale, buildingId),
    ["apartments:listByBuilding:v3", locale, buildingId],
    {
      tags: [
        APARTMENT_TAGS.list,
        BUILDING_TAGS.list,
        BUILDING_TAGS.building(buildingId),
      ],
    },
  )();
}
async function publicDetail(
  locale: Locale,
  slugValue: string,
): Promise<ApartmentDetail | null> {
  let id = await resolveSlug("apartment", locale, slugValue);
  if (!id) {
    const [legacy] = await db
      .select({ id: apartment.id })
      .from(apartment)
      .where(eq(apartment.slug, slugValue))
      .limit(1);
    id = legacy?.id;
  }
  if (!id) return null;
  const identity = await readApartmentIdentity(id);
  if (!identity || identity.status === "archived") return null;
  const parent = await getBuildingLocaleScope(identity.building_id, locale);
  if (!parent?.published || parent.archived) return null;
  const rows = await readApartmentLocaleRows(identity, false);
  const document = rows.find((row) => row.locale === locale)?.published;
  if (!document) return null;
  const slugs = await loadSlugs("apartment", [id], locale);
  const shared = await readApartmentSharedState(identity, rows);
  const detail = await resolveApartmentDocument(
    id,
    identity.building_id,
    overlayApartmentShared(document, shared.content),
    locale,
    slugs.get(id) ?? identity.slug,
  );
  const available = new Set(
    rows.filter((row) => row.published).map((row) => row.locale),
  );
  detail.alternateSlugs = Object.fromEntries(
    Object.entries(detail.alternateSlugs).filter(([key]) =>
      available.has(key as Locale),
    ),
  );
  return detail;
}
export function getApartmentBySlug(
  locale: Locale,
  slugValue: string,
): Promise<ApartmentDetail | null> {
  return unstable_cache(
    () => publicDetail(locale, slugValue),
    ["apartments:getApartmentBySlug:v3", locale, slugValue],
    { tags: [APARTMENT_TAGS.list, BUILDING_TAGS.list] },
  )();
}
