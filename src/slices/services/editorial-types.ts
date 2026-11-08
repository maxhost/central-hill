import type { MediaAlts } from '@core/media/alt';
import type { Locale } from '@core/db/columns';
import type { AdminMediaPreview } from '@slices/backoffice/contract';
import type { ServiceSaveInput } from './admin/validation';

export const SERVICE_EDITOR_LOCALES = ['en', 'es', 'pt', 'fr'] as const;
export const SERVICE_TARGET_LOCALES = ['es', 'pt', 'fr'] as const;
export type ServiceContent = Omit<ServiceSaveInput, 'id' | 'slug' | 'status' | 'cover_media_id'> & { cover_media_id: string | null; media_alts?: MediaAlts };
export interface ServiceEnvelope { schemaVersion: 1; localeMode: 'inherit' | 'custom'; content: ServiceContent }
export const SERVICE_SHARED_KEYS = ['position', 'category_id', 'cover_media_id', 'og_image_media_id', 'price_from', 'rating_tenths', 'booking_type', 'presentation', 'gallery'] as const;
export type ServiceSharedContent = Pick<ServiceContent, typeof SERVICE_SHARED_KEYS[number]> & {
  factIcons: Record<string, ServiceContent['detail']['facts'][number]['icon']>;
  itineraryMedia: Record<string, string | null>;
};
export interface ServiceLocaleModel {
  locale: Locale; revision: number; templateRevision: number | null;
  published: ServiceEnvelope | null; draft: ServiceEnvelope | null; working: ServiceEnvelope;
}
export interface ServiceEditorialModel {
  id: string; status: 'draft' | 'published' | 'archived'; slugByLocale: Partial<Record<Locale, string>>;
  locales: Record<Locale, ServiceLocaleModel>;
  shared: { revision: number; content: ServiceSharedContent };
  previews: Record<string, AdminMediaPreview>;
}
export interface SaveServiceDraftInput {
  serviceId: string; locale: Locale; expectedRevision: number; templateRevision: number | null;
  expectedSharedRevision: number; payload: ServiceEnvelope; shared?: ServiceSharedContent; slug?: string;
}
export interface PublishServiceDraftInput { serviceId: string; locale: Locale; expectedRevision: number }
export type ServiceEditorialResult =
  | { ok: true; model: ServiceEditorialModel }
  | { ok: false; error: 'validation'; fieldErrors: Record<string, string> }
  | { ok: false; error: 'conflict' | 'not_found' | 'archived' | 'legacy_invalid' | 'slug_conflict' | 'no_draft' | 'server' };
export interface ServiceCategoryOption { id: string; name: string; names?: Record<Locale, string> }
export type ServiceCategoryTranslations = Record<typeof SERVICE_TARGET_LOCALES[number], string>;
