import type { EditorSection } from "@slices/backoffice/contract";
export function apartmentEditorSections(
  t: (key: string) => string,
): EditorSection[] {
  return [
    ["card", "admin.sections.identity"],
    ["details", "admin.sections.specs"],
    ["booking", "admin.sections.booking"],
  ].map(([id, key]) => ({
    id: id!,
    label: t(key!),
    bindings: [],
    selectAsGroup: true,
  }));
}
