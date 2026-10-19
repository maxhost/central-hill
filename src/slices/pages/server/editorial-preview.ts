import "server-only";
import { requireStaff } from "@core/auth";
import type { Locale } from "@core/db/columns";
import type { PageResult } from "../contract";
import type {
  EditorialPageKey,
  PageContentMap,
  PageEnvelope,
} from "../editorial-types";
import { validEditorialRequest } from "./editorial-policy";
import { readEditorialRows } from "../admin/editorial-store";
import { resolveEditorialEnvelope } from "./editorial-publication";
/** Uncached staff-only preview of the saved snapshot, never local unsaved edits. */
export async function getPageDraftPreview<K extends EditorialPageKey>(
  key: K,
  locale: Locale,
): Promise<PageResult<PageContentMap[K]> | null> {
  await requireStaff();
  if (!validEditorialRequest(key, locale)) return null;
  const row = (await readEditorialRows(key)).find(
    (row) => row.locale === locale,
  );
  return resolveEditorialEnvelope(
    (row?.draft ?? row?.published ?? null) as PageEnvelope<K> | null,
    locale,
  );
}
