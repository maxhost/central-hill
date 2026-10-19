import { translatablePaths } from "@core/validation/primitives";
import { homeSchema, type HomeContent } from "./schemas/home";
import { expand } from "./server/overlay";
export const HOME_LIST_PATH = "stats.figures";
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
  data._list_ids ??= { [HOME_LIST_PATH]: (data.stats?.figures ?? []).map((_, i) => `legacy_${i}`) };
  data._retired_ids ??= [];
  return data;
}
export function homeIdentityErrors(data: HomeContent, previous?: HomeContent): Record<string,string> {
  const ids = data._list_ids?.[HOME_LIST_PATH] ?? [];
  const before = new Set(previous?._list_ids?.[HOME_LIST_PATH] ?? []);
  const retired = new Set(previous?._retired_ids ?? data._retired_ids ?? []);
  if (!data._list_ids || Object.keys(data._list_ids).some(k => k !== HOME_LIST_PATH) || ids.length !== (data.stats?.figures ?? []).length || new Set(ids).size !== ids.length || ids.some(id => !ID.test(id) || retired.has(id) || (previous && !before.has(id) && id.startsWith("legacy_")))) return { [HOME_LIST_PATH]: "Invalid list identities. Reload the editor." };
  return {};
}
export function retireHomeIds(data: HomeContent, previous: HomeContent): HomeContent {
  return { ...structuredClone(data), _retired_ids: [...new Set([...(previous._retired_ids ?? []), ...(previous._list_ids?.[HOME_LIST_PATH] ?? []).filter(id => !data._list_ids?.[HOME_LIST_PATH]?.includes(id))])] };
}
export function homeTranslationField(data: HomeContent, path: string): string {
  if (!path.startsWith(`${HOME_LIST_PATH}.`)) return `block:${path}`;
  const rest = path.slice(HOME_LIST_PATH.length + 1).split(".");
  const id = data._list_ids?.[HOME_LIST_PATH]?.[Number(rest[0])];
  if (!id) throw new Error("Missing Home identity");
  return `block:${HOME_LIST_PATH}.${id.startsWith("legacy_") ? id.slice(7) : `@${id}`}.${rest.slice(1).join(".")}`;
}
export function homeTextPaths(data: HomeContent): string[] {
 return translatablePaths(homeSchema).flatMap(pattern => expand(pattern.split("."), data, []).map(path => path.join(".")));
}
export function homeSourceFields(data: HomeContent): Record<string,string> {
 return Object.fromEntries(homeTextPaths(data).flatMap(path => {const value = homeAt(data,path); return typeof value === "string" && value.trim() ? [[homeTranslationField(data,path),value]] : [];}));
}
