import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@core/db/client";
import {
  guide_page,
  guide_section,
  guide_place,
  guide_locale_content,
} from "../schema";
export function isGuideEditorialEntity(type: string) {
  return (
    type === "guide_page" || type === "guide_section" || type === "guide_place"
  );
}
export async function getGuideEditorialRedirect(
  type: string,
  id: string,
  locale?: string,
) {
  if (
    !isGuideEditorialEntity(type) ||
    !/^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id)
  )
    return null;
  let owner: string | undefined;
  if (type === "guide_page") {
    const [r] = await db
      .select({ id: guide_page.id })
      .from(guide_page)
      .where(eq(guide_page.id, id))
      .limit(1);
    owner = r?.id;
  } else if (type === "guide_section") {
    const [r] = await db
      .select({ id: guide_section.guide_page_id })
      .from(guide_section)
      .where(eq(guide_section.id, id))
      .limit(1);
    owner = r?.id;
  } else {
    const [r] = await db
      .select({ id: guide_section.guide_page_id })
      .from(guide_place)
      .innerJoin(
        guide_section,
        eq(guide_place.guide_section_id, guide_section.id),
      )
      .where(eq(guide_place.id, id))
      .limit(1);
    owner = r?.id;
  }
  return owner
    ? `/admin/guides/${owner}${locale && ["en", "es", "pt", "fr"].includes(locale) ? `?locale=${locale}` : ""}`
    : null;
}
export async function isGuideAdapted(id: string) {
  const [row] = await db
    .select({ id: guide_locale_content.id })
    .from(guide_locale_content)
    .where(eq(guide_locale_content.guide_id, id))
    .limit(1);
  return Boolean(row);
}
