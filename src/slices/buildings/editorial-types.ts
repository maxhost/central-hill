import type { MediaAlts } from "@core/media/alt";
import type { Locale } from "@core/db/columns";
import type { PropertyEditorialModel, PropertyEnvelope } from "@slices/backoffice/contract";
export const PROPERTY_GRAPH_LOCK = 7158;
export interface BuildingEditorialFaq { id: string; question: string; answer: string }
/** Localized button. Absence retains legacy URL resolution; null link explicitly hides it. */
export interface BuildingBookingButton { label: string; link: string | null }
export interface BuildingEditorialContent {
  /** Localized per-document descriptions; media references remain shared. */
  media_alts?: MediaAlts;
  name: string; headline: string; teaser: string; description_intro: string;
  description_neighbourhood: string | null; meta_title: string | null; meta_description: string | null;
  position: number; is_new: boolean; is_featured: boolean;
  city_id: string; neighbourhood_id: string | null; street_address: string | null;
  latitude: number | null; longitude: number | null;
  cover_media_id: string | null; og_image_media_id: string | null;
  gallery: string[]; amenity_ids: string[]; faq: BuildingEditorialFaq[];
  avantio_id: string | null; default_booking_url: string | null; booking_url: string | null; booking_enabled: boolean;
  booking_button?: BuildingBookingButton;
}
export type BuildingEnvelope = PropertyEnvelope<BuildingEditorialContent>;
export type BuildingEditorialModel = PropertyEditorialModel<BuildingEditorialContent>;
/** No apartment lookup: child public reads call this without recursion. */
export interface BuildingLocaleScope { id: string; archived: boolean; published: boolean; bookingUrl: string | null }
export type BuildingLocale = Locale;

/** ADR0061: one common value per identity, effective for every locale on Save. */
export const BUILDING_SHARED_KEYS = [
  "position",
  "is_new",
  "is_featured",
  "city_id",
  "neighbourhood_id",
  "street_address",
  "latitude",
  "longitude",
  "cover_media_id",
  "og_image_media_id",
  "gallery",
  "amenity_ids",
  "avantio_id",
  "default_booking_url",
  "booking_enabled",
] as const satisfies readonly (keyof BuildingEditorialContent)[];
export type BuildingSharedContent = Pick<BuildingEditorialContent, (typeof BUILDING_SHARED_KEYS)[number]>;

/** Reversible global visibility, independent of localized draft/publication. */
export type BuildingStatusResult =
  | { ok: true; status: "draft" | "published" | "archived"; refreshWarning?: boolean }
  | { ok: false; error?: "not_found" | "legacy_invalid" | "server" };
