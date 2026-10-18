import { BLOG_FALLBACK_KEYS } from "../blog-content";
import { blogSchema, defaultBlog } from "../schemas/blog";

/** Absence scaffolds only the historical aside; invalid saved source is never repaired. */
export function blogEditorDefaults(raw: unknown, exists: boolean) {
  const parsed = blogSchema.safeParse(exists ? raw : defaultBlog);
  const sourceStatus = !exists ? "absent" as const : parsed.success ? "valid" as const : "invalid" as const;
  return { data: parsed.success ? structuredClone(parsed.data) : {}, sourceStatus, sourceInvalid: !parsed.success };
}

export function blogInheritedValues(message: (key: string) => string): Record<string, string> {
  return Object.fromEntries(Object.entries(BLOG_FALLBACK_KEYS).map(([path, key]) => [path, message(key)]));
}
