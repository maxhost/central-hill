/** Client-safe whole-guide and UUID-keyed common data contract (ADR0066). */
import type { Locale } from '@core/db/columns';
import type { GuideRecommendationType } from './contract';
import { parseGuidePresentation } from './presentation';
import {
  GUIDE_SHARED_ROOT_KEYS, GUIDE_SHARED_PLACE_KEYS,
  type GuideContent, type GuideEnvelope, type GuideSharedContent,
} from './editorial-types';

export function emptyGuideEnvelope(cityId = ''): GuideEnvelope {
  return { schemaVersion: 1, localeMode: 'custom', content: {
    city_id: cityId, template: 'landing', position: 0, hero_media_id: null, og_image_media_id: null,
    title: '', intro: null, meta_title: null, meta_description: null, sections: [],
  } };
}
export function guideRecommendationType(value: string | null): GuideRecommendationType | null {
  const key = value?.trim().toLowerCase();
  return key === 'restaurant' || key === 'viewpoint' || key === 'beach' ? key : null;
}
export function guideSharedContent(content: GuideContent, previous?: GuideSharedContent, locale: Locale = 'en'): GuideSharedContent {
  const sections = { ...previous?.sections };
  const places = { ...previous?.places };
  for (const section of content.sections) {
    const presentation = parseGuidePresentation(section.presentation);
    if (section.presentation != null && !presentation) throw new Error('guide_presentation_invalid');
    sections[section.id] = { header_media_id: section.header_media_id, layout: section.layout, presentation };
    for (const place of section.places) {
      places[place.id] = {
        ...Object.fromEntries(GUIDE_SHARED_PLACE_KEYS.map(key => [key, structuredClone(place[key])])) as Pick<typeof place, typeof GUIDE_SHARED_PLACE_KEYS[number]>,
        section_id: previous?.places[place.id]?.section_id ?? section.id,
        recommendation_type: locale === 'en' ? guideRecommendationType(place.category) : previous?.places[place.id]?.recommendation_type ?? null,
      };
    }
  }
  return { ...Object.fromEntries(GUIDE_SHARED_ROOT_KEYS.map(key => [key, structuredClone(content[key])])) as Pick<GuideContent, typeof GUIDE_SHARED_ROOT_KEYS[number]>, sections, places };
}
export function overlayGuideShared(envelope: GuideEnvelope, shared: GuideSharedContent): GuideEnvelope {
  return { ...envelope, content: {
    ...envelope.content,
    ...Object.fromEntries(GUIDE_SHARED_ROOT_KEYS.map(key => [key, structuredClone(shared[key])])),
    sections: envelope.content.sections.map(section => ({
      ...section,
      ...(shared.sections[section.id] ? structuredClone(shared.sections[section.id]) : {}),
      places: section.places.map(place => ({ ...place,
        ...(shared.places[place.id] ? Object.fromEntries(GUIDE_SHARED_PLACE_KEYS.map(key => [key, structuredClone(shared.places[place.id]![key])])) : {}),
      })),
    })),
  } };
}
function without<T extends object>(value: T, keys: readonly PropertyKey[]): object {
  const result = { ...value };
  for (const key of keys) Reflect.deleteProperty(result, key);
  return result;
}
export function guideLocalizedContent(content: GuideContent): unknown {
  return { ...without(content, GUIDE_SHARED_ROOT_KEYS),
    sections: content.sections.map(section => ({
      ...without(section, ['header_media_id', 'layout', 'presentation']),
      places: section.places.map(place => without(place, GUIDE_SHARED_PLACE_KEYS)),
    })),
  };
}
/** JSONB object order is not significant; localized array order is. */
export function guideValuesEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) || Array.isArray(b)) return Array.isArray(a) && Array.isArray(b)
    && a.length === b.length && a.every((value, index) => guideValuesEqual(value, b[index]));
  const entries = Object.entries(a).filter(([, value]) => value !== undefined);
  return entries.length === Object.entries(b).filter(([, value]) => value !== undefined).length
    && entries.every(([key, value]) => Object.hasOwn(b, key) && guideValuesEqual(value, (b as Record<string, unknown>)[key]));
}
export function guideLocalizedEqual(a: GuideContent, b: GuideContent): boolean {
  return guideValuesEqual(guideLocalizedContent(a), guideLocalizedContent(b));
}
export function guideContentMediaIds(content: GuideContent): string[] {
  return [...new Set([content.hero_media_id, content.og_image_media_id,
    ...content.sections.flatMap(section => [section.header_media_id, ...section.places.map(place => place.media_id)]),
  ].filter((id): id is string => Boolean(id)))];
}
export function guideSharedMediaIds(shared: GuideSharedContent): string[] {
  return [...new Set([shared.hero_media_id, shared.og_image_media_id,
    ...Object.values(shared.sections).map(section => section.header_media_id),
    ...Object.values(shared.places).map(place => place.media_id),
  ].filter((id): id is string => Boolean(id)))];
}
