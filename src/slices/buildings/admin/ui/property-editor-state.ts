import type { Locale } from "@core/db/columns";
import {
  BUILDING_SHARED_KEYS,
  type BuildingEditorialContent,
  type BuildingEnvelope,
  type BuildingSharedContent,
} from "../../editorial-types";
import type { PropertyLocaleModel } from "@slices/backoffice/contract";
export { effectiveBuildingBooking } from "../../booking-button";

export const BUILDING_EDITOR_BINDING_IDS = [
  "identity",
  "hero",
  "gallery",
  "amenities",
  "faq",
  "booking",
  "seo",
];
export const BUILDING_SHARED_FIELDS = BUILDING_SHARED_KEYS;
export function emptyBuildingEnvelope(cityId = ""): BuildingEnvelope {
  return {
    schemaVersion: 1,
    content: {
      name: "",
      headline: "",
      teaser: "",
      description_intro: "",
      description_neighbourhood: null,
      meta_title: null,
      meta_description: null,
      position: 0,
      is_new: false,
      is_featured: false,
      city_id: cityId,
      neighbourhood_id: null,
      street_address: null,
      latitude: null,
      longitude: null,
      cover_media_id: null,
      og_image_media_id: null,
      gallery: [],
      amenity_ids: [],
      faq: [],
      avantio_id: null,
      default_booking_url: null,
      booking_url: null,
      booking_enabled: false,
      booking_button: { label: "Book Now", link: null },
    },
  };
}
/** Common values are global; each customized locale owns its entire FAQ/text. */
export function prepareBuildingTarget(
  source: BuildingEnvelope,
  own: BuildingEnvelope | null,
): BuildingEnvelope {
  if (!own || own.localeMode === "inherit")
    return { ...structuredClone(source), localeMode: "inherit" };
  return overlayBuildingShared(own, buildingSharedContent(source.content));
}
export function buildingSharedContent(
  content: BuildingEditorialContent,
): BuildingSharedContent {
  return Object.fromEntries(
    BUILDING_SHARED_KEYS.map((key) => [key, structuredClone(content[key])]),
  ) as unknown as BuildingSharedContent;
}
export function overlayBuildingShared(
  envelope: BuildingEnvelope,
  shared: Partial<BuildingEditorialContent>,
): BuildingEnvelope {
  return { ...envelope, content: { ...envelope.content, ...shared } };
}
export function buildingLocalizedContent(envelope: BuildingEnvelope) {
  return Object.fromEntries(
    Object.entries(envelope.content).filter(
      ([key]) => !(BUILDING_SHARED_KEYS as readonly string[]).includes(key),
    ),
  );
}
/** JSONB object ordering is not an edit. Ordered collections retain their order. */
export function buildingValuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (
    a === null ||
    b === null ||
    typeof a !== "object" ||
    typeof b !== "object"
  )
    return false;
  if (Array.isArray(a) || Array.isArray(b))
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((value, i) => buildingValuesEqual(value, b[i]))
    );
  const first = a as Record<string, unknown>,
    second = b as Record<string, unknown>;
  const keys = Object.keys(first).filter((key) => first[key] !== undefined);
  return (
    keys.length ===
      Object.keys(second).filter((key) => second[key] !== undefined).length &&
    keys.every(
      (key) =>
        Object.hasOwn(second, key) &&
        buildingValuesEqual(first[key], second[key]),
    )
  );
}
export function buildingEnvelopeEqual(
  a: BuildingEnvelope | null,
  b: BuildingEnvelope | null,
): boolean {
  return buildingValuesEqual(a, b);
}

export function buildingLocaleDirty(
  model: PropertyLocaleModel<BuildingEditorialContent>,
): boolean {
  const baseline = model.draft ?? model.published;
  if (!baseline) return model.working.localeMode !== "inherit";
  return (
    !buildingValuesEqual(
      buildingLocalizedContent(model.working),
      buildingLocalizedContent(baseline),
    ) ||
    (model.working.localeMode === "custom" && baseline.localeMode === "inherit")
  );
}

