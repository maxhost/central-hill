import "server-only";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@core/db/client";
import { loadTranslationRows } from "@core/i18n";
import { GUIDE_EDITOR_LOCALES, type GuideEnvelope } from "../editorial-types";
import {
  guide_page,
  guide_section,
  guide_place,
  guide_locale_content,
} from "../schema";
import { checkGuideEnvelope } from "./locale-validation";
export class GuideLegacyError extends Error {
  constructor() {
    super("Existing guide content cannot be read safely.");
    this.name = "GuideLegacyError";
  }
}
export type GuideIdentity = typeof guide_page.$inferSelect;
export type GuideLocaleRow = typeof guide_locale_content.$inferSelect;
export async function readGuideIdentity(id: string) {
  const [row] = await db
    .select()
    .from(guide_page)
    .where(eq(guide_page.id, id))
    .limit(1);
  return row ?? null;
}
export async function legacyGuideLocaleRows(
  identity: GuideIdentity,
): Promise<GuideLocaleRow[]> {
  const sections = await db
    .select()
    .from(guide_section)
    .where(eq(guide_section.guide_page_id, identity.id))
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
  const refs = [
    { type: "guide_page", id: identity.id },
    ...sections.map((s) => ({ type: "guide_section", id: s.id })),
    ...places.map((p) => ({ type: "guide_place", id: p.id })),
  ];
  const translations = (
    await Promise.all(refs.map((ref) => loadTranslationRows(ref)))
  ).flat();
  function envelope(
    locale: (typeof GUIDE_EDITOR_LOCALES)[number],
    pending: boolean,
  ): GuideEnvelope {
    const get = (type: string, id: string, field: string) =>
      translations.find(
        (r) =>
          r.entity_type === type &&
          r.entity_id === id &&
          r.locale === locale &&
          (locale === "en" || pending || r.state === "approved") &&
          r.field === field,
      )?.value ??
      translations.find(
        (r) =>
          r.entity_type === type &&
          r.entity_id === id &&
          r.locale === "en" &&
          r.field === field,
      )?.value ??
      null;
    const authored =
      locale === "en" || translations.some((r) => r.locale === locale);
    const content = {
      city_id: identity.city_id,
      template: identity.template,
      position: identity.position,
      hero_media_id: identity.hero_media_id,
      og_image_media_id: identity.og_image_media_id,
      title: get("guide_page", identity.id, "title") ?? "",
      intro: get("guide_page", identity.id, "intro"),
      meta_title: get("guide_page", identity.id, "meta_title"),
      meta_description: get("guide_page", identity.id, "meta_description"),
      sections: sections.map((s) => ({
        id: s.id,
        guide_page_id: identity.id,
        position: s.position,
        layout: s.layout,
        header_media_id: s.header_media_id,
        presentation: s.presentation,
        cta_url: s.cta_url,
        title: get("guide_section", s.id, "title") ?? "",
        body: get("guide_section", s.id, "body"),
        local_tip: get("guide_section", s.id, "local_tip"),
        cta_label: get("guide_section", s.id, "cta_label"),
        places: places
          .filter((p) => p.guide_section_id === s.id)
          .map((p) => ({
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
            name: get("guide_place", p.id, "name") ?? "",
            description: get("guide_place", p.id, "description"),
          })),
      })),
    };
    const checked = checkGuideEnvelope(
      {
        schemaVersion: 1,
        localeMode: authored ? "custom" : "inherit",
        content,
      },
      identity.id,
    );
    if (!checked.envelope || Object.keys(checked.errors).length)
      throw new GuideLegacyError();
    return checked.envelope;
  }
  return GUIDE_EDITOR_LOCALES.map((locale) => {
    const published =
      identity.status === "published" ? envelope(locale, false) : null;
    const pending = translations.some(
      (r) => r.locale === locale && locale !== "en" && r.state !== "approved",
    );
    const draft = !published || pending ? envelope(locale, true) : null;
    return {
      id: identity.id,
      guide_id: identity.id,
      locale,
      published,
      draft,
      revision: 0,
      published_at: published ? identity.updated_at : null,
      draft_saved_at: draft ? identity.updated_at : null,
      updated_by: null,
      created_at: identity.created_at,
      updated_at: identity.updated_at,
    };
  });
}
export async function readGuideLocaleRows(identity: GuideIdentity) {
  const rows = await db
    .select()
    .from(guide_locale_content)
    .where(eq(guide_locale_content.guide_id, identity.id));
  for (const row of rows)
    for (const value of [row.published, row.draft])
      if (value) {
        const checked = checkGuideEnvelope(value, identity.id);
        if (!checked.envelope || Object.keys(checked.errors).length)
          throw new GuideLegacyError();
      }
  if (rows.length === 4) return rows;
  const legacy = await legacyGuideLocaleRows(identity);
  return GUIDE_EDITOR_LOCALES.map(
    (locale) =>
      rows.find((r) => r.locale === locale) ??
      legacy.find((r) => r.locale === locale)!,
  );
}
