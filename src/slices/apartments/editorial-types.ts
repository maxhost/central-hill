import type { PropertyEditorialModel, PropertyEnvelope, SavePropertyDraftInput, PublishPropertyDraftInput } from "@slices/backoffice/contract";
export interface ApartmentEditorialContent {
  name: string; badge: string | null; description: string;
  meta_title: string | null; meta_description: string | null;
  bedrooms: number; bathrooms: number; max_guests: number; beds_count: number;
  size_m2: number | null; floor: number | null;
  cover_media_id: string | null; og_image_media_id: string | null; gallery: string[];
  avantio_id: string | null; default_booking_url: string | null; booking_url: string | null;
}
export type ApartmentEnvelope = PropertyEnvelope<ApartmentEditorialContent>;
export type ApartmentEditorialModel = PropertyEditorialModel<ApartmentEditorialContent> & { parentId: string };
export type SaveApartmentDraftInput = SavePropertyDraftInput<ApartmentEditorialContent> & { parentId: string };
export type PublishApartmentDraftInput = PublishPropertyDraftInput & { parentId: string };

/** ADR0061: one common value per identity, effective for every locale on Save. */
export const APARTMENT_SHARED_KEYS = [
  "bedrooms",
  "bathrooms",
  "max_guests",
  "beds_count",
  "size_m2",
  "floor",
  "cover_media_id",
  "og_image_media_id",
  "gallery",
  "avantio_id",
  "default_booking_url",
] as const satisfies readonly (keyof ApartmentEditorialContent)[];
export type ApartmentSharedContent = Pick<ApartmentEditorialContent, (typeof APARTMENT_SHARED_KEYS)[number]>;
