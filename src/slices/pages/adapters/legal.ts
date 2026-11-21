import { createElement } from "react";
import { IMAGE_MIMES } from "@core/media/mime";
import { defaultLegalPage, legalPageDescriptor, legalPageDraftSchema, legalPagePublishSchema, type LegalPageKey } from "../legal-page-content";
import type { PageEditorialAdapter } from "../editorial-adapter-types";

export function createLegalPageAdapter<K extends LegalPageKey>(key: K): PageEditorialAdapter<K> {
  return {
    key,
    descriptor: legalPageDescriptor(key),
    draftSchema: legalPageDraftSchema,
    publishSchema: legalPagePublishSchema,
    defaultContent: () => defaultLegalPage(key),
    normalize: content => structuredClone(content),
    identityErrors: () => ({}),
    retireIds: content => structuredClone(content),
    textPaths: () => ["title", "body", "seo.meta_title", "seo.meta_description"],
    translationField: (_content, path) => `block:${path}`,
    collectMediaReferences: (_content, og) => og ? [{ path: "og_image_media_id", id: og, kind: "image" }] : [],
    mediaErrors: (_content, og, assets): Record<string, string> => {
      if (!og) return {};
      const mime = assets.get(og)?.mime;
      return mime && (IMAGE_MIMES as readonly string[]).includes(mime) ? {} : { og_image_media_id: "Select an uploaded image." };
    },
    async render(input) {
      const { LegalPage } = await import("../ui/legal-page");
      return createElement(LegalPage, {
        pageKey: key, locale: input.locale, preview: true,
        page: input.page ?? { content: defaultLegalPage(key), media: {}, ogImage: null },
      });
    },
  };
}
export const privacyPolicyAdapter = createLegalPageAdapter("privacy_policy");
export const cookiesPolicyAdapter = createLegalPageAdapter("cookies_policy");
export const complaintsBookAdapter = createLegalPageAdapter("complaints_book");
