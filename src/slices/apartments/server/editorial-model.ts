import type { Locale } from "@core/db/columns";
import type {
  PropertyLocaleModel,
  PropertySharedState,
} from "@slices/backoffice/contract";
import type {
  ApartmentEditorialContent,
  ApartmentEnvelope,
} from "../editorial-types";
import {
  emptyApartmentEnvelope,
  overlayApartmentShared,
} from "./editorial-validation";
export function apartmentLocaleModel(
  rows: {
    locale: Locale;
    revision: number;
    draft: ApartmentEnvelope | null;
    published: ApartmentEnvelope | null;
  }[],
  locale: Locale,
  shared?: PropertySharedState<ApartmentEditorialContent>,
): PropertyLocaleModel<ApartmentEditorialContent> {
  const row = rows.find((row) => row.locale === locale);
  const en = rows.find((row) => row.locale === "en");
  const source = en?.draft ?? en?.published ?? emptyApartmentEnvelope();
  const own = row?.draft ?? row?.published;
  const mode =
    locale === "en"
      ? "custom"
      : (own?.localeMode ??
        (own && (row?.revision ?? 0) > 0 ? "custom" : "inherit"));
  const working = {
    ...structuredClone(
      mode === "inherit" ? source : (own ?? emptyApartmentEnvelope()),
    ),
    localeMode: mode,
  };
  return {
    locale,
    revision: row?.revision ?? 0,
    templateRevision: mode === "inherit" ? (en?.revision ?? 0) : null,
    published: row?.published ?? null,
    draft: row?.draft ?? null,
    working: shared
      ? overlayApartmentShared(working, shared.working ?? shared.content)
      : working,
  };
}
