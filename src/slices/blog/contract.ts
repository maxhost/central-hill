/**
 * Public contract of slice `blog` (the ONLY surface other slices may import).
 * Produces post/category/author read models + cache tags (docs/vertical-slices.md
 * → S4). Body is a constrained portable-JSON block set (ADR 0013). Consumers:
 * S9 pages (featured/teasers), S13 seo-geo (sitemap URLs), S14 translation.
 */
import type { MediaImageData } from "@core/media";
import type { PostBody } from "./body";

/** Entity type used for translation/slug keys and cache tags. */
export const BLOG_POST = "blog_post" as const;

/** Cache tags this slice owns (conventions.md → Cache tags). */
export const BLOG_TAGS = {
  list: "blog_post-list",
  post: (id: string) => `blog_post:${id}`,
} as const;

export interface CategoryRef {
  id: string;
  /** Language-neutral slug (a column, not translated). */
  slug: string;
  name: string;
  /** Brand color for the category chip (hex). */
  color: string;
}

export interface AuthorRef {
  id: string;
  slug: string;
  name: string;
}

export interface PostSummary {
  id: string;
  /** Per-locale public slug. */
  slug: string;
  title: string;
  excerpt: string;
  category: CategoryRef;
  author: AuthorRef;
  cover: MediaImageData | null;
  readingMinutes: number | null;
  isFeatured: boolean;
  /** ISO 8601, or null if not yet published. */
  publishedAt: string | null;
}

export interface PostDetail extends PostSummary {
  body: PostBody;
  /** media_asset.id → resolved image, for inline body image blocks. */
  bodyMedia: Record<string, MediaImageData>;
  cta: { label: string; url: string } | null;
  metaTitle?: string;
  metaDescription?: string;
  ogImage: MediaImageData | null;
  related: PostSummary[];
  /** Per-locale slugs for hreflang alternates. */
  alternateSlugs: Partial<Record<"en" | "pt" | "es" | "fr", string>>;
}

export type { PostBody, BodyBlock } from "./body";

export {
  listPosts,
  getPostBySlug,
  listCategories,
  getFeaturedPost,
  listPostParams,
} from "./server/queries";

/**
 * Backoffice contribution (S12). `blogAdminScreens` is spread into `composeAdminNav`
 * by the admin panel layout; the category/author managers + post list + editors mount
 * under `app/(admin)/admin/(panel)/{blog-categories,authors,posts}/…`. Pure data —
 * safe to import anywhere.
 */
export { blogAdminScreens } from "./admin/screens";
