import { translatablePaths } from "@core/validation/primitives";
import { servicesSchema, type ServicesContent } from "./schemas/services";
import { applyDefaults, describe } from "./admin/form-model";
import type { PageEditorialDescriptor } from "./editorial-adapter-types";
import {
  editorialTextPaths,
  editorialTranslationField,
} from "./editorial-identities";

/** Hidden legacy steps retain numeric translation paths and have no list IDs. */
export const servicesDescriptor: PageEditorialDescriptor = {
  key: "services",
  title: "Services",
  publicPath: "/services",
  rootNode: describe(servicesSchema),
  textPatterns: translatablePaths(servicesSchema),
  listPaths: [],
  maxLocalMedia: 5,
  externalSections: ["catalogue"],
  mediaSlots: [
    { path: "hero.media_media_id", kind: "mixed" },
    { path: "hero.poster_media_id", kind: "image" },
    { path: "final_cta.media_media_id", kind: "mixed" },
    { path: "final_cta.poster_media_id", kind: "image" },
  ],
};

/** Blank scaffold exposes the three slots without persisting inherited locale copy/icons. */
export const normalizeServices = (content: ServicesContent): ServicesContent =>
  applyDefaults(servicesDescriptor.rootNode, content) as ServicesContent;
export const servicesTextPaths = (content: ServicesContent) =>
  editorialTextPaths(content, servicesDescriptor);
export const servicesTranslationField = (
  content: ServicesContent,
  path: string,
) => editorialTranslationField(content, path, servicesDescriptor);
