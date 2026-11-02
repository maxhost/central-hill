import { translatablePaths } from "@core/validation/primitives";
import {
  realEstateSchema,
  type RealEstateContent,
} from "./schemas/real-estate";
import { describe } from "./admin/form-model";
import type { PageEditorialDescriptor } from "./editorial-adapter-types";
import {
  normalizeEditorial,
  editorialIdentityErrors,
  editorialTextPaths,
  editorialTranslationField,
  retireEditorialIds,
} from "./editorial-identities";

export const REAL_ESTATE_LIST_PATHS = [
  "partners.benefits",
  "capabilities.benefits",
  "asset_management.benefits",
  "deal_structures.models",
  "deal_structures.models[].points",
  "market.stats",
  "market.fundamentals.body",
  "market.thesis.points",
  "track_record.tiles",
  "process.steps",
] as const;
/** Pure serializable metadata; server registry functions stay outside client imports. */
export const realEstateDescriptor: PageEditorialDescriptor = {
  key: "real_estate",
  title: "Real Estate",
  publicPath: "/real-estate",
  rootNode: describe(realEstateSchema),
  textPatterns: translatablePaths(realEstateSchema),
  listPaths: [...REAL_ESTATE_LIST_PATHS],
  maxLocalMedia: 21,
  externalSections: ["faq"],
  mediaSlots: [
    { path: "hero.image_media_id", kind: "image" },
    { path: "hero.capability_statement_media_id", kind: "pdf" },
    { path: "capabilities.image_media_id", kind: "mixed" },
    { path: "asset_management.image_media_id", kind: "mixed" },
    { path: "asset_management.benefits[].image_media_id", kind: "image" },
    { path: "market.fundamentals.image_left_media_id", kind: "image" },
    { path: "market.fundamentals.image_right_media_id", kind: "image" },
    { path: "process.steps[].image_media_id", kind: "image" },
  ],
};
export const normalizeRealEstate = (
  content: RealEstateContent,
): RealEstateContent => normalizeEditorial(content, realEstateDescriptor);
export const realEstateIdentityErrors = (
  content: RealEstateContent,
  previous?: RealEstateContent,
) => editorialIdentityErrors(content, previous, realEstateDescriptor);
export const retireRealEstateIds = (
  content: RealEstateContent,
  previous: RealEstateContent,
): RealEstateContent =>
  retireEditorialIds(content, previous, realEstateDescriptor);
export const realEstateTextPaths = (content: RealEstateContent) =>
  editorialTextPaths(content, realEstateDescriptor);
export const realEstateTranslationField = (
  content: RealEstateContent,
  path: string,
) => editorialTranslationField(content, path, realEstateDescriptor);

/** Fallback photos follow the original item when the editor reorders its stable IDs. */
export function realEstateAssetFallbackIndex(
  content: RealEstateContent,
  index: number,
): number {
  const id =
    content._list_ids?.["asset_management.benefits"]?.[index] ??
    `legacy_${index}`;
  return id.startsWith("legacy_") ? Number(id.slice(7)) : 0;
}

/** Process stock photos follow each legacy step when its order changes. */
export function realEstateProcessFallbackIndex(
  content: RealEstateContent,
  index: number,
): number {
  const id = content._list_ids?.["process.steps"]?.[index] ?? `legacy_${index}`;
  return id.startsWith("legacy_") ? Number(id.slice(7)) : 0;
}
