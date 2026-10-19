import { defaultServices, servicesSchema } from "../schemas/services";
import {
  servicesMediaReferences,
  servicesMediaErrors,
} from "../admin/services-media-validation";
import {
  servicesDescriptor,
  normalizeServices,
  servicesTextPaths,
  servicesTranslationField,
} from "../services-content";
import type { PageEditorialAdapter } from "../editorial-adapter-types";

export const servicesAdapter: PageEditorialAdapter<"services"> = {
  key: "services",
  descriptor: servicesDescriptor,
  draftSchema: servicesSchema,
  publishSchema: servicesSchema,
  defaultContent: () => normalizeServices(defaultServices),
  normalize: normalizeServices,
  identityErrors: () => ({}),
  retireIds: (content) => structuredClone(content),
  textPaths: servicesTextPaths,
  translationField: servicesTranslationField,
  collectMediaReferences: servicesMediaReferences,
  mediaErrors: servicesMediaErrors,
  async render(input) {
    const { ServicesListingRenderer } =
      await import("@slices/services/contract");
    return ServicesListingRenderer(input);
  },
};
