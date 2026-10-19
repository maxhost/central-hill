import type { ReactNode } from "react";

/** Page-independent contextual editor. Persistence and field semantics belong to adapters. */
export type EditorLocale = "en" | "es" | "pt" | "fr";
export interface EditorBinding { id: string; label: string; sectionId: string }
export interface EditorSection { id: string; label: string; bindings: EditorBinding[]; external?: boolean }
export interface PageEditorAdapter {
  title: string;
  sections: EditorSection[];
  selectedId: string;
  onSelect: (id: string) => void;
  locale: EditorLocale;
  onLocaleChange: (locale: EditorLocale) => void;
  previewUrl: string;
  previewVersion: number;
  dirty: boolean;
  busy: boolean;
  status?: ReactNode;
  inspector: ReactNode;
  actions: ReactNode;
}
export interface PageEditorShellProps { adapter: PageEditorAdapter }
/** Private same-origin bridge; validate origin, source, instance and known binding IDs. */
export type PageEditorBridgeMessage = {
  channel: "central-hill-page-editor";
  instance: string;
  type: "ready" | "select";
  bindingId?: string;
};
