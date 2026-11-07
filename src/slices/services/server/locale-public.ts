import "server-only";
import { eq, inArray } from "drizzle-orm";
import { db } from "@core/db/client";
import type { Locale } from "@core/db/columns";
import type { ServiceEnvelope } from "../editorial-types";
import { overlayServiceShared } from "../locale-content";
import { service_locale_content, service_shared_content } from "../schema";
import { checkServiceEnvelope, serviceSharedSchema } from "./locale-validation";

/** Missing map key = untouched legacy service. Null = adapted but unpublished in
 * this language. Never substitute an English draft or publication for that null. */
export async function loadServicePublications(
  ids: string[],
  locale: Locale,
): Promise<Map<string, ServiceEnvelope | null>> {
  const out = new Map<string, ServiceEnvelope | null>();
  if (!ids.length) return out;
  const [rows, common] = await Promise.all([
    db
      .select({
        service_id: service_locale_content.service_id,
        locale: service_locale_content.locale,
        published: service_locale_content.published,
      })
      .from(service_locale_content)
      .where(inArray(service_locale_content.service_id, ids)),
    db
      .select()
      .from(service_shared_content)
      .where(inArray(service_shared_content.service_id, ids)),
  ]);
  for (const row of rows) {
    if (!out.has(row.service_id)) out.set(row.service_id, null);
    if (row.locale !== locale || !row.published) continue;
    const checkedSnapshot = checkServiceEnvelope(row.published);
    if (
      !checkedSnapshot.envelope ||
      Object.keys(checkedSnapshot.errors).length
    ) {
      out.set(row.service_id, null);
      continue;
    }
    const commonRow = common.find(
      (value) => value.service_id === row.service_id,
    );
    const shared = commonRow?.data;
    if (
      commonRow &&
      (shared?.schemaVersion !== 1 ||
        !serviceSharedSchema.safeParse(shared?.content).success)
    ) {
      out.set(row.service_id, null);
      continue;
    }
    const envelope =
      shared?.schemaVersion === 1
        ? overlayServiceShared(row.published, shared.content)
        : row.published;
    const checked = checkServiceEnvelope(envelope);
    out.set(
      row.service_id,
      checked.envelope && !Object.keys(checked.errors).length ? envelope : null,
    );
  }
  return out;
}
export async function servicePublicAlternates(
  id: string,
  slugs: Partial<Record<Locale, string>>,
): Promise<Partial<Record<Locale, string>>> {
  const rows = await db
    .select({
      locale: service_locale_content.locale,
      published: service_locale_content.published,
    })
    .from(service_locale_content)
    .where(eq(service_locale_content.service_id, id));
  if (!rows.length) return slugs;
  return Object.fromEntries(
    rows
      .filter((row) => row.published && slugs[row.locale])
      .map((row) => [row.locale, slugs[row.locale]]),
  );
}
