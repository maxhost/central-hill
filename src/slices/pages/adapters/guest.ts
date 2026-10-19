import { z } from "zod";
import { guestSchema, type GuestContent } from "../schemas/guest";
import { applyDefaults } from "../admin/form-model";
import {
  guestMediaReferences,
  guestMediaErrors,
} from "../admin/guest-media-validation";
import {
  guestDescriptor,
  normalizeGuest,
  guestIdentityErrors,
  retireGuestIds,
  guestTextPaths,
  guestTranslationField,
} from "../guest-content";
import type { PageEditorialAdapter } from "../editorial-adapter-types";
const unfinishedUrl = z.union([z.literal(""), z.url()]);
const incompleteCta = guestSchema.shape.hero.shape.cta.extend({
  url: unfinishedUrl,
});
const incompleteWithNote = guestSchema.shape.why.shape.cta.extend({
  url: unfinishedUrl,
});
export const guestDraftSchema = guestSchema.extend({
  hero: guestSchema.shape.hero.extend({ cta: incompleteCta }),
  why: guestSchema.shape.why.extend({ cta: incompleteWithNote }),
  portfolio: guestSchema.shape.portfolio.extend({ cta: incompleteWithNote }),
  services_teaser: guestSchema.shape.services_teaser.extend({
    cta: incompleteWithNote,
  }),
  activities_teaser: guestSchema.shape.activities_teaser.extend({
    cta: incompleteWithNote,
  }),
  dual_cta: guestSchema.shape.dual_cta.extend({
    guest: guestSchema.shape.dual_cta.shape.guest.extend({
      cta: incompleteCta,
    }),
    owner: guestSchema.shape.dual_cta.shape.owner.extend({
      cta: incompleteCta,
    }),
  }),
});
export const guestAdapter: PageEditorialAdapter<"guest"> = {
  key: "guest",
  descriptor: guestDescriptor,
  draftSchema: guestDraftSchema,
  publishSchema: guestSchema,
  defaultContent() {
    const content = applyDefaults(guestDescriptor.rootNode, {}) as GuestContent;
    for (const list of [
      content.why.benefits,
      content.services_teaser.items,
      content.activities_teaser.items,
    ])
      for (const item of list) item.icon_key = "check";
    return normalizeGuest(content);
  },
  normalize: normalizeGuest,
  identityErrors: guestIdentityErrors,
  retireIds: retireGuestIds,
  textPaths: guestTextPaths,
  translationField: guestTranslationField,
  collectMediaReferences: guestMediaReferences,
  mediaErrors: guestMediaErrors,
  async render(input) {
    const { GuestPage } = await import("../ui/guest-page");
    return GuestPage(input);
  },
};
