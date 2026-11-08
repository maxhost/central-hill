import type { MediaAlts } from "@core/media/alt";
import type { Locale } from "@core/db/columns";
import type { PostBody } from "./body";
import type { AdminMediaPreview } from "@slices/backoffice/contract";

export const BLOG_EDITOR_LOCALES = ["en", "es", "pt", "fr"] as const;
/** Persist references and authored values only; resolved media remains ephemeral. */
export interface BlogPostContent {
  /** Localized per-document descriptions; media references remain shared. */
  media_alts?: MediaAlts;
  title: string;
  excerpt: string;
  body: PostBody;
  category_id: string;
  author_id: string;
  cover_media_id: string | null;
  og_image_media_id: string | null;
  published_at: string | null;
  reading_minutes: number | null;
  is_featured: boolean;
  related_ids: string[];
  cta_label: string | null;
  cta_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
}
export interface BlogPostEnvelopeV1 { schemaVersion: 1; content: BlogPostContent }
export interface BlogPostLocaleModel {
  locale: Locale;
  revision: number;
  templateRevision: number | null;
  published: BlogPostEnvelopeV1 | null;
  draft: BlogPostEnvelopeV1 | null;
  working: BlogPostEnvelopeV1;
}
export interface BlogPostEditorialModel {
  id: string;
  archived: boolean;
  slugByLocale: Partial<Record<Locale, string>>;
  locales: Record<Locale, BlogPostLocaleModel>;
  previews: Record<string, AdminMediaPreview>;
}
export interface SaveBlogPostDraftInput {
  /** Stable client-generated identity makes first-save retry recoverable. */
  postId: string;
  locale: Locale;
  expectedRevision: number;
  templateRevision: number | null;
  payload: BlogPostEnvelopeV1;
  /** Only accepted when creating a new identity in EN. */
  slug?: string;
}
export interface PublishBlogPostDraftInput { postId: string; locale: Locale; expectedRevision: number }
export type BlogPostEditorialResult =
  | { ok: true; postId: string; slugByLocale: Partial<Record<Locale, string>>; model: BlogPostLocaleModel; refreshWarning?: boolean }
  | { ok: false; error: "validation"; fieldErrors: Record<string, string> }
  | { ok: false; error: "conflict" | "not_found" | "archived" | "legacy_invalid" | "slug_conflict" | "no_draft" | "server" };
export interface BlogPostPreviewInput {
  postId: string;
  locale: Locale;
  envelope: BlogPostEnvelopeV1;
  slug: string;
  localMedia: Record<string, AdminMediaPreview>;
}
