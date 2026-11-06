import { createElement } from "react";
import { blogSchema, defaultBlog } from "../schemas/blog";
import {
  blogDescriptor,
  normalizeBlog,
  blogTextPaths,
  blogTranslationField,
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
  collectMediaReferences: blogMediaReferences,
  mediaErrors: blogMediaErrors,
  async render(input) {
    const { BlogListingRenderer, BlogArticlePreview } = await import("@slices/blog/contract");
    if (input.surface === "shared_aside") {
      return createElement(BlogArticlePreview, { locale: input.locale, page: input.page ?? {
        content: blogAdapter.defaultContent(), media: {}, ogImage: null,
      } });
    }
    return BlogListingRenderer(input);
  },
};
