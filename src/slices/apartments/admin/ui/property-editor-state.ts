import type { Locale } from "@core/db/columns";
import type {
  ApartmentEditorialContent,
  ApartmentEnvelope,
} from "../../editorial-types";
import type { PropertyLocaleModel } from "@slices/backoffice/contract";
import {
  apartmentSharedFields,
  apartmentMediaIds,
  apartmentSharedContent,
  apartmentLocalizedContent,
  emptyApartmentEnvelope,
  prepareApartmentTarget,
  overlayApartmentShared,
  semanticEqual,
} from "../../server/editorial-validation";
export const APARTMENT_EDITOR_BINDING_IDS = ["card", "details", "booking"];
export const APARTMENT_SHARED_FIELDS = apartmentSharedFields;
export const emptyPropertyEnvelope = emptyApartmentEnvelope;
export const preparePropertyTarget = prepareApartmentTarget;
export const propertyEnvelopeEqual = semanticEqual;
export const propertyMediaIds = apartmentMediaIds;
export function propertyLocaleDirty(
  model: PropertyLocaleModel<ApartmentEditorialContent>,
  baseline?: ApartmentEnvelope,
): boolean {
  const saved = baseline ?? model.draft ?? model.published ?? model.working;
  return (
    !semanticEqual(
      apartmentLocalizedContent(model.working),
      apartmentLocalizedContent(saved),
    ) || Boolean(baseline && model.working.localeMode !== baseline.localeMode)
  );
}
export interface PropertyLocaleWorkspace {
  model: PropertyLocaleModel<ApartmentEditorialContent>;
  baseline?: ApartmentEnvelope;
  errors: Record<string, string>;
  notice: string;
  conflict: boolean;
}
export type PropertyWorkspace = Record<Locale, PropertyLocaleWorkspace>;
/** A selected save updates English followers, never a customized local form. */
export function applyPropertyLocaleResult(
  states: PropertyWorkspace,
  locale: Locale,
  model: PropertyLocaleModel<ApartmentEditorialContent>,
  notice: string,
  shared?: Partial<ApartmentEditorialContent>,
): PropertyWorkspace {
  const next = {
    ...states,
    [locale]: {
      model,
      baseline: structuredClone(model.working),
      errors: {},
      notice,
      conflict: false,
    },
  };
  if (locale === "en") {
    const source = model.draft ?? model.published ?? model.working;
    for (const target of ["es", "pt", "fr"] as const) {
      const own = next[target];
      if (own.model.working.localeMode !== "inherit") continue;
      const working: ApartmentEnvelope = {
        ...structuredClone(source),
        localeMode: "inherit",
      };
      next[target] = {
        ...own,
        baseline: structuredClone(working),
        model: { ...own.model, working, templateRevision: model.revision },
      };
    }
  }
  if (shared) {
    for (const target of ["en", "es", "pt", "fr"] as const) {
      const own = next[target];
      next[target] = {
        ...own,
        model: {
          ...own.model,
          working: overlayApartmentShared(own.model.working, shared),
        },
      };
    }
  }
  return next;
}
export function changePropertyField<K extends keyof ApartmentEditorialContent>(
  states: PropertyWorkspace,
  locale: Locale,
  key: K,
  value: ApartmentEditorialContent[K],
): PropertyWorkspace {
  const own = states[locale];
  if (semanticEqual(own.model.working.content[key], value)) return states;
  const shared = (apartmentSharedFields as readonly string[]).includes(key);
  if (shared) {
    return Object.fromEntries(
      Object.entries(states).map(([target, current]) => [
        target,
        {
          ...current,
          notice: "",
          model: {
            ...current.model,
            working: {
              ...current.model.working,
              content: {
                ...current.model.working.content,
                [key]: structuredClone(value),
              },
            },
          },
        },
      ]),
    ) as PropertyWorkspace;
  }
  return {
    ...states,
    [locale]: {
      ...own,
      notice: "",
      model: {
        ...own.model,
        templateRevision: null,
        working: {
          ...own.model.working,
          localeMode: "custom",
          content: { ...own.model.working.content, [key]: value },
        },
      },
    },
  };
}
/** Retained compatibility seam; automatic followers replace manual adoption UI. */
export function hasNewPropertySourceDetails(
  states: PropertyWorkspace,
  locale: Locale,
): boolean {
  const source = states.en.model.draft ?? states.en.model.published;
  return (
    locale !== "en" &&
    Boolean(
      source &&
      !semanticEqual(
        apartmentSharedContent(source),
        apartmentSharedContent(states[locale].model.working),
      ),
    )
  );
}
export function adoptPropertySourceDetails(
  states: PropertyWorkspace,
  locale: Locale,
): PropertyWorkspace {
  const source = states.en.model.draft ?? states.en.model.published;
  if (locale === "en" || !source) return states;
  return {
    ...states,
    [locale]: {
      ...states[locale],
      model: {
        ...states[locale].model,
        working: overlayApartmentShared(
          states[locale].model.working,
          apartmentSharedContent(source),
        ),
      },
    },
  };
}
