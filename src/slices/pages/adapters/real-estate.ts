import { z } from "zod";
import { realEstateSchema, defaultCapabilities, defaultDealStructures, defaultProcess, defaultTrackRecord, type RealEstateContent } from "../schemas/real-estate";
import { applyDefaults } from "../admin/form-model";
import { realEstateMediaReferences, realEstateMediaErrors } from "../admin/real-estate-media-validation";
import { realEstateDescriptor, normalizeRealEstate, realEstateIdentityErrors, retireRealEstateIds, realEstateTextPaths, realEstateTranslationField } from "../real-estate-content";
import type { PageEditorialAdapter } from "../editorial-adapter-types";

const unfinishedUrl = z.union([z.literal(""), z.url()]);
export const realEstateDraftSchema = realEstateSchema.extend({
  hero: realEstateSchema.shape.hero.extend({
    cta_primary: realEstateSchema.shape.hero.shape.cta_primary.extend({ url: unfinishedUrl }),
    cta_secondary: realEstateSchema.shape.hero.shape.cta_secondary.extend({ url: unfinishedUrl }),
  }),
  partners: realEstateSchema.shape.partners.extend({
    cta_primary: realEstateSchema.shape.partners.shape.cta_primary.extend({ url: unfinishedUrl }),
    cta_secondary: realEstateSchema.shape.partners.shape.cta_secondary.extend({ url: unfinishedUrl }),
  }),
  capabilities: realEstateSchema.shape.capabilities.extend({ cta: realEstateSchema.shape.capabilities.shape.cta.extend({ url: unfinishedUrl }) }),
  asset_management: realEstateSchema.shape.asset_management.extend({ cta: realEstateSchema.shape.asset_management.shape.cta.extend({ url: unfinishedUrl }) }),
});
export const realEstateAdapter: PageEditorialAdapter<"real_estate"> = {
  key: "real_estate", descriptor: realEstateDescriptor,
  draftSchema: realEstateDraftSchema, publishSchema: realEstateSchema,
  defaultContent() {
    const content = applyDefaults(realEstateDescriptor.rootNode, {}) as RealEstateContent;
    content.capabilities = structuredClone(defaultCapabilities);
    content.deal_structures = structuredClone(defaultDealStructures);
    content.process = structuredClone(defaultProcess);
    content.track_record = structuredClone(defaultTrackRecord);
    for (const list of [content.partners.benefits, content.asset_management.benefits]) for (const item of list) item.icon_key = "check";
    return normalizeRealEstate(content);
  },
  normalize: normalizeRealEstate, identityErrors: realEstateIdentityErrors, retireIds: retireRealEstateIds,
  textPaths: realEstateTextPaths, translationField: realEstateTranslationField,
  collectMediaReferences: realEstateMediaReferences, mediaErrors: realEstateMediaErrors,
  async render(input) { const { RealEstatePage } = await import("../ui/real-estate-page"); return RealEstatePage(input); },
};
