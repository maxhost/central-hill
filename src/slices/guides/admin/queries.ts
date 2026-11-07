import "server-only";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { requireStaff } from "@core/auth";
import { db } from "@core/db/client";
import { loadContent, loadAlternateSlugs, loadSlugs } from "@core/i18n/content";
import { resolveMediaPreviews } from "@slices/backoffice/contract";
import { listGuideCityOptions } from "@slices/geography/contract";
import { GUIDE_PAGE, GUIDE_SECTION, GUIDE_PLACE } from "../contract";
import { guide_page, guide_section, guide_place } from "../schema";
import { readGuideEditorialModel } from "../server/locale-model";
import { isGuideAdapted } from "../server/editorial-translation-policy";
import { parseGuidePresentation } from "../presentation";
import type {
  GuideAdminListItem,
  GuideEditBundle,
  GuidePageEdit,
  GuideSectionEdit,
  GuidePlaceEdit,
} from "./model";

export async function getGuideForEdit(
  id: string,
): Promise<GuideEditBundle | null> {
  await requireStaff(["admin", "editor"]);
  const [page] = await db
    .select()
    .from(guide_page)
    .where(eq(guide_page.id, id))
    .limit(1);
  if (!page) return null;
  const sections = await db
    .select()
    .from(guide_section)
    .where(eq(guide_section.guide_page_id, id))
    .orderBy(asc(guide_section.position), asc(guide_section.id));
  const places = sections.length
    ? await db
        .select()
        .from(guide_place)
        .where(
          inArray(
            guide_place.guide_section_id,
            sections.map((s) => s.id),
          ),
        )
        .orderBy(asc(guide_place.position), asc(guide_place.id))
    : [];
  const [content, slugs, cities] = await Promise.all([
    loadContent(
      [
        { type: GUIDE_PAGE, id },
        ...sections.map((s) => ({ type: GUIDE_SECTION, id: s.id })),
        ...places.map((p) => ({ type: GUIDE_PLACE, id: p.id })),
      ],
      "en",
    ),
    loadAlternateSlugs(GUIDE_PAGE, id),
    listGuideCityOptions(),
  ]);
  const source = (type: string, id: string, key: string) =>
    content.get(type, id, key) ?? null;
  const sectionData: GuideSectionEdit[] = sections.map((s) => ({
    id: s.id,
    guide_page_id: id,
    position: s.position,
    layout: s.layout,
    header_media_id: s.header_media_id,
    cta_url: s.cta_url,
    presentation: s.presentation,
    title: source(GUIDE_SECTION, s.id, "title") ?? "",
    body: source(GUIDE_SECTION, s.id, "body"),
    local_tip: source(GUIDE_SECTION, s.id, "local_tip"),
    cta_label: source(GUIDE_SECTION, s.id, "cta_label"),
    places: places
      .filter((p) => p.guide_section_id === s.id)
      .map(
        (p): GuidePlaceEdit => ({
          id: p.id,
          guide_section_id: s.id,
          position: p.position,
          category: p.category,
          address: p.address,
          phone: p.phone,
          price_tier: p.price_tier,
          opening_hours: p.opening_hours,
          latitude: p.latitude,
          longitude: p.longitude,
          website_url: p.website_url,
          booking_url: p.booking_url,
          media_id: p.media_id,
          name: source(GUIDE_PLACE, p.id, "name") ?? "",
          description: source(GUIDE_PLACE, p.id, "description"),
        }),
      ),
  }));
  const data: GuidePageEdit = {
    id,
    city_id: page.city_id,
    template: page.template,
    slug: page.slug,
    slugs,
    status: page.status,
    position: page.position,
    hero_media_id: page.hero_media_id,
    og_image_media_id: page.og_image_media_id,
    title: source(GUIDE_PAGE, id, "title") ?? "",
    intro: source(GUIDE_PAGE, id, "intro"),
    meta_title: source(GUIDE_PAGE, id, "meta_title"),
    meta_description: source(GUIDE_PAGE, id, "meta_description"),
    sections: sectionData,
  };
  const ids = [
    page.hero_media_id,
    page.og_image_media_id,
    ...sections.map((s) => s.header_media_id),
    ...places.map((p) => p.media_id),
  ].filter((id): id is string => Boolean(id));
  const city = cities.find((c) => c.id === page.city_id);
  return {
    data,
    cities,
    previews: await resolveMediaPreviews(ids),
    publishedUrl:
      page.status === "published" && city?.status === "published" && slugs.en
        ? `/en/guides/${city.slug}/${slugs.en}`
        : null,
    integrity: sections.some(
      (s) => s.presentation != null && !parseGuidePresentation(s.presentation),
    )
      ? "invalid"
      : "valid",
  };
}
export async function listGuidesAdmin(
  filter: { cityId?: string; status?: string; search?: string } = {},
): Promise<GuideAdminListItem[]> {
  await requireStaff(["admin", "editor"]);
  const rows = await db
    .select({
      id: guide_page.id,
      slug: guide_page.slug,
      city_id: guide_page.city_id,
      template: guide_page.template,
      status: guide_page.status,
      position: guide_page.position,
      sections: sql<number>`count(distinct ${guide_section.id})::int`,
      places: sql<number>`count(distinct ${guide_place.id})::int`,
    })
    .from(guide_page)
    .leftJoin(guide_section, eq(guide_section.guide_page_id, guide_page.id))
    .leftJoin(guide_place, eq(guide_place.guide_section_id, guide_section.id))
    .groupBy(guide_page.id)
    .orderBy(asc(guide_page.position), asc(guide_page.id));
  const [cities, content, slugs] = await Promise.all([
    listGuideCityOptions(),
    loadContent(
      rows.map((p) => ({ type: GUIDE_PAGE, id: p.id })),
      "en",
    ),
    loadSlugs(
      GUIDE_PAGE,
      rows.map((p) => p.id),
      "en",
    ),
  ]);
  const models = new Map(
    await Promise.all(
      rows.map(
        async (row) =>
          [
            row.id,
            (await isGuideAdapted(row.id))
              ? await readGuideEditorialModel(row.id)
              : null,
          ] as const,
      ),
    ),
  );
  return rows
    .map((row) => {
      const model = models.get(row.id);
      const draft = model?.locales.en.working.content;
      const city = cities.find((c) => c.id === (draft?.city_id ?? row.city_id));
      const slug = slugs.get(row.id);
      return {
        ...row,
        ...(draft
          ? {
              city_id: draft.city_id,
              template: draft.template,
              position: draft.position,
              sections: draft.sections.length,
              places: draft.sections.reduce((n, s) => n + s.places.length, 0),
            }
          : {}),
        title:
          draft?.title ?? content.get(GUIDE_PAGE, row.id, "title") ?? row.slug,
        city: city?.name ?? row.city_id,
        publishedUrl:
          row.status === "published" &&
          (!model || model.locales.en.published) &&
          city?.status === "published" &&
          slug
            ? `/en/guides/${city.slug}/${slug}`
            : null,
      };
    })
    .filter(
      (row) =>
        (!filter.cityId || row.city_id === filter.cityId) &&
        (!filter.status || row.status === filter.status) &&
        (!filter.search ||
          row.title.toLowerCase().includes(filter.search.toLowerCase())),
    );
}
