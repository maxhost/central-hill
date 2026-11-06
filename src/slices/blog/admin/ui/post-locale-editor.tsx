"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  AdminButton, Checkbox, Field, MediaField, PageEditorShell, Select, TextArea,
  TextInput, useMediaQueue, type AdminMediaPreview, type EditorLocale,
} from "@slices/backoffice/contract";
import { BLOG_EDITOR_LOCALES, type BlogPostContent, type BlogPostEditorialModel, type BlogPostEditorialResult } from "../editorial-contract";
import { archivePost, publishPostLocaleDraft, savePostLocaleDraft } from "../post-locale-actions";
import { deletePost } from "../actions";
import { BodyEditor } from "./body-editor";
import { postEditorSections } from "./post-editor-adapter";
import {
  applyPostLocaleResult, changePostField, emptyPostEnvelope, postEnvelopeEqual,
  postLocaleDirty, postMediaIds, preparePostTarget, type PostWorkspace,
} from "./post-editor-state";

type Option = { id: string; name: string };
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
  const [selection, setSelection] = useState("header");
  const [started, setStarted] = useState(() => new Set<EditorLocale>(["en", selectedLocale]));
  const [operation, setOperation] = useState<Operation>(null);
  const [localMedia, setLocalMedia] = useState<Record<string, AdminMediaPreview>>({});
  const [leaveTarget, setLeaveTarget] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"archive" | "delete" | null>(null);
  const lock = useRef(false);
  const skipLeave = useRef(false);
  const leaveDialog = useRef<HTMLDialogElement>(null);
  const actionDialog = useRef<HTMLDialogElement>(null);
  const state = states[locale];
  const content = state.model.working.content;
  const busy = operation !== null || queue.isPreparing;
  const dirty = persisted ? postLocaleDirty(state.model)
    : !postEnvelopeEqual(state.model.working, emptyPostEnvelope(categories[0]?.id, authors[0]?.id)) || Boolean(slug);
  const anyDirty = [...started].some(key => persisted ? postLocaleDirty(states[key].model)
    : !postEnvelopeEqual(states[key].model.working, emptyPostEnvelope(categories[0]?.id, authors[0]?.id))) || (!persisted && Boolean(slug));
  const previews = useMemo(() => ({ ...initial?.previews, ...localMedia }), [initial?.previews, localMedia]);
  const sections = useMemo(() => postEditorSections(te), [te]);
  const onSelect = useCallback((id: string) => setSelection(id), []);
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
      const first = Object.keys(result.fieldErrors)[0]?.replace(/^content\./, "") ?? "";
      setSelection(first.startsWith("body") ? "body" : first.startsWith("meta_") || first.startsWith("og_") ? "seo"
        : first.startsWith("cta_") ? "cta" : first.startsWith("related") ? "related"
        : ["category_id", "author_id", "slug", "published_at", "reading_minutes", "is_featured"].includes(first) ? "article" : "header");
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
        window.history.replaceState(window.history.state, "", `/admin/posts/${result.postId}`);
        currentUrl.current = window.location.href;
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

  const error = (key: string) => state.errors[key] ?? state.errors[`content.${key}`] ?? state.errors[`payload.content.${key}`];
  const fieldId = (key: string) => `${fieldPrefix}-${locale}-${key}`;
  const input = (key: "title" | "excerpt" | "cta_label" | "cta_url" | "meta_title" | "meta_description", label: string, multiline = false) => (
    <Field key={key} label={label} htmlFor={fieldId(key)} error={error(key)}>
      {multiline ? <TextArea id={fieldId(key)} value={content[key] ?? ""} onChange={event => set(key, event.target.value)} disabled={busy || archived} />
        : <TextInput id={fieldId(key)} value={content[key] ?? ""} onChange={event => set(key, event.target.value)} disabled={busy || archived} />}
    </Field>
  );
  const sharedNotice = locale !== "en" ? <p className="text-xs leading-relaxed text-ink-soft">{te("sourceFields")}</p> : null;
  const inspector = selection === "article" ? <div className="space-y-5">
    {sharedNotice}
    <Field label={t("admin.post.fields.category")} htmlFor={fieldId("category_id")} error={error("category_id")} required>
      <Select id={fieldId("category_id")} value={content.category_id} onChange={event => set("category_id", event.target.value)} disabled={!editableShared || busy}>
        <option value="">{t("admin.post.fields.choose")}</option>{categories.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
      </Select>
    </Field>
    <Field label={t("admin.post.fields.author")} htmlFor={fieldId("author_id")} error={error("author_id")} required>
      <Select id={fieldId("author_id")} value={content.author_id} onChange={event => set("author_id", event.target.value)} disabled={!editableShared || busy}>
        <option value="">{t("admin.post.fields.choose")}</option>{authors.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
      </Select>
    </Field>
    <Field label={t("admin.post.fields.slug")} htmlFor={fieldId("slug")} error={error("slug")} hint={persisted ? te("immutableSlug") : undefined}>
      <TextInput id={fieldId("slug")} value={persisted ? slugByLocale[locale] ?? slug : slug} onChange={event => setSlug(event.target.value)} disabled={persisted || busy} />
    </Field>
    <Field label={t("admin.post.fields.publishedAt")} htmlFor={fieldId("published_at")} error={error("published_at")}>
      <TextInput id={fieldId("published_at")} type="datetime-local" value={content.published_at?.slice(0, 16) ?? ""}
        onChange={event => set("published_at", event.target.value || null)} disabled={!editableShared || busy} />
    </Field>
    <Field label={t("admin.post.fields.readingMinutes")} htmlFor={fieldId("reading_minutes")} error={error("reading_minutes")}>
      <TextInput id={fieldId("reading_minutes")} type="number" min={1} max={120} value={content.reading_minutes ?? ""}
        onChange={event => set("reading_minutes", event.target.value === "" ? null : Number(event.target.value))} disabled={busy || archived} />
    </Field>
    <Checkbox label={t("admin.post.fields.featuredLabel")} checked={content.is_featured} onChange={event => set("is_featured", event.target.checked)} disabled={!editableShared || busy} />
  </div> : selection === "header" ? <div className="space-y-5">
    {input("title", t("admin.post.fields.title"))}{input("excerpt", t("admin.post.fields.excerpt"), true)}
    {sharedNotice}
    <Field label={t("admin.post.fields.cover")} error={error("cover_media_id")}>
      <fieldset disabled={!editableShared || busy}><MediaField value={content.cover_media_id} preview={content.cover_media_id ? previews[content.cover_media_id] ?? null : null}
        onChange={(id, preview) => { set("cover_media_id", id); remember(preview); }} /></fieldset>
    </Field>
  </div> : selection === "body" ? <div className="space-y-4">
    {Object.entries(state.errors).filter(([key]) => key.includes("body")).map(([key, message]) => <p key={key} role="alert" className="text-xs text-red-700">{message}</p>)}
    <fieldset disabled={busy || archived}>
      <BodyEditor key={locale} value={content.body} onChange={body => set("body", body)} previews={previews} onPreview={remember} errors={state.errors} />
    </fieldset>
  </div> : selection === "cta" ? <div className="space-y-5">
    {input("cta_label", t("admin.post.fields.ctaLabel"))}{input("cta_url", t("admin.post.fields.ctaUrl"))}
  </div> : selection === "related" ? <div className="space-y-4">
    {sharedNotice}<p className="text-xs text-ink-soft">{t("admin.post.related.hint", { max: 3 })}</p>
    {posts.filter(post => post.id !== postId).map(post => <div key={post.id}><Checkbox label={post.title} checked={content.related_ids.includes(post.id)}
      disabled={!editableShared || busy || (!content.related_ids.includes(post.id) && content.related_ids.length >= 3)}
      onChange={() => set("related_ids", content.related_ids.includes(post.id) ? content.related_ids.filter(id => id !== post.id) : [...content.related_ids, post.id])} /></div>)}
    {error("related_ids") ? <p role="alert" className="text-xs text-red-700">{error("related_ids")}</p> : null}
  </div> : <div className="space-y-5">
    {input("meta_title", t("admin.post.fields.metaTitle"))}{input("meta_description", t("admin.post.fields.metaDescription"), true)}
    {sharedNotice}<Field label={t("admin.post.fields.ogImage")} error={error("og_image_media_id")}>
      <fieldset disabled={!editableShared || busy}><MediaField value={content.og_image_media_id} preview={content.og_image_media_id ? previews[content.og_image_media_id] ?? null : null}
        onChange={(id, preview) => { set("og_image_media_id", id); remember(preview); }} /></fieldset>
    </Field>
  </div>;

  const previewPayload = { postId, locale, envelope: state.model.working, slug: slugByLocale[locale] ?? slug,
    localMedia: Object.fromEntries(postMediaIds(state.model.working).flatMap(id => localMedia[id]?.url.startsWith("blob:") ? [[id, localMedia[id]!]] : [])),
  };
  const editorialState = `${locale.toUpperCase()} · ${archived ? te("archived") : [
    state.model.published ? te("published") : te("unpublished"),
    ...(state.model.draft ? [te("draftSaved")] : []),
    ...(dirty ? [te("unsaved")] : []),
  ].join(" · ")}`;
  const titleId = `${fieldPrefix}-leave-title`;
  const descriptionId = `${fieldPrefix}-leave-description`;
  return <>
    <PageEditorShell adapter={{
      title: content.title || te("newPost"), locale, onLocaleChange: selectLocale, sections,
      disabledLocales: persisted ? [] : ["es", "pt", "fr"],
      selectedId: selection, onSelect, seoSectionId: "seo", inspector,
      previewUrl: `/admin/preview/posts/${postId}?locale=${locale}${persisted ? "" : "&new=1"}`,
      previewVersion: 0, previewPayload, dirty, busy, editorialState,
      pageNavigation: <div className="flex flex-wrap items-center justify-between gap-3">
        <AdminButton onClick={() => leave("/admin/posts")} disabled={busy}>{te("back")}</AdminButton>
        <span className="text-xs text-ink-soft">{persisted ? te("manual") : te("firstSave")}</span>
        {persisted ? <div className="flex gap-2">
          {!archived ? <AdminButton disabled={busy} onClick={() => setConfirmAction("archive")}>{te("archive")}</AdminButton> : null}
          <AdminButton variant="danger" disabled={busy} onClick={() => setConfirmAction("delete")}>{tb("actions.delete")}</AdminButton>
        </div> : null}
      </div>,
      status: <div className="space-y-2">
        <span>{state.notice || (queue.isPreparing ? te("preparing") : te("manual"))}</span>
        {state.errors._source ? <p role="alert">{state.errors._source}</p> : null}
        {state.conflict ? <AdminButton disabled={busy} onClick={() => {
          if (anyDirty) setLeaveTarget("__reload__");
          else { skipLeave.current = true; window.location.reload(); }
        }}>{te("reload")}</AdminButton> : null}
        {persisted ? <p className="break-all">{te("url")}: /{locale}/blog/{slugByLocale[locale] ?? ""}</p> : null}
      </div>,
      actions: <>
        <AdminButton onClick={() => void mutate("save")} disabled={busy || archived || state.conflict || !postId}>
          {te(operation === "save" ? "saving" : "saveDraft")}
        </AdminButton>
        <AdminButton variant="primary" onClick={() => void mutate("publish")} disabled={busy || archived || state.conflict || !persisted || !state.model.draft || dirty}>
          {te(operation === "publish" ? "publishing" : "publish")}
        </AdminButton>
      </>,
    }} />
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
  </>;
}
