import type { EditorSection } from "@slices/backoffice/contract";

export function postEditorSections(t: (key: string) => string): EditorSection[] {
  return [
    ["article", "sectionArticle"], ["header", "sectionHeader"],
    ["body", "sectionBody"], ["cta", "sectionCta"], ["related", "sectionRelated"], ["seo", "seo"],
  ].map(([id, key]) => ({ id: id!, label: t(key!), bindings: [], selectAsGroup: true }));
}
