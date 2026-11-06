import { getTranslations } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import type { BlogPage } from "@slices/pages/contract";
import type { PostDetail } from "../contract";
import { BlogPostRenderer } from "./blog-post";

/** Private, deterministic example. It never loads, creates or edits a CMS article. */
export async function BlogArticlePreview({ locale, page }: { locale: Locale; page: BlogPage }) {
  const t = await getTranslations({ locale, namespace: "blog.editorPreview" });
  const post: PostDetail = {
    id: "editor-example", slug: "editor-example", title: t("title"), excerpt: t("intro"),
    category: { id: "editor-example", slug: "example", name: t("category"), color: "" },
    author: { id: "editor-example", slug: "central-hill", name: "Central Hill", bio: t("authorNote") },
    body: [
      { type: "heading", level: 2, text: t("firstHeading") },
      { type: "paragraph", text: t("firstParagraph") },
      { type: "heading", level: 2, text: t("secondHeading") },
      { type: "paragraph", text: t("secondParagraph") },
    ],
    cover: null, ogImage: null, bodyMedia: {}, cta: null, related: [], alternateSlugs: {},
    readingMinutes: null, isFeatured: false, publishedAt: null,
  };
  return BlogPostRenderer({ locale, post, page, preview: true });
}
