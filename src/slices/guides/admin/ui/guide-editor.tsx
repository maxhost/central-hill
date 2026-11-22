"use client";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  EditorFeedbackSummary,
  feedbackMessage,
  feedbackTabProps,
  FeedbackScope,
  useEditorFeedbackToast,
} from "@slices/backoffice/contract-client";
import {
  guideFeedbackGroups,
  guideFeedbackDestination,
  retainGuideErrors,
  guideMediaPath,
} from "./feedback-model";
import type { Locale } from "@core/db/columns";
import { UiIcon } from "@core/ui";
import {
  AdminCard,
  StateBadge,
  Field,
  Select,
  FieldGrid,
  AdminButton,
  MediaField,
  MediaAltProvider,
  MediaQueueProvider,
  useMediaQueue,
  type AdminMediaPreview,
} from "@slices/backoffice/contract";
import {
  GUIDE_EDITOR_LOCALES,
  type GuideContent,
  type GuideEditorialModel,
  type GuideEditorialResult,
} from "../../editorial-types";
import { guideValuesEqual, guideSharedMediaIds } from "../../locale-content";
import type {
  GuidePageEdit,
  GuideCityOption,
  GuideSectionEdit,
} from "../model";
import {
  saveGuideLocaleDraft,
  publishGuideLocaleDraft,
  setGuideVisibility,
} from "../locale-actions";
import {
  newSection,
  newPlace,
  moveItem,
  nextPosition,
  fieldError,
} from "./editor-model";
import { GuideTextField } from "./guide-place-editor";
import { GuideSectionEditor } from "./guide-section-editor";
import {
  createGuideWorkspace,
  changeGuideContent,
  applyGuideModel,
  applyGuideVisibilityModel,
  guideFormEnvelope,
  guideFormSharedContent,
  guideAnyFormDirty,
  guideLocaleFormDirty,
  guideLocalTextDirty,
  guidePublicationNeedsSave,
  guideEntityErrors,
} from "./locale-form-state";

