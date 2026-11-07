import { translatablePaths } from "@core/validation/primitives";
import { guestSchema, type GuestContent } from "./schemas/guest";
import { describe } from "./admin/form-model";
import type { PageEditorialDescriptor } from "./editorial-adapter-types";
import {
  normalizeEditorial,
  editorialIdentityErrors,
  editorialTextPaths,
  editorialTranslationField,
  retireEditorialIds,
} from "./editorial-identities";
export const GUEST_LIST_PATHS = [
  "why.benefits",
  "services_teaser.items",
  "activities_teaser.items",
] as const;
export const guestDescriptor: PageEditorialDescriptor = {
  key: "guest",
  title: "Guests",
  publicPath: "/guests",
  rootNode: describe(guestSchema),
  textPatterns: translatablePaths(guestSchema),
  localeReferencePaths: ["faq_group_key"],
  listPaths: [...GUEST_LIST_PATHS],
  maxLocalMedia: 16,
  externalSections: ["portfolio", "services_teaser", "activities_teaser", "testimonials", "faq"],
  mediaSlots: [
    { path: "hero.video_media_id", kind: "video" },
    { path: "hero.poster_media_id", kind: "image" },
    { path: "welcome.image_media_id", kind: "mixed" },
    { path: "services_teaser.items[].image_media_id", kind: "image" },
    { path: "activities_teaser.items[].image_media_id", kind: "image" },
  ],
};
export const normalizeGuest = (content: GuestContent): GuestContent =>
  normalizeEditorial(content, guestDescriptor);
export const guestIdentityErrors = (
  content: GuestContent,
  previous?: GuestContent,
) => editorialIdentityErrors(content, previous, guestDescriptor);
export const retireGuestIds = (
  content: GuestContent,
  previous: GuestContent,
): GuestContent => retireEditorialIds(content, previous, guestDescriptor);
export const guestTextPaths = (content: GuestContent) =>
  editorialTextPaths(content, guestDescriptor);
export const guestTranslationField = (content: GuestContent, path: string) =>
  editorialTranslationField(content, path, guestDescriptor);
/** Missing metadata is a legacy public row; new UUID rows use the first stock image. */
export function guestFallbackIndex(
  content: GuestContent,
  list: "services_teaser.items" | "activities_teaser.items",
  index: number,
): number {
  const id = content._list_ids?.[list]?.[index] ?? `legacy_${index}`;
  return id.startsWith("legacy_") ? Number(id.slice(7)) : 0;
}
