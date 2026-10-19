import { createElement } from "react";
import { blogSchema, defaultBlog } from "../schemas/blog";
import {
  blogDescriptor,
  normalizeBlog,
  blogTextPaths,
  blogTranslationField,
  blogAsideCta,
} from "../blog-content";
import { blogMediaReferences, blogMediaErrors } from "../admin/blog-media-validation";
import type { PageEditorialAdapter } from "../editorial-adapter-types";

export const blogAdapter: PageEditorialAdapter<"blog"> = {
  key: "blog",
  publicationScope: "layout",
  descriptor: blogDescriptor,
  draftSchema: blogSchema,
  publishSchema: blogSchema,
  defaultContent: () => normalizeBlog(defaultBlog),
  normalize: normalizeBlog,
  identityErrors: () => ({}),
  retireIds: content => structuredClone(content),
  textPaths: blogTextPaths,
  translationField: blogTranslationField,
  collectMediaReferences: (_content, og) => blogMediaReferences(og).map(ref => ({ ...ref, kind: "image" })),
  mediaErrors: (_content, og, assets) => blogMediaErrors(og, assets),
  async render(input) {
    const { BlogListingRenderer, BlogSharedAside } = await import("@slices/blog/contract");
    if (input.surface === "shared_aside") {
      const { getTranslations } = await import("next-intl/server");
      const t = await getTranslations({ locale: input.locale, namespace: "pages" });
      return createElement(BlogSharedAside, {
        asideCta: blogAsideCta(input.page?.content ?? blogAdapter.defaultContent(), input.locale),
        preview: true,
        previewLabel: t("admin.editorial.sharedBlock"),
      });
    }
    return BlogListingRenderer(input);
  },
};
