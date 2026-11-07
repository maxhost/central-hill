import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@core/db/client";
import type { PropertySharedState } from "@slices/backoffice/contract";
import type {
  BuildingEditorialContent,
  BuildingEnvelope,
  BuildingSharedContent,
} from "../editorial-types";
import { BUILDING_SHARED_KEYS } from "../editorial-types";
import { building_shared_content } from "../schema";
import {
  buildingSharedContent,
  buildingValuesEqual,
  overlayBuildingShared,
  emptyBuildingEnvelope,
} from "../admin/ui/property-editor-state";
import {
  type BuildingIdentity,
  type BuildingLocaleRow,
  PropertyLegacyError,
  legacyBuildingLocaleRows,
} from "./editorial-bootstrap";
import { checkBuildingEnvelope } from "./editorial-validation";
export { buildingSharedContent, overlayBuildingShared };
/** Pure fallback: a pending English draft never becomes public merely by reading. */
export function deriveBuildingSharedState(
  rows: BuildingLocaleRow[],
  fallback: BuildingEnvelope,
): PropertySharedState<BuildingEditorialContent> {
  const english = rows.find((row) => row.locale === "en");
  const published =
    english?.published ?? rows.find((row) => row.published)?.published;
  const baseline = published ?? english?.draft ?? fallback;
  const content = buildingSharedContent(baseline.content);
  const working = english?.draft
    ? buildingSharedContent(english.draft.content)
    : content;
  return {
    revision: 0,
    content,
    ...(!buildingValuesEqual(content, working) ? { working } : {}),
  };
}
export async function readBuildingSharedState(
  identity: BuildingIdentity,
  rows: BuildingLocaleRow[],
): Promise<PropertySharedState<BuildingEditorialContent>> {
  const [stored] = await db
    .select()
    .from(building_shared_content)
    .where(eq(building_shared_content.building_id, identity.id))
    .limit(1);
  if (stored) {
    const raw = stored.data as {
      schemaVersion?: number;
      content?: BuildingSharedContent;
    };
    if (
      raw?.schemaVersion !== 1 ||
      !raw.content ||
      Object.keys(raw.content).length !== BUILDING_SHARED_KEYS.length ||
      !BUILDING_SHARED_KEYS.every((key) => Object.hasOwn(raw.content!, key)) ||
      !checkBuildingEnvelope(
        overlayBuildingShared(emptyBuildingEnvelope(), raw.content),
      ).envelope
    )
      throw new PropertyLegacyError();
    return { revision: stored.revision, content: raw.content };
  }
  let fallback =
    rows.find((row) => row.locale === "en")?.draft ??
    rows.find((row) => row.published)?.published;
  if (!fallback) {
    const legacy = await legacyBuildingLocaleRows(identity);
    fallback =
      legacy.find((row) => row.locale === "en")?.draft ??
      emptyBuildingEnvelope(identity.city_id);
  }
  return deriveBuildingSharedState(rows, fallback);
}
