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
import {
  AdminButton,
  Field,
  MediaField,
  TextArea,
  FieldGrid,
  TextInput,
  useMediaQueue,
  PROPERTY_EDITOR_LOCALES,
  type PropertyEditorialResult,
  type AdminMediaPreview,
  type EditorLocale,
} from "@slices/backoffice/contract";
import type {
  ApartmentEditorialContent,
  ApartmentEditorialModel,
} from "../../editorial-types";
import {
  archiveApartment,
  publishApartmentLocaleDraft,
  saveApartmentLocaleDraft,
} from "../editorial-actions";
import { deleteApartment } from "../actions";
import {
  apartmentSharedContent,
  apartmentLocalizedContent,
  semanticEqual,
} from "../../server/editorial-validation";
import {
  applyPropertyLocaleResult,
  changePropertyField,
  emptyPropertyEnvelope,
  propertyLocaleDirty,
  propertyMediaIds,
  type PropertyWorkspace,
} from "./property-editor-state";

type Operation = "save" | "publish" | "archive" | "delete" | null;

export function ApartmentLocaleEditor({
  initial,
  newEntityId,
  initialLocale,
  buildingId,
  parentPublication,
}: {
  initial: ApartmentEditorialModel | null;
  /** Generated in the route so server and client hydration use the same identity. */
  newEntityId?: string;
  initialLocale?: string;
  buildingId: string;
  parentPublication?: Partial<Record<EditorLocale, boolean>>;
}) {
  const t = useTranslations("apartments");
  const te = useTranslations("propertyEditor");
  const tb = useTranslations("backoffice");
  const router = useRouter();
  const queue = useMediaQueue();
  const fieldPrefix = useId();
  const [entityId] = useState(() => initial?.id ?? newEntityId ?? "");
  const [persisted, setPersisted] = useState(Boolean(initial));

  const [savedPreviews, setSavedPreviews] = useState(initial?.previews ?? {});
  const [sharedRevision, setSharedRevision] = useState(
    initial?.shared?.revision ?? 0,
  );
  const [sharedBaseline, setSharedBaseline] = useState(
    () =>
      initial?.shared?.content ??
      apartmentSharedContent(
        initial?.locales.en.working ?? emptyPropertyEnvelope(),
      ),
  );
  const [archived, setArchived] = useState(initial?.archived ?? false);
  const [states, setStates] = useState<PropertyWorkspace>(
    () =>
      Object.fromEntries(
        PROPERTY_EDITOR_LOCALES.map((locale) => [
          locale,
          {
            baseline: structuredClone(
              initial?.locales[locale].working ?? {
                ...emptyPropertyEnvelope(),
                localeMode: locale === "en" ? "custom" : "inherit",
              },
            ),
            model: initial?.locales[locale] ?? {
              locale,
              revision: 0,
              templateRevision: locale === "en" ? null : 0,
              published: null,
              draft: null,
              working: {
                ...emptyPropertyEnvelope(),
                localeMode: locale === "en" ? "custom" : "inherit",
              },
            },
            errors: {},
            notice: "",
            conflict: false,
          },
        ]),
      ) as PropertyWorkspace,
  );
  const selectedLocale: EditorLocale =
    initial && PROPERTY_EDITOR_LOCALES.includes(initialLocale as EditorLocale)
      ? (initialLocale as EditorLocale)
      : "en";
  const [locale, setLocale] = useState<EditorLocale>(selectedLocale);
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
  const busy = operation !== null || queue.isPreparing || navigating;
  const sharedDirty = !semanticEqual(
    apartmentSharedContent(state.model.working),
    sharedBaseline,
  );
  const dirty = propertyLocaleDirty(state.model, state.baseline) || sharedDirty;
  const anyDirty =
    sharedDirty ||
    PROPERTY_EDITOR_LOCALES.some((key) =>
      propertyLocaleDirty(states[key].model, states[key].baseline),
    );
  const draftMatchesWorking = Boolean(
    state.model.draft &&
    semanticEqual(
      apartmentLocalizedContent(state.model.draft),
      apartmentLocalizedContent(state.model.working),
    ),
  );
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

  function set<K extends keyof ApartmentEditorialContent>(
    key: K,
    value: ApartmentEditorialContent[K],
  ) {
    if (busy || archived) return;
    setStates((previous) => changePropertyField(previous, locale, key, value));
  }
  function selectLocale(next: EditorLocale) {
    if (busy || (!persisted && next !== "en")) return;
    setLocale(next);
  }
  function remember(preview: AdminMediaPreview | null) {
    if (preview)
      setLocalMedia((previous) => ({ ...previous, [preview.id]: preview }));
  }
  function resultError(
    result: Exclude<
      PropertyEditorialResult<ApartmentEditorialContent>,
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
      requestAnimationFrame(() =>
        document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus(),
      );
    }
  }
  async function mutate(action: "save" | "publish") {
    if (lock.current || busy || archived || !entityId || state.conflict) return;
    if (
      action === "publish" &&
      (!state.model.draft || dirty || !draftMatchesWorking || !persisted)
    )
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
        !(await queue.flush(propertyMediaIds(state.model.working)))
      )
        return;
      const request = {
        id: entityId,
        parentId: buildingId,
        locale,
        expectedRevision: state.model.revision,
      };
      const result =
        action === "save"
          ? await saveApartmentLocaleDraft({
              ...request,
              payload: state.model.working,
              templateRevision: state.model.templateRevision,
              expectedSharedRevision: sharedRevision,
              sharedChanged: sharedDirty,
            })
          : await publishApartmentLocaleDraft(request);
      if (!result.ok) {
        resultError(result);
        return;
      }
      setStates((previous) =>
        applyPropertyLocaleResult(
          previous,
          locale,
          result.model,
          result.refreshWarning
            ? te("savedRefreshWarning")
            : te(action === "save" ? "draftSaved" : "published"),
          result.shared?.content,
        ),
      );
      if (result.shared) {
        setSharedRevision(result.shared.revision);
        setSharedBaseline(result.shared.content);
      }
      if (result.previews)
        setSavedPreviews((previous) => ({ ...previous, ...result.previews }));
      if (!persisted) {
        setPersisted(true);
        // Creation moves to the real Edit route. Keeping the New route's RSC
        // tree after changing browser history can later reinitialize this form.
        // Targets are still locked while this saved EN model is being reopened.
        skipLeave.current = true;
        startNavigation(() =>
          router.replace(
            `/admin/buildings/${buildingId}/apartments/${result.id}`,
          ),
        );
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
          ? await archiveApartment(entityId, buildingId)
          : await deleteApartment(entityId, buildingId);
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
      router.push(`/admin/buildings/${buildingId}/apartments`);
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
      | "badge"
      | "avantio_id"
      | "default_booking_url"
      | "booking_url"
      | "meta_title",
    label: string,
    shared = false,
    hint?: string,
  ) => (
    <Field
      key={key}
      label={label}
      htmlFor={fieldId(key)}
      error={error(key)}
      hint={hint}
    >
      <TextInput
        id={fieldId(key)}
        value={content[key] ?? ""}
        onChange={(event) =>
          set(key, event.target.value || (key === "name" ? "" : null))
        }
        disabled={busy || archived || (shared && !editableShared)}
      />
    </Field>
  );
  const ownership =
    state.model.working.localeMode === "inherit" ? "usesEnglish" : "customized";
  const textFields = (
    <section className="space-y-5" aria-labelledby={`${fieldPrefix}-localized`}>
      <h2 id={`${fieldPrefix}-localized`} className="font-serif text-2xl">
        {te("localizedHeading", { locale: locale.toUpperCase() })}
      </h2>
      <p className="text-sm text-ink-soft">
        {te(ownership === "usesEnglish" ? "inheritHint" : "customHint")}
      </p>
      <FieldGrid>
        {input("name", t("admin.fields.name"))}
        {input(
          "badge",
          t("admin.fields.badge"),
          false,
          t("admin.fields.badgeHint"),
        )}
      </FieldGrid>
      {input("booking_url", te("bookingUrl"), false, te("bookingHint"))}
    </section>
  );
  const commonFields = (
    <section
      className="space-y-5 border-t border-line pt-7"
      aria-labelledby={`${fieldPrefix}-shared`}
    >
      <div className="space-y-2">
        <h2 id={`${fieldPrefix}-shared`} className="font-serif text-2xl">
          {te("sharedHeading")}
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-ink-soft">
          {te("sharedSaveHint")}
        </p>
      </div>
      <FieldGrid>
        {(["bedrooms", "max_guests", "beds_count", "size_m2"] as const).map(
          (key) => (
            <Field
              key={key}
              label={t(
                `admin.fields.${({ bedrooms: "bedrooms", max_guests: "maxGuests", beds_count: "bedsCount", size_m2: "sizeM2" } as const)[key]}`,
              )}
              htmlFor={fieldId(key)}
              error={error(key)}
            >
              <TextInput
                id={fieldId(key)}
                type="number"
                min={0}
                value={content[key] ?? ""}
                disabled={!editableShared || busy}
                onChange={(event) =>
                  set(
                    key,
                    event.target.value === "" && key === "size_m2"
                      ? null
                      : Number(event.target.value),
                  )
                }
              />
            </Field>
          ),
        )}
      </FieldGrid>
      <p className="text-xs text-ink-soft">{te("globalOrder")}</p>
      <Field
        label={t("admin.fields.cover")}
        hint={t("admin.fields.coverHint")}
        error={error("cover_media_id")}
      >
        <fieldset disabled={!editableShared || busy}>
          <MediaField
            key={`cover-${locale}-${content.cover_media_id}-${content.cover_media_id ? previews[content.cover_media_id]?.url : ""}`}
            value={content.cover_media_id}
            preview={
              content.cover_media_id
                ? (previews[content.cover_media_id] ?? null)
                : null
            }
            onChange={(id, preview) => {
              set("cover_media_id", id);
              remember(preview);
            }}
          />
        </fieldset>
      </Field>
      <FieldGrid>
        {input("avantio_id", t("admin.fields.avantioId"), true)}
        {input("default_booking_url", te("bookingBase"), true)}
      </FieldGrid>
    </section>
  );
  const seoFields = (
    <section
      className="space-y-5 border-t border-line pt-7"
      aria-labelledby={`${fieldPrefix}-seo`}
    >
      <h2 id={`${fieldPrefix}-seo`} className="font-serif text-2xl">
        {te("seoHeading")}
      </h2>
      {input("meta_title", te("metaTitle"))}
      <Field
        label={te("metaDescription")}
        htmlFor={fieldId("meta_description")}
        error={error("meta_description")}
      >
        <TextArea
          id={fieldId("meta_description")}
          value={content.meta_description ?? ""}
          disabled={busy || archived}
          rows={3}
          onChange={(event) =>
            set("meta_description", event.target.value || null)
          }
        />
      </Field>
      <Field
        label={te("ogImage")}
        error={error("og_image_media_id")}
        hint={te("sharedSaveHint")}
      >
        <fieldset disabled={busy || archived}>
          <MediaField
            key={`og-${locale}-${content.og_image_media_id}-${content.og_image_media_id ? previews[content.og_image_media_id]?.url : ""}`}
            value={content.og_image_media_id}
            preview={
              content.og_image_media_id
                ? (previews[content.og_image_media_id] ?? null)
                : null
            }
            onChange={(id, preview) => {
              set("og_image_media_id", id);
              remember(preview);
            }}
          />
        </fieldset>
      </Field>
    </section>
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
      <div className="space-y-8">
        <div className="sticky top-0 z-20 -mx-2 space-y-4 border-b border-line bg-bg px-2 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <AdminButton
              onClick={() => leave(`/admin/buildings/${buildingId}/apartments`)}
              disabled={busy}
            >
              {te("back")}
            </AdminButton>
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
                  dirty ||
                  !draftMatchesWorking
                }
              >
                {te(operation === "publish" ? "publishing" : "publish")}
              </AdminButton>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              role="tablist"
              aria-label={te("language")}
              className="flex gap-1 rounded-md border border-line bg-surface p-1"
            >
              {PROPERTY_EDITOR_LOCALES.map((value) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={locale === value}
                  aria-controls={`${fieldPrefix}-form`}
                  disabled={busy || (!persisted && value !== "en")}
                  onClick={() => selectLocale(value)}
                  className={`min-h-9 rounded px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 ${locale === value ? "bg-accent/10 text-accent-deep" : "text-ink-soft"}`}
                >
                  {value.toUpperCase()}{value === "en" ? <span className="ml-1 text-[10px] font-normal">{tb("pageEditor.source")}</span> : null}
                </button>
              ))}
            </div>
            <p className="text-xs text-ink-soft">
              {editorialState} · {te(ownership)}
            </p>
          </div>
          <div
            role="status"
            aria-live="polite"
            className="text-sm text-ink-soft"
          >
            {state.notice ||
              (queue.isPreparing
                ? te("preparing")
                : persisted
                  ? te("manual")
                  : te("firstSave"))}
            {state.model.published && parentPublication?.[locale] === false ? (
              <p>{te("parentUnpublished")}</p>
            ) : null}
            {state.errors._source ? (
              <p role="alert">{state.errors._source}</p>
            ) : null}
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
          </div>
        </div>
        <h1 className="font-serif text-3xl">
          {content.name || te("newEntity")}
        </h1>
        <form
          id={`${fieldPrefix}-form`}
          role="tabpanel"
          onSubmit={(event) => {
            event.preventDefault();
            void mutate("save");
          }}
          className="space-y-8"
        >
          {textFields}
          {commonFields}
          {seoFields}
        </form>
        {persisted ? (
          <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-5">
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
