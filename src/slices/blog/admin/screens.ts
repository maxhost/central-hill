import type { AdminScreen } from "@slices/backoffice/contract";

/**
 * Backoffice screens contributed by slice `blog` (S12 plug-in). Three `content`-group
 * screens: category manager, author manager, and the post list; create/edit for each
 * live at child routes. Label keys resolve against the `backoffice` namespace.
 */
export const blogAdminScreens: AdminScreen[] = [
  {
    id: "blog.categories",
    href: "/admin/blog-categories",
    label: "nav.blogCategories",
    group: "content",
    order: 80,
  },
  { id: "blog.authors", href: "/admin/authors", label: "nav.authors", group: "content", order: 85 },
  { id: "blog.posts", href: "/admin/posts", label: "nav.posts", group: "content", order: 90 },
];
