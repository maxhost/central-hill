import { aboutSchema, type AboutContent } from "./schemas/about";
import { translatablePaths } from "@core/validation/primitives";
import { expand } from "./server/overlay";

export const ABOUT_LIST_PATHS = ["story.narrative", "stats", "serve.audiences", "values.items", "organisation.departments", "certifications.items", "community.copy", "contact.cards"] as const;
export type AboutListPath = typeof ABOUT_LIST_PATHS[number];
export const ABOUT_DESTINATIONS = ["buildings", "owners", "real_estate"] as const;
const ID = /^(legacy_\d+|[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/;
export function aboutAt(root: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((node, key) => node && typeof node === "object" ? (node as Record<string, unknown>)[key] : undefined, root);
}
export function aboutSet(root: unknown, path: string, value: unknown): void {
  const keys = path.split(".");
  const parent = aboutAt(root, keys.slice(0, -1).join("."));
  if (parent && typeof parent === "object") (parent as Record<string, unknown>)[keys.at(-1)!] = value;
}
/** Metadata is optional only for genuine legacy rows. Never fill holes in authored metadata. */
export function normalizeAbout(raw: AboutContent): AboutContent {
  const data = structuredClone(raw);
  if (!data._list_ids) data._list_ids = Object.fromEntries(ABOUT_LIST_PATHS.map(path => [path, (aboutAt(data, path) as unknown[]).map((_, i) => `legacy_${i}`)]));
  data._retired_ids ??= [];
  for (let i = 0; i < data.contact.cards.length; i++) {
    const card = data.contact.cards[i]!;
    if (!card.destination) {
      const id = data._list_ids["contact.cards"]?.[i];
      const n = id?.match(/^legacy_(\d+)$/)?.[1];
      if (n !== undefined && Number(n) < 3) card.destination = ABOUT_DESTINATIONS[Number(n)];
    }
  }
  return data;
}
export function aboutIdentityErrors(data: AboutContent, previous?: AboutContent): Record<string, string> {
  const errors: Record<string, string> = {};
  const retired = new Set(previous?._retired_ids ?? data._retired_ids ?? []);
  if (!data._list_ids || Object.keys(data._list_ids).some(k => !(ABOUT_LIST_PATHS as readonly string[]).includes(k))) errors._source = "Invalid list identities. Reload the editor.";
  for (const path of ABOUT_LIST_PATHS) {
    const items = aboutAt(data, path) as unknown[];
    const ids = data._list_ids?.[path] ?? [];
    const before = new Set(previous?._list_ids?.[path] ?? []);
    if (ids.length !== items.length || new Set(ids).size !== ids.length || ids.some(id => !ID.test(id) || retired.has(`${path}:${id}`) || (previous && !before.has(id) && id.startsWith("legacy_")))) errors[path] = "Invalid list identity. Reload before editing.";
  }
  data.contact.cards.forEach((c, i) => { if (!c.destination) errors[`contact.cards.${i}.destination`] = "Choose a destination."; });
  return errors;
}
export function retireAboutIds(data: AboutContent, previous: AboutContent): AboutContent {
  const out = structuredClone(data);
  out._retired_ids = [...new Set([...(previous._retired_ids ?? []), ...ABOUT_LIST_PATHS.flatMap(path => (previous._list_ids?.[path] ?? []).filter(id => !out._list_ids?.[path]?.includes(id)).map(id => `${path}:${id}`))])];
  return out;
}
/** Existing keys stay byte-identical; only the current index → original identity mapping changes. */
export function aboutTranslationField(data: AboutContent, path: string): string {
  for (const list of ABOUT_LIST_PATHS) {
    if (!path.startsWith(`${list}.`)) continue;
    const rest = path.slice(list.length + 1).split(".");
    const id = data._list_ids?.[list]?.[Number(rest[0])];
    if (!id) throw new Error("Missing About identity");
    const slot = id.startsWith("legacy_") ? id.slice(7) : `@${id}`;
    return `block:${list}.${[slot, ...rest.slice(1)].join(".")}`;
  }
  return `block:${path}`;
}
export function aboutSourceFields(data: AboutContent): Record<string, string> {
  const result: Record<string, string> = {};
  for (const pattern of translatablePaths(aboutSchema)) for (const path of expand(pattern.split("."), data, [])) {
    const leaf = path.join(".");
    const value = aboutAt(data, leaf);
    if (typeof value === "string" && value.trim()) result[aboutTranslationField(data, leaf)] = value;
  }
  return result;
}
