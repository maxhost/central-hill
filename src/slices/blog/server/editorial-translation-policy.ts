import "server-only";
/** Blog owns its editorial identity policy; legacy rows remain read-only after adaptation. */
export const isBlogEditorialEntity = (type: string): boolean =>
  ["blog_post", "author", "blog_category"].includes(type);
export function getBlogEditorialRedirect(
  type: string,
  id: string,
  locale?: string,
): string | null {
  if (
    !isBlogEditorialEntity(type) ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    return null;
  if (type === "author") return `/admin/authors/${id}`;
  if (type === "blog_category") return `/admin/blog-categories/${id}`;
  const suffix =
    locale && ["en", "es", "pt", "fr"].includes(locale)
      ? `?locale=${locale}`
      : "";
  return `/admin/posts/${id}${suffix}`;
}
