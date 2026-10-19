import type { PageEditorialDescriptor } from "./editorial-adapter-types";
import { expand } from "./server/overlay";
export { homeAt as editorialAt, homeSet as editorialSet } from "./home-content";
import { homeAt as at } from "./home-content";
type Identified = {
  _list_ids?: Record<string, string[]>;
  _retired_ids?: string[];
};
const ID =
  /^(legacy_\d+|[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/;
/** Editing paths are positional; persisted nested scopes use the parent's stable ID. */
export function editorialListScope(
  content: unknown,
  path: string,
  descriptor: PageEditorialDescriptor,
): string | null {
  if (!descriptor.listPaths.includes(path.replace(/\.\d+(?=\.|$)/g, "[]")))
    return null;
  const parts = path.split(".");
  const scope: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]!;
    if (/^\d+$/.test(part)) {
      const parentPath = parts.slice(0, i).join(".");
      const pattern = parentPath.replace(/\.\d+(?=\.|$)/g, "[]");
      if (descriptor.listPaths.includes(pattern)) {
        const id = (content as Identified)._list_ids?.[scope.join(".")]?.[
          Number(part)
        ];
        if (!id) throw new Error(`Missing identity for ${parentPath}`);
        scope.push(`@${id}`);
        continue;
      }
    }
    scope.push(part);
  }
  return scope.join(".");
}
export function editorialListIds(
  content: unknown,
  path: string,
  descriptor: PageEditorialDescriptor,
): string[] {
  const scope = editorialListScope(content, path, descriptor);
  return scope ? ((content as Identified)._list_ids?.[scope] ?? []) : [];
}
export function editorialTextPaths(
  content: unknown,
  descriptor: PageEditorialDescriptor,
): string[] {
  return descriptor.textPatterns.flatMap((pattern) =>
    expand(pattern.split("."), content, []).map((path) => path.join(".")),
  );
}
function lists(
  content: unknown,
  descriptor: PageEditorialDescriptor,
): string[] {
  return descriptor.listPaths.flatMap((pattern) =>
    expand(pattern.split("."), content, []).map((path) => path.join(".")),
  );
}
export function normalizeEditorial<T>(
  raw: T,
  descriptor: PageEditorialDescriptor,
): T & Identified {
  const content = structuredClone(raw) as T & Identified;
  content._list_ids ??= {};
  content._retired_ids ??= [];
  for (const path of lists(content, descriptor)) {
    const scope = editorialListScope(content, path, descriptor)!;
    if (!Object.hasOwn(content._list_ids, scope))
      content._list_ids[scope] = ((at(content, path) as unknown[]) ?? []).map(
        (_, i) => `legacy_${i}`,
      );
  }
  const active = new Set(
    lists(content, descriptor).map((path) =>
      editorialListScope(content, path, descriptor),
    ),
  );
  for (const scope of Object.keys(content._list_ids))
    if (!active.has(scope)) delete content._list_ids[scope];
  return content;
}
export function editorialIdentityErrors(
  content: Identified,
  previous: Identified | undefined,
  descriptor: PageEditorialDescriptor,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const active = new Set<string>();
  const retired = new Set(previous?._retired_ids ?? content._retired_ids ?? []);
  try {
    for (const path of lists(content, descriptor)) {
      const scope = editorialListScope(content, path, descriptor)!;
      active.add(scope);
      const ids = content._list_ids?.[scope] ?? [];
      const before = new Set(previous?._list_ids?.[scope] ?? []);
      if (
        !Object.hasOwn(content._list_ids ?? {}, scope) ||
        ids.length !== ((at(content, path) as unknown[]) ?? []).length ||
        new Set(ids).size !== ids.length ||
        ids.some(
          (id) =>
            !ID.test(id) ||
            retired.has(`${scope}:${id}`) ||
            (previous && !before.has(id) && id.startsWith("legacy_")),
        )
      )
        errors[path] = "Invalid list identities. Reload the editor.";
    }
  } catch {
    errors._source = "Invalid list identities. Reload the editor.";
  }
  if (Object.keys(content._list_ids ?? {}).some((scope) => !active.has(scope)))
    errors._source = "Invalid list identities. Reload the editor.";
  return errors;
}
export function retireEditorialIds<T extends Identified>(
  content: T,
  previous: T,
  descriptor: PageEditorialDescriptor,
): T {
  const next = structuredClone(content);
  const retired = new Set(previous._retired_ids ?? []);
  for (const [scope, ids] of Object.entries(previous._list_ids ?? {}))
    for (const id of ids)
      if (!next._list_ids?.[scope]?.includes(id)) retired.add(`${scope}:${id}`);
  next._retired_ids = [...retired];
  void descriptor;
  return next;
}
export function editorialTranslationField(
  content: unknown,
  path: string,
  descriptor: PageEditorialDescriptor,
): string {
  const parts = path.split(".");
  const result: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]!;
    const parentPath = parts.slice(0, i).join(".");
    if (
      /^\d+$/.test(part) &&
      descriptor.listPaths.includes(parentPath.replace(/\.\d+(?=\.|$)/g, "[]"))
    ) {
      const id = editorialListIds(content, parentPath, descriptor)[
        Number(part)
      ];
      if (!id) throw new Error(`Missing identity for ${parentPath}`);
      result.push(id.startsWith("legacy_") ? id.slice(7) : `@${id}`);
    } else result.push(part);
  }
  return `block:${result.join(".")}`;
}
