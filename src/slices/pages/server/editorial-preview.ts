import "server-only";
import { requireStaff } from "@core/auth";
import type { Locale } from "@core/db/columns";
import type { HomePage } from "../contract";
import { validEditorialRequest } from "./editorial-policy";
import { readEditorialRows } from "../admin/editorial-store";
import { resolveEditorialEnvelope } from "./editorial-publication";
/** Uncached staff-only preview of the saved snapshot, never local unsaved edits. */
export async function getPageDraftPreview(key: string, locale: Locale): Promise<HomePage | null> {
  await requireStaff();
  if (!validEditorialRequest(key, locale)) return null;
  const row = (await readEditorialRows()).find(row => row.locale === locale);
  return resolveEditorialEnvelope(row?.draft ?? row?.published ?? null, locale);
}
