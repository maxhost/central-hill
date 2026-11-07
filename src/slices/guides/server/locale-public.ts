import "server-only";
import { inArray } from "drizzle-orm";
import { db } from "@core/db/client";
import type { Locale } from "@core/db/columns";
import type { GuideEnvelope, GuideSharedContent } from "../editorial-types";
import { overlayGuideShared } from "../locale-content";
import { guide_locale_content, guide_shared_content } from "../schema";
import { GuideLegacyError } from "./locale-bootstrap";
import { checkGuideEnvelope, guideSharedSchema } from "./locale-validation";
/** Missing key means legacy; null means explicitly unpublished. Never read drafts publicly. */
export async function loadGuidePublications(
  ids: string[],
  locale: Locale,
): Promise<
  Map<string, { envelope: GuideEnvelope; shared: GuideSharedContent } | null>
> {
  const result = new Map<
    string,
    { envelope: GuideEnvelope; shared: GuideSharedContent } | null
  >();
  if (!ids.length) return result;
  const [rows, commons] = await Promise.all([
    db
      .select({
        guide_id: guide_locale_content.guide_id,
        locale: guide_locale_content.locale,
        published: guide_locale_content.published,
      })
      .from(guide_locale_content)
      .where(inArray(guide_locale_content.guide_id, ids)),
    db
      .select()
      .from(guide_shared_content)
      .where(inArray(guide_shared_content.guide_id, ids)),
  ]);
  for (const id of new Set(rows.map((r) => r.guide_id))) {
    const row = rows.find((r) => r.guide_id === id && r.locale === locale);
    const common = commons.find((s) => s.guide_id === id);
    if (!row?.published) {
      result.set(id, null);
      continue;
    }
    if (
      !common ||
      common.data?.schemaVersion !== 1 ||
      !guideSharedSchema.safeParse(common.data.content).success
    )
      throw new GuideLegacyError();
    const checked = checkGuideEnvelope(row.published, id);
    if (!checked.envelope || Object.keys(checked.errors).length)
      throw new GuideLegacyError();
    result.set(id, {
      envelope: overlayGuideShared(checked.envelope, common.data.content),
      shared: common.data.content,
    });
  }
  return result;
}
