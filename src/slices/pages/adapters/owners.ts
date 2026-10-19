import { z } from "zod";
import { ownersSchema, type OwnersContent } from "../schemas/owners";
import { applyDefaults } from "../admin/form-model";
import {
  ownersMediaReferences,
  ownersMediaErrors,
} from "../admin/owners-media-validation";
import {
  ownersDescriptor,
  normalizeOwners,
  ownersIdentityErrors,
  retireOwnersIds,
  ownersTextPaths,
  ownersTranslationField,
} from "../owners-content";
import type { PageEditorialAdapter } from "../editorial-adapter-types";
const unfinishedUrl = z.union([z.literal(""), z.url()]);
const unfinishedCta = ownersSchema.shape.why.shape.cta_primary.extend({
  url: unfinishedUrl,
});
const helper = ownersSchema.shape.plans.shape.helpers.element;
export const ownersDraftSchema = ownersSchema.extend({
  why: ownersSchema.shape.why.extend({
    cta_primary: unfinishedCta,
    cta_secondary: unfinishedCta,
  }),
  services: ownersSchema.shape.services.extend({ cta: unfinishedCta }),
  dashboard: ownersSchema.shape.dashboard.extend({ cta: unfinishedCta }),
  plans: ownersSchema.shape.plans.extend({
    helpers: z
      .array(
        helper.extend({
          cta: helper.shape.cta
            .unwrap()
            .extend({ url: unfinishedUrl })
            .optional(),
        }),
      )
      .length(1),
  }),
});
export const ownersAdapter: PageEditorialAdapter<"owners"> = {
  key: "owners",
  descriptor: ownersDescriptor,
  draftSchema: ownersDraftSchema,
  publishSchema: ownersSchema,
  defaultContent() {
    const content = applyDefaults(
      ownersDescriptor.rootNode,
      {},
    ) as OwnersContent;
    for (const list of [
      content.why.benefits,
      content.services.benefits,
      content.dashboard.benefits,
    ])
      for (const item of list) item.icon_key = "check";
    return normalizeOwners(content);
  },
  normalize: normalizeOwners,
  identityErrors: ownersIdentityErrors,
  retireIds: retireOwnersIds,
  textPaths: ownersTextPaths,
  translationField: ownersTranslationField,
  collectMediaReferences: ownersMediaReferences,
  mediaErrors: ownersMediaErrors,
  async render(input) {
    const { OwnersPage } = await import("../ui/owners-page");
    return OwnersPage(input);
  },
};
