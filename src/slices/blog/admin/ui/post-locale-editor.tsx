"use client";

import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { UiIcon } from "@core/ui";
import {
  AdminButton, Checkbox, Field, MediaField, MediaAltProvider, Select, TextArea,
  TextInput, useMediaQueue, type AdminMediaPreview, type EditorLocale,
} from "@slices/backoffice/contract";
import { BLOG_EDITOR_LOCALES, type BlogPostContent, type BlogPostEditorialModel, type BlogPostEditorialResult } from "../editorial-contract";
import { archivePost, publishPostLocaleDraft, savePostLocaleDraft } from "../post-locale-actions";
import { deletePost } from "../actions";
import { PostRichTextEditor } from "./post-rich-text-editor";
import {
  adoptPostSourceDetails, applyPostLocaleResult, changePostField, emptyPostEnvelope, hasNewPostSourceDetails, postEnvelopeEqual,
  postLocaleDirty, postMediaIds, preparePostTarget, type PostWorkspace,
} from "./post-editor-state";

type Option = import("../../reference-locale-types").BlogReferenceOption;
type Operation = "save" | "publish" | "archive" | "delete" | null;

export function PostLocaleEditor({ initial, newPostId, initialLocale, categories, authors, posts }: {
  initial: BlogPostEditorialModel | null;
  /** Generated in the route so server and client hydration use the same identity. */
  newPostId?: string;
  initialLocale?: string;
  categories: Option[];
  authors: Option[];
  posts: { id: string; title: string }[];
}) {
  const t = useTranslations("blog");
  const te = useTranslations("blog.editorial");
  const tb = useTranslations("backoffice");
  const router = useRouter();
  const queue = useMediaQueue();
  const fieldPrefix = useId();
  const [postId] = useState(() => initial?.id ?? newPostId ?? "");
  const [persisted, setPersisted] = useState(Boolean(initial));
  const [slug, setSlug] = useState(initial?.slugByLocale.en ?? "");
  const [slugByLocale, setSlugByLocale] = useState(initial?.slugByLocale ?? {});
  const [archived, setArchived] = useState(initial?.archived ?? false);
  const [states, setStates] = useState<PostWorkspace>(() => Object.fromEntries(BLOG_EDITOR_LOCALES.map(locale => [locale, {
    model: initial?.locales[locale] ?? { locale, revision: 0, templateRevision: locale === "en" ? null : 0,
      published: null, draft: null, working: emptyPostEnvelope(categories[0]?.id, authors[0]?.id) },
    errors: {}, notice: "", conflict: false,
  }])) as PostWorkspace);
  const selectedLocale: EditorLocale = initial && BLOG_EDITOR_LOCALES.includes(initialLocale as EditorLocale) ? initialLocale as EditorLocale : "en";
  const [locale, setLocale] = useState<EditorLocale>(selectedLocale);
  const [relatedPage, setRelatedPage] = useState(1);
  const [started, setStarted] = useState(() => new Set<EditorLocale>(["en", selectedLocale]));
  const [operation, setOperation] = useState<Operation>(null);
  const [navigating, startNavigation] = useTransition();
  const [localMedia, setLocalMedia] = useState<Record<string, AdminMediaPreview>>({});
  const [leaveTarget, setLeaveTarget] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"archive" | "delete" | null>(null);
  const lock = useRef(false);
  const skipLeave = useRef(false);
  const leaveDialog = useRef<HTMLDialogElement>(null);
  const actionDialog = useRef<HTMLDialogElement>(null);
  const formRoot = useRef<HTMLDivElement>(null);
  const pendingValidationFocus = useRef<string | null>(null);
  const state = states[locale];
  const content = state.model.working.content;
  const busy = operation !== null || queue.isPreparing || navigating;
  const dirty = persisted ? postLocaleDirty(state.model)
    : !postEnvelopeEqual(state.model.working, emptyPostEnvelope(categories[0]?.id, authors[0]?.id)) || Boolean(slug);
  const anyDirty = [...started].some(key => persisted ? postLocaleDirty(states[key].model)
    : !postEnvelopeEqual(states[key].model.working, emptyPostEnvelope(categories[0]?.id, authors[0]?.id))) || (!persisted && Boolean(slug));
  // Server-resolved media replaces its reservation blob after a successful save.
  const previews = useMemo(() => ({ ...localMedia, ...initial?.previews }), [initial?.previews, localMedia]);
  const editableShared = locale === "en" && !archived;
  const currentUrl = useRef("");

  useEffect(() => { currentUrl.current = window.location.href; }, [persisted]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!skipLeave.current && (anyDirty || busy)) event.preventDefault();
    };
    const intercept = (event: MouseEvent) => {
      if (skipLeave.current || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const href = new URL(link.href, window.location.href);
      if (href.href === window.location.href || (href.pathname === window.location.pathname && href.search === window.location.search && href.hash)) return;
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
    if (leaveTarget && !leaveDialog.current?.open) leaveDialog.current?.showModal();
    if (!leaveTarget && leaveDialog.current?.open) leaveDialog.current?.close();
  }, [leaveTarget]);
  useEffect(() => {
    if (confirmAction && !actionDialog.current?.open) actionDialog.current?.showModal();
    if (!confirmAction && actionDialog.current?.open) actionDialog.current?.close();
  }, [confirmAction]);

  useEffect(() => {
    if (busy || !pendingValidationFocus.current) return;
    const key = pendingValidationFocus.current;
    pendingValidationFocus.current = null;
    const frame = window.requestAnimationFrame(() => {
      const location = [...(formRoot.current?.querySelectorAll<HTMLElement>("[data-post-field]") ?? [])]
        .find(element => element.dataset.postField === key);
      if (!location) return;
      const control = location.querySelector<HTMLElement>("[contenteditable='true'], input:not(:disabled):not([type='hidden']), textarea:not(:disabled), select:not(:disabled), button:not(:disabled)");
      (control ?? location).focus({ preventScroll: true });
      location.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [busy, locale, state.errors]);

  function set<K extends keyof BlogPostContent>(key: K, value: BlogPostContent[K]) {
    if (busy || archived) return;
    setStates(previous => changePostField(previous, locale, key, value));
  }
  function selectLocale(next: EditorLocale) {
    if (busy || (!persisted && next !== "en")) return;
    if (!started.has(next)) {
      setStarted(previous => new Set([...previous, next]));
      setStates(previous => {
        const own = previous[next];
        const en = previous.en.model;
        const source = en.draft ?? en.published;
        if (next === "en" || own.model.draft || !source) return previous;
        return { ...previous, [next]: { ...own, model: { ...own.model,
          working: preparePostTarget(source, own.model.published), templateRevision: en.revision,
        } } };
      });
    }
    setLocale(next);
  }
  function remember(preview: AdminMediaPreview | null) {
    if (preview) setLocalMedia(previous => ({ ...previous, [preview.id]: preview }));
  }
  function resultError(result: Exclude<BlogPostEditorialResult, { ok: true }>) {
    const notice = result.error === "validation" ? te("validation")
      : result.error === "conflict" ? te("conflict")
      : result.error === "legacy_invalid" ? te("legacyInvalid")
      : result.error === "slug_conflict" ? te("slugConflict")
      : result.error === "no_draft" ? te("noDraft")
      : result.error === "archived" ? te("archived") : te("error");
    setStates(previous => ({ ...previous, [locale]: { ...previous[locale], notice,
      conflict: result.error === "conflict" || result.error === "legacy_invalid",
      errors: result.error === "validation" ? result.fieldErrors : {},
    } }));
    if (result.error === "validation") {
      const first = Object.keys(result.fieldErrors)[0]?.replace(/^(?:payload\.)?content\./, "") ?? "_source";
      pendingValidationFocus.current = first.split(".")[0] ?? "_source";
    }
  }
  async function mutate(action: "save" | "publish") {
    if (lock.current || busy || archived || !postId || state.conflict) return;
    if (action === "publish" && (!state.model.draft || dirty || !persisted)) return;
    lock.current = true;
    setOperation(action);
    setStates(previous => ({ ...previous, [locale]: { ...previous[locale], notice: "", errors: {} } }));
    try {
      if (action === "save" && !await queue.flush(postMediaIds(state.model.working))) return;
      const request = { postId, locale, expectedRevision: state.model.revision };
      const result = action === "save" ? await savePostLocaleDraft({ ...request,
        payload: state.model.working, templateRevision: state.model.templateRevision,
        ...(!persisted ? { slug: slug.trim() } : {}),
      }) : await publishPostLocaleDraft(request);
      if (!result.ok) { resultError(result); return; }
      setStates(previous => applyPostLocaleResult(previous, locale, result.model,
        result.refreshWarning ? te("refreshWarning") : te(action === "save" ? "draftSaved" : "published")));
      setSlugByLocale(result.slugByLocale);
      if (!persisted) {
        setPersisted(true);
        // Creation moves to the real Edit route. Keeping the New route's RSC
        // tree after changing browser history can later reinitialize this form.
        // Targets are still locked while this saved EN model is being reopened.
        skipLeave.current = true;
        startNavigation(() => router.replace(`/admin/posts/${result.postId}`));
      }
    } catch {
      setStates(previous => ({ ...previous, [locale]: { ...previous[locale], notice: te("error") } }));
    } finally {
      setOperation(null);
      lock.current = false;
    }
  }
  function leave(href: string) {
    if (busy) return;
    if (anyDirty) { setLeaveTarget(href); return; }
    skipLeave.current = true;
    router.push(href);
  }
  async function lifecycle(action: "archive" | "delete") {
    if (lock.current || busy) return;
    lock.current = true;
    setOperation(action);
    setConfirmAction(null);
    try {
      const result = action === "archive" ? await archivePost(postId) : await deletePost(postId);
      if (!result.ok) {
        const inUse = action === "delete" && "error" in result && result.error === "in_use";
        setStates(previous => ({ ...previous, [locale]: { ...previous[locale], notice: te(inUse ? "inUse" : "error") } }));
        return;
      }
      if (action === "archive") setArchived(true);
      skipLeave.current = true;
      router.push("/admin/posts");
    } catch {
      setStates(previous => ({ ...previous, [locale]: { ...previous[locale], notice: te("error") } }));
    } finally { setOperation(null); lock.current = false; }
  }

  const error = (key: string) => Object.entries(state.errors).find(([path]) => {
    const normalized = path.replace(/^(?:payload\.)?content\./, "");
    return normalized === key || normalized.startsWith(`${key}.`);
  })?.[1];
  const fieldId = (key: string) => `${fieldPrefix}-${locale}-${key}`;
  const input = (key: "title" | "excerpt" | "cta_label" | "cta_url" | "meta_title" | "meta_description", label: string, multiline = false) => (
    <div key={key} data-post-field={key} tabIndex={-1} className="scroll-mt-40 focus:outline-none">
      <Field label={label} htmlFor={fieldId(key)} error={error(key)}>
        {multiline ? <TextArea id={fieldId(key)} value={content[key] ?? ""} onChange={event => set(key, event.target.value)} disabled={busy || archived}
          aria-invalid={Boolean(error(key))} rows={key === "excerpt" ? 3 : 4} />
          : <TextInput id={fieldId(key)} value={content[key] ?? ""} onChange={event => set(key, event.target.value)} disabled={busy || archived}
            aria-invalid={Boolean(error(key))} className={key === "title" ? "py-3 font-serif text-2xl leading-tight sm:text-3xl" : undefined} />}
      </Field>
    </div>
  );
  const canAdoptSource = hasNewPostSourceDetails(states, locale);
  const relatedPosts = posts.filter(post => post.id !== postId);
  const relatedPageCount = Math.max(1, Math.ceil(relatedPosts.length / 10));
  const currentRelatedPage = Math.min(relatedPage, relatedPageCount);
  const visibleRelatedPosts = relatedPosts.slice((currentRelatedPage - 1) * 10, currentRelatedPage * 10);
  const sharedNotice = locale !== "en" ? <div className="space-y-2 border-b border-line pb-5">
    <p className="text-xs leading-relaxed text-ink-soft">{te("sourceFields")}</p>
    {canAdoptSource ? <>
      <AdminButton disabled={busy || archived || state.conflict} onClick={() => {
        if (!busy && !archived && !state.conflict) setStates(previous => adoptPostSourceDetails(previous, locale));
      }}>{te("adoptSource")}</AdminButton>
      <p className="text-xs leading-relaxed text-ink-soft">{te("adoptSourceHint")}</p>
    </> : null}
  </div> : null;
  const editorialState = `${locale.toUpperCase()} · ${archived ? te("archived") : [
    state.model.published ? te("published") : te("unpublished"),
    ...(state.model.draft ? [te("draftSaved")] : []),
    ...(dirty ? [te("unsaved")] : []),
  ].join(" · ")}`;
  const titleId = `${fieldPrefix}-leave-title`;
  const descriptionId = `${fieldPrefix}-leave-description`;
  return <MediaAltProvider locale={locale} value={content.media_alts} onChange={value => set("media_alts", value)} disabled={busy || archived}>
    <div ref={formRoot} className="min-w-0 selection:bg-accent/20 selection:text-ink" data-post-editor="form" aria-busy={busy}>
      <header className="sticky top-0 z-20 space-y-3 border-b border-line bg-bg py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AdminButton onClick={() => leave("/admin/posts")} disabled={busy} className="shrink-0">
            <UiIcon name="nav-arrow-left" size={16} />
            {te("back")}
          </AdminButton>
          <h1 className="min-w-0 max-w-full flex-1 truncate font-serif text-2xl" title={content.title || te("newPost")}>
            {content.title || te("newPost")}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <AdminButton onClick={() => void mutate("save")} disabled={busy || archived || state.conflict || !postId}>
              {te(operation === "save" ? "saving" : "saveDraft")}
            </AdminButton>
            <AdminButton variant="primary" onClick={() => void mutate("publish")} disabled={busy || archived || state.conflict || !persisted || !state.model.draft || dirty}>
              {te(operation === "publish" ? "publishing" : "publish")}
            </AdminButton>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="tablist" aria-label={tb("pageEditor.contentLanguage")} className="flex gap-1 rounded-md border border-line bg-surface p-1">
            {BLOG_EDITOR_LOCALES.map(key => <button key={key} type="button" role="tab"
              id={`${fieldPrefix}-tab-${key}`} aria-controls={`${fieldPrefix}-panel-${key}`}
              aria-selected={locale === key} tabIndex={locale === key ? 0 : -1}
              disabled={busy || (!persisted && key !== "en")} onClick={() => selectLocale(key)}
              onKeyDown={event => {
                if (busy || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                event.preventDefault();
                const available = persisted ? BLOG_EDITOR_LOCALES : ["en"] as const;
                const index = available.findIndex(item => item === key);
                const next = event.key === "Home" ? available[0] : event.key === "End" ? available[available.length - 1]
                  : available[(index + (event.key === "ArrowRight" ? 1 : -1) + available.length) % available.length];
                if (!next) return;
                selectLocale(next);
                document.getElementById(`${fieldPrefix}-tab-${next}`)?.focus();
              }}
              className={`min-h-9 rounded px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 ${locale === key ? "bg-accent/10 text-accent-deep" : "text-ink-soft"}`}>
              {key.toUpperCase()}{key === "en" ? <span className="ml-1 text-[10px] font-normal">{tb("pageEditor.source")}</span> : null}
            </button>)}
          </div>
          <p className={`text-xs ${dirty ? "text-accent-deep" : "text-ink-soft"}`} role="status">{editorialState}</p>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-end gap-3 py-5">
        <p className="text-xs text-ink-soft">{persisted ? te("manual") : te("firstSave")}</p>
      </div>
      <div data-post-field="_source" tabIndex={-1} className="mb-6 space-y-2 text-sm text-ink-soft focus:outline-none" role="status" aria-live="polite">
        {state.notice || queue.isPreparing ? <p>{state.notice || te("preparing")}</p> : null}
        {state.errors._source ? <p role="alert">{state.errors._source}</p> : null}
        {state.conflict ? <AdminButton disabled={busy} onClick={() => {
          if (anyDirty) setLeaveTarget("__reload__");
          else { skipLeave.current = true; window.location.reload(); }
        }}>{te("reload")}</AdminButton> : null}
      </div>

      <div role="tabpanel" id={`${fieldPrefix}-panel-${locale}`} aria-labelledby={`${fieldPrefix}-tab-${locale}`}
        className="grid min-w-0 items-start gap-10 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0 space-y-8">
          <section aria-label={t("richText.content")} className="space-y-6">
            {input("title", t("admin.post.fields.title"))}
            {input("excerpt", t("admin.post.fields.excerpt"), true)}
            <div data-post-field="body" tabIndex={-1} className="min-w-0 scroll-mt-40 space-y-3 focus:outline-none">
              <h2 className="text-sm font-semibold">{te("sectionBody")}</h2>
              {Object.entries(state.errors).filter(([key]) => /^(?:(?:payload\.)?content\.)?body(?:\.|$)/.test(key)).map(([key, message]) =>
                <p key={key} role="alert" className="text-xs text-red-700">{message}</p>)}
              <PostRichTextEditor value={content.body} onChange={(body: BlogPostContent["body"]) => set("body", body)} previews={previews}
                onPreview={remember} errors={state.errors} disabled={busy || archived} localeKey={locale} />
            </div>
          </section>
          <section aria-labelledby={fieldId("cta-heading")} className="space-y-4 border-t border-line pt-6">
            <h2 id={fieldId("cta-heading")} className="font-serif text-xl">{te("sectionCta")}</h2>
            {input("cta_label", t("admin.post.fields.ctaLabel"))}
            {input("cta_url", t("admin.post.fields.ctaUrl"))}
          </section>
          <section data-post-field="related_ids" tabIndex={-1} aria-labelledby={fieldId("related-heading")} className="scroll-mt-40 space-y-4 border-t border-line pt-6 focus:outline-none">
            <h2 id={fieldId("related-heading")} className="font-serif text-xl">{te("sectionRelated")}</h2>
            <p className="text-xs text-ink-soft">{t("admin.post.related.hint", { max: 3 })}</p>
            {locale !== "en" ? <p className="text-xs text-ink-soft">{te("shared")}</p> : null}
            <div className="space-y-3" data-related-options>
              {relatedPosts.length ? visibleRelatedPosts.map(post => <div key={post.id}><Checkbox label={post.title} checked={content.related_ids.includes(post.id)}
                disabled={!editableShared || busy || (!content.related_ids.includes(post.id) && content.related_ids.length >= 3)}
                onChange={() => set("related_ids", content.related_ids.includes(post.id) ? content.related_ids.filter(id => id !== post.id) : [...content.related_ids, post.id])} /></div>)
                : <p className="text-sm text-ink-soft">{t("admin.post.related.empty")}</p>}
            </div>
            {relatedPageCount > 1 ? <nav aria-label={t("admin.post.related.pagination")} className="flex items-center justify-between gap-3" data-related-pagination>
              <AdminButton disabled={busy || currentRelatedPage === 1} onClick={() => setRelatedPage(currentRelatedPage - 1)}>
                {t("admin.post.related.previous")}
              </AdminButton>
              <span aria-current="page" role="status" className="text-sm tabular-nums text-ink-soft" aria-label={t("admin.post.related.page", { page: currentRelatedPage, total: relatedPageCount })}>
                {currentRelatedPage} / {relatedPageCount}
              </span>
              <AdminButton disabled={busy || currentRelatedPage === relatedPageCount} onClick={() => setRelatedPage(currentRelatedPage + 1)}>
                {t("admin.post.related.next")}
              </AdminButton>
            </nav> : null}
            {error("related_ids") ? <p role="alert" className="text-xs text-red-700">{error("related_ids")}</p> : null}
          </section>
        </div>
        <aside className="min-w-0 space-y-8 border-t border-line pt-6 xl:border-t-0 xl:border-l xl:pl-7 xl:pt-0" aria-label={te("sectionArticle")}>
          <section aria-labelledby={fieldId("details-heading")} className="space-y-5">
            <h2 id={fieldId("details-heading")} className="font-serif text-xl">{te("sectionArticle")}</h2>
            {sharedNotice}
            <div data-post-field="category_id" tabIndex={-1} className="scroll-mt-40 focus:outline-none">
              <Field label={t("admin.post.fields.category")} htmlFor={fieldId("category_id")} error={error("category_id")} required>
                <Select id={fieldId("category_id")} value={content.category_id} onChange={event => set("category_id", event.target.value)} disabled={!editableShared || busy} aria-invalid={Boolean(error("category_id"))}>
                  <option value="">{t("admin.post.fields.choose")}</option>{categories.map(option => <option key={option.id} value={option.id}>{option.labels?.[locale] ?? option.name}</option>)}
                </Select>
              </Field>
            </div>
            <div data-post-field="author_id" tabIndex={-1} className="scroll-mt-40 focus:outline-none">
              <Field label={t("admin.post.fields.author")} htmlFor={fieldId("author_id")} error={error("author_id")} required>
                <Select id={fieldId("author_id")} value={content.author_id} onChange={event => set("author_id", event.target.value)} disabled={!editableShared || busy} aria-invalid={Boolean(error("author_id"))}>
                  <option value="">{t("admin.post.fields.choose")}</option>{authors.map(option => <option key={option.id} value={option.id}>{option.labels?.[locale] ?? option.name}</option>)}
                </Select>
              </Field>
            </div>
            <div data-post-field="slug" tabIndex={-1} className="scroll-mt-40 focus:outline-none">
              <Field label={t("admin.post.fields.slug")} htmlFor={fieldId("slug")} error={error("slug")} hint={persisted ? te("immutableSlug") : t("admin.post.fields.slugHint")}>
                <TextInput id={fieldId("slug")} value={persisted ? slugByLocale[locale] ?? slug : slug} onChange={event => setSlug(event.target.value)} disabled={persisted || busy || archived} aria-invalid={Boolean(error("slug"))} />
              </Field>
              {persisted ? <p className="mt-2 break-all text-xs text-ink-soft">{te("url")}: /{locale}/blog/{slugByLocale[locale] ?? ""}</p> : null}
            </div>
            <div data-post-field="published_at" tabIndex={-1} className="scroll-mt-40 focus:outline-none">
              <Field label={t("admin.post.fields.publishedAt")} htmlFor={fieldId("published_at")} error={error("published_at")}>
                <TextInput id={fieldId("published_at")} type="datetime-local" value={content.published_at?.slice(0, 16) ?? ""}
                  onChange={event => set("published_at", event.target.value || null)} disabled={!editableShared || busy} aria-invalid={Boolean(error("published_at"))} />
              </Field>
            </div>
            <div data-post-field="reading_minutes" tabIndex={-1} className="scroll-mt-40 focus:outline-none">
              <Field label={t("admin.post.fields.readingMinutes")} htmlFor={fieldId("reading_minutes")} error={error("reading_minutes")}>
                <TextInput id={fieldId("reading_minutes")} type="number" min={1} max={120} value={content.reading_minutes ?? ""}
                  onChange={event => set("reading_minutes", event.target.value === "" ? null : Number(event.target.value))} disabled={busy || archived} aria-invalid={Boolean(error("reading_minutes"))} />
              </Field>
            </div>
            <div data-post-field="is_featured" tabIndex={-1} className="scroll-mt-40 focus:outline-none">
              <Checkbox label={t("admin.post.fields.featuredLabel")} checked={content.is_featured} onChange={event => set("is_featured", event.target.checked)} disabled={!editableShared || busy} />
              {error("is_featured") ? <p role="alert" className="text-xs text-red-700">{error("is_featured")}</p> : null}
            </div>
          </section>
          <section data-post-field="cover_media_id" tabIndex={-1} aria-labelledby={fieldId("cover-heading")} className="scroll-mt-40 space-y-4 border-t border-line pt-6 focus:outline-none">
            <h2 id={fieldId("cover-heading")} className="font-serif text-xl">{t("admin.post.fields.cover")}</h2>
            <fieldset disabled={busy}>
              <MediaField mediaDisabled={!editableShared} key={`${locale}-cover-${content.cover_media_id}-${content.cover_media_id ? previews[content.cover_media_id]?.url : ""}`} value={content.cover_media_id} preview={content.cover_media_id ? previews[content.cover_media_id] ?? null : null}
                onChange={(id, preview) => { set("cover_media_id", id); remember(preview); }} />
            </fieldset>
            {error("cover_media_id") ? <p role="alert" className="text-xs text-red-700">{error("cover_media_id")}</p> : null}
          </section>
          <section aria-labelledby={fieldId("seo-heading")} className="space-y-5 border-t border-line pt-6">
            <h2 id={fieldId("seo-heading")} className="font-serif text-xl">{te("seo")}</h2>
            {input("meta_title", t("admin.post.fields.metaTitle"))}
            {input("meta_description", t("admin.post.fields.metaDescription"), true)}
            <div data-post-field="og_image_media_id" tabIndex={-1} className="scroll-mt-40 focus:outline-none">
              <Field label={t("admin.post.fields.ogImage")} error={error("og_image_media_id")} hint={t("admin.post.fields.ogImageHint")}>
                <fieldset disabled={busy}>
                  <MediaField mediaDisabled={!editableShared} key={`${locale}-social-${content.og_image_media_id}-${content.og_image_media_id ? previews[content.og_image_media_id]?.url : ""}`} value={content.og_image_media_id} preview={content.og_image_media_id ? previews[content.og_image_media_id] ?? null : null}
                    onChange={(id, preview) => { set("og_image_media_id", id); remember(preview); }} />
                </fieldset>
              </Field>
            </div>
          </section>
        </aside>
      </div>
      {persisted ? <div className="mt-10 flex flex-wrap justify-end gap-3 border-t border-line pt-5">
        {!archived ? <AdminButton disabled={busy} onClick={() => setConfirmAction("archive")}>{te("archive")}</AdminButton> : null}
        <AdminButton variant="danger" disabled={busy} onClick={() => setConfirmAction("delete")}>{tb("actions.delete")}</AdminButton>
      </div> : null}
    </div>
    <dialog ref={leaveDialog} aria-labelledby={titleId} aria-describedby={descriptionId}
      onCancel={() => setLeaveTarget(null)} onClose={() => setLeaveTarget(null)}
      className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-line bg-surface p-6 text-ink backdrop:bg-ink/40">
      <h2 id={titleId} className="font-serif text-2xl">{te("leaveTitle")}</h2>
      <p id={descriptionId} className="mt-3 text-sm leading-relaxed text-ink-soft">{te("leaveBody")}</p>
      <div className="mt-6 flex justify-end gap-3">
        <AdminButton autoFocus onClick={() => setLeaveTarget(null)}>{te("cancel")}</AdminButton>
        <AdminButton variant="primary" onClick={() => {
          if (!leaveTarget) return;
          skipLeave.current = true;
          const target = leaveTarget;
          setLeaveTarget(null);
          if (target === "__reload__") { window.location.reload(); return; }
          const url = new URL(target, window.location.href);
          if (url.origin === window.location.origin) router.push(`${url.pathname}${url.search}${url.hash}`);
          else window.location.assign(url.href);
        }}>{te("continue")}</AdminButton>
      </div>
    </dialog>
    <dialog ref={actionDialog} aria-label={te(confirmAction === "delete" ? "deleteConfirm" : "archiveConfirm")}
      onCancel={() => setConfirmAction(null)} onClose={() => setConfirmAction(null)}
      className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-line bg-surface p-6 text-ink backdrop:bg-ink/40">
      <h2 className="font-serif text-xl">{te(confirmAction === "delete" ? "deleteConfirm" : "archiveConfirm")}</h2>
      <div className="mt-6 flex justify-end gap-3">
        <AdminButton autoFocus onClick={() => setConfirmAction(null)}>{te("cancel")}</AdminButton>
        <AdminButton variant="danger" disabled={busy} onClick={() => { if (confirmAction) void lifecycle(confirmAction); }}>{te("continue")}</AdminButton>
      </div>
    </dialog>
  </MediaAltProvider>;
}
