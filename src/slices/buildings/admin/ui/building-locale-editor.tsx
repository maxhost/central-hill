"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { UiIcon } from "@core/ui";
import {
  PROPERTY_EDITOR_LOCALES,
  AdminButton,
  Checkbox,
  Field,
  MediaField,
  Select,
  TextArea,
  TextInput,
  useMediaQueue,
  type AdminMediaPreview,
  type EditorLocale,
  type PropertyEditorialResult,
} from "@slices/backoffice/contract";
import type {
  BuildingEditorialContent,
  BuildingEditorialModel,
} from "../../editorial-types";
import type { LocationOptions, AmenityOption } from "../queries";
import {
  archiveBuilding,
  publishBuildingLocaleDraft,
  saveBuildingLocaleDraft,
} from "../editorial-actions";
import { deleteBuilding } from "../actions";
import {
  applyBuildingLocaleResult,
  changeBuildingField,
  emptyBuildingEnvelope,
  buildingEnvelopeEqual,
  buildingLocaleDirty,
  buildingMediaIds,
  buildingSharedContent,
  buildingValuesEqual,
  applyBuildingSharedResult,
  type BuildingWorkspace,
} from "./property-editor-state";

type Operation = "save" | "publish" | "archive" | "delete" | null;

export function BuildingLocaleEditor({
  initial,
  newEntityId,
  initialLocale,
  locations,
  amenities,
}: {
  initial: BuildingEditorialModel | null;
  /** Generated in the route so server and client hydration use the same identity. */
  newEntityId?: string;
  initialLocale?: string;
  locations: LocationOptions;
  amenities: AmenityOption[];
}) {
  const t = useTranslations("buildings");
  const te = useTranslations("propertyEditor");
  const tb = useTranslations("backoffice");
  const router = useRouter();
  const queue = useMediaQueue();
  const fieldPrefix = useId();
  const [entityId] = useState(() => initial?.id ?? newEntityId ?? "");
  const [persisted, setPersisted] = useState(Boolean(initial));
  const [slug, setSlug] = useState(initial?.slugByLocale.en ?? "");
  const [slugByLocale, setSlugByLocale] = useState(initial?.slugByLocale ?? {});
  const [archived, setArchived] = useState(initial?.archived ?? false);
  const [states, setStates] = useState<BuildingWorkspace>(
    () =>
      Object.fromEntries(
        PROPERTY_EDITOR_LOCALES.map((locale) => [
          locale,
          {
            model: initial?.locales[locale] ?? {
              locale,
              revision: 0,
              templateRevision: locale === "en" ? null : 0,
              published: null,
              draft: null,
              working: {
                ...emptyBuildingEnvelope(locations.cities[0]?.id),
                localeMode: locale === "en" ? "custom" : "inherit",
              },
            },
            errors: {},
            notice: "",
            conflict: false,
          },
        ]),
      ) as BuildingWorkspace,
  );
  const selectedLocale: EditorLocale =
    initial && PROPERTY_EDITOR_LOCALES.includes(initialLocale as EditorLocale)
      ? (initialLocale as EditorLocale)
      : "en";
  const [locale, setLocale] = useState<EditorLocale>(selectedLocale);
  const [shared, setShared] = useState(
    () =>
      initial?.shared ?? {
        revision: 0,
        content: buildingSharedContent(
          initial?.locales.en.working.content ??
            emptyBuildingEnvelope(locations.cities[0]?.id).content,
        ),
      },
  );
  const [savedPreviews, setSavedPreviews] = useState(initial?.previews ?? {});
  const [started, setStarted] = useState(
    () => new Set<EditorLocale>(["en", selectedLocale]),
  );
  const [operation, setOperation] = useState<Operation>(null);
  const [navigating, startNavigation] = useTransition();
  const [localMedia, setLocalMedia] = useState<
    Record<string, AdminMediaPreview>
  >({});
  const [leaveTarget, setLeaveTarget] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    "archive" | "delete" | null
  >(null);
  const lock = useRef(false);
  const skipLeave = useRef(false);
  const leaveDialog = useRef<HTMLDialogElement>(null);
  const actionDialog = useRef<HTMLDialogElement>(null);
  const state = states[locale];
  const content = state.model.working.content;
  const [openingEdit, setOpeningEdit] = useState(false);
  const busy =
    operation !== null || queue.isPreparing || navigating || openingEdit;
  const sharedDirty = !buildingValuesEqual(
    buildingSharedContent(content),
    shared.content,
  );
  const dirty =
    sharedDirty ||
    (persisted
      ? buildingLocaleDirty(state.model)
      : !buildingEnvelopeEqual(
          { ...state.model.working, localeMode: undefined },
          emptyBuildingEnvelope(locations.cities[0]?.id),
        ) || Boolean(slug));
  const anyDirty =
    sharedDirty ||
    [...started].some((key) =>
      persisted
        ? buildingLocaleDirty(states[key].model)
        : !buildingEnvelopeEqual(
            { ...states[key].model.working, localeMode: undefined },
            emptyBuildingEnvelope(locations.cities[0]?.id),
          ),
    ) ||
    (!persisted && Boolean(slug));
  const previews = useMemo(
    () => ({ ...localMedia, ...savedPreviews }),
    [savedPreviews, localMedia],
  );
  const editableShared = !archived;
  const currentUrl = useRef("");

  useEffect(() => {
    currentUrl.current = window.location.href;
  }, [persisted]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!skipLeave.current && (anyDirty || busy)) event.preventDefault();
    };
    const intercept = (event: MouseEvent) => {
      if (
        skipLeave.current ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href]")
          : null;
      if (!link || link.target === "_blank" || link.hasAttribute("download"))
        return;
      const href = new URL(link.href, window.location.href);
      if (
        href.href === window.location.href ||
        (href.pathname === window.location.pathname &&
          href.search === window.location.search &&
          href.hash)
      )
        return;
      if (!anyDirty && !busy) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!busy) setLeaveTarget(href.href);
    };
    const back = (event: PopStateEvent) => {
      if (skipLeave.current || (!anyDirty && !busy)) return;
      const target = window.location.href;
      if (target === currentUrl.current) return;
      event.stopImmediatePropagation();
      window.history.pushState(window.history.state, "", currentUrl.current);
      if (!busy) setLeaveTarget(target);
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", intercept, true);
    window.addEventListener("popstate", back, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", intercept, true);
      window.removeEventListener("popstate", back, true);
    };
  }, [anyDirty, busy]);
  useEffect(() => {
    if (leaveTarget && !leaveDialog.current?.open)
      leaveDialog.current?.showModal();
    if (!leaveTarget && leaveDialog.current?.open) leaveDialog.current?.close();
  }, [leaveTarget]);
  useEffect(() => {
    if (confirmAction && !actionDialog.current?.open)
      actionDialog.current?.showModal();
    if (!confirmAction && actionDialog.current?.open)
      actionDialog.current?.close();
  }, [confirmAction]);

  function set<K extends keyof BuildingEditorialContent>(
    key: K,
    value: BuildingEditorialContent[K],
  ) {
    if (busy || archived) return;
    setStates((previous) => changeBuildingField(previous, locale, key, value));
  }
  function selectLocale(next: EditorLocale) {
    if (busy || (!persisted && next !== "en")) return;
    if (!started.has(next)) {
      setStarted((previous) => new Set([...previous, next]));
    }
    setLocale(next);
  }
  function remember(preview: AdminMediaPreview | null) {
    if (preview)
      setLocalMedia((previous) => ({ ...previous, [preview.id]: preview }));
  }
  function resultError(
    result: Exclude<
      PropertyEditorialResult<BuildingEditorialContent>,
      { ok: true }
    >,
  ) {
    const notice =
      result.error === "validation"
        ? te("validation")
        : result.error === "conflict"
          ? te("conflict")
          : result.error === "legacy_invalid"
            ? te("legacyInvalid")
            : result.error === "slug_conflict"
              ? te("slugConflict")
              : result.error === "no_draft"
                ? te("noDraft")
                : result.error === "archived"
                  ? te("archived")
                  : te("error");
    setStates((previous) => ({
      ...previous,
      [locale]: {
        ...previous[locale],
        notice,
        conflict:
          result.error === "conflict" || result.error === "legacy_invalid",
        errors: result.error === "validation" ? result.fieldErrors : {},
      },
    }));
    if (result.error === "validation") {
      const first =
        Object.keys(result.fieldErrors)[0]?.replace(/^content\./, "") ?? "";
      requestAnimationFrame(() => {
        const node =
          document.getElementById(`${fieldPrefix}-${locale}-${first}`) ??
          document.getElementById(`${fieldPrefix}-status`);
        node?.scrollIntoView({ block: "center", behavior: "smooth" });
        node?.focus();
      });
    }
  }
  async function mutate(action: "save" | "publish") {
    if (lock.current || busy || archived || !entityId || state.conflict) return;
    if (action === "publish" && (!state.model.draft || dirty || !persisted))
      return;
    lock.current = true;
    setOperation(action);
    setStates((previous) => ({
      ...previous,
      [locale]: { ...previous[locale], notice: "", errors: {} },
    }));
    try {
      if (
        action === "save" &&
        !(await queue.flush(buildingMediaIds(state.model.working)))
      )
        return;
      const request = {
        id: entityId,
        locale,
        expectedRevision: state.model.revision,
      };
      const result =
        action === "save"
          ? await saveBuildingLocaleDraft({
              ...request,
              payload: state.model.working,
              templateRevision: state.model.templateRevision,
              expectedSharedRevision: shared.revision,
              sharedChanged: sharedDirty,
              ...(!persisted ? { slug: slug.trim() } : {}),
            })
          : await publishBuildingLocaleDraft(request);
      if (!result.ok) {
        resultError(result);
        return;
      }
      setStates((previous) =>
        applyBuildingSharedResult(
          applyBuildingLocaleResult(
            previous,
            locale,
            result.model,
            result.refreshWarning
              ? te(action === "save" ? "savedRefreshWarning" : "refreshWarning")
              : te(action === "save" ? "draftSaved" : "published"),
          ),
          result.shared?.content ??
            buildingSharedContent(result.model.working.content),
        ),
      );
      if (result.shared) setShared(result.shared);
      if (result.previews)
        setSavedPreviews((previous) => ({ ...previous, ...result.previews }));
      setSlugByLocale(result.slugByLocale);
      if (!persisted) {
        setOpeningEdit(true);
        setPersisted(true);
        // Creation moves to the real Edit route. Keeping the New route's RSC
        // tree after changing browser history can later reinitialize this form.
        // Targets are still locked while this saved EN model is being reopened.
        skipLeave.current = true;
        startNavigation(() => router.replace(`/admin/buildings/${result.id}`));
      }
    } catch {
      setStates((previous) => ({
        ...previous,
        [locale]: { ...previous[locale], notice: te("error") },
      }));
    } finally {
      setOperation(null);
      lock.current = false;
    }
  }
  function leave(href: string) {
    if (busy) return;
    if (anyDirty) {
      setLeaveTarget(href);
      return;
    }
    skipLeave.current = true;
    router.push(href);
  }
  async function lifecycle(action: "archive" | "delete") {
    if (lock.current || busy) return;
    lock.current = true;
    setOperation(action);
    setConfirmAction(null);
    try {
      const result =
        action === "archive"
          ? await archiveBuilding(entityId)
          : await deleteBuilding(entityId);
      if (!result.ok) {
        const inUse =
          action === "delete" && "error" in result && result.error === "in_use";
        setStates((previous) => ({
          ...previous,
          [locale]: {
            ...previous[locale],
            notice: te(inUse ? "inUse" : "error"),
          },
        }));
        return;
      }
      if (action === "archive") setArchived(true);
      skipLeave.current = true;
      router.push("/admin/buildings");
    } catch {
      setStates((previous) => ({
        ...previous,
        [locale]: { ...previous[locale], notice: te("error") },
      }));
    } finally {
      setOperation(null);
      lock.current = false;
    }
  }

  const error = (key: string) =>
    state.errors[key] ??
    state.errors[`content.${key}`] ??
    state.errors[`payload.content.${key}`];
  const fieldId = (key: string) => `${fieldPrefix}-${locale}-${key}`;
  const input = (
    key:
      | "name"
      | "teaser"
      | "booking_url"
      | "default_booking_url"
      | "avantio_id"
      | "street_address"
      | "meta_title"
      | "meta_description",
    label: string,
    multiline = false,
    shared = false,
  ) => (
    <Field key={key} label={label} htmlFor={fieldId(key)} error={error(key)}>
      {multiline ? (
        <TextArea
          id={fieldId(key)}
          value={content[key] ?? ""}
          onChange={(event) => set(key, event.target.value)}
          disabled={busy || archived || (shared && !editableShared)}
        />
      ) : (
        <TextInput
          id={fieldId(key)}
          value={content[key] ?? ""}
          onChange={(event) => set(key, event.target.value)}
          disabled={busy || archived || (shared && !editableShared)}
        />
      )}
    </Field>
  );
  const imageField = (
    key: "cover_media_id" | "og_image_media_id",
    label: string,
  ) => (
    <Field label={label} error={error(key)}>
      <fieldset disabled={!editableShared || busy}>
        <MediaField
          key={`${key}-${content[key] ?? "empty"}-${content[key] ? (previews[content[key]!]?.url ?? "") : ""}`}
          value={content[key]}
          preview={content[key] ? (previews[content[key]!] ?? null) : null}
          onChange={(id, preview) => {
            set(key, id);
            remember(preview);
          }}
        />
      </fieldset>
    </Field>
  );
  const numberField = (
    key: "position" | "latitude" | "longitude",
    label: string,
  ) => (
    <Field key={key} label={label} htmlFor={fieldId(key)} error={error(key)}>
      <TextInput
        id={fieldId(key)}
        type="number"
        value={content[key] ?? ""}
        onChange={(event) =>
          set(
            key,
            key === "position"
              ? Number(event.target.value)
              : event.target.value === ""
                ? null
                : Number(event.target.value),
          )
        }
        disabled={!editableShared || busy}
      />
    </Field>
  );
  const moveFaq = (index: number, direction: number) => {
    const next = [...content.faq];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    set("faq", next);
  };
  const renderSection = (selection: string) => (
    <div className="space-y-5">
      {selection === "identity" ? (
        <>
          <Field
            label={t("admin.fields.slug")}
            htmlFor={fieldId("slug")}
            error={error("slug")}
            hint={persisted ? te("immutableSlug") : t("admin.fields.slugHint")}
          >
            <TextInput
              id={fieldId("slug")}
              value={persisted ? (slugByLocale[locale] ?? slug) : slug}
              onChange={(event) => setSlug(event.target.value)}
              disabled={persisted || busy}
            />
          </Field>
          <Field
            label={t("admin.fields.city")}
            htmlFor={fieldId("city_id")}
            error={error("city_id")}
          >
            <Select
              id={fieldId("city_id")}
              value={content.city_id}
              onChange={(event) => {
                set("city_id", event.target.value);
                set("neighbourhood_id", null);
              }}
              disabled={!editableShared || busy}
            >
              <option value="">{t("admin.fields.choose")}</option>
              {locations.cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label={t("admin.fields.neighbourhood")}
            htmlFor={fieldId("neighbourhood_id")}
            error={error("neighbourhood_id")}
          >
            <Select
              id={fieldId("neighbourhood_id")}
              value={content.neighbourhood_id ?? ""}
              onChange={(event) =>
                set("neighbourhood_id", event.target.value || null)
              }
              disabled={!editableShared || busy}
            >
              <option value="">{t("admin.fields.none")}</option>
              {locations.neighbourhoods
                .filter((n) => n.cityId === content.city_id)
                .map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
            </Select>
          </Field>
          {input(
            "street_address",
            t("admin.fields.streetAddress"),
            false,
            true,
          )}
          {numberField("position", t("admin.fields.position"))}
          <Checkbox
            label={t("admin.fields.isNew")}
            checked={content.is_new}
            onChange={(e) => set("is_new", e.target.checked)}
            disabled={!editableShared || busy}
          />
          <Checkbox
            label={t("admin.fields.isFeatured")}
            checked={content.is_featured}
            onChange={(e) => set("is_featured", e.target.checked)}
            disabled={!editableShared || busy}
          />
          {numberField("latitude", t("admin.fields.latitude"))}
          {numberField("longitude", t("admin.fields.longitude"))}
        </>
      ) : selection === "hero" ? (
        <>
          {input("name", t("admin.fields.name"))}
          {input("teaser", t("admin.fields.teaser"), true)}
          {imageField("cover_media_id", t("admin.fields.cover"))}
        </>
      ) : selection === "gallery" ? (
        <>
          <p className="text-xs text-ink-soft">
            {t("admin.fields.galleryHint")}
          </p>
          <fieldset disabled={!editableShared || busy} className="space-y-4">
            {content.gallery.map((id, index) => (
              <div key={id} className="space-y-2">
                <MediaField
                  key={`${id}-${previews[id]?.url ?? ""}`}
                  value={id}
                  preview={previews[id] ?? null}
                  onChange={(next, preview) => {
                    set(
                      "gallery",
                      next
                        ? content.gallery.map((item) =>
                            item === id ? next : item,
                          )
                        : content.gallery.filter((item) => item !== id),
                    );
                    remember(preview);
                  }}
                />
                <div className="flex gap-2">
                  <AdminButton
                    aria-label={tb("actions.moveUp")}
                    disabled={index === 0}
                    onClick={() => {
                      const next = [...content.gallery];
                      [next[index - 1], next[index]] = [
                        next[index]!,
                        next[index - 1]!,
                      ];
                      set("gallery", next);
                    }}
                  >
                    ↑
                  </AdminButton>
                  <AdminButton
                    aria-label={tb("actions.moveDown")}
                    disabled={index === content.gallery.length - 1}
                    onClick={() => {
                      const next = [...content.gallery];
                      [next[index + 1], next[index]] = [
                        next[index]!,
                        next[index + 1]!,
                      ];
                      set("gallery", next);
                    }}
                  >
                    ↓
                  </AdminButton>
                </div>
              </div>
            ))}
            <MediaField
              key={`add-${content.gallery.length}`}
              value={null}
              onChange={(id, preview) => {
                if (id) set("gallery", [...content.gallery, id]);
                remember(preview);
              }}
            />
          </fieldset>
        </>
      ) : selection === "amenities" ? (
        <>
          {amenities.length ? (
            amenities.map((option) => (
              <div key={option.id}>
                <Checkbox
                  label={option.label}
                  checked={content.amenity_ids.includes(option.id)}
                  onChange={() =>
                    set(
                      "amenity_ids",
                      content.amenity_ids.includes(option.id)
                        ? content.amenity_ids.filter((id) => id !== option.id)
                        : [...content.amenity_ids, option.id],
                    )
                  }
                  disabled={!editableShared || busy}
                />
              </div>
            ))
          ) : (
            <p className="text-sm text-ink-soft">{t("admin.noAmenities")}</p>
          )}
        </>
      ) : selection === "faq" ? (
        <>
          <p className="text-xs text-ink-soft">{t("admin.sectionHints.faq")}</p>
          {content.faq.map((item, index) => (
            <div key={item.id} className="space-y-3 border-b border-line pb-5">
              <Field
                label={t("admin.fields.question")}
                htmlFor={fieldId(`faq-${item.id}-question`)}
                error={error(`faq.${index}`)}
              >
                <TextInput
                  id={fieldId(`faq-${item.id}-question`)}
                  value={item.question}
                  disabled={busy || archived}
                  onChange={(event) =>
                    set(
                      "faq",
                      content.faq.map((f) =>
                        f.id === item.id
                          ? { ...f, question: event.target.value }
                          : f,
                      ),
                    )
                  }
                />
              </Field>
              <Field
                label={t("admin.fields.answer")}
                htmlFor={fieldId(`faq-${item.id}-answer`)}
              >
                <TextArea
                  id={fieldId(`faq-${item.id}-answer`)}
                  value={item.answer}
                  disabled={busy || archived}
                  onChange={(event) =>
                    set(
                      "faq",
                      content.faq.map((f) =>
                        f.id === item.id
                          ? { ...f, answer: event.target.value }
                          : f,
                      ),
                    )
                  }
                />
              </Field>
              {!archived ? (
                <div className="flex gap-2">
                  <AdminButton
                    aria-label={tb("actions.moveUp")}
                    disabled={busy || index === 0}
                    onClick={() => moveFaq(index, -1)}
                  >
                    ↑
                  </AdminButton>
                  <AdminButton
                    aria-label={tb("actions.moveDown")}
                    disabled={busy || index === content.faq.length - 1}
                    onClick={() => moveFaq(index, 1)}
                  >
                    ↓
                  </AdminButton>
                  <AdminButton
                    disabled={busy}
                    onClick={() =>
                      set(
                        "faq",
                        content.faq.filter((f) => f.id !== item.id),
                      )
                    }
                  >
                    {tb("actions.remove")}
                  </AdminButton>
                </div>
              ) : null}
            </div>
          ))}
          {!archived ? (
            <AdminButton
              disabled={busy}
              onClick={() =>
                set("faq", [
                  ...content.faq,
                  { id: crypto.randomUUID(), question: "", answer: "" },
                ])
              }
            >
              {t("admin.addFaq")}
            </AdminButton>
          ) : null}
        </>
      ) : selection === "booking" ? (
        <>
          {input("avantio_id", t("admin.fields.avantioId"), false, true)}
          {input("default_booking_url", te("bookingBase"), false, true)}
          {input("booking_url", te("bookingUrl"))}
          <p className="text-xs text-ink-soft">{te("bookingHint")}</p>
          <Checkbox
            label={t("admin.fields.bookingEnabled")}
            checked={content.booking_enabled}
            onChange={(event) => set("booking_enabled", event.target.checked)}
            disabled={!editableShared || busy}
          />
          <p className="text-xs text-ink-soft">
            {t("admin.fields.bookingEnabledHint")}
          </p>
        </>
      ) : (
        <>
          {input("meta_title", t("admin.fields.metaTitle"))}
          {input("meta_description", t("admin.fields.metaDescription"), true)}
          {imageField("og_image_media_id", t("admin.fields.ogImage"))}
        </>
      )}
    </div>
  );

  const editorialState = `${locale.toUpperCase()} · ${
    archived
      ? te("archived")
      : [
          state.model.published ? te("published") : te("unpublished"),
          ...(state.model.draft ? [te("draftSaved")] : []),
          ...(dirty ? [te("unsaved")] : []),
        ].join(" · ")
  }`;
  const titleId = `${fieldPrefix}-leave-title`;
  const descriptionId = `${fieldPrefix}-leave-description`;
  return (
    <>
      <div
        className="min-w-0 selection:bg-accent/20 selection:text-ink"
        data-building-editor="form"
        aria-busy={busy}
      >
        <header className="sticky top-0 z-20 space-y-3 border-b border-line bg-bg py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {!initial ? (
              <AdminButton
                onClick={() => leave("/admin/buildings")}
                disabled={busy}
              >
                <UiIcon name="nav-arrow-left" size={16} />
                {te("back")}
              </AdminButton>
            ) : null}
            <h1
              className="min-w-0 flex-1 truncate font-serif text-2xl"
              title={content.name || te("newEntity")}
            >
              {content.name || te("newEntity")}
            </h1>
            <div className="flex flex-wrap gap-2">
              <AdminButton
                onClick={() => void mutate("save")}
                disabled={busy || archived || state.conflict || !entityId}
              >
                {te(operation === "save" ? "saving" : "saveDraft")}
              </AdminButton>
              <AdminButton
                variant="primary"
                onClick={() => void mutate("publish")}
                disabled={
                  busy ||
                  archived ||
                  state.conflict ||
                  !persisted ||
                  !state.model.draft ||
                  dirty
                }
              >
                {te(operation === "publish" ? "publishing" : "publish")}
              </AdminButton>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              role="tablist"
              aria-label={tb("pageEditor.contentLanguage")}
              className="flex gap-1 rounded-md border border-line bg-surface p-1"
            >
              {PROPERTY_EDITOR_LOCALES.map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  id={`${fieldPrefix}-tab-${key}`}
                  aria-controls={`${fieldPrefix}-panel-${key}`}
                  aria-selected={locale === key}
                  tabIndex={locale === key ? 0 : -1}
                  disabled={busy || (!persisted && key !== "en")}
                  onClick={() => selectLocale(key)}
                  onKeyDown={(event) => {
                    if (
                      busy ||
                      !["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                        event.key,
                      )
                    )
                      return;
                    event.preventDefault();
                    const available = persisted
                      ? PROPERTY_EDITOR_LOCALES
                      : (["en"] as const);
                    const index = available.findIndex((item) => item === key);
                    const next =
                      event.key === "Home"
                        ? available[0]
                        : event.key === "End"
                          ? available[available.length - 1]
                          : available[
                              (index +
                                (event.key === "ArrowRight" ? 1 : -1) +
                                available.length) %
                                available.length
                            ];
                    if (next) {
                      selectLocale(next);
                      document
                        .getElementById(`${fieldPrefix}-tab-${next}`)
                        ?.focus();
                    }
                  }}
                  className={`min-h-10 min-w-11 rounded px-3 py-2 text-xs font-semibold transition-colors hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 ${locale === key ? "bg-accent/10 text-accent-deep" : "text-ink-soft"}`}
                >
                  {key.toUpperCase()}
                </button>
              ))}
            </div>
            <p
              role="status"
              className={`text-xs ${dirty ? "text-accent-deep" : "text-ink-soft"}`}
            >
              {editorialState}
            </p>
          </div>
        </header>
        <div
          id={`${fieldPrefix}-status`}
          tabIndex={-1}
          role="status"
          aria-live="polite"
          className="space-y-2 py-5 text-sm text-ink-soft focus:outline-none"
        >
          <p>{persisted ? te("manual") : te("firstSave")}</p>
          {locale !== "en" ? (
            <p>
              <strong>
                {te(
                  content && state.model.working.localeMode === "inherit"
                    ? "usesEnglish"
                    : "customized",
                )}
              </strong>{" "}
              ·{" "}
              {te(
                state.model.working.localeMode === "inherit"
                  ? "inheritHint"
                  : "customHint",
              )}
            </p>
          ) : null}
          {state.notice || queue.isPreparing ? (
            <p>{state.notice || te("preparing")}</p>
          ) : null}
          {Object.entries(state.errors).map(([key, message]) => (
            <p key={key} role="alert" className="text-red-700">
              {message}
            </p>
          ))}
          {state.conflict ? (
            <AdminButton
              disabled={busy}
              onClick={() => {
                if (anyDirty) setLeaveTarget("__reload__");
                else {
                  skipLeave.current = true;
                  window.location.reload();
                }
              }}
            >
              {te("reload")}
            </AdminButton>
          ) : null}
          {persisted ? (
            <p className="break-all">
              {te("url")}: /{locale}/buildings/{slugByLocale[locale] ?? ""}
            </p>
          ) : null}
        </div>
        <div
          role="tabpanel"
          id={`${fieldPrefix}-panel-${locale}`}
          aria-labelledby={`${fieldPrefix}-tab-${locale}`}
          className="space-y-10"
        >
          <section
            className="space-y-5"
            aria-labelledby={fieldId("content-heading")}
          >
            <h2 id={fieldId("content-heading")} className="font-serif text-2xl">
              {te("localizedHeading", { locale: locale.toUpperCase() })}
            </h2>
            <div className="grid min-w-0 gap-5 md:grid-cols-2">
              {input("name", t("admin.fields.name"))}
              {input("teaser", t("admin.fields.teaser"), true)}
            </div>
          </section>
          <section
            className="space-y-5 border-t border-line pt-7"
            aria-labelledby={fieldId("shared-heading")}
          >
            <h2 id={fieldId("shared-heading")} className="font-serif text-2xl">
              {te("sharedHeading")}
            </h2>
            <p className="text-sm leading-relaxed text-ink-soft">
              {te("sharedSaveHint")}
            </p>
            <div className="grid min-w-0 gap-5 md:grid-cols-2">
              {renderSection("identity")}
            </div>
            <div className="grid min-w-0 items-start gap-8 md:grid-cols-2">
              <div className="space-y-5">
                {imageField("cover_media_id", t("admin.fields.cover"))}
                {imageField("og_image_media_id", t("admin.fields.ogImage"))}
              </div>
              <div className="space-y-5">
                <h3 className="font-semibold">{t("admin.sections.gallery")}</h3>
                {renderSection("gallery")}
              </div>
            </div>
            <h3 className="pt-3 font-semibold">
              {t("admin.sections.amenities")}
            </h3>
            {renderSection("amenities")}
          </section>
          <section
            className="space-y-5 border-t border-line pt-7"
            aria-labelledby={fieldId("faq-heading")}
          >
            <h2 id={fieldId("faq-heading")} className="font-serif text-2xl">
              {t("admin.sections.faq")}
            </h2>
            {renderSection("faq")}
          </section>
          <section
            className="space-y-5 border-t border-line pt-7"
            aria-labelledby={fieldId("booking-heading")}
          >
            <h2 id={fieldId("booking-heading")} className="font-serif text-2xl">
              {t("admin.sections.booking")}
            </h2>
            {renderSection("booking")}
          </section>
          <section
            className="space-y-5 border-t border-line pt-7"
            aria-labelledby={fieldId("seo-heading")}
          >
            <h2 id={fieldId("seo-heading")} className="font-serif text-2xl">
              {te("seoHeading")}
            </h2>
            {input("meta_title", t("admin.fields.metaTitle"))}
            {input("meta_description", t("admin.fields.metaDescription"), true)}
          </section>
        </div>
        {persisted ? (
          <div className="mt-10 flex flex-wrap justify-end gap-3 border-t border-line pt-6">
            {!archived ? (
              <AdminButton
                disabled={busy}
                onClick={() => setConfirmAction("archive")}
              >
                {te("archive")}
              </AdminButton>
            ) : null}
            <AdminButton
              variant="danger"
              disabled={busy}
              onClick={() => setConfirmAction("delete")}
            >
              {tb("actions.delete")}
            </AdminButton>
          </div>
        ) : null}
      </div>
      <dialog
        ref={leaveDialog}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onCancel={() => setLeaveTarget(null)}
        onClose={() => setLeaveTarget(null)}
        className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-line bg-surface p-6 text-ink backdrop:bg-ink/40"
      >
        <h2 id={titleId} className="font-serif text-2xl">
          {te("leaveTitle")}
        </h2>
        <p
          id={descriptionId}
          className="mt-3 text-sm leading-relaxed text-ink-soft"
        >
          {te("leaveBody")}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <AdminButton autoFocus onClick={() => setLeaveTarget(null)}>
            {te("cancel")}
          </AdminButton>
          <AdminButton
            variant="primary"
            onClick={() => {
              if (!leaveTarget) return;
              skipLeave.current = true;
              const target = leaveTarget;
              setLeaveTarget(null);
              if (target === "__reload__") {
                window.location.reload();
                return;
              }
              const url = new URL(target, window.location.href);
              if (url.origin === window.location.origin)
                router.push(`${url.pathname}${url.search}${url.hash}`);
              else window.location.assign(url.href);
            }}
          >
            {te("continue")}
          </AdminButton>
        </div>
      </dialog>
      <dialog
        ref={actionDialog}
        aria-label={te(
          confirmAction === "delete" ? "deleteConfirm" : "archiveConfirm",
        )}
        onCancel={() => setConfirmAction(null)}
        onClose={() => setConfirmAction(null)}
        className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-line bg-surface p-6 text-ink backdrop:bg-ink/40"
      >
        <h2 className="font-serif text-xl">
          {te(confirmAction === "delete" ? "deleteConfirm" : "archiveConfirm")}
        </h2>
        <div className="mt-6 flex justify-end gap-3">
          <AdminButton autoFocus onClick={() => setConfirmAction(null)}>
            {te("cancel")}
          </AdminButton>
          <AdminButton
            variant="danger"
            disabled={busy}
            onClick={() => {
              if (confirmAction) void lifecycle(confirmAction);
            }}
          >
            {te("continue")}
          </AdminButton>
        </div>
      </dialog>
    </>
  );
}
