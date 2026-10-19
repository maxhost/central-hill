import {
  buildingsSchema,
  defaultBuildings,
  type BuildingsContent,
} from "../schemas/buildings";
import { applyDefaults } from "../admin/form-model";
import {
  buildingsMediaReferences,
  buildingsMediaErrors,
} from "../admin/buildings-media-validation";
import {
  buildingsDescriptor,
  normalizeBuildings,
  buildingsIdentityErrors,
  retireBuildingsIds,
  buildingsTextPaths,
  buildingsTranslationField,
} from "../buildings-content";
import type { PageEditorialAdapter } from "../editorial-adapter-types";
export const buildingsAdapter: PageEditorialAdapter<"buildings"> = {
  key: "buildings",
  descriptor: buildingsDescriptor,
  draftSchema: buildingsSchema,
  publishSchema: buildingsSchema,
  defaultContent: () =>
    normalizeBuildings(
      applyDefaults(
        buildingsDescriptor.rootNode,
        structuredClone(defaultBuildings),
      ) as BuildingsContent,
    ),
  normalize: normalizeBuildings,
  identityErrors: buildingsIdentityErrors,
  retireIds: retireBuildingsIds,
  textPaths: buildingsTextPaths,
  translationField: buildingsTranslationField,
  collectMediaReferences: buildingsMediaReferences,
  mediaErrors: buildingsMediaErrors,
  async render(input) {
    const { BuildingsListingRenderer } =
      await import("@slices/buildings/contract");
    return BuildingsListingRenderer({
      ...input,
      page: input.page ?? {
        content: buildingsAdapter.defaultContent(),
        media: {},
        ogImage: null,
      },
    });
  },
};
