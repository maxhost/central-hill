import type { EditorSection } from "@slices/backoffice/contract";
import type { PageEditorialDescriptor } from "../editorial-adapter-types";
import { pageSections } from "./home-contextual";

export type PageEditorView = "page" | "blog_article";
export const BLOG_ARTICLE_EDITOR_URL = "/admin/pages/blog/article-sidebar";

/** Presentation scopes only; both Blog editors retain the complete locale envelope. */
export function editorViewSections(descriptor: PageEditorialDescriptor, label: (key: string) => string, content: unknown, view: PageEditorView): EditorSection[] {
  const sections = pageSections(descriptor, label, content);
  if (descriptor.key !== "blog") return sections;
  return view === "blog_article"
    ? sections.filter(section => section.id === "post_aside").map(section => ({ ...section, label: label("article_sidebar") }))
    : sections.filter(section => section.id !== "post_aside");
}
