import { translatablePaths } from "@core/validation/primitives";
import { homeSchema, type HomeContent } from "./schemas/home";
import { expand } from "./server/overlay";
export const HOME_LIST_PATH = "stats.figures";
export const HOME_LIST_PATHS = [HOME_LIST_PATH, "guests_pitch.benefits", "services_carousel.assurances"] as const;
const ID = /^(legacy_\d+|[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/;
export function homeAt(root: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((node, key) => node && typeof node === "object" ? (node as Record<string, unknown>)[key] : undefined, root);
}
export function homeSet(root: unknown, path: string, value: unknown): void {
  const keys = path.split(".");
  const parent = homeAt(root, keys.slice(0, -1).join("."));
  if (parent && typeof parent === "object") (parent as Record<string, unknown>)[keys.at(-1)!] = value;
}

export function normalizeHome(raw: HomeContent): HomeContent {
  const data = structuredClone(raw);
  if (!data._list_ids) data._list_ids = Object.fromEntries(HOME_LIST_PATHS.map(path => [path, (homeAt(data, path) as unknown[] | undefined ?? []).map((_, i) => `legacy_${i}`)]));
  // Older contextual rows only authored stats IDs. Introduce the two newly supported
  // lists once; an existing malformed identity array must still fail validation.
  for (const path of HOME_LIST_PATHS.slice(1)) if (!Object.hasOwn(data._list_ids, path)) data._list_ids[path] = (homeAt(data, path) as unknown[] | undefined ?? []).map((_, i) => `legacy_${i}`);
  data._retired_ids = (data._retired_ids ?? []).map(id => id.includes(":") ? id : `${HOME_LIST_PATH}:${id}`);
  return data;
}
export function homeIdentityErrors(data: HomeContent, previous?: HomeContent): Record<string,string> {
  const errors: Record<string,string> = {};
  const retired = new Set(previous?._retired_ids ?? data._retired_ids ?? []);
  if (!data._list_ids || Object.keys(data._list_ids).some(k => !(HOME_LIST_PATHS as readonly string[]).includes(k))) errors._source = "Invalid list identities. Reload the editor.";
  for (const path of HOME_LIST_PATHS) {
    const ids = data._list_ids?.[path] ?? [];
    const before = new Set(previous?._list_ids?.[path] ?? []);
    if (!Object.hasOwn(data._list_ids ?? {}, path) || ids.length !== (homeAt(data, path) as unknown[] | undefined ?? []).length || new Set(ids).size !== ids.length || ids.some(id => !ID.test(id) || retired.has(`${path}:${id}`) || (previous && !before.has(id) && id.startsWith("legacy_")))) errors[path] = "Invalid list identities. Reload the editor.";
  }
  return errors;
}
export function retireHomeIds(data: HomeContent, previous: HomeContent): HomeContent {
  return { ...structuredClone(data), _retired_ids: [...new Set([...(previous._retired_ids ?? []), ...HOME_LIST_PATHS.flatMap(path => (previous._list_ids?.[path] ?? []).filter(id => !data._list_ids?.[path]?.includes(id)).map(id => `${path}:${id}`))])] };
}
export function homeTranslationField(data: HomeContent, path: string): string {
  const list = HOME_LIST_PATHS.find(candidate => path.startsWith(`${candidate}.`));
  if (!list) return `block:${path}`;
  const rest = path.slice(list.length + 1).split(".");
  const id = data._list_ids?.[list]?.[Number(rest[0])];
  if (!id) throw new Error("Missing Home identity");
  return `block:${list}.${id.startsWith("legacy_") ? id.slice(7) : `@${id}`}.${rest.slice(1).join(".")}`;
}
export function homeTextPaths(data: HomeContent): string[] {
 return translatablePaths(homeSchema).flatMap(pattern => expand(pattern.split("."), data, []).map(path => path.join(".")));
}
export function homeSourceFields(data: HomeContent): Record<string,string> {
 return Object.fromEntries(homeTextPaths(data).flatMap(path => {const value = homeAt(data,path); return typeof value === "string" && value.trim() ? [[homeTranslationField(data,path),value]] : [];}));
}
