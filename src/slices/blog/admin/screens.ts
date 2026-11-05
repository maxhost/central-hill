import type { AdminScreen } from "@slices/backoffice/contract";

/**
 * Backoffice screens contributed by slice `blog` (S12 plug-in). Three `website`-group
 * screens: category manager, author manager, and the post list; create/edit for each
 * live at child routes. Label keys resolve against the `backoffice` namespace.
 */
export const blogAdminScreens: AdminScreen[] = [
  {
    id: "blog.categories",
    href: "/admin/blog-categories",
    label: "nav.blogCategories",
    group: "website",
    order: 80,
    parentId: "blog.posts",
  },
  { id: "blog.authors", href: "/admin/authors", label: "nav.authors", group: "website", order: 85, parentId: "blog.posts" },
  { id: "blog.posts", href: "/admin/posts", label: "nav.posts", group: "website", order: 40 },
];
