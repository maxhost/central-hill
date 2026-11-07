import type { Locale } from "@core/db/columns";
import type { PropertyLocaleModel } from "@slices/backoffice/contract";
import type {
  BuildingEnvelope,
  BuildingEditorialContent,
} from "../editorial-types";
import {
  PropertyLegacyError,
  type BuildingLocaleRow,
} from "./editorial-bootstrap";
import {
  checkBuildingEnvelope,
  prepareBuildingTarget,
} from "./editorial-validation";
export function buildingLocaleModel(
  rows: BuildingLocaleRow[],
  locale: Locale,
  empty: BuildingEnvelope,
): PropertyLocaleModel<BuildingEditorialContent> {
  const row = rows.find((r) => r.locale === locale);
  const en = rows.find((r) => r.locale === "en");
  const template = en?.draft ?? en?.published ?? empty;
  const own = row?.draft ?? row?.published;
  const mode =
    locale === "en"
      ? "custom"
      : (own?.localeMode ??
        ((row?.revision ?? 0) > 0 || own ? "custom" : "inherit"));
  for (const value of [row?.draft, row?.published, template])
    if (value && !checkBuildingEnvelope(value).envelope)
      throw new PropertyLegacyError();
  return {
    locale,
    revision: row?.revision ?? 0,
    templateRevision:
      locale !== "en" && mode === "inherit" ? (en?.revision ?? 0) : null,
    published: row?.published ?? null,
    draft: row?.draft ?? null,
    working:
      locale === "en"
        ? { ...structuredClone(own ?? empty), localeMode: "custom" }
        : mode === "inherit"
          ? { ...structuredClone(template), localeMode: "inherit" }
          : {
              ...prepareBuildingTarget(template, own ?? empty),
              localeMode: "custom",
            },
  };
}