type EditorProps = {
  initial: GuideEditorialModel | null;
  cities: GuideCityOption[];
  draft: GuidePageEdit;
  initialLocale?: string;
};
export function GuideEditor(props: EditorProps) {
  return (
    <MediaQueueProvider>
      <Editor {...props} />
    </MediaQueueProvider>
  );
}
function Editor({ initial, cities, draft, initialLocale }: EditorProps) {
  const t = useTranslations("guides.admin"),
    te = useTranslations("guides.editorial"),
    tb = useTranslations("backoffice"),
    tv = useTranslations("propertyEditor");
  const router = useRouter(),
    queue = useMediaQueue(),
    toast = useEditorFeedbackToast(),
    prefix = useId();
  const [workspace, setWorkspace] = useState(() =>
    createGuideWorkspace(initial, draft),
  );
  const [locale, setLocale] = useState<Locale>(() =>
    initial && GUIDE_EDITOR_LOCALES.includes(initialLocale as Locale)
      ? (initialLocale as Locale)
      : "en",
  );
  const [operation, setOperation] = useState<
    "save" | "publish" | "visibility" | null
  >(null);
  const [openingEdit, setOpeningEdit] = useState(false);
  const [localPreviews, setLocalPreviews] = useState<
    Record<string, AdminMediaPreview>
  >({});
  const pendingFocus = useRef(false);
  const lock = useRef(false),
    bypass = useRef(false),
    currentUrl = useRef("");
  const persisted = Boolean(workspace.model),
    own = workspace.locales[locale],
    page = own.working,
    saved = own.saved;
  const model = workspace.model?.locales[locale],
    busy = Boolean(operation) || openingEdit || queue.isPreparing;
  const dirty = guideLocaleFormDirty(workspace, locale),
    needsSave = guidePublicationNeedsSave(workspace, locale);
  const anyDirty =
    guideAnyFormDirty(workspace) || queue.hasPending || queue.isPreparing;
  const feedbackWorkspace = {
    ...workspace,
    locales: Object.fromEntries(
      GUIDE_EDITOR_LOCALES.map((key) => [
        key,
        {
          ...workspace.locales[key],
          errors: {
            ...workspace.locales[key].errors,
            ...Object.fromEntries(
              (queue.failures ?? [])
                .filter((f) => f.entity === workspace.id && f.locale === key)
                .flatMap((f) => {
                  const path = guideMediaPath(
                    workspace.locales[key].working,
                    f.id,
                  );
                  return path
                    ? [
                        [
                          path,
                          `Could not upload “${f.name}” for ${key.toUpperCase()}. Retry the upload.`,
                        ],
                      ]
                    : [];
                }),
            ),
          },
        },
      ]),
    ) as typeof workspace.locales,
  };
  const errors = guideEntityErrors(
      page,
      workspace.id,
      feedbackWorkspace.locales[locale].errors,
    ),
    pageErrors = errors[workspace.id] ?? {};
  const previews = { ...workspace.model?.previews, ...localPreviews };
  const groups = guideFeedbackGroups(feedbackWorkspace);
  const disabled = busy || own.conflict || Boolean(own.reloadRequired);
  const publishedUrl =
    workspace.model?.status === "published" &&
    model?.published &&
    workspace.model.citySlugs[locale] &&
    workspace.model.slugByLocale[locale]
      ? `/${locale}/guides/${workspace.model.citySlugs[locale]}/${workspace.model.slugByLocale[locale]}`
      : null;
  const onPreview = (preview: AdminMediaPreview | null) => {
    if (preview)
      setLocalPreviews((previous) => ({ ...previous, [preview.id]: preview }));
  };
  const setPage = (next: GuideContent) =>
    setWorkspace((previous) => changeGuideContent(previous, locale, next));
  const updatePage = <K extends keyof GuideContent>(
    key: K,
    value: GuideContent[K],
  ) =>
    setWorkspace((previous) =>
      changeGuideContent(previous, locale, {
        ...previous.locales[locale].working,
        [key]: value,
      }),
    );
  const updateSection = (section: GuideSectionEdit) =>
    updatePage(
      "sections",
      page.sections.map((current) =>
        current.id === section.id ? section : current,
      ),
    );
  function focusEntity(id: string, name?: string) {
    requestAnimationFrame(() => {
      const block = document.getElementById(`entity-${id}`);
      if (block instanceof HTMLDetailsElement) block.open = true;
      let parent = block?.parentElement;
      while (parent) {
        if (parent instanceof HTMLDetailsElement) parent.open = true;
        parent = parent.parentElement;
      }
      const field = name
        ? document.getElementById(
            `${id}-${name
              .replace(/^(source|changes)\./, "")
              .replace(/^slugs\.en$/, "slug")
              .replace(/^image$/, "image-module")}`,
          )
        : null;
      const group = name ? document.getElementById(`${id}-${name}`) : null;
      const registered = document.querySelector<HTMLElement>(
        `[data-feedback-path="${id}.${name}"]`,
      );
      const candidate = field ?? registered;
      const target =
        (candidate?.matches(
          'input:not([type="file"]):not([type="hidden"]):not([disabled]),textarea:not([disabled]),select:not([disabled]),button:not([disabled])',
        )
          ? candidate
          : candidate?.querySelector<HTMLElement>(
              'input:not([type="file"]):not([type="hidden"]):not([disabled]),textarea:not([disabled]),select:not([disabled]),button:not([disabled])',
            )) ??
        group?.querySelector<HTMLElement>(
          "input,textarea,select,button,summary",
        ) ??
        block?.querySelector<HTMLElement>(
          "input, textarea, select, button, summary",
        );
      if (target) {
        target.focus();
        target.scrollIntoView({ block: "center" });
      }
    });
  }
  useEffect(() => {
    currentUrl.current = window.location.href;
  }, []);
  useEffect(() => {
    const retained = new Set(guideSharedMediaIds(workspace.shared));
    for (const id of Object.keys(localPreviews))
      if (!retained.has(id) && queue.isQueued(id)) queue.dequeue(id);
  }, [workspace.shared, localPreviews, queue]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if ((anyDirty || busy) && !bypass.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const intercept = (event: MouseEvent) => {
      if (
        bypass.current ||
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
      if (busy || !window.confirm(t("unsaved"))) {
        event.preventDefault();
        event.stopImmediatePropagation();
      } else bypass.current = true;
    };
    const back = () => {
      if (bypass.current || (!anyDirty && !busy)) return;
      const target = window.location.href;
      if (target === currentUrl.current) return;
      window.history.pushState(window.history.state, "", currentUrl.current);
      if (!busy && window.confirm(t("unsaved"))) {
        bypass.current = true;
        window.location.assign(target);
      }
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", intercept, true);
    window.addEventListener("popstate", back);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", intercept, true);
      window.removeEventListener("popstate", back);
    };
  }, [anyDirty, busy, t]);
  useEffect(() => {
    if (busy || !pendingFocus.current) return;
    pendingFocus.current = false;
    const first = Object.entries(errors).find(
      ([, fields]) => Object.keys(fields).length,
    );
    if (first) focusEntity(first[0], Object.keys(first[1])[0]);
    // Errors are replaced only by an action or an edit; do not refocus on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [own.errors, busy]);
  function receive(
    result: GuideEditorialResult,
    action: "save" | "publish" | "visibility",
    attemptLocale: Locale,
    sharedChanged = false,
  ) {
    if (result.ok) {
      const message = feedbackMessage({
        action: action === "publish" ? "publish" : "save",
        locale: attemptLocale,
        outcome: "success",
        refreshWarning: result.refreshWarning,
        reloadRequired: result.reloadRequired,
        sharedChanged,
      });
      setLocalPreviews((previous) => {
        const retained = { ...previous };
        for (const id of Object.keys(result.model.previews))
          delete retained[id];
        return retained;
      });
      if (result.reloadRequired) {
        setWorkspace((previous) => ({
          ...previous,
          locales: {
            ...previous.locales,
            [attemptLocale]: {
              ...previous.locales[attemptLocale],
              notice: message,
              reloadRequired: true,
            },
          },
        }));
        toast.success(message);
        return;
      }
      setWorkspace((previous) => {
        if (action === "visibility")
          return applyGuideVisibilityModel(previous, result.model);
        const next = applyGuideModel(
          previous,
          attemptLocale,
          result.model,
          message,
        );
        if (action === "save")
          next.locales[attemptLocale].errors = retainGuideErrors(
            previous,
            attemptLocale,
            next.locales[attemptLocale].working,
            true,
          );
        return next;
      });
      if (action !== "visibility") toast.success(message);
      if (!persisted) {
        setOpeningEdit(true);
        bypass.current = true;
        router.replace(`/admin/guides/${result.model.id}`);
      }
      return;
    }
    const fieldErrors =
      result.error === "validation"
        ? { ...workspace.locales[attemptLocale].errors, ...result.fieldErrors }
        : result.error === "slug_conflict"
          ? { slug: "Choose an available URL slug." }
          : workspace.locales[attemptLocale].errors;
    const outcome =
      result.error === "validation" || result.error === "slug_conflict"
        ? "validation"
        : result.error === "conflict"
          ? "conflict"
          : result.error === "no_draft"
            ? "no_draft"
            : result.error === "uncertain"
              ? "uncertain"
              : "server";
    const nextGroups = guideFeedbackGroups({
      ...workspace,
      locales: {
        ...workspace.locales,
        [attemptLocale]: {
          ...workspace.locales[attemptLocale],
          errors: fieldErrors,
        },
      },
    });
    const message = feedbackMessage({
      action: action === "publish" ? "publish" : "save",
      locale: attemptLocale,
      outcome,
      groups: nextGroups,
    });
    setWorkspace((previous) => ({
      ...previous,
      locales: {
        ...previous.locales,
        [attemptLocale]: {
          ...previous.locales[attemptLocale],
          errors: fieldErrors,
          conflict:
            previous.locales[attemptLocale].conflict ||
            result.error === "conflict",
          uncertain: result.error === "uncertain",
          notice: message,
        },
      },
    }));
    pendingFocus.current = outcome === "validation";
    toast.error(message);
  }
  async function run(action: "save" | "publish" | "visibility") {
    if (busy || lock.current || (own.conflict && action !== "visibility"))
      return;
    const attemptLocale = locale;
    const attemptGroups = guideFeedbackGroups(workspace);
    const sharedChanged = !guideValuesEqual(
      workspace.shared,
      workspace.savedShared,
    );
    const archived = workspace.model?.status !== "archived";
    if (
      action === "visibility" &&
      archived &&
      !window.confirm(tv("archiveConfirm"))
    )
      return;
    lock.current = true;
    setOperation(action);
    try {
      if (action === "save") {
        if (
          !(await queue.flush(guideSharedMediaIds(workspace.shared), {
            locale: attemptLocale,
            feedback: true,
            knownGroups: attemptGroups,
          }))
        ) {
          return;
        }
        const state = workspace.model?.locales[locale];
        receive(
          await saveGuideLocaleDraft({
            guideId: workspace.id,
            locale,
            expectedRevision: state?.revision ?? 0,
            templateRevision: state?.templateRevision ?? null,
            expectedSharedRevision: workspace.model?.shared.revision ?? 0,
            payload: guideFormEnvelope(workspace, locale),
            shared: guideFormSharedContent(workspace),
            ...(!persisted ? { slug: workspace.slug } : {}),
          }),
          action,
          attemptLocale,
          sharedChanged,
        );
      } else if (action === "publish") {
        if (!persisted || dirty || needsSave || !model?.draft) return;
        receive(
          await publishGuideLocaleDraft({
            guideId: workspace.id,
            locale,
            expectedRevision: model.revision,
          }),
          action,
          attemptLocale,
          sharedChanged,
        );
      } else
        receive(
          await setGuideVisibility({ guideId: workspace.id, archived }),
          action,
          attemptLocale,
          sharedChanged,
        );
    } catch {
      const message = feedbackMessage({
        action: action === "publish" ? "publish" : "save",
        locale: attemptLocale,
        outcome: "uncertain",
        groups: attemptGroups,
      });
      setWorkspace((previous) => ({
        ...previous,
        locales: {
          ...previous.locales,
          [attemptLocale]: {
            ...previous.locales[attemptLocale],
            notice: message,
            uncertain: true,
          },
        },
      }));
      toast.error(message);
    } finally {
      lock.current = false;
      setOperation(null);
    }
  }
  function addSection() {
    const id = crypto.randomUUID();
    const section = {
      ...newSection(id, workspace.id, nextPosition(page.sections)),
      presentation: { version: 1, enabled: true },
    };
    setPage({ ...page, sections: [...page.sections, section] });
    focusEntity(id, "title");
  }
  function addPlace(section: GuideSectionEdit) {
    const place = newPlace(
      crypto.randomUUID(),
      section.id,
      nextPosition(section.places),
    );
    updateSection({ ...section, places: [...section.places, place] });
    focusEntity(place.id, "name");
  }
  const text = (
    name: "title" | "intro" | "meta_title" | "meta_description",
    maxLength: number,
    multiline = false,
  ) => (
    <GuideTextField
      entityId={workspace.id}
      name={name}
      required={name === "title"}
      value={page[name]}
      errors={pageErrors}
      maxLength={maxLength}
      multiline={multiline}
      onChange={(value) =>
        updatePage(name, name === "title" ? value : value || null)
      }
    />
  );
  return (
    <FeedbackScope
      locale={locale}
      entity={workspace.id}
      knownGroups={guideFeedbackGroups(workspace)}
    >
      <MediaAltProvider
        locale={locale}
        value={page.media_alts}
        onChange={(value) => updatePage("media_alts", value)}
        disabled={disabled}
      >
        <div className="space-y-6">
          <div className="space-y-4 border-b border-line pb-5">
            <Link
              href="/admin/guides"
              className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-ink"
            >
              <UiIcon name="nav-arrow-left" size={16} />
              {t("back")}
            </Link>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 flex-wrap items-center gap-3">
                <h1 className="font-serif text-2xl leading-tight text-ink">
                  {persisted ? page.title || t("edit") : t("newGuide")}
                </h1>
                <StateBadge
                  label={t(
                    workspace.model?.status === "published"
                      ? "publishedStatus"
                      : (workspace.model?.status ?? "draft"),
                  )}
                  tone={
                    workspace.model?.status === "published"
                      ? "approved"
                      : workspace.model?.status === "archived"
                        ? "neutral"
                        : "draft"
                  }
                />
              </div>
              {publishedUrl ? (
                <a
                  href={publishedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-ink-soft hover:text-accent-deep"
                >
                  {t("published")} ↗
                </a>
              ) : null}
            </div>
          </div>
          <header className="sticky top-0 z-20 w-full min-w-0 max-w-3xl space-y-3 border-b border-line bg-bg py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                {persisted ? (
                  <AdminButton
                    className="min-h-11"
                    disabled={busy}
                    onClick={() => run("visibility")}
                  >
                    {tv(
                      workspace.model?.status === "archived"
                        ? "restore"
                        : "archive",
                    )}
                  </AdminButton>
                ) : null}
              </div>
              <div className="ml-auto flex flex-wrap gap-2">
                <AdminButton
                  className="min-h-11"
                  disabled={disabled}
                  onClick={() => run("save")}
                >
                  {operation === "save"
                    ? "Saving…"
                    : `Save draft (${locale.toUpperCase()})`}
                </AdminButton>
                <AdminButton
                  className="min-h-11"
                  variant="primary"
                  disabled={
                    disabled ||
                    !persisted ||
                    !model?.draft ||
                    dirty ||
                    needsSave
                  }
                  onClick={() => run("publish")}
                >
                  {operation === "publish"
                    ? "Publishing…"
                    : `Publish (${locale.toUpperCase()})`}
                </AdminButton>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div
                role="tablist"
                aria-label={tb("pageEditor.contentLanguage")}
                className="flex gap-1 rounded-md border border-line bg-surface p-1"
              >
                {GUIDE_EDITOR_LOCALES.map((key) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    id={`${prefix}-tab-${key}`}
                    aria-controls={`${prefix}-panel-${key}`}
                    {...feedbackTabProps(
                      groups.find((group) => group.locale === key),
                      `${prefix}-feedback`,
                    )}
                    aria-selected={locale === key}
                    tabIndex={locale === key ? 0 : -1}
                    disabled={busy || (!persisted && key !== "en")}
                    onClick={() => setLocale(key)}
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
                        ? GUIDE_EDITOR_LOCALES
                        : (["en"] as const);
                      const index = available.findIndex(
                        (value) => value === key,
                      );
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
                        setLocale(next);
                        document
                          .getElementById(`${prefix}-tab-${next}`)
                          ?.focus();
                      }
                    }}
                    className={`${
                      feedbackTabProps(
                        groups.find((group) => group.locale === key),
                        `${prefix}-feedback`,
                      ).className ?? ""
                    } min-h-9 rounded px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 ${locale === key ? "bg-accent/10 text-accent-deep" : "text-ink-soft"}`}
                  >
                    {key.toUpperCase()}
                    {workspace.locales[key].uncertain
                      ? " !"
                      : (groups.find((group) => group.locale === key)?.issues
                            .length ?? 0)
                        ? ` (${groups.find((group) => group.locale === key)?.issues.length ?? 0})`
                        : ""}
                    {key === "en" ? (
                      <span className="ml-1 text-[10px] font-normal">
                        {tb("pageEditor.source")}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
              <p
                role="status"
                className={`text-xs ${dirty || needsSave ? "text-accent-deep" : "text-ink-soft"}`}
              >
                {locale.toUpperCase()} ·{" "}
                {te(
                  dirty || needsSave
                    ? "unsaved"
                    : model?.draft
                      ? "draft"
                      : model?.published
                        ? "published"
                        : "unpublished",
                )}
              </p>
            </div>
            <p className="text-xs text-ink-soft">
              Only the selected language is published.
            </p>
            {dirty || needsSave ? (
              <p className="text-xs text-ink-soft">
                Save your changes before publishing.
              </p>
            ) : null}
            <EditorFeedbackSummary
              id={`${prefix}-feedback`}
              groups={groups}
              onNavigate={(target, path) => {
                if (busy) return;
                const issue = groups
                  .find((group) => group.locale === target)
                  ?.issues.find((issue) => issue.path === path);
                const source = issue?.sourceLocale ?? target;
                setLocale(source);
                const destination = guideFeedbackDestination(
                  workspace.locales[source].working,
                  workspace.id,
                  path,
                );
                focusEntity(destination.id, destination.name);
              }}
            />
          </header>
          <div className="max-w-3xl space-y-4">
            {own.notice ? (
              <p
                role="status"
                className="rounded-md border border-line bg-surface px-4 py-3 text-sm"
              >
                {own.notice}
              </p>
            ) : null}
            {own.conflict || own.reloadRequired ? (
              <div
                role="alert"
                className="space-y-3 rounded-md border border-red-200 p-4 text-sm text-red-700"
              >
                <p>
                  {own.reloadRequired
                    ? "Your changes were committed. Reload the latest version before continuing."
                    : te("conflict")}
                </p>
                <AdminButton
                  onClick={() => {
                    if (!anyDirty || window.confirm(t("unsaved"))) {
                      bypass.current = true;
                      window.location.reload();
                    }
                  }}
                >
                  {te("reload")}
                </AdminButton>
              </div>
            ) : null}
            <p className="text-sm text-ink-soft">
              {!persisted
                ? te("firstSave")
                : locale === "en"
                  ? te("sharedHint")
                  : te(
                      own.mode === "custom" || guideLocalTextDirty(own)
                        ? "customHint"
                        : "inheritHint",
                    )}
            </p>
          </div>
          <form
            id={`entity-${workspace.id}`}
            onSubmit={(event) => {
              event.preventDefault();
              run("save");
            }}
            noValidate
            className="max-w-3xl space-y-6"
          >
            <div
              id={`${prefix}-panel-${locale}`}
              role="tabpanel"
              aria-labelledby={`${prefix}-tab-${locale}`}
            >
              <fieldset disabled={disabled} className="min-w-0 space-y-6">
                <p className="text-xs text-ink-soft">
                  * Required to publish. You can save an incomplete draft.
                </p>
                <AdminCard title={t("general")}>
                  <div className="space-y-4">
                    {text("title", 200)}
                    {text("intro", 1200, true)}
                    <FieldGrid>
                      <Field
                        label={t("labels.city_id")}
                        required
                        htmlFor={`${workspace.id}-city_id`}
                        error={fieldError(pageErrors, "city_id")}
                      >
                        <Select
                          id={`${workspace.id}-city_id`}
                          value={page.city_id}
                          onChange={(event) =>
                            updatePage("city_id", event.target.value)
                          }
                        >
                          <option value="">{t("noCity")}</option>
                          {cities.map((city) => (
                            <option key={city.id} value={city.id}>
                              {city.labels?.[locale] ?? city.name} (
                              {t(
                                city.status === "published"
                                  ? "publishedStatus"
                                  : city.status,
                              )}
                              )
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field
                        label={t("labels.template")}
                        htmlFor={`${workspace.id}-template`}
                        error={fieldError(pageErrors, "template")}
                      >
                        <Select
                          id={`${workspace.id}-template`}
                          value={page.template}
                          onChange={(event) =>
                            updatePage(
                              "template",
                              event.target.value as GuideContent["template"],
                            )
                          }
                        >
                          {[
                            "landing",
                            "eat",
                            "beaches",
                            "events",
                            "secrets",
                            "families",
                            "groups",
                            "travellers",
                            "custom",
                          ].map((value) => (
                            <option key={value} value={value}>
                              {t(`templates.${value}`)}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <GuideTextField
                        entityId={workspace.id}
                        name="position"
                        value={page.position}
                        errors={pageErrors}
                        type="number"
                        onChange={(value) =>
                          updatePage("position", Number(value))
                        }
                      />
                    </FieldGrid>
                    {!persisted ? (
                      <>
                        <GuideTextField
                          entityId={workspace.id}
                          name="slug"
                          required
                          value={workspace.slug}
                          errors={pageErrors}
                          maxLength={160}
                          onChange={(value) =>
                            setWorkspace((previous) => ({
                              ...previous,
                              slug: value,
                            }))
                          }
                        />
                        <p className="text-xs text-ink-soft">
                          {t("slugWarning")}
                        </p>
                      </>
                    ) : null}
                    <Field
                      htmlFor={`${workspace.id}-hero_media_id`}
                      errorPath={`${workspace.id}.hero_media_id`}
                      label={t("labels.hero_media_id")}
                      error={fieldError(pageErrors, "hero_media_id")}
                      hint={te("sharedHint")}
                    >
                      <MediaField
                        value={page.hero_media_id}
                        preview={
                          page.hero_media_id
                            ? previews[page.hero_media_id]
                            : null
                        }
                        onChange={(id, preview) => {
                          onPreview(preview);
                          updatePage("hero_media_id", id);
                        }}
                      />
                    </Field>
                  </div>
                </AdminCard>
                <AdminCard title={t("seo")}>
                  <div className="space-y-4">
                    {text("meta_title", 70)}
                    {text("meta_description", 200, true)}
                    <Field
                      htmlFor={`${workspace.id}-og_image_media_id`}
                      errorPath={`${workspace.id}.og_image_media_id`}
                      label={t("labels.og_image_media_id")}
                      error={fieldError(pageErrors, "og_image_media_id")}
                      hint={te("sharedHint")}
                    >
                      <MediaField
                        value={page.og_image_media_id}
                        preview={
                          page.og_image_media_id
                            ? previews[page.og_image_media_id]
                            : null
                        }
                        onChange={(id, preview) => {
                          onPreview(preview);
                          updatePage("og_image_media_id", id);
                        }}
                      />
                    </Field>
                  </div>
                </AdminCard>
                <section
                  className={`space-y-4 ${pageErrors.sections ? "rounded-md border border-red-600 p-4" : ""}`}
                  aria-labelledby={`${prefix}-sections`}
                  aria-describedby={[
                    `${prefix}-sections-required`,
                    pageErrors.sections
                      ? `${workspace.id}-sections-error`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-xl space-y-2">
                      <h2
                        id={`${prefix}-sections`}
                        className="font-serif text-xl text-ink"
                      >
                        {t("sections")}{" "}
                        <span aria-hidden="true" className="text-red-700">
                          *
                        </span>
                      </h2>
                      <p
                        id={`${prefix}-sections-required`}
                        className="text-sm text-ink-soft"
                      >
                        Keep at least one complete visible section to publish.
                      </p>
                      <p className="text-sm text-ink-soft">
                        {te("sectionsHint")}
                      </p>
                      <p className="text-xs text-ink-soft">
                        {te("aggregateSaveHint")}
                      </p>
                    </div>
                    <AdminButton
                      id={`${workspace.id}-sections`}
                      aria-describedby={[
                        `${prefix}-sections-required`,
                        pageErrors.sections
                          ? `${workspace.id}-sections-error`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      className={
                        pageErrors.sections
                          ? "border-red-600 text-red-700"
                          : undefined
                      }
                      onClick={addSection}
                    >
                      {t("addSection")}
                    </AdminButton>
                  </div>
                  {pageErrors.sections ? (
                    <p
                      id={`${workspace.id}-sections-error`}
                      role="alert"
                      className="text-sm text-red-700"
                    >
                      {pageErrors.sections}
                    </p>
                  ) : null}
                  {!page.sections.length ? (
                    <div className="rounded-lg border border-dashed border-line bg-surface p-6">
                      <p className="mb-4 text-sm text-ink-soft">
                        {te("sectionsEmpty")}
                      </p>
                      <AdminButton
                        aria-describedby={[
                          `${prefix}-sections-required`,
                          pageErrors.sections
                            ? `${workspace.id}-sections-error`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        className={
                          pageErrors.sections
                            ? "border-red-600 text-red-700"
                            : undefined
                        }
                        onClick={addSection}
                      >
                        {t("addSection")}
                      </AdminButton>
                    </div>
                  ) : null}
                  {page.sections.map((section, index) => {
                    const savedSection = saved.sections.find(
                      (current) => current.id === section.id,
                    );
                    return (
                      <GuideSectionEditor
                        key={`${locale}-${section.id}`}
                        section={section}
                        previews={previews}
                        errors={errors[section.id] ?? {}}
                        dirty={
                          !guideValuesEqual(
                            { ...section, places: [] },
                            savedSection
                              ? { ...savedSection, places: [] }
                              : undefined,
                          )
                        }
                        hasPendingChildren={section.places.some(
                          (place) =>
                            !guideValuesEqual(
                              place,
                              savedSection?.places.find(
                                (current) => current.id === place.id,
                              ),
                            ),
                        )}
                        persisted={Boolean(savedSection)}
                        disabled={disabled}
                        canOrder={!disabled}
                        first={index === 0}
                        last={index === page.sections.length - 1}
                        placeState={(place) => ({
                          dirty: !guideValuesEqual(
                            place,
                            savedSection?.places.find(
                              (current) => current.id === place.id,
                            ),
                          ),
                          persisted: Boolean(
                            savedSection?.places.some(
                              (current) => current.id === place.id,
                            ),
                          ),
                          errors: errors[place.id] ?? {},
                        })}
                        onChange={updateSection}
                        onPreview={onPreview}
                        onDelete={() => {
                          if (window.confirm(t("confirmDelete")))
                            updatePage(
                              "sections",
                              page.sections.filter(
                                (current) => current.id !== section.id,
                              ),
                            );
                        }}
                        onMove={(offset) =>
                          updatePage(
                            "sections",
                            moveItem(page.sections, section.id, offset),
                          )
                        }
                        onAddPlace={() => addPlace(section)}
                        onDeletePlace={(id) => {
                          if (window.confirm(t("confirmDelete")))
                            updateSection({
                              ...section,
                              places: section.places.filter(
                                (place) => place.id !== id,
                              ),
                            });
                        }}
                        onMovePlace={(id, offset) =>
                          updateSection({
                            ...section,
                            places: moveItem(section.places, id, offset),
                          })
                        }
                      />
                    );
                  })}
                </section>
              </fieldset>
            </div>
          </form>
          <p className="max-w-3xl text-xs text-ink-soft">
            {t("sharedHint")}{" "}
            <Link
              href="/admin/pages/guides"
              className="text-accent-deep underline underline-offset-4"
            >
              {t("sharedPagesLink")}
            </Link>
            {" · "}
            <Link
              href="/admin/settings"
              className="text-accent-deep underline underline-offset-4"
            >
              {t("sharedSettingsLink")}
            </Link>
          </p>
        </div>
      </MediaAltProvider>
    </FeedbackScope>
  );
}
