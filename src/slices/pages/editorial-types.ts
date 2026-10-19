import type { Locale } from "@core/db/columns";
import type { HomeContent, OwnersContent, BuildingsContent, RealEstateContent, GuestContent, ServicesContent, AboutContent, GuidesContent, BlogContent } from "./schemas";
import type { PageEditorialDescriptor } from "./editorial-adapter-types";
export type EditorialPageKey = "home" | "owners" | "buildings" | "real_estate" | "guest" | "services" | "about" | "guides" | "blog";
export interface PageContentMap { home: HomeContent; owners: OwnersContent; buildings: BuildingsContent; real_estate: RealEstateContent; guest: GuestContent; services: ServicesContent; about: AboutContent; guides: GuidesContent; blog: BlogContent }

import type { PageEditModel } from "./admin/queries";

/** Versioned full snapshot; references only, never resolved media URLs. */
export interface PageEnvelope<K extends EditorialPageKey = "home"> {
  schemaVersion: 1;
  content: PageContentMap[K];
  ogImageMediaId: string | null;
}
export interface PageLocaleEditorialModel<K extends EditorialPageKey = "home"> {
  locale: Locale;
  revision: number;
  published: PageEnvelope<K> | null;
  draft: PageEnvelope<K> | null;
  /** Editable value: existing draft exactly, else latest EN template + own text. */
  working: PageEnvelope<K>;
  /** Required on a first target draft, to guard the EN template used to prepare it. */
  templateRevision: number | null;
}
export interface PageEditorialModel<K extends EditorialPageKey = "home"> extends PageEditModel {
  descriptor: PageEditorialDescriptor;
  locales: Record<Locale, PageLocaleEditorialModel<K>>;
}
export type HomeEditorialModel = PageEditorialModel<"home">;
export interface SavePageDraftInput<K extends EditorialPageKey = "home"> {
  key: K;
  locale: Locale;
  expectedRevision: number;
  templateRevision: number | null;
  payload: PageEnvelope<K>;
}
export interface PublishPageDraftInput<K extends EditorialPageKey = "home"> {
  key: K;
  locale: Locale;
  expectedRevision: number;
}
export type PageEditorialResult<K extends EditorialPageKey = "home"> =
  | { ok: true; model: PageLocaleEditorialModel<K>; refreshWarning?: boolean }
  | { ok: false; error: "validation"; fieldErrors: Record<string, string> }
  | { ok: false; error: "conflict" | "server" | "no_draft" };

/** Ephemeral private preview only; local URLs must never enter PageEnvelope storage. */
export interface PageLivePreviewInput<K extends EditorialPageKey = "home"> {
  envelope: PageEnvelope<K>;
  localMedia: Record<string, import("@slices/backoffice/contract").AdminMediaPreview>;
}

export type HomeLivePreviewInput = PageLivePreviewInput<"home">;
