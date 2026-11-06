import type { ReactNode } from "react";

/** Page-independent contextual editor. Persistence and field semantics belong to adapters. */
export type EditorLocale = "en" | "es" | "pt" | "fr";
export interface EditorBinding { id: string; label: string; sectionId: string }
export interface EditorSection {
  id: string;
  label: string;
  bindings: EditorBinding[];
  external?: boolean;
  /** One selector entry opens the whole section; bindings remain available to its inspector/preview. */
  selectAsGroup?: boolean;
}
export interface PageEditorAdapter {
  title: string;
  /** Optional page navigation, including leave confirmation, supplied by its owning slice. */
  pageNavigation?: ReactNode;
  sections: EditorSection[];
  /** Dedicated metadata inspector, surfaced beside viewport controls. */
  seoSectionId?: string;
  selectedId: string;
  onSelect: (id: string) => void;
  locale: EditorLocale;
  onLocaleChange: (locale: EditorLocale) => void;
  previewUrl: string;
  previewVersion: number;
  /** Optional in-memory snapshot; never persisted by the shell. */
  previewPayload?: unknown;
  /** Optional read-only dialog exposed by the private preview renderer. */
  previewDialog?: { bindingId: string; open: boolean; onOpenChange: (open: boolean) => void };
  dirty: boolean;
  busy: boolean;
  /** Adapter-specific selected-locale draft/publication status. */
  editorialState?: ReactNode;
  status?: ReactNode;
  inspector: ReactNode;
  actions: ReactNode;
}
export interface PageEditorShellProps { adapter: PageEditorAdapter }
/** Private same-origin bridge; validate origin, source, instance and known binding IDs. */
export type PageEditorBridgeMessage = {
  channel: "central-hill-page-editor";
  instance: string;
} & (
  | { type: "ready"; bindingId?: undefined }
  | { type: "select"; bindingId: string; focus?: boolean }
  | { type: "dialog"; bindingId: string; open: boolean }
  | { type: "preview"; revision: number; payload: unknown }
);

export type PageLivePreviewResult =
  | { ok: true; content: ReactNode }
  | { ok: false; error: "validation" | "server" };
export type PageLivePreviewRenderer = (payload: unknown) => Promise<PageLivePreviewResult>;
