import type { Locale } from "@core/db/columns";
import {
  GUIDE_EDITOR_LOCALES,
  type GuideContent,
  type GuideEditorialModel,
  type GuideEnvelope,
  type GuideSharedContent,
} from "../../editorial-types";
import {
  guideLocalizedEqual,
  guideSharedContent,
  guideValuesEqual,
  overlayGuideShared,
} from "../../locale-content";
import type { GuidePageEdit } from "../model";

export interface GuideFormLocale {
  working: GuideContent;
  saved: GuideContent;
  mode: "inherit" | "custom";
  errors: Record<string, string>;
  notice: string;
  conflict: boolean;
}
export interface GuideFormWorkspace {
  id: string;
  model: GuideEditorialModel | null;
  locales: Record<Locale, GuideFormLocale>;
  shared: GuideSharedContent;
  savedShared: GuideSharedContent;
  slug: string;
  savedSlug: string;
}
function contentFromPage(page: GuidePageEdit): GuideContent {
  const content = structuredClone(page);
  for (const key of ["id", "status", "slug", "slugs"])
    Reflect.deleteProperty(content, key);
  return content;
}
function overlay(
  content: GuideContent,
  shared: GuideSharedContent,
): GuideContent {
  return overlayGuideShared(
    { schemaVersion: 1, localeMode: "custom", content },
    shared,
  ).content;
}
export function createGuideWorkspace(
  model: GuideEditorialModel | null,
  draft: GuidePageEdit,
): GuideFormWorkspace {
  const locales = Object.fromEntries(
    GUIDE_EDITOR_LOCALES.map((locale) => {
      const envelope = model?.locales[locale].working;
      const content = structuredClone(
        envelope?.content ?? contentFromPage(draft),
      );
      return [
        locale,
        {
          working: content,
          saved: structuredClone(content),
          mode:
            envelope?.localeMode ?? (locale === "en" ? "custom" : "inherit"),
          errors: {},
          notice: "",
          conflict: false,
        },
      ];
    }),
  ) as Record<Locale, GuideFormLocale>;
  let shared = guideSharedContent(locales.en.working);
  // Seed target-only legacy identities, then let the authoritative common registry win.
  for (const locale of GUIDE_EDITOR_LOCALES) {
    const target = guideSharedContent(
      locales[locale].working,
      undefined,
      locale,
    );
    shared = {
      ...shared,
      sections: { ...target.sections, ...shared.sections },
      places: { ...target.places, ...shared.places },
    };
  }
  if (model)
    shared = {
      ...model.shared.content,
      sections: { ...shared.sections, ...model.shared.content.sections },
      places: { ...shared.places, ...model.shared.content.places },
    };
  for (const locale of GUIDE_EDITOR_LOCALES) {
    locales[locale].working = overlay(locales[locale].working, shared);
    locales[locale].saved = structuredClone(locales[locale].working);
  }
  const slug = model?.slugByLocale.en ?? draft.slugs.en ?? draft.slug;
  return {
    id: model?.id ?? draft.id,
    model,
    locales,
    shared,
    savedShared: structuredClone(shared),
    slug,
    savedSlug: slug,
  };
}
export function guideLocalTextDirty(state: GuideFormLocale): boolean {
  return !guideLocalizedEqual(state.working, state.saved);
}
export function guideLocaleFormDirty(
  workspace: GuideFormWorkspace,
  locale: Locale,
): boolean {
  return (
    guideLocalTextDirty(workspace.locales[locale]) ||
    !guideValuesEqual(workspace.shared, workspace.savedShared) ||
    workspace.slug !== workspace.savedSlug
  );
}
export function guideAnyFormDirty(workspace: GuideFormWorkspace): boolean {
  return GUIDE_EDITOR_LOCALES.some((locale) =>
    guideLocaleFormDirty(workspace, locale),
  );
}
/** Common maps are keyed by stable identities and include every language's local tree. */
export function changeGuideContent(
  workspace: GuideFormWorkspace,
  locale: Locale,
  content: GuideContent,
): GuideFormWorkspace {
  const shared = guideSharedContent(content, workspace.shared, locale);
  const contents = GUIDE_EDITOR_LOCALES.map((key) =>
    key === locale ? content : workspace.locales[key].working,
  );
  const sectionIds = new Set(
    contents.flatMap((tree) => tree.sections.map((section) => section.id)),
  );
  const placeIds = new Set(
    contents.flatMap((tree) =>
      tree.sections.flatMap((section) =>
        section.places.map((place) => place.id),
      ),
    ),
  );
  for (const id of Object.keys(shared.places))
    if (!Object.hasOwn(workspace.savedShared.places, id) && !placeIds.has(id))
      delete shared.places[id];
  // Retain a first registry parent while any saved or working place still uses it.
  for (const place of Object.values(shared.places))
    sectionIds.add(place.section_id);
  for (const id of Object.keys(shared.sections))
    if (
      !Object.hasOwn(workspace.savedShared.sections, id) &&
      !sectionIds.has(id)
    )
      delete shared.sections[id];
  const locales = { ...workspace.locales };
  for (const key of GUIDE_EDITOR_LOCALES) {
    locales[key] = {
      ...locales[key],
      working: overlay(key === locale ? content : locales[key].working, shared),
      ...(key === locale ? { errors: {}, notice: "" } : {}),
    };
  }
  return { ...workspace, locales, shared };
}
export function guideFormEnvelope(
  workspace: GuideFormWorkspace,
  locale: Locale,
): GuideEnvelope {
  const state = workspace.locales[locale];
  return {
    schemaVersion: 1,
    localeMode:
      locale === "en" || state.mode === "custom" || guideLocalTextDirty(state)
        ? "custom"
        : "inherit",
    content: structuredClone(state.working),
  };
}
function incomingWorkspace(
  workspace: GuideFormWorkspace,
  model: GuideEditorialModel,
): GuideFormWorkspace {
  return createGuideWorkspace(model, {
    ...workspace.locales.en.working,
    id: workspace.id,
    status: model.status,
    slug: workspace.slug,
    slugs: model.slugByLocale,
  });
}
/** A completed aggregate Save accepts common maps but never discards another tab's text. */
export function applyGuideModel(
  workspace: GuideFormWorkspace,
  selected: Locale,
  model: GuideEditorialModel,
  notice = "",
): GuideFormWorkspace {
  const incoming = incomingWorkspace(workspace, model);
  for (const locale of GUIDE_EDITOR_LOCALES) {
    const previous = workspace.locales[locale];
    if (locale === selected) {
      incoming.locales[locale].notice = notice;
      continue;
    }
    if (guideLocalTextDirty(previous)) {
      const stale =
        workspace.model &&
        workspace.model.locales[locale].revision !==
          model.locales[locale].revision;
      incoming.locales[locale] = {
        ...previous,
        saved: incoming.locales[locale].saved,
        working: overlay(previous.working, incoming.shared),
        conflict: previous.conflict || Boolean(stale),
      };
    } else
      incoming.locales[locale] = {
        ...incoming.locales[locale],
        errors: previous.errors,
        notice: previous.notice,
        conflict: previous.conflict,
      };
  }
  return incoming;
}
/** Archive/Restore affects visibility alone; preserve selected, other-tab and shared edits. */
export function applyGuideVisibilityModel(
  workspace: GuideFormWorkspace,
  model: GuideEditorialModel,
): GuideFormWorkspace {
  const incoming = incomingWorkspace(workspace, model);
  const sharedDirty = !guideValuesEqual(
    workspace.shared,
    workspace.savedShared,
  );
  const staleShared =
    sharedDirty && workspace.model?.shared.revision !== model.shared.revision;
  const shared = sharedDirty ? workspace.shared : incoming.shared;
  for (const locale of GUIDE_EDITOR_LOCALES) {
    const previous = workspace.locales[locale];
    const localDirty = guideLocalTextDirty(previous);
    const stale =
      localDirty &&
      workspace.model?.locales[locale].revision !==
        model.locales[locale].revision;
    incoming.locales[locale] = {
      ...incoming.locales[locale],
      mode: localDirty ? previous.mode : incoming.locales[locale].mode,
      working: overlay(
        localDirty ? previous.working : incoming.locales[locale].working,
        shared,
      ),
      errors: previous.errors,
      notice: previous.notice,
      conflict: previous.conflict || Boolean(stale || staleShared),
    };
  }
  return {
    ...incoming,
    shared,
    slug:
      workspace.slug !== workspace.savedSlug ? workspace.slug : incoming.slug,
  };
}
export function guidePublicationNeedsSave(
  workspace: GuideFormWorkspace,
  locale: Locale,
): boolean {
  const state = workspace.model?.locales[locale];
  return Boolean(
    state?.draft &&
    !guideLocalizedEqual(state.working.content, state.draft.content),
  );
}
export function guideFormSharedContent(
  workspace: GuideFormWorkspace,
): GuideSharedContent {
  return structuredClone(workspace.shared);
}
/** Normalize server paths to stable entity field IDs, accepting index and UUID paths. */
export function guideEntityErrors(
  content: GuideContent,
  rootId: string,
  errors: Record<string, string>,
): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  for (const [raw, message] of Object.entries(errors)) {
    const path = raw.replace(/^(payload\.)?content\./, "").split(".");
    let id = rootId;
    if (path[0] === "sections" && path.length > 1) {
      const identity = path[1]!;
      const section =
        content.sections.find((section) => section.id === identity) ??
        content.sections[Number(identity)];
      if (section) {
        id = section.id;
        path.splice(0, 2);
        if (path.at(0) === "places" && path.length > 1) {
          const placeIdentity = path[1]!;
          const place =
            section.places.find((place) => place.id === placeIdentity) ??
            section.places[Number(placeIdentity)];
          if (place) {
            id = place.id;
            path.splice(0, 2);
          }
        }
      }
    }
    (result[id] ??= {})[path.join(".") || "_root"] = message;
  }
  return result;
}
