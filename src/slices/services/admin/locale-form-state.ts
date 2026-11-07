import type { Locale } from "@core/db/columns";
import { iconKey } from "@core/validation/icon-key";
import {
  SERVICE_EDITOR_LOCALES,
  type ServiceEditorialModel,
  type ServiceEnvelope,
  type ServiceSharedContent,
} from "../editorial-types";
import {
  emptyServiceEnvelope,
  identifyServiceContent,
  serviceLocalizedContent,
  serviceSharedContent,
} from "../locale-content";
import { buildPayload, initialState, type FormState } from "./form-model";
import { serviceDetailContent } from "../detail";

const SHARED_FORM_KEYS = [
  "position",
  "category_id",
  "cover_media_id",
  "og_image_media_id",
  "price_from",
  "rating",
  "booking_type",
  "presentation",
  "gallery",
] as const;
type SharedForm = Pick<FormState, (typeof SHARED_FORM_KEYS)[number]> & {
  factIcons: Record<string, string>;
  itineraryMedia: Record<string, string>;
};
export interface ServiceFormLocale {
  working: FormState;
  saved: FormState;
  mode: "inherit" | "custom";
  errors: Record<string, string>;
  notice: string;
  conflict: boolean;
}
export interface ServiceFormWorkspace {
  model: ServiceEditorialModel | null;
  locales: Record<Locale, ServiceFormLocale>;
  shared: SharedForm;
  savedShared: SharedForm;
  slug: string;
  savedSlug: string;
}
/** JSONB field order is irrelevant; list order and absent/null remain meaningful. */
export function serviceFormEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) || Array.isArray(b))
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((v, i) => serviceFormEqual(v, b[i]))
    );
  const left = a as Record<string, unknown>,
    right = b as Record<string, unknown>;
  const keys = Object.keys(left).filter((k) => left[k] !== undefined);
  return (
    keys.length ===
      Object.keys(right).filter((k) => right[k] !== undefined).length &&
    keys.every(
      (k) => Object.hasOwn(right, k) && serviceFormEqual(left[k], right[k]),
    )
  );
}
function localForm(form: FormState): unknown {
  const local = { ...form } as Partial<FormState>;
  for (const key of SHARED_FORM_KEYS) delete local[key];
  delete local.slug;
  delete local.status;
  return {
    ...local,
    detail: {
      ...form.detail,
      facts: form.detail.facts.map((fact) => {
        const text = { ...fact };
        Reflect.deleteProperty(text, "icon");
        return text;
      }),
      itinerary: form.detail.itinerary.map((step) => {
        const text = { ...step };
        Reflect.deleteProperty(text, "media_id");
        return text;
      }),
    },
  };
}
function sharedForm(form: FormState, previous?: SharedForm): SharedForm {
  return {
    ...(Object.fromEntries(
      SHARED_FORM_KEYS.map((key) => [key, structuredClone(form[key])]),
    ) as Pick<FormState, (typeof SHARED_FORM_KEYS)[number]>),
    factIcons: {
      ...previous?.factIcons,
      ...Object.fromEntries(
        form.detail.facts.filter((f) => f.id).map((f) => [f.id!, f.icon]),
      ),
    },
    itineraryMedia: {
      ...previous?.itineraryMedia,
      ...Object.fromEntries(
        form.detail.itinerary
          .filter((s) => s.id)
          .map((s) => [s.id!, s.media_id]),
      ),
    },
  };
}
function overlayForm(form: FormState, shared: SharedForm): FormState {
  return {
    ...form,
    ...Object.fromEntries(
      SHARED_FORM_KEYS.map((key) => [key, structuredClone(shared[key])]),
    ),
    detail: {
      ...form.detail,
      facts: form.detail.facts.map((f) => ({
        ...f,
        icon:
          f.id && Object.hasOwn(shared.factIcons, f.id)
            ? shared.factIcons[f.id]!
            : f.icon,
      })),
      itinerary: form.detail.itinerary.map((s) => ({
        ...s,
        media_id:
          s.id && Object.hasOwn(shared.itineraryMedia, s.id)
            ? shared.itineraryMedia[s.id]!
            : s.media_id,
      })),
    },
  };
}
function formFromEnvelope(
  envelope: ServiceEnvelope,
  slug: string,
  status: FormState["status"],
): FormState {
  return initialState(
    { ...identifyServiceContent(envelope.content), slug, status },
    envelope.content.category_id,
  );
}
export function createServiceWorkspace(
  model: ServiceEditorialModel | null,
  defaultCategoryId: string,
): ServiceFormWorkspace {
  const slug = model?.slugByLocale.en ?? "";
  const locales = Object.fromEntries(
    SERVICE_EDITOR_LOCALES.map((locale) => {
      const envelope =
        model?.locales[locale].working ??
        ({
          ...emptyServiceEnvelope(defaultCategoryId),
          localeMode: locale === "en" ? "custom" : "inherit",
        } as ServiceEnvelope);
      const form = formFromEnvelope(envelope, slug, model?.status ?? "draft");
      return [
        locale,
        {
          working: form,
          saved: structuredClone(form),
          mode: envelope.localeMode,
          errors: {},
          notice: "",
          conflict: false,
        },
      ];
    }),
  ) as Record<Locale, ServiceFormLocale>;
  let shared = sharedForm(locales.en.working);
  // Retain target-only legacy nested identities as well as the complete stored maps.
  for (const locale of SERVICE_EDITOR_LOCALES)
    shared = {
      ...shared,
      factIcons: {
        ...sharedForm(locales[locale].working).factIcons,
        ...shared.factIcons,
      },
      itineraryMedia: {
        ...sharedForm(locales[locale].working).itineraryMedia,
        ...shared.itineraryMedia,
      },
    };
  if (model)
    shared = {
      ...shared,
      factIcons: { ...shared.factIcons, ...model.shared.content.factIcons },
      itineraryMedia: {
        ...shared.itineraryMedia,
        ...Object.fromEntries(
          Object.entries(model.shared.content.itineraryMedia).map(
            ([id, media]) => [id, media ?? ""],
          ),
        ),
      },
    };
  for (const locale of SERVICE_EDITOR_LOCALES) {
    locales[locale].working = overlayForm(locales[locale].working, shared);
    locales[locale].saved = structuredClone(locales[locale].working);
  }
  return {
    model,
    locales,
    shared,
    savedShared: structuredClone(shared),
    slug,
    savedSlug: slug,
  };
}
export function serviceLocalTextDirty(state: ServiceFormLocale): boolean {
  return !serviceFormEqual(localForm(state.working), localForm(state.saved));
}
export function serviceLocaleFormDirty(
  workspace: ServiceFormWorkspace,
  locale: Locale,
): boolean {
  return (
    serviceLocalTextDirty(workspace.locales[locale]) ||
    !serviceFormEqual(workspace.shared, workspace.savedShared) ||
    workspace.slug !== workspace.savedSlug
  );
}
export function serviceAnyFormDirty(workspace: ServiceFormWorkspace): boolean {
  return SERVICE_EDITOR_LOCALES.some((locale) =>
    serviceLocaleFormDirty(workspace, locale),
  );
}
/** Update common fields locally across tabs without ever taking target ownership. */
export function changeServiceForm(
  workspace: ServiceFormWorkspace,
  locale: Locale,
  form: FormState,
): ServiceFormWorkspace {
  const shared = sharedForm(form, workspace.shared);
  const locales = { ...workspace.locales };
  for (const key of SERVICE_EDITOR_LOCALES) {
    const old = locales[key];
    locales[key] = {
      ...old,
      working: overlayForm(key === locale ? form : old.working, shared),
      ...(key === locale ? { errors: {}, notice: "" } : {}),
    };
  }
  return { ...workspace, locales, shared, slug: form.slug };
}
/** A result rebases common values but retains unsaved text in every other language. */
export function applyServiceModel(
  workspace: ServiceFormWorkspace,
  selected: Locale,
  model: ServiceEditorialModel,
  notice = "",
): ServiceFormWorkspace {
  const incoming = createServiceWorkspace(
    model,
    model.shared.content.category_id,
  );
  for (const locale of SERVICE_EDITOR_LOCALES) {
    if (locale === selected) {
      incoming.locales[locale].notice = notice;
      continue;
    }
    const previous = workspace.locales[locale];
    if (serviceLocalTextDirty(previous)) {
      const stale =
        workspace.model &&
        workspace.model.locales[locale].revision !==
          model.locales[locale].revision;
      incoming.locales[locale] = {
        ...previous,
        conflict: previous.conflict || Boolean(stale),
        saved: incoming.locales[locale].saved,
        working: {
          ...overlayForm(previous.working, incoming.shared),
          slug: incoming.slug,
          status: model.status,
        },
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
export function serviceFormEnvelope(
  workspace: ServiceFormWorkspace,
  locale: Locale,
): ServiceEnvelope {
  const state = workspace.locales[locale];
  const payload = buildPayload(state.working, undefined);
  const content = {
    ...payload,
    detail: serviceDetailContent.parse(payload.detail),
  };
  for (const key of ["id", "slug", "status"])
    Reflect.deleteProperty(content, key);
  return {
    schemaVersion: 1,
    localeMode:
      locale === "en" || state.mode === "custom" || serviceLocalTextDirty(state)
        ? "custom"
        : "inherit",
    content,
  };
}

/** Archive/restore changes visibility only, preserving even selected unsaved work. */
export function applyServiceVisibilityModel(
  workspace: ServiceFormWorkspace,
  model: ServiceEditorialModel,
): ServiceFormWorkspace {
  const incoming = createServiceWorkspace(
    model,
    model.shared.content.category_id,
  );
  const sharedDirty = !serviceFormEqual(
    workspace.shared,
    workspace.savedShared,
  );
  const staleShared =
    sharedDirty && workspace.model?.shared.revision !== model.shared.revision;
  const shared = sharedDirty ? workspace.shared : incoming.shared;
  for (const locale of SERVICE_EDITOR_LOCALES) {
    const previous = workspace.locales[locale];
    const localDirty = serviceLocalTextDirty(previous);
    const staleLocale =
      localDirty &&
      workspace.model?.locales[locale].revision !==
        model.locales[locale].revision;
    incoming.locales[locale] = {
      ...incoming.locales[locale],
      errors: previous.errors,
      notice: previous.notice,
      conflict: previous.conflict || Boolean(staleShared || staleLocale),
      working: {
        ...overlayForm(
          localDirty ? previous.working : incoming.locales[locale].working,
          shared,
        ),
        status: model.status,
      },
    };
  }
  return {
    ...incoming,
    shared,
    slug:
      workspace.slug !== workspace.savedSlug ? workspace.slug : incoming.slug,
  };
}

/** Inherited work can follow newer saved EN while its existing saved draft stays frozen. */
export function servicePublicationNeedsSave(
  workspace: ServiceFormWorkspace,
  locale: Locale,
): boolean {
  const model = workspace.model?.locales[locale];
  return Boolean(
    model?.draft &&
    !serviceFormEqual(
      serviceLocalizedContent(model.working.content),
      serviceLocalizedContent(model.draft.content),
    ),
  );
}

/** Save all common nested references, including slots absent from the selected locale. */
export function serviceFormSharedContent(
  workspace: ServiceFormWorkspace,
  locale: Locale,
): ServiceSharedContent {
  return {
    ...serviceSharedContent(serviceFormEnvelope(workspace, locale).content),
    factIcons: Object.fromEntries(
      Object.entries(workspace.shared.factIcons).map(([id, icon]) => [
        id,
        iconKey.parse(icon),
      ]),
    ),
    itineraryMedia: Object.fromEntries(
      Object.entries(workspace.shared.itineraryMedia).map(([id, media]) => [
        id,
        media || null,
      ]),
    ),
  };
}
