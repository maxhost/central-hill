import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@core/db/client";
import { loadTranslationRows, type TranslationRow } from "@core/i18n";
import type { Locale } from "@core/db/columns";
import {
  SERVICE_EDITOR_LOCALES,
  type ServiceEnvelope,
} from "../editorial-types";
import { EMPTY_DETAIL, parseDetail } from "../detail";
import { parseServicePresentation } from "../presentation";
import { resolveServiceCopy, SERVICE_COPY_KEYS } from "../copy";
import { identifyServiceContent } from "../locale-content";
import { service, service_locale_content, service_media } from "../schema";
import { checkServiceEnvelope } from "./locale-validation";

export class ServiceLegacyError extends Error {
  constructor() {
    super(
      "Existing service content cannot be read safely. No content was overwritten.",
    );
    this.name = "ServiceLegacyError";
  }
}
export type ServiceIdentity = typeof service.$inferSelect;
export type ServiceLocaleRow = typeof service_locale_content.$inferSelect;
const fields = [
  "name",
  "excerpt",
  "body",
  "duration_label",
  "price_suffix",
  "cta_label",
  "meta_title",
  "meta_description",
  "detail",
  ...SERVICE_COPY_KEYS.map((key) => `copy:${key}`),
];
export function legacyServiceEnvelope(
  identity: ServiceIdentity,
  translations: TranslationRow[],
  gallery: string[],
  locale: Locale,
  pending = false,
  strict = true,
): ServiceEnvelope {
  const source = new Map(
    translations
      .filter((row) => row.locale === "en")
      .map((row) => [row.field, row.value]),
  );
  const target = new Map(
    translations
      .filter(
        (row) =>
          row.locale === locale &&
          locale !== "en" &&
          (pending || row.state === "approved"),
      )
      .map((row) => [row.field, row.value]),
  );
  const get = (field: string) => target.get(field) ?? source.get(field);
  const rawDetail = get("detail");
  const detail = parseDetail(rawDetail);
  const presentation = parseServicePresentation(identity.presentation);
  if (
    strict &&
    ((rawDetail && !detail) || (identity.presentation != null && !presentation))
  )
    throw new ServiceLegacyError();
  const authored =
    locale === "en" ||
    translations.some(
      (row) => row.locale === locale && fields.includes(row.field),
    );
  const envelope: ServiceEnvelope = {
    schemaVersion: 1,
    localeMode: authored ? "custom" : "inherit",
    content: identifyServiceContent({
      category_id: identity.category_id,
      position: identity.position,
      cover_media_id: identity.cover_media_id,
      og_image_media_id: identity.og_image_media_id,
      price_from: identity.price_from,
      rating_tenths: identity.rating_tenths,
      booking_type: identity.booking_type,
      cta_url: identity.cta_url,
      gallery,
      presentation,
      name: get("name") ?? "",
      excerpt: get("excerpt") ?? "",
      body: get("body") ?? "",
      duration_label: get("duration_label") ?? null,
      price_suffix: get("price_suffix") ?? null,
      cta_label: get("cta_label") ?? null,
      meta_title: get("meta_title") ?? null,
      meta_description: get("meta_description") ?? null,
      detail: detail ?? structuredClone(EMPTY_DETAIL),
      copy: resolveServiceCopy(get),
    }),
  };
  if (strict) {
    const checked = checkServiceEnvelope(envelope);
    if (!checked.envelope || Object.keys(checked.errors).length)
      throw new ServiceLegacyError();
  }
  return envelope;
}
export async function readServiceIdentity(
  id: string,
): Promise<ServiceIdentity | null> {
  const [identity] = await db
    .select()
    .from(service)
    .where(eq(service.id, id))
    .limit(1);
  return identity ?? null;
}
export async function legacyServiceLocaleRows(
  identity: ServiceIdentity,
  strict = true,
): Promise<ServiceLocaleRow[]> {
  const [translations, galleryRows] = await Promise.all([
    loadTranslationRows({ type: "service", id: identity.id }),
    db
      .select({ media_id: service_media.media_id })
      .from(service_media)
      .where(eq(service_media.service_id, identity.id))
      .orderBy(asc(service_media.position)),
  ]);
  const gallery = galleryRows.map((row) => row.media_id);
  return SERVICE_EDITOR_LOCALES.map((locale) => {
    const publicEnvelope = legacyServiceEnvelope(
      identity,
      translations,
      gallery,
      locale,
      false,
      strict,
    );
    const published = identity.status === "published" ? publicEnvelope : null;
    const pending = translations.some(
      (row) =>
        row.locale === locale &&
        locale !== "en" &&
        row.state !== "approved" &&
        fields.includes(row.field),
    );
    const draft =
      !published || pending
        ? legacyServiceEnvelope(
            identity,
            translations,
            gallery,
            locale,
            true,
            strict,
          )
        : null;
    return {
      id: identity.id,
      service_id: identity.id,
      locale,
      revision: 0,
      published,
      draft,
      published_at: published ? identity.updated_at : null,
      draft_saved_at: draft ? identity.updated_at : null,
      updated_by: null,
      created_at: identity.created_at,
      updated_at: identity.updated_at,
    };
  });
}
export async function readServiceLocaleRows(
  identity: ServiceIdentity,
  strict = true,
): Promise<ServiceLocaleRow[]> {
  const stored = await db
    .select()
    .from(service_locale_content)
    .where(eq(service_locale_content.service_id, identity.id));
  if (stored.length === 4) return stored;
  const legacy = await legacyServiceLocaleRows(identity, strict);
  return SERVICE_EDITOR_LOCALES.map(
    (locale) =>
      stored.find((row) => row.locale === locale) ??
      legacy.find((row) => row.locale === locale)!,
  );
}
