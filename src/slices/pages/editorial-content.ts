import { homeAt, homeSet } from "./home-content";
import { homeSchema } from "./schemas/home";
import { HOME_LIST_PATHS } from "./home-content";
import { describe } from "./admin/form-model";
import { translatablePaths } from "@core/validation/primitives";
const homeDescriptor: PageEditorialDescriptor = {
  key: "home",
  title: "Home",
  publicPath: "",
  rootNode: describe(homeSchema),
  textPatterns: translatablePaths(homeSchema),
  listPaths: [...HOME_LIST_PATHS],
  mediaSlots: [],
  maxLocalMedia: 6,
  externalSections: [],
};
import type { PageEditorialDescriptor } from "./editorial-adapter-types";
import {
  editorialTextPaths,
  editorialTranslationField,
} from "./editorial-identities";
import type { EditorialPageKey, PageEnvelope } from "./editorial-types";

/** Preserve translated leaves by stable row identity while adopting the EN structure. */
export function prepareTargetEnvelope<K extends EditorialPageKey = "home">(
  template: PageEnvelope<K>,
  target: PageEnvelope<K> | null,
  descriptor: PageEditorialDescriptor = homeDescriptor,
): PageEnvelope<K> {
  const next = structuredClone(template);
  const texts = new Map<string, string>();
  if (target)
    for (const path of editorialTextPaths(target.content, descriptor)) {
      const value = homeAt(target.content, path);
      if (typeof value === "string")
        texts.set(
          editorialTranslationField(target.content, path, descriptor),
          value,
        );
    }
  // SEO always has editable leaves, even when no English override exists.
  next.content.seo ??= { meta_title: "", meta_description: "" };
  for (const path of editorialTextPaths(next.content, descriptor)) {
    const value = texts.get(
      editorialTranslationField(next.content, path, descriptor),
    );
    if (value !== undefined) homeSet(next.content, path, value);
  }
  return next;
}

/** Shared fields include list order/IDs, references, icons and the OG reference. */
export function sharedEnvelope<K extends EditorialPageKey = "home">(
  envelope: PageEnvelope<K>,
  descriptor: PageEditorialDescriptor = homeDescriptor,
): string {
  const copy = structuredClone(envelope);
  copy.content.seo ??= { meta_title: "", meta_description: "" };
  for (const path of editorialTextPaths(copy.content, descriptor))
    homeSet(copy.content, path, undefined);
  // Optional text containers have no shared semantics.
  delete copy.content.seo;
  return JSON.stringify(canonical(copy));
}
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    const entries = Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => [key, canonical(child)])
      .filter(([, child]) => child !== undefined);
    return entries.length ? Object.fromEntries(entries) : undefined;
  }
  return value;
}

/** Capture legacy unapproved copy without changing the public baseline. */
export function captureLegacyPending<K extends EditorialPageKey>(
  published: PageEnvelope<K>,
  pending: readonly { field: string; value: string }[],
  descriptor: PageEditorialDescriptor,
): PageEnvelope<K> | null {
  if (!pending.length) return null;
  const draft = structuredClone(published);
  if (pending.some((row) => row.field.startsWith("block:seo.")))
    draft.content.seo ??= { meta_title: "", meta_description: "" };
  for (const path of editorialTextPaths(draft.content, descriptor)) {
    const row = pending.find(
      (row) =>
        row.field ===
        editorialTranslationField(draft.content, path, descriptor),
    );
    if (row) homeSet(draft.content, path, row.value);
  }
  return draft;
}

/** Object insertion order has no editorial meaning; array order still does. */
export function sameEditorialSnapshot<K extends EditorialPageKey>(
  left: PageEnvelope<K>, right: PageEnvelope<K> | null,
): boolean {
  const ordered = (_key: string, value: unknown): unknown =>
    value && typeof value === "object" && !Array.isArray(value)
      ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)))
      : value;
  return JSON.stringify(left, ordered) === JSON.stringify(right, ordered);
}
