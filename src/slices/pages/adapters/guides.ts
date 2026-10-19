import { createElement } from "react";
import { defaultGuides, guidesSchema } from "../schemas/guides";
import {
  guidesMediaReferences,
  guidesMediaErrors,
} from "../admin/guides-media-validation";
import {
  guidesDescriptor,
  normalizeGuides,
  guidesTextPaths,
  guidesTranslationField,
  guidesAsideCta,
} from "../guides-content";
import type { PageEditorialAdapter } from "../editorial-adapter-types";

export const guidesAdapter: PageEditorialAdapter<"guides"> = {
  key: "guides",
  publicationScope: "layout",
  descriptor: guidesDescriptor,
  draftSchema: guidesSchema,
  publishSchema: guidesSchema,
  defaultContent: () => normalizeGuides(defaultGuides),
  normalize: normalizeGuides,
  identityErrors: () => ({}),
  retireIds: (content) => structuredClone(content),
  textPaths: guidesTextPaths,
  translationField: guidesTranslationField,
  collectMediaReferences: guidesMediaReferences,
  mediaErrors: guidesMediaErrors,
  async render(input) {
    const { GuidesListingRenderer, GuideSharedAside } =
      await import("@slices/guides/contract");
    if (input.surface !== "shared_aside") return GuidesListingRenderer(input);
    const { getTranslations } = await import("next-intl/server");
    const t = await getTranslations({
      locale: input.locale,
      namespace: "pages.admin.editorial",
    });
    const page = input.page ?? {
      content: normalizeGuides(defaultGuides),
      media: {},
      ogImage: null,
    };
    return createElement(
      "section",
      { className: "mx-auto max-w-[440px] px-7 py-12" },
      createElement(
        "h1",
        { className: "mb-6 text-sm font-semibold text-ink-soft" },
        t("sharedBlock"),
      ),
      createElement(
        "div",
        { "data-editor-binding": "guide_aside" },
        createElement(GuideSharedAside, {
          asideCta: guidesAsideCta(page, input.locale),
        }),
      ),
    );
  },
};
