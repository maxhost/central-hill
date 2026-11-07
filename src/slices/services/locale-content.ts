/** Pure contract helpers shared by the form, legacy projection and public readers. */
import { EMPTY_DETAIL } from './detail';
import { SERVICE_SHARED_KEYS, type ServiceContent, type ServiceEnvelope, type ServiceSharedContent } from './editorial-types';

export function emptyServiceEnvelope(categoryId = ''): ServiceEnvelope {
  return { schemaVersion: 1, localeMode: 'custom', content: {
    position: 0, category_id: categoryId, cover_media_id: null, og_image_media_id: null,
    price_from: null, rating_tenths: null, booking_type: 'none', presentation: null, gallery: [],
    name: '', excerpt: '', body: '', duration_label: null, price_suffix: null,
    cta_label: null, cta_url: null, meta_title: null, meta_description: null,
    detail: structuredClone(EMPTY_DETAIL), copy: {},
  } };
}
/** Legacy ordinal slots get keys only at initial projection. Existing ids never change. */
export function identifyServiceContent(content: ServiceContent): ServiceContent {
  return { ...content, detail: { ...content.detail,
    facts: content.detail.facts.map((fact, index) => ({ ...fact, id: fact.id ?? `legacy-fact-${index}` })),
    itinerary: content.detail.itinerary.map((step, index) => ({ ...step, id: step.id ?? `legacy-step-${index}` })),
  } };
}
export function serviceSharedContent(content: ServiceContent, previous?: ServiceSharedContent): ServiceSharedContent {
  const c = identifyServiceContent(content);
  return { ...Object.fromEntries(SERVICE_SHARED_KEYS.map(key => [key, structuredClone(c[key])])) as Pick<ServiceContent, typeof SERVICE_SHARED_KEYS[number]>,
    factIcons: { ...previous?.factIcons, ...Object.fromEntries(c.detail.facts.map(f => [f.id!, f.icon])) },
    itineraryMedia: { ...previous?.itineraryMedia, ...Object.fromEntries(c.detail.itinerary.map(s => [s.id!, s.media_id ?? null])) },
  };
}
function withoutKey<T extends object, K extends keyof T>(value: T, key: K): Omit<T, K> {
  const result = { ...value };
  Reflect.deleteProperty(result, key);
  return result;
}
export function overlayServiceShared(envelope: ServiceEnvelope, shared: ServiceSharedContent): ServiceEnvelope {
  const c = identifyServiceContent(envelope.content);
  const root = Object.fromEntries(SERVICE_SHARED_KEYS.map(key => [key, structuredClone(shared[key])]));
  return { ...envelope, content: { ...c, ...root,
    detail: { ...c.detail,
      facts: c.detail.facts.map(f => ({ ...f, icon: shared.factIcons[f.id!] ?? f.icon })),
      itinerary: c.detail.itinerary.map(s => {
        if (!Object.hasOwn(shared.itineraryMedia, s.id!)) return s;
        const text = withoutKey(s, "media_id");
        const id = shared.itineraryMedia[s.id!];
        return { ...text, ...(id ? { media_id: id } : {}) };
      }),
    },
  } };
}
export function serviceLocalizedContent(content: ServiceContent): unknown {
  const c = identifyServiceContent(content);
  const local = { ...c } as Partial<ServiceContent>;
  for (const key of SERVICE_SHARED_KEYS) delete local[key];
  return { ...local, detail: { ...c.detail,
    facts: c.detail.facts.map(fact => withoutKey(fact, "icon")),
    itinerary: c.detail.itinerary.map(step => withoutKey(step, "media_id")),
  } };
}
/** JSONB does not retain object key order. Array order remains meaningful. */
export function serviceValuesEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) || Array.isArray(b)) return Array.isArray(a) && Array.isArray(b)
    && a.length === b.length && a.every((value, index) => serviceValuesEqual(value, b[index]));
  const left = Object.entries(a).filter(([, value]) => value !== undefined);
  const right = Object.entries(b).filter(([, value]) => value !== undefined);
  return left.length === right.length && left.every(([key, value]) => Object.hasOwn(b, key)
    && serviceValuesEqual(value, (b as Record<string, unknown>)[key]));
}
export function serviceLocalizedEqual(a: ServiceContent, b: ServiceContent): boolean {
  return serviceValuesEqual(serviceLocalizedContent(a), serviceLocalizedContent(b));
}
export function serviceContentMediaIds(content: ServiceContent): string[] {
  return [...new Set([content.cover_media_id, content.og_image_media_id, ...content.gallery,
    ...content.detail.itinerary.map(step => step.media_id)].filter((id): id is string => Boolean(id)))];
}
