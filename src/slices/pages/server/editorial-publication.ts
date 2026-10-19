import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@core/db/client";
import type { Locale } from "@core/db/columns";
import type { PageResult } from "../contract";
import type {
  EditorialPageKey,
  PageContentMap,
  PageEnvelope,
} from "../editorial-types";
import { page_locale_content } from "../schema";
import { validEditorialRequest } from "./editorial-policy";
import { legacyEditorialRows } from "./editorial-legacy";
import { resolveMedia } from "./resolve";
export async function resolveEditorialEnvelope<
  K extends EditorialPageKey = "home",
>(
  envelope: PageEnvelope<K> | null,
  locale: Locale,
): Promise<PageResult<PageContentMap[K]> | null> {
  if (!envelope) return null;
  return {
    content: envelope.content,
    ...(await resolveMedia(envelope.content, envelope.ogImageMediaId, locale)),
  };
}
/** Public, read-only: never bootstraps or visits a cached public getter. */
export async function getPublishedPageLocale<K extends EditorialPageKey>(
  key: K,
  locale: Locale,
): Promise<PageResult<PageContentMap[K]> | null> {
  if (!validEditorialRequest(key, locale)) return null;
  const [row] = await db
    .select()
    .from(page_locale_content)
    .where(
      and(
        eq(page_locale_content.page_key, key),
        eq(page_locale_content.locale, locale),
      ),
    )
    .limit(1);
  if (row)
    return resolveEditorialEnvelope(
      row.published as PageEnvelope<K> | null,
      locale,
    );
  try {
    const baseline = await legacyEditorialRows(key, true);
    return resolveEditorialEnvelope(
      (baseline.find((row) => row.locale === locale)?.published ??
        null) as PageEnvelope<K> | null,
      locale,
    );
  } catch {
    return null;
  }
}
