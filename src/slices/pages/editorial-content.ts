import { homeAt, homeSet, homeTextPaths, homeTranslationField } from "./home-content";
import type { PageEnvelope } from "./editorial-types";

/** Preserve translated leaves by stable row identity while adopting the EN structure. */
export function prepareTargetEnvelope(template: PageEnvelope, target: PageEnvelope | null): PageEnvelope {
  const next = structuredClone(template);
  const texts = new Map<string, string>();
  if (target) for (const path of homeTextPaths(target.content)) {
    const value = homeAt(target.content, path);
    if (typeof value === "string") texts.set(homeTranslationField(target.content, path), value);
  }
  // SEO always has editable leaves, even when no English override exists.
  next.content.seo ??= { meta_title: "", meta_description: "" };
  for (const path of homeTextPaths(next.content)) {
    const value = texts.get(homeTranslationField(next.content, path));
    if (value !== undefined) homeSet(next.content, path, value);
  }
  return next;
}

/** Shared fields include list order/IDs, references, icons and the OG reference. */
export function sharedEnvelope(envelope: PageEnvelope): string {
  const copy = structuredClone(envelope);
  copy.content.seo ??= { meta_title: "", meta_description: "" };
  for (const path of homeTextPaths(copy.content)) homeSet(copy.content, path, undefined);
  // Optional text containers have no shared semantics.
  delete copy.content.seo;
  return JSON.stringify(canonical(copy));
}
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, canonical(child)]).filter(([, child]) => child !== undefined);
    return entries.length ? Object.fromEntries(entries) : undefined;
  }
  return value;
}
