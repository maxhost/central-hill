import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@core/db/client";
import { requireStaff } from "@core/auth";
import { loadAlternateSlugs } from "@core/i18n";
import { resolveMediaPreviews } from "@slices/backoffice/contract";
import { listGuideCityOptions } from "@slices/geography/contract";
import type { Locale } from "@core/db/columns";
import {
  GUIDE_EDITOR_LOCALES,
  type GuideEnvelope,
  type GuideSharedContent,
  type GuideEditorialModel,
  type GuideLocaleModel,
} from "../editorial-types";
import {
  emptyGuideEnvelope,
  overlayGuideShared,
  guideSharedContent,
  guideSharedMediaIds,
} from "../locale-content";
import { guide_shared_content } from "../schema";
import {
  GuideLegacyError,
  readGuideIdentity,
  readGuideLocaleRows,
  type GuideIdentity,
  type GuideLocaleRow,
} from "./locale-bootstrap";
import { checkGuideEnvelope, guideSharedSchema } from "./locale-validation";
export function guideLocaleModel(
  rows: GuideLocaleRow[],
  locale: Locale,
  empty: GuideEnvelope,
  shared: GuideSharedContent,
): GuideLocaleModel {
  const row = rows.find((r) => r.locale === locale),
    en = rows.find((r) => r.locale === "en");
  const own = row?.draft ?? row?.published,
    template = en?.draft ?? en?.published ?? empty;
  for (const value of [row?.draft, row?.published, template])
    if (value) {
      const check = checkGuideEnvelope(value);
      if (!check.envelope || Object.keys(check.errors).length)
        throw new GuideLegacyError();
    }
  const mode = locale === "en" ? "custom" : (own?.localeMode ?? "inherit");
  const working =
    mode === "inherit"
      ? { ...structuredClone(template), localeMode: "inherit" as const }
      : structuredClone(own ?? empty);
  return {
    locale,
    revision: row?.revision ?? 0,
    templateRevision:
      locale !== "en" && mode === "inherit" ? (en?.revision ?? 0) : null,
    published: row?.published ?? null,
    draft: row?.draft ?? null,
    working: overlayGuideShared(working, shared),
  };
}
export async function readGuideShared(
  identity: GuideIdentity,
  rows: GuideLocaleRow[],
) {
  const [stored] = await db
    .select()
    .from(guide_shared_content)
    .where(eq(guide_shared_content.guide_id, identity.id))
    .limit(1);
  if (stored) {
    if (
      stored.data?.schemaVersion !== 1 ||
      !guideSharedSchema.safeParse(stored.data.content).success
    )
      throw new GuideLegacyError();
    return { revision: stored.revision, content: stored.data.content };
  }
  const en = rows.find((r) => r.locale === "en");
  let shared = guideSharedContent(
    (en?.published ?? en?.draft ?? emptyGuideEnvelope(identity.city_id))
      .content,
  );
  for (const row of rows) {
    const c = row.published?.content ?? row.draft?.content;
    if (c) {
      const target = guideSharedContent(c);
      shared = {
        ...shared,
        sections: { ...target.sections, ...shared.sections },
        places: { ...target.places, ...shared.places },
      };
    }
  }
  return { revision: 0, content: shared };
}
export async function readGuideEditorialModel(
  id: string,
): Promise<GuideEditorialModel | null> {
  const identity = await readGuideIdentity(id);
  if (!identity) return null;
  const [rows, slugByLocale, cities] = await Promise.all([
    readGuideLocaleRows(identity),
    loadAlternateSlugs("guide_page", id),
    listGuideCityOptions(),
  ]);
  const shared = await readGuideShared(identity, rows);
  for (const row of rows)
    for (const envelope of [row.draft, row.published])
      if (envelope) {
        for (const section of envelope.content.sections) {
          if (
            !shared.content.sections[section.id] ||
            section.guide_page_id !== id
          )
            throw new GuideLegacyError();
          for (const place of section.places)
            if (
              !shared.content.places[place.id] ||
              place.guide_section_id !== section.id
            )
              throw new GuideLegacyError();
        }
      }
  const locales = Object.fromEntries(
    GUIDE_EDITOR_LOCALES.map((locale) => [
      locale,
      guideLocaleModel(
        rows,
        locale,
        emptyGuideEnvelope(identity.city_id),
        shared.content,
      ),
    ]),
  ) as GuideEditorialModel["locales"];
  const citySlugs =
    cities.find((city) => city.id === shared.content.city_id)?.status ===
    "published"
      ? await loadAlternateSlugs("city", shared.content.city_id)
      : {};
  return {
    id,
    status: identity.status,
    slugByLocale,
    citySlugs,
    locales,
    shared,
    cities,
    previews: await resolveMediaPreviews(guideSharedMediaIds(shared.content)),
  };
}
export async function getGuideEditorialModel(id: string) {
  await requireStaff(["admin", "editor"]);
  if (!/^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id)) return null;
  return readGuideEditorialModel(id);
}
