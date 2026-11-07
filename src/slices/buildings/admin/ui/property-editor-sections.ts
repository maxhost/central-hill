import type { EditorSection } from "@slices/backoffice/contract";
export function buildingEditorSections(
  t: (key: string) => string,
  te: (key: string) => string,
): EditorSection[] {
  return [
    "identity",
    "hero",
    "gallery",
    "amenities",
    "faq",
    "booking",
    "seo",
  ].map((id) => ({
    id,
    label: id === "identity" ? te("shared") : t(`admin.sections.${id}`),
    bindings: [],
    selectAsGroup: true,
  }));
}
