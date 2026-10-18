import { translatablePaths } from "@core/validation/primitives";
import { blogSchema, defaultBlog, type BlogContent } from "./schemas/blog";

/** Blank overrides inherit visitor-locale messages; these values are never persisted as defaults. */
export const BLOG_FALLBACK_KEYS = {
  "seo.meta_title": "metaTitle",
  "seo.meta_description": "metaDescription",
  "hero.eyebrow": "eyebrow",
  "hero.headline": "title",
  "hero.intro": "intro",
  "hero.search_placeholder": "searchPlaceholder",
  "hero.search_label": "searchLabel",
  "featured.eyebrow": "featured",
  "journal.eyebrow": "latestEyebrow",
  "journal.title": "latestTitle",
  "newsletter.eyebrow": "newsletter.eyebrow",
  "newsletter.title": "newsletter.title",
  "newsletter.description": "newsletter.description",
} as const;

export function blogSourceContent(raw: unknown): BlogContent {
  const parsed = blogSchema.safeParse(raw);
  return parsed.success ? parsed.data : structuredClone(defaultBlog);
}

/** Only authored nonblank leaves can have translations, including the existing aside. */
export function blogSourceFields(content: BlogContent): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const path of translatablePaths(blogSchema)) {
    let value: unknown = content;
    for (const key of path.split(".")) value = value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined;
    if (typeof value === "string" && value.trim()) fields[`block:${path}`] = value;
  }
  return fields;
}

/** Do not revive cleared source overrides from a stale target row. */
export function blogLocalizedContent(source: BlogContent, translated: unknown): BlogContent {
  const result = structuredClone(source) as Record<string, unknown>;
  const target = blogSchema.safeParse(translated);
  if (!target.success) return source;
  for (const field of Object.keys(blogSourceFields(source))) {
    const [group, leaf] = field.slice(6).split(".") as [keyof BlogContent, string];
    const candidate = (target.data[group] as Record<string, unknown> | undefined)?.[leaf];
    if (typeof candidate === "string" && candidate.trim()) (result[group] as Record<string, unknown>)[leaf] = candidate;
  }
  return result as BlogContent;
}
