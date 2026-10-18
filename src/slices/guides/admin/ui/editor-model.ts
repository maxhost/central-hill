import type {
  GuidePageEdit,
  GuideSectionEdit,
  GuidePlaceEdit,
  GuidePageMutation,
  GuideSectionMutation,
  GuidePlaceMutation,
} from "../model";

const pageColumns = [
  "city_id",
  "template",
  "status",
  "position",
  "hero_media_id",
  "og_image_media_id",
] as const;
const pageSource = [
  "title",
  "intro",
  "meta_title",
  "meta_description",
] as const;
const sectionColumns = [
  "position",
  "header_media_id",
  "cta_url",
  "presentation",
] as const;
const sectionSource = ["title", "body", "local_tip", "cta_label"] as const;
const placeColumns = [
  "position",
  "category",
  "address",
  "phone",
  "price_tier",
  "opening_hours",
  "latitude",
  "longitude",
  "website_url",
  "booking_url",
  "media_id",
] as const;
const placeSource = ["name", "description"] as const;
function changed<T extends object, K extends keyof T>(
  value: T,
  saved: T | undefined,
  keys: readonly K[],
): Pick<T, K> {
  return Object.fromEntries(
    keys
      .filter(
        (k) => !saved || JSON.stringify(value[k]) !== JSON.stringify(saved[k]),
      )
      .map((k) => [k, value[k]]),
  ) as Pick<T, K>;
}
export function pagePatch(
  value: GuidePageEdit,
  saved?: GuidePageEdit,
): GuidePageMutation {
  const slugs = changed(value.slugs, saved?.slugs, ["en", "pt", "es", "fr"]);
  return {
    id: value.id,
    ...(!saved ? { create: true } : {}),
    changes: changed(value, saved, pageColumns),
    source: changed(value, saved, pageSource),
    ...(Object.values(slugs).some((v) => v !== undefined)
      ? {
          slugs: Object.fromEntries(
            Object.entries(slugs).filter(([, v]) => v !== undefined),
          ),
        }
      : {}),
  };
}
export function sectionPatch(
  value: GuideSectionEdit,
  saved?: GuideSectionEdit,
): GuideSectionMutation {
  return {
    id: value.id,
    ...(!saved ? { create: true } : {}),
    changes: changed(
      value,
      saved,
      sectionColumns,
    ) as GuideSectionMutation["changes"],
    source: changed(value, saved, sectionSource),
  };
}
export function placePatch(
  value: GuidePlaceEdit,
  saved?: GuidePlaceEdit,
): GuidePlaceMutation {
  return {
    id: value.id,
    ...(!saved ? { create: true } : {}),
    changes: changed(value, saved, placeColumns),
    source: changed(value, saved, placeSource),
  };
}
export function patchIsDirty(patch: {
  create?: boolean;
  changes: object;
  source: object;
  slugs?: object;
}): boolean {
  return Boolean(
    patch.create ||
    Object.keys(patch.changes).length ||
    Object.keys(patch.source).length ||
    Object.keys(patch.slugs ?? {}).length,
  );
}
export function newGuide(id: string, cityId = ""): GuidePageEdit {
  return {
    id,
    city_id: cityId,
    template: "landing",
    status: "draft",
    position: 0,
    hero_media_id: null,
    og_image_media_id: null,
    title: "",
    intro: null,
    meta_title: null,
    meta_description: null,
    slug: "",
    slugs: { en: "" },
    sections: [],
  };
}
export function newSection(
  id: string,
  pageId: string,
  position: number,
): GuideSectionEdit {
  return {
    id,
    guide_page_id: pageId,
    position,
    layout: "standard",
    header_media_id: null,
    cta_url: null,
    presentation: { version: 1, enabled: false },
    title: "",
    body: null,
    local_tip: null,
    cta_label: null,
    places: [],
  };
}
export function newPlace(
  id: string,
  sectionId: string,
  position: number,
): GuidePlaceEdit {
  return {
    id,
    guide_section_id: sectionId,
    position,
    name: "",
    description: null,
    category: null,
    address: null,
    phone: null,
    price_tier: null,
    opening_hours: null,
    latitude: null,
    longitude: null,
    website_url: null,
    booking_url: null,
    media_id: null,
  };
}
export function moveItem<T extends { id: string; position: number }>(
  items: T[],
  id: string,
  offset: number,
): T[] {
  const index = items.findIndex((item) => item.id === id),
    target = index + offset;
  if (index < 0 || target < 0 || target >= items.length) return items;
  const next = [...items];
  const current = next[index],
    destination = next[target];
  if (!current || !destination) return items;
  next[index] = destination;
  next[target] = current;
  return next.map((item, position) => ({ ...item, position }));
}
export function fieldError(
  errors: Record<string, string>,
  name: string,
): string | undefined {
  return errors[name] ?? errors[`source.${name}`] ?? errors[`changes.${name}`];
}

/** Append after the highest stored position, including gaps left by deletion. */
export function nextPosition(items: readonly { position: number }[]): number {
  return items.length ? Math.max(...items.map((item) => item.position)) + 1 : 0;
}
