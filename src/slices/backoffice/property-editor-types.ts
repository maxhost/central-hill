import type { Locale } from "@core/db/columns";
import type { AdminMediaPreview } from "./server/media-actions";
export const PROPERTY_EDITOR_LOCALES = ["en", "es", "pt", "fr"] as const;
export interface PropertyEnvelope<C> { schemaVersion: 1; localeMode?: "inherit" | "custom"; content: C }
export interface PropertyLocaleModel<C> {
  locale: Locale; revision: number; templateRevision: number | null;
  published: PropertyEnvelope<C> | null; draft: PropertyEnvelope<C> | null; working: PropertyEnvelope<C>;
}
export interface PropertySharedState<C> {
  revision: number; content: Partial<C>; working?: Partial<C>;
}
export interface PropertyEditorialModel<C> {
  id: string; parentId?: string; archived: boolean;
  slugByLocale: Partial<Record<Locale, string>>;
  locales: Record<Locale, PropertyLocaleModel<C>>;
  previews: Record<string, AdminMediaPreview>;
  shared?: PropertySharedState<C>;
}
export interface SavePropertyDraftInput<C> {
  id: string; parentId?: string; locale: Locale; expectedRevision: number;
  templateRevision: number | null; payload: PropertyEnvelope<C>; slug?: string;
  expectedSharedRevision?: number; sharedChanged?: boolean;
}
export interface PublishPropertyDraftInput { id: string; parentId?: string; locale: Locale; expectedRevision: number }
export type PropertyEditorialResult<C> =
  | { ok: true; id: string; parentId?: string; slugByLocale: Partial<Record<Locale, string>>; model: PropertyLocaleModel<C>; shared?: PropertySharedState<C>; previews?: Record<string, AdminMediaPreview>; refreshWarning?: boolean }
  | { ok: false; error: "validation"; fieldErrors: Record<string, string> }
  | { ok: false; error: "conflict" | "not_found" | "archived" | "legacy_invalid" | "slug_conflict" | "no_draft" | "server" | "in_use" };
export interface PropertyPreviewInput<C> {
  id: string; parentId?: string; locale: Locale; slug?: string;
  envelope: PropertyEnvelope<C>; localMedia: Record<string, AdminMediaPreview>;
}
