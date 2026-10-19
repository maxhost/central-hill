import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@core/db/client";
import type { Locale } from "@core/db/columns";
import type { HomePage } from "../contract";
import type { PageEnvelope } from "../editorial-types";
import { page_content, page_locale_content } from "../schema";
import { homeSchema } from "../schemas/home";
import { homeIdentityErrors, normalizeHome } from "../home-content";
import { validEditorialRequest } from "./editorial-policy";
import { resolveHomeData } from "./home-translations";
import { resolveMedia } from "./resolve";
export async function resolveEditorialEnvelope(envelope: PageEnvelope | null, locale: Locale): Promise<HomePage | null> {
  if (!envelope) return null;
  return { content: envelope.content, ...await resolveMedia(envelope.content, envelope.ogImageMediaId, locale) };
}
/** Public, read-only: never bootstraps or visits a cached Home getter. */
export async function getPublishedPageLocale(key: string, locale: Locale): Promise<HomePage | null> {
  if (!validEditorialRequest(key, locale)) return null;
  const [row] = await db.select().from(page_locale_content).where(and(eq(page_locale_content.page_key, key), eq(page_locale_content.locale, locale))).limit(1);
  if (row) return resolveEditorialEnvelope(row.published, locale);
  const [legacy] = await db.select().from(page_content).where(eq(page_content.key, "home")).limit(1);
  const parsed = homeSchema.safeParse(legacy?.data);
  if (!legacy || !parsed.success) return null;
  const source = normalizeHome(parsed.data);
  if (Object.keys(homeIdentityErrors(source)).length) return null;
  return resolveEditorialEnvelope({ schemaVersion: 1, content: await resolveHomeData(legacy.id, source, locale), ogImageMediaId: legacy.og_image_media_id }, locale);
}
