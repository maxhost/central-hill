import { requireStaff } from "@core/auth";
import { TranslationInbox } from "@slices/translation/admin/ui/inbox";
import type { TranslationInboxFilters } from "@slices/translation/admin/queries";

/**
 * Translation review inbox route (`/admin/translations`). Inside the gated
 * `(panel)` group; the action/query layer re-gates too. View + entity-type come
 * from the URL and are validated (unknown values ignored → unfiltered).
 */
export default async function TranslationsInboxPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaff();
  const sp = await searchParams;

  const filters: TranslationInboxFilters = {};
  if (sp.view === "attention" || sp.view === "done") filters.view = sp.view;
  if (typeof sp.type === "string" && sp.type) filters.entityType = sp.type;

  return <TranslationInbox filters={filters} />;
}
