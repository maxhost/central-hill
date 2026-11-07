import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@core/db/client";
import { requireStaff } from "@core/auth";
import { loadAlternateSlugs } from "@core/i18n";
import { loadMedia, mediaUrl } from "@core/media";
import type { Locale } from "@core/db/columns";
import {
  SERVICE_EDITOR_LOCALES,
  type ServiceEnvelope,
  type ServiceEditorialModel,
  type ServiceLocaleModel,
  type ServiceSharedContent,
} from "../editorial-types";
import {
  emptyServiceEnvelope,
  overlayServiceShared,
  serviceSharedContent,
  serviceContentMediaIds,
} from "../locale-content";
import { service_shared_content } from "../schema";
import { checkServiceEnvelope, serviceSharedSchema } from "./locale-validation";
import {
  ServiceLegacyError,
  readServiceIdentity,
  readServiceLocaleRows,
  type ServiceIdentity,
  type ServiceLocaleRow,
} from "./locale-bootstrap";

export function serviceLocaleModel(
  rows: ServiceLocaleRow[],
  locale: Locale,
  empty: ServiceEnvelope,
  shared: ServiceSharedContent,
): ServiceLocaleModel {
  const row = rows.find((row) => row.locale === locale);
  const en = rows.find((row) => row.locale === "en");
  const own = row?.draft ?? row?.published;
  const template = en?.draft ?? en?.published ?? empty;
  for (const envelope of [row?.draft, row?.published, template])
    if (
      envelope &&
      (!checkServiceEnvelope(envelope).envelope ||
        Object.keys(checkServiceEnvelope(envelope).errors).length)
    )
      throw new ServiceLegacyError();
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
    working: overlayServiceShared(working, shared),
  };
}
export async function readServiceShared(
  identity: ServiceIdentity,
  rows: ServiceLocaleRow[],
): Promise<{ revision: number; content: ServiceSharedContent }> {
  const [stored] = await db
    .select()
    .from(service_shared_content)
    .where(eq(service_shared_content.service_id, identity.id))
    .limit(1);
  if (stored) {
    if (
      stored.data?.schemaVersion !== 1 ||
      !serviceSharedSchema.safeParse(stored.data.content).success
    )
      throw new ServiceLegacyError();
    const checked = checkServiceEnvelope(
      overlayServiceShared(
        emptyServiceEnvelope(identity.category_id),
        stored.data.content,
      ),
    );
    if (!checked.envelope || Object.keys(checked.errors).length)
      throw new ServiceLegacyError();
    return { revision: stored.revision, content: stored.data.content };
  }
  const en = rows.find((row) => row.locale === "en");
  const baseline =
    en?.published ??
    rows.find((row) => row.published)?.published ??
    en?.draft ??
    emptyServiceEnvelope(identity.category_id);
  // Preserve target-only legacy slots; English owns collisions. No writes on GET.
  let shared = serviceSharedContent(baseline.content);
  for (const row of [...rows].reverse()) {
    const content = row.published?.content ?? row.draft?.content;
    if (content)
      shared = {
        ...shared,
        factIcons: {
          ...serviceSharedContent(content).factIcons,
          ...shared.factIcons,
        },
        itineraryMedia: {
          ...serviceSharedContent(content).itineraryMedia,
          ...shared.itineraryMedia,
        },
      };
  }
  return { revision: 0, content: shared };
}
/** Internal read; actions and staff getter provide the auth boundary. Public readers use publication-only batching. */
export async function readServiceEditorialModel(
  id: string,
): Promise<ServiceEditorialModel | null> {
  const identity = await readServiceIdentity(id);
  if (!identity) return null;
  const [rows, slugByLocale] = await Promise.all([
    readServiceLocaleRows(identity),
    loadAlternateSlugs("service", id),
  ]);
  const shared = await readServiceShared(identity, rows);
  const locales = Object.fromEntries(
    SERVICE_EDITOR_LOCALES.map((locale) => [
      locale,
      serviceLocaleModel(
        rows,
        locale,
        emptyServiceEnvelope(identity.category_id),
        shared.content,
      ),
    ]),
  ) as ServiceEditorialModel["locales"];
  const ids = SERVICE_EDITOR_LOCALES.flatMap((locale) =>
    [locales[locale].working, locales[locale].published].flatMap((envelope) =>
      envelope ? serviceContentMediaIds(envelope.content) : [],
    ),
  );
  const assets = await loadMedia(ids);
  const previews = Object.fromEntries(
    [...assets].map(([id, asset]) => [
      id,
      {
        id,
        url: mediaUrl(asset.r2_key),
        width: asset.width,
        height: asset.height,
        mime: asset.mime,
      },
    ]),
  );
  return {
    id,
    status: identity.status,
    slugByLocale,
    locales,
    shared,
    previews,
  };
}
export async function getServiceEditorialModel(
  id: string,
): Promise<ServiceEditorialModel | null> {
  await requireStaff();
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    return null;
  return readServiceEditorialModel(id);
}