export function buildingMediaIds(envelope: BuildingEnvelope): string[] {
  return [
    ...new Set(
      [
        envelope.content.cover_media_id,
        envelope.content.og_image_media_id,
        ...envelope.content.gallery,
      ].filter((id): id is string => Boolean(id)),
    ),
  ];
}

export interface BuildingLocaleWorkspace {
  model: PropertyLocaleModel<BuildingEditorialContent>;
  errors: Record<string, string>;
  notice: string;
  conflict: boolean;
}
export type BuildingWorkspace = Record<Locale, BuildingLocaleWorkspace>;

/** English refreshes untouched working text, including inherited saved drafts. */
export function applyBuildingLocaleResult(
  states: BuildingWorkspace,
  locale: Locale,
  model: PropertyLocaleModel<BuildingEditorialContent>,
  notice: string,
): BuildingWorkspace {
  const next = {
    ...states,
    [locale]: { model, errors: {}, notice, conflict: false },
  };
  if (locale !== "en") return next;
  const source = model.draft ?? model.published ?? model.working;
  for (const target of ["es", "pt", "fr"] as const) {
    const own = states[target];
    if (own.model.working.localeMode !== "inherit") continue;
    next[target] = {
      ...own,
      model: {
        ...own.model,
        templateRevision: model.revision,
        working: { ...structuredClone(source), localeMode: "inherit" },
      },
    };
  }
  return next;
}
export function changeBuildingField<K extends keyof BuildingEditorialContent>(
  states: BuildingWorkspace,
  locale: Locale,
  key: K,
  value: BuildingEditorialContent[K],
): BuildingWorkspace {
  if (buildingValuesEqual(states[locale].model.working.content[key], value))
    return states;
  if ((BUILDING_SHARED_KEYS as readonly string[]).includes(key)) {
    return Object.fromEntries(
      Object.entries(states).map(([lang, own]) => [
        lang,
        {
          ...own,
          notice: "",
          model: {
            ...own.model,
            working: {
              ...own.model.working,
              content: {
                ...own.model.working.content,
                [key]: structuredClone(value),
              },
            },
          },
        },
      ]),
    ) as BuildingWorkspace;
  }
  const own = states[locale];
  return {
    ...states,
    [locale]: {
      ...own,
      notice: "",
      model: {
        ...own.model,
        working: {
          ...own.model.working,
          localeMode: "custom",
          content: { ...own.model.working.content, [key]: value },
        },
      },
    },
  };
}
export function applyBuildingSharedResult(
  states: BuildingWorkspace,
  common: Partial<BuildingEditorialContent>,
): BuildingWorkspace {
  return Object.fromEntries(
    Object.entries(states).map(([locale, state]) => [
      locale,
      {
        ...state,
        model: {
          ...state.model,
          working: overlayBuildingShared(state.model.working, common),
        },
      },
    ]),
  ) as BuildingWorkspace;
}
/** Compatibility helpers for old callers; forms no longer offer adoption. */
export function hasNewBuildingSourceDetails(
  states: BuildingWorkspace,
  locale: Locale,
): boolean {
  const source = states.en.model.draft ?? states.en.model.published;
  return Boolean(
    locale !== "en" &&
    source &&
    !buildingValuesEqual(
      buildingSharedContent(source.content),
      buildingSharedContent(states[locale].model.working.content),
    ),
  );
}
export function adoptBuildingSourceDetails(
  states: BuildingWorkspace,
  locale: Locale,
): BuildingWorkspace {
  const source = states.en.model.draft ?? states.en.model.published;
  if (locale === "en" || !source) return states;
  const own = states[locale];
  return {
    ...states,
    [locale]: {
      ...own,
      notice: "",
      model: {
        ...own.model,
        working: overlayBuildingShared(
          own.model.working,
          buildingSharedContent(source.content),
        ),
        templateRevision: states.en.model.revision,
      },
    },
  };
}
