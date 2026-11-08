import type { GeographyNameTranslations } from "../../reference-name-types";
import type { CityEditData } from "../queries";
import type { CitySaveInput } from "../validation";

export interface NeighbourhoodFormValues {
  /** Stable UI identity, retained when a newly saved row receives its DB ID. */
  clientKey: string;
  id?: string;
  slug: string;
  name: string;
  translations: GeographyNameTranslations;
}

export interface CityFormValues {
  slug: string;
  position: string;
  status: CityEditData["status"];
  country: string;
  hero_media_id: string;
  hero_alts?: import("@core/media/owner-alt").OwnerMediaAlts;
  name: string;
  translations: GeographyNameTranslations;
  intro: string;
  neighbourhoods: NeighbourhoodFormValues[];
}

/** Missing targets stay blank; authored values are never replaced by EN copies. */
export function nameFormTranslations(
  translations?: Partial<GeographyNameTranslations>,
): GeographyNameTranslations {
  return {
    es: translations?.es ?? "",
    pt: translations?.pt ?? "",
    fr: translations?.fr ?? "",
  };
}

export function cityFormValues(data: CityEditData | null): CityFormValues {
  return {
    slug: data?.slug ?? "",
    position: String(data?.position ?? 0),
    status: data?.status ?? "draft",
    country: data?.country ?? "PT",
    hero_media_id: data?.hero_media_id ?? "",
    hero_alts: data?.hero_alts,
    name: data?.name ?? "",
    translations: nameFormTranslations(data?.translations),
    intro: data?.intro ?? "",
    neighbourhoods:
      data?.neighbourhoods.map((row) => ({
        clientKey: row.id,
        id: row.id,
        slug: row.slug,
        name: row.name,
        translations: nameFormTranslations(row.translations),
      })) ?? [],
  };
}

function namePayload(translations: GeographyNameTranslations) {
  return {
    es: translations.es.trim(),
    pt: translations.pt.trim(),
    fr: translations.fr.trim(),
  };
}

/** A single Save explicitly authors every name, including blank fallback targets. */
export function cityNamePayload(
  state: CityFormValues,
  id?: string,
): CitySaveInput {
  const position = Number.parseInt(state.position, 10);
  return {
    id,
    slug: state.slug.trim(),
    position: Number.isFinite(position) ? position : 0,
    status: state.status,
    country: state.country.trim().toUpperCase(),
    hero_media_id: state.hero_media_id || null,
    hero_alts: state.hero_alts,
    name: state.name.trim(),
    translations: namePayload(state.translations),
    intro: state.intro.trim() || null,
    neighbourhoods: state.neighbourhoods.map((row) => ({
      id: row.id,
      slug: row.slug.trim(),
      name: row.name.trim(),
      translations: namePayload(row.translations),
    })),
  };
}

/** Successful Save returns IDs in submitted order; retain them for the next Save. */
export function adoptNeighbourhoodIds(
  state: CityFormValues,
  ids?: readonly string[],
): CityFormValues {
  if (!ids || ids.length !== state.neighbourhoods.length) return state;
  return {
    ...state,
    neighbourhoods: state.neighbourhoods.map((row, index) => ({
      ...row,
      id: ids[index] ?? row.id,
    })),
  };
}
