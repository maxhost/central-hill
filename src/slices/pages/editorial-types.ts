import type { Locale } from "@core/db/columns";
import type { HomeContent } from "./schemas/home";
import type { PageEditModel } from "./admin/queries";

/** Versioned full snapshot; references only, never resolved media URLs. */
export interface PageEnvelope {
  schemaVersion: 1;
  content: HomeContent;
  ogImageMediaId: string | null;
}
export interface PageLocaleEditorialModel {
  locale: Locale;
  revision: number;
  published: PageEnvelope | null;
  draft: PageEnvelope | null;
  /** Editable value: existing draft exactly, else latest EN template + own text. */
  working: PageEnvelope;
  /** Required on a first target draft, to guard the EN template used to prepare it. */
  templateRevision: number | null;
}
export interface HomeEditorialModel extends PageEditModel {
  locales: Record<Locale, PageLocaleEditorialModel>;
}
export interface SavePageDraftInput {
  key: "home";
  locale: Locale;
  expectedRevision: number;
  templateRevision: number | null;
  payload: PageEnvelope;
}
export interface PublishPageDraftInput {
  key: "home";
  locale: Locale;
  expectedRevision: number;
}
export type PageEditorialResult =
  | { ok: true; model: PageLocaleEditorialModel; refreshWarning?: boolean }
  | { ok: false; error: "validation"; fieldErrors: Record<string, string> }
  | { ok: false; error: "conflict" | "server" | "no_draft" };

/** Ephemeral private preview only; local URLs must never enter PageEnvelope storage. */
export interface HomeLivePreviewInput {
  envelope: PageEnvelope;
  localMedia: Record<string, import("@slices/backoffice/contract").AdminMediaPreview>;
}
