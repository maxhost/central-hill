import { translatablePaths } from "@core/validation/primitives";
import { buildingsSchema, type BuildingsContent } from "./schemas/buildings";
import { describe } from "./admin/form-model";
import type { PageEditorialDescriptor } from "./editorial-adapter-types";
import {
  normalizeEditorial,
  editorialIdentityErrors,
  editorialTextPaths,
  editorialTranslationField,
  retireEditorialIds,
} from "./editorial-identities";
export const buildingsDescriptor: PageEditorialDescriptor = {
  key: "buildings",
  title: "Buildings",
  publicPath: "/buildings",
  rootNode: describe(buildingsSchema),
  textPatterns: translatablePaths(buildingsSchema),
  listPaths: ["stats.figures"],
  maxLocalMedia: 3,
  externalSections: ["catalogue"],
  mediaSlots: [
    { path: "hero.image_media_id", kind: "image" },
    { path: "calculator.media_media_id", kind: "mixed" },
  ],
};
export const normalizeBuildings = (
  content: BuildingsContent,
): BuildingsContent => normalizeEditorial(content, buildingsDescriptor);
export const buildingsIdentityErrors = (
  content: BuildingsContent,
  previous?: BuildingsContent,
) => editorialIdentityErrors(content, previous, buildingsDescriptor);
export const retireBuildingsIds = (
  content: BuildingsContent,
  previous: BuildingsContent,
): BuildingsContent =>
  retireEditorialIds(content, previous, buildingsDescriptor);
export const buildingsTextPaths = (content: BuildingsContent) =>
  editorialTextPaths(content, buildingsDescriptor);
export const buildingsTranslationField = (
  content: BuildingsContent,
  path: string,
) => editorialTranslationField(content, path, buildingsDescriptor);
