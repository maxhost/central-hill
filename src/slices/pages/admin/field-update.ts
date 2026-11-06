import type { FieldNode } from "./form-model";
import { emptyValue } from "./form-model";

/** Materializing an optional block must include its empty media slots for validation. */
export function setPageField(root: unknown, schema: FieldNode, path: readonly (string | number)[], value: unknown): unknown {
  function write(current: unknown, node: FieldNode | undefined, keys: readonly (string | number)[], depth: number): unknown {
    if (!keys.length) return value;
    const [key, ...rest] = keys;
    const out = Array.isArray(current) ? [...current] : { ...(current && typeof current === "object" ? current : {}) };
    const record = out as Record<string, unknown>;
    if (depth > 0 && node?.kind === "object") {
      // Missing media means the existing public fallback. Do not materialize other
      // optional objects/lists/flags: their absence can carry separate semantics.
      for (const field of node.fields) {
        if (field.node.kind === "media" && !field.node.optional && record[field.key] === undefined)
          record[field.key] = emptyValue(field.node);
      }
    }
    const child = node?.kind === "object"
      ? node.fields.find(field => field.key === String(key))?.node
      : node?.kind === "array" ? node.element : undefined;
    record[String(key)] = write(record[String(key)], child, rest, depth + 1);
    return out;
  }
  return write(root, schema, path, 0);
}
