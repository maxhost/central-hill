import { homeSchema } from "../schemas/home";
import { normalizeHome, homeIdentityErrors, retireHomeIds, homeTextPaths, homeTranslationField, HOME_LIST_PATHS } from "../home-content";
import { homeMediaReferences, homeMediaErrors } from "../admin/home-media-validation";
import { homeDraftSchema } from "../admin/editorial-validation";
import { applyDefaults, describe } from "../admin/form-model";
import type { HomeContent } from "../schemas/home";
import type { PageEditorialAdapter } from "../editorial-adapter-types";
import { translatablePaths } from "@core/validation/primitives";
export const homeAdapter: PageEditorialAdapter<"home"> = {
 key: "home",
 descriptor: { key: "home", title: "Home", publicPath: "", rootNode: describe(homeSchema), textPatterns: translatablePaths(homeSchema), listPaths: [...HOME_LIST_PATHS], maxLocalMedia: 6, externalSections: ["avantio", "portfolio", "services_carousel", "faq"], mediaSlots: [
 {path:"hero.video_media_id",kind:"video"},{path:"hero.poster_media_id",kind:"image"},{path:"guests_pitch.image_media_id",kind:"mixed"},{path:"dual_cta.owner.image_media_id",kind:"image"},{path:"dual_cta.guest.image_media_id",kind:"image"},
 ] },
 draftSchema: homeDraftSchema, publishSchema: homeSchema,
 defaultContent: () => normalizeHome(applyDefaults(describe(homeSchema), {}) as HomeContent),
 normalize: normalizeHome, identityErrors: homeIdentityErrors, retireIds: retireHomeIds,
 textPaths: homeTextPaths, translationField: homeTranslationField,
 collectMediaReferences: homeMediaReferences, mediaErrors: homeMediaErrors,
 async render(input) { const {HomePage} = await import("../ui/home-page"); return HomePage(input); },
};
