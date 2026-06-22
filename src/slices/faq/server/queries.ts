import "server-only";
import { unstable_cache } from "next/cache";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import type { Locale } from "@core/db/columns";
import { loadContent } from "@core/i18n/content";
import { type FaqGroupOption, FAQ_ITEM, FAQ_TAGS, type FaqGroup, type FaqItem } from "../contract";
import { faq_group, faq_item } from "../schema";

/**
 * Public read functions for slice `faq` (conventions.md → reads go through typed,
 * cache-tagged `server/` functions; never the DB at request time). Wrapped in
 * `unstable_cache` keyed by locale + group key and tagged `faq-list` so a publish
 * busts them (see `./publish`). The `question`/`answer` [T] fields resolve via
 * `core/i18n`.
 */
async function _getFaqGroup(locale: Locale, key: string): Promise<FaqGroup | null> {
  const groups = await db
    .select({ id: faq_group.id, key: faq_group.key })
    .from(faq_group)
    .where(eq(faq_group.key, key))
    .orderBy(asc(faq_group.position))
    .limit(1);
  const group = groups[0];
  if (!group) return null;

  const rows = await db
    .select({ id: faq_item.id })
    .from(faq_item)
    .where(and(eq(faq_item.group_id, group.id), eq(faq_item.status, "published")))
    .orderBy(asc(faq_item.position));

  if (rows.length === 0) return { id: group.id, key: group.key, items: [] };

  const content = await loadContent(
    rows.map((r) => ({ type: FAQ_ITEM, id: r.id })),
    locale,
  );

  const items: FaqItem[] = rows.map((r) => ({
    id: r.id,
    question: content.get(FAQ_ITEM, r.id, "question") ?? "",
    answer: content.get(FAQ_ITEM, r.id, "answer") ?? "",
  }));

  return { id: group.id, key: group.key, items };
}

/**
 * The published FAQ set for a marketing-page key (e.g. `owners`, `guest`,
 * `real_estate`), items in display order. Returns `null` when the group does not
 * exist, or a group with `items: []` when it has none published yet.
 */
export function getFaqGroup(locale: Locale, key: string): Promise<FaqGroup | null> {
  return unstable_cache(() => _getFaqGroup(locale, key), ["faq:getFaqGroup", locale, key], {
    tags: [FAQ_TAGS.list],
  })();
}

/**
 * Lightweight catalogue of every FAQ group (language-neutral `key` + count of published
 * items), in display order. Powers the page-editor's "include an FAQ" dropdown (S12) so a
 * new group authored in `/admin/faq` shows up automatically. Cached + tagged `faq-list`
 * (a publish busts it). `locale` is accepted for parity / future labels; counts are
 * locale-independent.
 */
async function _listFaqGroups(): Promise<FaqGroupOption[]> {
  const rows = await db
    .select({
      key: faq_group.key,
      publishedCount: sql<number>`count(${faq_item.id}) FILTER (WHERE ${faq_item.status} = 'published')::int`,
    })
    .from(faq_group)
    .leftJoin(faq_item, eq(faq_item.group_id, faq_group.id))
    .groupBy(faq_group.id, faq_group.key, faq_group.position)
    .orderBy(asc(faq_group.position));
  return rows.map((r) => ({ key: r.key, publishedCount: r.publishedCount }));
}

export function listFaqGroups(locale: Locale): Promise<FaqGroupOption[]> {
  return unstable_cache(() => _listFaqGroups(), ["faq:listFaqGroups", locale], {
    tags: [FAQ_TAGS.list],
  })();
}
