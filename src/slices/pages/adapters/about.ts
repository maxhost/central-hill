import { aboutSchema, defaultAbout } from "../schemas/about";
import {
  aboutDescriptor,
  normalizeAbout,
  aboutIdentityErrors,
  retireAboutIds,
  aboutTextPaths,
  aboutTranslationField,
} from "../about-content";
import { aboutMediaReferences, aboutMediaErrors } from "../admin/about-media-validation";
import type { PageEditorialAdapter } from "../editorial-adapter-types";

export const aboutAdapter: PageEditorialAdapter<"about"> = {
  key: "about",
  descriptor: aboutDescriptor,
  draftSchema: aboutSchema,
  publishSchema: aboutSchema,
  defaultContent: () => normalizeAbout(defaultAbout),
  normalize: normalizeAbout,
  identityErrors: aboutIdentityErrors,
  retireIds: retireAboutIds,
  textPaths: aboutTextPaths,
  translationField: aboutTranslationField,
  collectMediaReferences: (content, og) => aboutMediaReferences(content, og).map(ref => ({
    path: ref.path,
    id: ref.id,
    kind: ref.mixed ? "mixed" : "image",
  })),
  mediaErrors: aboutMediaErrors,
  async render(input) {
    const { AboutPage } = await import("../ui/about-page");
    return AboutPage(input);
  },
};
