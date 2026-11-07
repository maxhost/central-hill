import type { Locale } from '@core/db/columns';
import type { AdminMediaPreview } from '@slices/backoffice/contract';
import type { GuidePageEdit, GuidePlaceEdit, GuideCityOption, GuideStatus } from './admin/model';
import type { GuideLayout, GuideRecommendationType } from './contract';
import type { GuideSectionPresentation } from './presentation';

export const GUIDE_EDITOR_LOCALES = ['en', 'es', 'pt', 'fr'] as const;
export type GuideContent = Omit<GuidePageEdit, 'id' | 'slug' | 'slugs' | 'status'>;
export interface GuideEnvelope { schemaVersion: 1; localeMode: 'inherit' | 'custom'; content: GuideContent }
export const GUIDE_SHARED_ROOT_KEYS = ['city_id', 'template', 'position', 'hero_media_id', 'og_image_media_id'] as const;
export const GUIDE_SHARED_PLACE_KEYS = ['media_id', 'address', 'phone', 'price_tier', 'latitude', 'longitude'] as const;
export interface GuideSectionShared {
  header_media_id: string | null;
  layout: GuideLayout;
  presentation: GuideSectionPresentation | null;
}
export type GuidePlaceShared = Pick<GuidePlaceEdit, typeof GUIDE_SHARED_PLACE_KEYS[number]> & {
  /** Stable first registry parent, not the localized tree's current placement. */
  section_id: string;
  /** Eligibility classification remains neutral when a visible category is translated. */
  recommendation_type: GuideRecommendationType | null;
};
export type GuideSharedContent = Pick<GuideContent, typeof GUIDE_SHARED_ROOT_KEYS[number]> & {
  sections: Record<string, GuideSectionShared>;
  places: Record<string, GuidePlaceShared>;
};
export interface GuideLocaleModel {
  locale: Locale; revision: number; templateRevision: number | null;
  published: GuideEnvelope | null; draft: GuideEnvelope | null; working: GuideEnvelope;
}
export interface GuideEditorialModel {
  id: string; status: GuideStatus; slugByLocale: Partial<Record<Locale, string>>;
  citySlugs: Partial<Record<Locale, string>>;
  locales: Record<Locale, GuideLocaleModel>;
  shared: { revision: number; content: GuideSharedContent };
  cities: GuideCityOption[];
  previews: Record<string, AdminMediaPreview>;
}
export interface SaveGuideDraftInput {
  guideId: string; locale: Locale; expectedRevision: number; templateRevision: number | null;
  expectedSharedRevision: number; payload: GuideEnvelope;
  /** Complete maps include rows only present in another locale's unsaved workspace. */
  shared?: GuideSharedContent;
  slug?: string;
}
export interface PublishGuideDraftInput { guideId: string; locale: Locale; expectedRevision: number }
export type GuideEditorialResult =
  | { ok: true; model: GuideEditorialModel }
  | { ok: false; error: 'validation'; fieldErrors: Record<string, string> }
  | { ok: false; error: 'conflict' | 'not_found' | 'legacy_invalid' | 'slug_conflict' | 'no_draft' | 'ownership' | 'server' };
