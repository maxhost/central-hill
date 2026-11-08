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
  localeReferencePaths: ["faq_group_key"],
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

/** Preserve localized copy/references while adopting the shared EN structure. */
export function prepareTargetEnvelope<K extends EditorialPageKey = "home">(
  template: PageEnvelope<K>,
  target: PageEnvelope<K> | null,
  descriptor: PageEditorialDescriptor = homeDescriptor,
): PageEnvelope<K> {
  const next = structuredClone(template);
  if (target?.mediaAlts !== undefined) next.mediaAlts = structuredClone(target.mediaAlts);
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
    // A target may have authored a text-only optional group while EN kept it absent.
    if (value !== undefined) homeSet(next.content, path, value, true);
  }
  // References belong to the target even before its first localized text edit.
  // Preserve absence instead of copying EN or materializing a false dirty blank.
  for (const path of descriptor.localeReferencePaths ?? [])
    homeSet(next.content, path, target ? homeAt(target.content, path) : undefined, true);
  // Preserve absent legacy URLs and their localized fallback. Introducing a blank
  // would create false unsaved changes; inheriting EN would change the destination.
  if (descriptor.key === "home" && target && homeAt(target.content, "dual_cta.guest.cta_url") === undefined)
    homeSet(next.content, "dual_cta.guest.cta_url", undefined);
  // Guest overrides were added after its legacy booking and Settings contact fallbacks.
  // An untouched target keeps those defaults instead of adopting a new EN override.
  if (descriptor.key === "guest" && target)
    for (const path of ["hero.cta_label", "hero.cta_url", "dual_cta.guest.contact_line", "dual_cta.owner.contact_line"])
      if (homeAt(target.content, path) === undefined) homeSet(next.content, path, undefined);
  // Services also keeps its pre-existing booking defaults until that locale opts in.
  if (descriptor.key === "services" && target)
    for (const path of ["hero.cta_label", "hero.cta_url"])
      if (homeAt(target.content, path) === undefined) homeSet(next.content, path, undefined);
  return next;
}

/** Shared fields retain layout/media; declared locale references are excluded. */
export function sharedEnvelope<K extends EditorialPageKey = "home">(
  envelope: PageEnvelope<K>,
  descriptor: PageEditorialDescriptor = homeDescriptor,
): string {
  const copy = structuredClone(envelope);
  copy.content.seo ??= { meta_title: "", meta_description: "" };
  for (const path of editorialTextPaths(copy.content, descriptor))
    homeSet(copy.content, path, undefined);
  for (const path of descriptor.localeReferencePaths ?? [])
    homeSet(copy.content, path, undefined);
  // Optional text containers have no shared semantics.
  delete copy.content.seo;
  delete copy.mediaAlts;
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
