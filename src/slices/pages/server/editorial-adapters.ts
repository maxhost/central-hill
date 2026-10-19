import "server-only";
import type { EditorialPageKey } from "../editorial-types";
import type { PageEditorialAdapter } from "../editorial-adapter-types";
import { homeAdapter } from "../adapters/home";
/** Explicit server registry: consumers cannot accidentally bundle queries/renderers. */
export function getEditorialAdapter<K extends EditorialPageKey>(key: K): PageEditorialAdapter<K> {
 if (key === "home") return homeAdapter as unknown as PageEditorialAdapter<K>;
 throw new Error(`Editorial adapter not enabled: ${key}`);
}
