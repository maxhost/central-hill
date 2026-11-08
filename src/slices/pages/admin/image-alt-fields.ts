import type { FieldNode } from "./form-model";

export interface PageImageField {
  path: (string | number)[];
  id: string | null;
  accept: Extract<FieldNode, { kind: "media" }>["accept"];
  inlineAltPath?: (string | number)[];
}

/** Schema-owned sibling ALT fields remain the single authoring surface. */
export function pageImageFields(node: FieldNode, value: unknown, path: (string | number)[] = []): PageImageField[] {
  if (node.kind === "object") return node.fields.flatMap(field => {
    const children = pageImageFields(field.node, (value as Record<string, unknown> | undefined)?.[field.key], [...path, field.key]);
    if (field.node.kind !== "media") return children;
    const altKey = `${field.key.replace(/_media_id$/, "")}_alt`;
    const sibling = node.fields.find(candidate => candidate.key === altKey && candidate.node.kind === "string");
    return children.map(child => ({ ...child, ...(sibling ? { inlineAltPath: [...path, sibling.key] } : {}) }));
  });
  if (node.kind === "array") return (Array.isArray(value) ? value : []).flatMap((child, index) => pageImageFields(node.element, child, [...path, index]));
  if (node.kind !== "media" || node.accept === "document" || node.accept === "video") return [];
  return [{ path, id: typeof value === "string" && value ? value : null, accept: node.accept }];
}
