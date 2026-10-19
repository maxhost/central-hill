import { translatablePaths } from "@core/validation/primitives";
import { realEstateSchema, type RealEstateContent } from "./schemas/real-estate";
import { describe } from "./admin/form-model";
import type { PageEditorialDescriptor } from "./editorial-adapter-types";
import { normalizeEditorial, editorialIdentityErrors, editorialTextPaths, editorialTranslationField, retireEditorialIds } from "./editorial-identities";

export const REAL_ESTATE_LIST_PATHS = [
  "partners.benefits", "capabilities.benefits", "asset_management.benefits",
  "deal_structures.models", "deal_structures.models[].points", "market.stats",
  "market.fundamentals.body", "market.thesis.points", "track_record.tiles", "process.steps",
] as const;
/** Pure serializable metadata; server registry functions stay outside client imports. */
export const realEstateDescriptor: PageEditorialDescriptor = {
  key: "real_estate", title: "Real Estate", publicPath: "/real-estate",
  rootNode: describe(realEstateSchema), textPatterns: translatablePaths(realEstateSchema),
  listPaths: [...REAL_ESTATE_LIST_PATHS], maxLocalMedia: 5, externalSections: ["faq"],
  mediaSlots: [
    { path: "hero.image_media_id", kind: "image" },
    { path: "hero.capability_statement_media_id", kind: "pdf" },
    { path: "capabilities.image_media_id", kind: "mixed" },
    { path: "asset_management.image_media_id", kind: "mixed" },
  ],
};
export const normalizeRealEstate = (content: RealEstateContent): RealEstateContent => normalizeEditorial(content, realEstateDescriptor);
export const realEstateIdentityErrors = (content: RealEstateContent, previous?: RealEstateContent) => editorialIdentityErrors(content, previous, realEstateDescriptor);
export const retireRealEstateIds = (content: RealEstateContent, previous: RealEstateContent): RealEstateContent => retireEditorialIds(content, previous, realEstateDescriptor);
export const realEstateTextPaths = (content: RealEstateContent) => editorialTextPaths(content, realEstateDescriptor);
export const realEstateTranslationField = (content: RealEstateContent, path: string) => editorialTranslationField(content, path, realEstateDescriptor);
