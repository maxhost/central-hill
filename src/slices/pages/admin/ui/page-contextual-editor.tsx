"use client";

import { useMemo, useRef, useState, useId, useEffect, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { RichTextEditor, type PostBody } from "@slices/blog/admin-rich-text-contract";
import { AdminButton, Field, MediaField, MediaAltProvider, PageEditorShell, TextArea, TextInput, useMediaQueue, type EditorLocale, type AdminMediaPreview } from "@slices/backoffice/contract";
import { FeedbackScope, EditorFeedbackSummary, feedbackMessage, focusEditorField, useEditorFeedbackToast, type FeedbackGroup, type FeedbackIssue } from "@slices/backoffice/contract-client";
import { knownPageFieldResolved, pageFeedbackPath } from "../page-feedback";
import { pageSections } from "../home-contextual";
import type { EditorialPageKey, PageContentMap, PageEditorialModel, PageLocaleEditorialModel } from "../../editorial-types";
import { prepareTargetEnvelope, sameEditorialSnapshot } from "../../editorial-content";
import { homeNode, homeButtonFields, pageFieldLabel, descriptorMediaIds, isEditableFieldPath } from "../home-contextual";
import { editorialAt, editorialListScope, editorialListIds, editorialTextPaths, editorialTranslationField, normalizeEditorial } from "../../editorial-identities";
import { publishPageDraft, savePageDraft } from "../editorial-actions";
import { NodeField, useFieldLabels } from "./schema-fields";
import type { AboutListOperation } from "../form-model";
import { PageNavigation } from "./page-navigation";
import { pageImageFields } from "../image-alt-fields";
import { setPageField } from "../field-update";
import { AboutContactSelector } from "./about-contact-selector";
import { realEstateEnquiryFormId } from "../../real-estate-enquiry-content";
import { guestContactFormId } from "../../guest-contact-content";
import { aboutContactFormId } from "../../about-contact-content";
import { editorViewSections, type PageEditorView } from "../editorial-views";

type LocaleState<K extends EditorialPageKey> = {
  model: PageLocaleEditorialModel<K>;
  errors: Record<string, string>;
  notice: string;
  conflict: boolean;
  previewVersion: number;
  uncertain?: boolean;
};

function setValue(root: unknown, path: (string | number)[], value: unknown): unknown {
  if (!path.length) return value;
  const [head, ...tail] = path;
  const out = Array.isArray(root) ? [...root] : { ...(root && typeof root === "object" ? root : {}) };
  (out as Record<string, unknown>)[String(head)] = setValue((out as Record<string, unknown>)[String(head)], tail, value);
  return out;
}

function isDirty<K extends EditorialPageKey>(model: PageLocaleEditorialModel<K>): boolean {
  return !sameEditorialSnapshot(model.working, model.draft ?? model.published);
}

export function PageContextualEditor<K extends EditorialPageKey = "home">({ model, view = "page" }: { model: PageEditorialModel<K>; view?: PageEditorView }) {
  const descriptor = model.descriptor;
  const t = useTranslations("pages");
  const tb = useTranslations("backoffice");
  const labels = useFieldLabels();
  const toast = useEditorFeedbackToast();
  const feedbackId = useId();
  const entity = `page:${model.descriptor.key}`;
  const editorRoot = useRef<HTMLDivElement>(null);
  const [focusRequest, setFocusRequest] = useState<{ locale: EditorLocale; path: string; version: number } | null>(null);
  const [errorView, setErrorView] = useState<PageEditorView | null>(null);
  // Each tab owns its snapshot and revision. A mutation never reinitializes other tabs.
  const [states, setStates] = useState(() => Object.fromEntries(
    Object.entries(model.locales).map(([key, value]) => [key, {
      model: value, errors: {}, notice: "", conflict: false, previewVersion: 0,
    }]),
  ) as Record<EditorLocale, LocaleState<K>>);
  const [localPreviews, setLocalPreviews] = useState<Record<string, AdminMediaPreview>>({});
  const previews = useMemo(() => ({ ...model.previews, ...localPreviews }), [model.previews, localPreviews]);
  const [locale, setLocale] = useState<EditorLocale>("en");
  const [contactPreviewOpen, setContactPreviewOpen] = useState(false);
  const [selection, setSelected] = useState(view === "blog_article" ? "post_aside" : "hero");
  const [operation, setOperation] = useState<"save" | "publish" | null>(null);
  const queue = useMediaQueue();
  const lock = useRef(false);
  const [startedLocales, setStartedLocales] = useState(() => new Set<EditorLocale>(["en"]));
  const state = states[locale];
  const content = state.model.working.content;
  const og = state.model.working.ogImageMediaId;
  const previewPayload = useMemo(() => ({
    envelope: state.model.working,
    ...(descriptor.key === "about" ? { aboutContactFormId: aboutContactFormId(states.en.model.working.content) ?? null } : {}),
    ...(descriptor.key === "guest" ? { guestContactFormId: guestContactFormId(states.en.model.working.content) ?? null } : {}),
    ...(descriptor.key === "real_estate" ? { realEstateEnquiryFormId: realEstateEnquiryFormId(states.en.model.working.content) ?? null } : {}),
    localMedia: Object.fromEntries(descriptorMediaIds(state.model.working.content, state.model.working.ogImageMediaId, descriptor)
      .flatMap(id => localPreviews[id]?.url.startsWith("blob:") ? [[id, localPreviews[id]!]] : [])),
  }), [state.model.working, states.en.model.working, localPreviews, descriptor]);
  const dirty = isDirty(state.model);
  const busy = operation !== null || queue.isPreparing;
  const unsavedPage = Object.entries(states).some(([key, value]) =>
    startedLocales.has(key as EditorLocale) && isDirty(value.model),
  ) || Object.keys(localPreviews).some(queue.isQueued);
  const sections = editorViewSections(descriptor, labels.field, content, errorView ?? view);
  const matchingSection = sections.find(s => s.id === selection || s.bindings.some(b => b.id === selection));
  const section = matchingSection ?? sections[0]!;
  const selected = matchingSection ? selection : section.id;

  const surface = descriptor.sectionPreviews?.[section.id] ?? "page";

  function issueFor(path: string, message: string, ownLocale: EditorLocale): FeedbackIssue {
    path = pageFeedbackPath(path);
    const ownContent = states[ownLocale].model.working.content;
    const candidateSections = pageSections(descriptor, labels.field, ownContent);
    const target = candidateSections.find(section => section.bindings.some(binding => path === binding.id || path.startsWith(`${binding.id}.`))) ?? candidateSections.find(section => section.id === path.split(".")[0]);
    const node = homeNode(descriptor.rootNode, path);
    const source = ownLocale !== "en" && !descriptor.localeIndependentContent && path !== "_source" && path !== "og_image_media_id" && !editorialTextPaths(ownContent, descriptor).includes(path) && !(descriptor.localeReferencePaths ?? []).includes(path);
    const human = path.startsWith("_") || path === "" ? "Shared source" : path === "og_image_media_id" ? "Social image" : pageFieldLabel(path, labels.field);
    const itemNumbers = path.split(".").filter(part => /^\d+$/.test(part)).map(part => Number(part) + 1);
    return { path, label: `${human}${itemNumbers.length ? ` (item ${itemNumbers.join(", ")})` : ""}`, message,
      section: target?.label, required: Boolean(node?.publishRequired), sourceLocale: source ? "en" : undefined };
  }
  const feedbackGroups: FeedbackGroup[] = (["en", "es", "pt", "fr"] as EditorLocale[]).map(ownLocale => {
    const own = states[ownLocale];
    const issues = Object.entries(own.errors).map(([path, message]) => issueFor(path, message, ownLocale));
    const ids = descriptorMediaIds(own.model.working.content, own.model.working.ogImageMediaId, descriptor);
    for (const failure of queue.failures ?? []) {
      if (failure.entity !== entity || failure.locale !== ownLocale || !ids.includes(failure.id)) continue;
      const mediaPath = own.model.working.ogImageMediaId === failure.id ? "og_image_media_id" : findMediaPath(own.model.working.content, failure.id) ?? "_upload";
      if (!issues.some(issue => issue.path === mediaPath)) issues.push(issueFor(mediaPath, `Could not upload “${failure.name}”. ${failure.error ?? "Retry the upload."}`, ownLocale));
    }
    return { locale: ownLocale, issues, notice: own.notice, uncertain: own.uncertain };
  });
  function findMediaPath(root: unknown, id: string, prefix = ""): string | null {
    if (!root || typeof root !== "object") return null;
    for (const [key, value] of Object.entries(root)) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (value === id) return path;
      const nested = findMediaPath(value, id, path);
      if (nested) return nested;
    }
    return null;
  }
  function navigateError(ownLocale: EditorLocale, path: string, explicit = true) {
    if (busy) return;
    const issue = feedbackGroups.find(group => group.locale === ownLocale)?.issues.find(issue => issue.path === path) ?? issueFor(path, "", ownLocale);
    const destination = explicit ? issue?.sourceLocale ?? ownLocale : ownLocale;
    selectLocale(destination);
    const candidates = pageSections(descriptor, labels.field, states[destination].model.working.content);
    const target = candidates.flatMap(section => section.bindings).filter(binding => path === binding.id || path.startsWith(`${binding.id}.`)).sort((a, b) => b.id.length - a.id.length)[0];
    if (descriptor.key === "blog") setErrorView(path.startsWith("post_aside") ? "blog_article" : "page");
    setSelected(target?.id ?? (path === "og_image_media_id" ? "seo" : path.split(".")[0]!));
    setFocusRequest(previous => ({ locale: destination, path, version: (previous?.version ?? 0) + 1 }));
  }
  useEffect(() => {
    if (!focusRequest || locale !== focusRequest.locale || busy) return;
    const frame = requestAnimationFrame(() => {
      focusEditorField(editorRoot.current, focusRequest.path);
    });
    return () => cancelAnimationFrame(frame);
  }, [focusRequest, locale, selected, busy]);

  function selectLocale(nextLocale: EditorLocale) {
    if (busy) return;
    // A target starts once, from the latest saved EN template. Returning to an
    // already started tab preserves even its unsaved prepared structure and copy.
    if (!startedLocales.has(nextLocale)) {
      setStartedLocales(previous => new Set([...previous, nextLocale]));
      setStates(previous => {
        const own = previous[nextLocale];
        const source = previous.en.model;
        const template = source.draft ?? source.published;
        if (own.model.draft || !template) return previous;
        return { ...previous, [nextLocale]: { ...own, model: {
          ...own.model, working: prepareTargetEnvelope(template, own.model.published, descriptor), templateRevision: source.revision,
        } } };
      });
    }
    setLocale(nextLocale);
  }
  function patchState(selectedLocale: EditorLocale, patch: Partial<LocaleState<K>>) {
    setStates(previous => ({ ...previous, [selectedLocale]: { ...previous[selectedLocale], ...patch } }));
  }
  function rememberPreview(preview?: AdminMediaPreview | null) {
    if (preview) setLocalPreviews(previous => ({ ...previous, [preview.id]: preview }));
  }
  function change(path: (string | number)[], value: unknown, preview?: AdminMediaPreview | null) {
    rememberPreview(preview);
    setStartedLocales(previous => previous.has(locale) ? previous : new Set([...previous, locale]));
    setStates(previous => {
      const own = previous[locale];
      const nextErrors = { ...own.errors };
      const changedPath = path.join(".");
      for (const errorPath of Object.keys(nextErrors)) {
        if ((errorPath === changedPath || errorPath.startsWith(`${changedPath}.`)) && knownPageFieldResolved(homeNode(descriptor.rootNode, errorPath), changedPath === "body" ? value : errorPath === changedPath ? value : editorialAt(value, errorPath.slice(changedPath.length + 1)), errorPath, Boolean(descriptor.localeIndependentContent), nextErrors[errorPath])) delete nextErrors[errorPath];
      }
      return { ...previous, [locale]: { ...own, notice: "", errors: nextErrors, model: { ...own.model, working: {
        ...own.model.working, content: setPageField(own.model.working.content, descriptor.rootNode, path, value) as PageContentMap[K],
      } } } };
    });
  }
  function listChange(path: string, operation: AboutListOperation) {
    if (locale !== "en" || editorialListScope(content, path, descriptor) === null) return;
    setStates(previous => {
      const own = previous.en;
      const c = own.model.working.content;
      const scope = editorialListScope(c, path, descriptor);
      if (scope === null) return previous;
      const items = [...(editorialAt(c, path) as unknown[] ?? [])];
      const ids = [...editorialListIds(c, path, descriptor)];
      if (operation.action === "add") { items.push(operation.value); ids.push(operation.id); }
      else if (operation.action === "remove") { items.splice(operation.index, 1); ids.splice(operation.index, 1); }
      else {
        [items[operation.index], items[operation.to]] = [items[operation.to], items[operation.index]];
        [ids[operation.index], ids[operation.to]] = [ids[operation.to]!, ids[operation.index]!];
      }
      const metadata = editorialAt(c, "_list_ids") as Record<string, string[]> | undefined;
      // New parents also receive identity metadata for their nested string/object lists.
      const content = normalizeEditorial({ ...(setValue(c, path.split("."), items) as PageContentMap[K]), _list_ids: { ...metadata, [scope]: ids } }, descriptor);
      const nextMetadata = editorialAt(content, "_list_ids") as Record<string, string[]>;
      for (const childScope of Object.keys(nextMetadata)) {
        if (childScope !== scope && !Object.hasOwn(metadata ?? {}, childScope)) {
          nextMetadata[childScope] = nextMetadata[childScope]!.map(() => crypto.randomUUID());
        }
      }
      return { ...previous, en: { ...own, notice: "", model: { ...own.model, working: { ...own.model.working, content } } } };
    });
  }
  async function mutate(action: "save" | "publish") {
    if (lock.current || busy || model.sourceInvalid || state.conflict || state.uncertain) return;
    if (action === "publish" && (!state.model.draft || dirty)) return;
    const attemptLocale = locale;
    const attemptState = state;
    lock.current = true;
    setOperation(action);
    patchState(attemptLocale, { notice: "" });
    const messageFor = (outcome: "success" | "validation" | "conflict" | "server" | "uncertain" | "no_draft", groups = feedbackGroups, refreshWarning = false) => feedbackMessage({ action, locale: attemptLocale, outcome, groups, refreshWarning });
    try {
      if (action === "save" && !await queue.flush(attemptLocale === "en" ? descriptorMediaIds(attemptState.model.working.content, attemptState.model.working.ogImageMediaId, descriptor) : [], { locale: attemptLocale, feedback: true, entity })) {
        patchState(attemptLocale, { notice: `Your ${attemptLocale.toUpperCase()} draft has not been saved. Retry the upload, then Save draft.` });
        return;
      }
      const input = { key: descriptor.key as K, locale: attemptLocale, expectedRevision: attemptState.model.revision };
      const result = action === "save"
        ? await savePageDraft({ ...input, templateRevision: attemptState.model.templateRevision, payload: attemptState.model.working })
        : await publishPageDraft(input);
      if (result.ok) {
        if (action === "publish" && attemptLocale !== "en") setStartedLocales(previous => {
          const next = new Set(previous); next.delete(attemptLocale); return next;
        });
        const notice = messageFor("success", feedbackGroups, Boolean(result.refreshWarning));
        const retainedErrors = action === "publish" ? {} : Object.fromEntries(Object.entries(attemptState.errors).filter(([path, message]) => !knownPageFieldResolved(homeNode(descriptor.rootNode, path), path === "body" || path.startsWith("body.") ? editorialAt(result.model.working.content, "body") : editorialAt(result.model.working.content, path), path, Boolean(descriptor.localeIndependentContent), message)));
        patchState(attemptLocale, { model: result.model, errors: retainedErrors, conflict: false, uncertain: false, previewVersion: attemptState.previewVersion + 1, notice });
        if (result.refreshWarning) toast.warning(notice, { duration: 0 }); else toast.success(notice);
      } else if (result.error === "validation") {
        const errors = { ...attemptState.errors, ...result.fieldErrors };
        const groups = feedbackGroups.map(group => group.locale === attemptLocale ? { ...group, issues: Object.entries(errors).map(([path, message]) => issueFor(path, message, attemptLocale)) } : group);
        const notice = messageFor("validation", groups);
        patchState(attemptLocale, { errors, notice });
        toast.error(notice, { duration: 0 });
        const firstPath = Object.keys(result.fieldErrors).find(path => !path.startsWith("_") && !(attemptLocale !== "en" && issueFor(path, "", attemptLocale).sourceLocale === "en"));
        if (firstPath) navigateError(attemptLocale, firstPath, false);
      } else {
        const notice = messageFor(result.error);
        patchState(attemptLocale, { conflict: result.error === "conflict", notice });
        toast.error(notice, { duration: 0 });
      }
    } catch {
      const notice = messageFor("uncertain");
      patchState(attemptLocale, { notice, uncertain: true });
      toast.warning(notice, { duration: 0 });
    } finally { setOperation(null); lock.current = false; }
  }

  const imageFields = pageImageFields(descriptor.rootNode, content);
  const inlineAltMediaPaths = imageFields.filter(field => field.inlineAltPath).map(field => field.path.join("."));
  const selectedFields = descriptor.key === "home" ? homeButtonFields(selected) : [selected];
  let visible = selected === section.id || section.selectAsGroup ? section.bindings : section.bindings.filter(b => selectedFields.includes(b.id));
  // Include blank and absent optional copy, especially SEO, in every target locale.
  // Selecting a photo directly also exposes its existing schema-owned ALT sibling.
  for (const image of imageFields) {
    if (!image.inlineAltPath || !visible.some(binding => binding.id === image.path.join("."))) continue;
    const altPath = image.inlineAltPath.join(".");
    if (!visible.some(binding => altPath === binding.id || altPath.startsWith(`${binding.id}.`)))
      visible = [...visible, { id: altPath, label: pageFieldLabel(altPath, labels.field), sectionId: section.id }];
  }
  const visibleImages = imageFields.filter(field => visible.some(binding => field.path.join(".") === binding.id || field.path.join(".").startsWith(`${binding.id}.`)));
  const targetPaths = editorialTextPaths(content, descriptor).filter(path => isEditableFieldPath(descriptor.rootNode, path) && visible.some(b => path === b.id || path.startsWith(`${b.id}.`)));
  const visibleImagePreviews = visibleImages.filter(field => field.id && (!previews[field.id] || previews[field.id]!.mime.startsWith("image/")));
  const pairedAltPaths = new Set(visibleImagePreviews.filter(field => field.inlineAltPath).map(field => field.inlineAltPath!.join(".")));
  const referencePaths = (descriptor.localeReferencePaths ?? []).filter(path => isEditableFieldPath(descriptor.rootNode, path) && visible.some(b => path === b.id || path.startsWith(`${b.id}.`)));
  const english = (states.en.model.draft ?? states.en.model.published ?? states.en.model.working).content;
  const englishText = Object.fromEntries(editorialTextPaths(english, descriptor).map(path => [editorialTranslationField(english, path, descriptor), editorialAt(english, path)]));
  function groupContactFields(fields: { id: string; node: ReactNode }[]) {
    if (descriptor.key === "real_estate" && section.id === "deal_enquiry") return fields.flatMap(field => [field.node, ...(field.id === "deal_enquiry.note" ? [<AboutContactSelector key="real-estate-enquiry-form" placement="real_estate" value={realEstateEnquiryFormId(states.en.model.working.content)} readOnly={locale !== "en"} disabled={busy} error={states.en.errors["deal_enquiry.form_id"]} onEnglish={() => selectLocale("en")} onChange={value => change(["deal_enquiry", "form_id"], value)} />] : [])]);
    if (descriptor.key === "about" && section.id === "contact") return fields.flatMap(field => [field.node, ...(field.id === "contact.form.subheadline" ? [<AboutContactSelector key="about-contact-form" value={aboutContactFormId(states.en.model.working.content)} readOnly={locale !== "en"} disabled={busy} error={states.en.errors["contact.form.form_id"]} onEnglish={() => selectLocale("en")} onChange={value => change(["contact", "form", "form_id"], value)} />] : [])]);
    if (descriptor.key !== "guest" || section.id !== "dual_cta") return fields.map(field => field.node);
    const contactIds = ["dual_cta.owner.contact.title", "dual_cta.owner.contact.intro"];
    const contactFields = fields.filter(field => contactIds.includes(field.id));
    return fields.map(field => {
      if (!contactIds.includes(field.id)) return field.node;
      if (field.id !== contactFields[0]?.id) return null;
      return <div key={`${locale}-owner-contact`} className="space-y-3 rounded-md border border-line p-3">
        <p className="text-xs text-ink-soft">{t("admin.contextual.guestOwnerContactNote")}</p>
        <AdminButton aria-pressed={contactPreviewOpen} onClick={() => setContactPreviewOpen(open => !open)}>
          {t(contactPreviewOpen ? "admin.contextual.hideContactForm" : "admin.contextual.showContactForm")}
        </AdminButton>
        {contactFields.flatMap(contact => [contact.node, ...(contact.id === "dual_cta.owner.contact.intro" ? [<AboutContactSelector key="guest-contact-form" placement="guest" value={guestContactFormId(states.en.model.working.content)} readOnly={locale !== "en"} disabled={busy} error={states.en.errors["dual_cta.owner.contact.form_id"]} onEnglish={() => selectLocale("en")} onChange={value => change(["dual_cta", "owner", "contact", "form_id"], value)} />] : [])])}
      </div>;
    });
  }
  const inspector = <MediaAltProvider locale={locale} value={state.model.working.mediaAlts} disabled={busy} onChange={mediaAlts => {
    setStates(previous => {
      const own = previous[locale];
      return { ...previous, [locale]: { ...own, notice: "", model: { ...own.model, working: { ...own.model.working, mediaAlts } } } };
    });
  }}><fieldset disabled={busy} className="min-w-0 space-y-5">
    <h2 className="font-serif text-xl text-ink">{section.label}</h2>
    {view === "blog_article" ? <p className="text-sm leading-relaxed text-ink-soft">{t("admin.blogEditors.context")}</p> : null}
    {["portfolio", "services_carousel", "faq"].includes(section.id) ? <p className="text-xs text-ink-soft">
      {t(`admin.contextual.${section.id === "portfolio" ? "portfolioNote" : section.id === "faq" ? "faqNote" : "servicesNote"}`)}{" "}
      <a className="underline underline-offset-2" href={section.id === "portfolio" ? "/admin/buildings" : section.id === "faq" ? "/admin/faq" : "/admin/services"}>
        {tb(`nav.${section.id === "portfolio" ? "buildings" : section.id === "faq" ? "faq" : "services"}`)}
      </a>
    </p> : null}
    {referencePaths.includes("faq_group_key") ? <p className="text-xs text-ink-soft">{t("admin.contextual.faqLocaleNote")}</p> : null}
    {section.external ? <p className="text-sm text-ink-soft">{t(descriptor.key === "home" ? "admin.contextual.external" : "admin.contextual.externalPage")}</p> : null}
    {state.notice ? <p role={state.conflict || Object.keys(state.errors).length ? "alert" : "status"} className="text-sm text-ink">{state.notice}</p> : null}
    {state.errors._source ? <p role="alert" className="text-sm text-ink">{state.errors._source}</p> : null}
    {model.sourceInvalid ? <p role="alert">{t("admin.contextual.sourceInvalid")}</p> : null}
    {locale === "en" || descriptor.localeIndependentContent ? groupContactFields(visible.map(binding => ({ id: binding.id, node: binding.id === "og_image_media_id"
      ? <Field key={binding.id} errorPath="og_image_media_id" label={t("admin.fields.ogImage")} hint={locale !== "en" ? "Managed in English" : undefined} error={state.errors.og_image_media_id}>
          <MediaField value={og} preview={og ? previews[og] ?? null : null} mediaDisabled={locale !== "en"} onChange={(id, preview) => { if (locale !== "en") return; rememberPreview(preview); setStates(previous => {
            const own = previous[locale];
            return { ...previous, [locale]: { ...own, notice: "", model: { ...own.model, working: { ...own.model.working, ogImageMediaId: id } } } };
          }); }} />
        </Field>
      : descriptor.localeIndependentContent && binding.id === "body"
      ? <div key={`${locale}-body`} className="min-w-0" data-page-body-inspector>
          <p className="mb-2 text-sm font-medium">Body <span className="text-accent-deep">*</span></p>
          <RichTextEditor value={editorialAt(content, "body") as PostBody} onChange={body => change(["body"], body)}
            previews={{}} onPreview={() => {}} errors={state.errors} disabled={busy || Boolean(model.sourceInvalid)}
            localeKey={`${descriptor.key}-${locale}`} textOnly />
        </div>
      : <NodeField key={`${locale}-${binding.id}`} pageKey={descriptor.key} inlineAltMediaPaths={inlineAltMediaPaths} node={homeNode(descriptor.rootNode, binding.id)!}
          value={editorialAt(content, binding.id)} path={binding.id.split(".")} label={binding.label} depth={0}
          onChange={change} onListChange={listChange} listIds={editorialAt(content, "_list_ids") as Record<string, string[]> | undefined} listPolicy={{ paths: descriptor.listPaths, scope: path => editorialListScope(content, path, descriptor) }} errors={state.errors} previews={previews} options={model.options} />})))
      : <>
        <p className="text-xs text-ink-soft">{t("admin.contextual.sourceOnly")}</p>
        {visible.some(binding => binding.id === "og_image_media_id") ? <Field label={t("admin.fields.ogImage")}>
          <MediaField value={og} preview={og ? previews[og] ?? null : null} mediaDisabled onChange={() => {}} />
        </Field> : null}
        {visibleImagePreviews.map(field => <div key={field.path.join(".")} className="space-y-2">
          <Field label={pageFieldLabel(field.path.join("."), labels.field)}>
            <MediaField value={field.id} preview={field.id ? previews[field.id] ?? null : null} accept={field.accept} mediaDisabled editAlt={!field.inlineAltPath} onChange={() => {}} />
          </Field>
          {field.inlineAltPath ? <NodeField pageKey={descriptor.key} node={homeNode(descriptor.rootNode, field.inlineAltPath.join("."))!}
            value={editorialAt(content, field.inlineAltPath.join("."))} path={field.inlineAltPath} label={pageFieldLabel(field.inlineAltPath.join("."), labels.field)} depth={0}
            onChange={change} errors={state.errors} previews={previews} options={model.options} /> : null}
        </div>)}
        {referencePaths.map(path => <NodeField key={`${locale}-${path}`} pageKey={descriptor.key} inlineAltMediaPaths={inlineAltMediaPaths} node={homeNode(descriptor.rootNode, path)!}
          value={editorialAt(content, path)} path={path.split(".")} label={visible.find(binding => binding.id === path)?.label ?? pageFieldLabel(path, labels.field)} depth={0}
          onChange={change} errors={state.errors} previews={previews} options={model.options} />)}
        {groupContactFields(targetPaths.filter(path => !pairedAltPaths.has(path)).map(path => {
          const field = editorialTranslationField(content, path, descriptor);
          const source = String(englishText[field] ?? "");
          return { id: path, node: <Field key={`${locale}-${field}`} errorPath={path} required={Boolean(homeNode(descriptor.rootNode, path)?.publishRequired)} label={pageFieldLabel(path, labels.field)} error={state.errors[path]}>
            <p className="mb-2 text-xs text-ink-soft">EN: {source}</p>
            {((descriptor.key === "home" && (path.endsWith(".url") || path.endsWith(".cta_url"))) || (["guest", "services"].includes(descriptor.key) && path === "hero.cta_url"))
              ? <TextInput type="url" value={String(editorialAt(content, path) ?? "")} onChange={event => change(path.split("."), event.target.value)} />
              : <TextArea value={String(editorialAt(content, path) ?? "")} onChange={event => change(path.split("."), event.target.value)} />}
          </Field> };
        }))}
      </>}
  </fieldset></MediaAltProvider>;
  return <FeedbackScope locale={locale} entity={entity} errors={state.errors}><div ref={editorRoot}><PageEditorShell adapter={{
    pageNavigation: <PageNavigation currentKey={descriptor.key} view={view} hasUnsavedChanges={unsavedPage} busy={busy} onLeave={() => {
      // These previews/queued files belong to this page, never to the destination.
      // Discard only local bytes; saved media and drafts are untouched.
      for (const preview of Object.values(localPreviews)) {
        if (preview.url.startsWith("blob:")) {
          queue.dequeue(preview.id);
          URL.revokeObjectURL(preview.url);
        }
      }
    }} />,
    title: view === "blog_article" ? t("admin.blogEditors.articleTitle") : descriptor.title, sections, seoSectionId: view === "blog_article" ? undefined : "seo", selectedId: section.selectAsGroup ? section.id : selected, onSelect: setSelected,
    locale, feedbackGroups, feedbackId, feedback: <EditorFeedbackSummary id={feedbackId} groups={feedbackGroups} onNavigate={navigateError} />, onLocaleChange: selectLocale, previewUrl: `/admin/preview/${descriptor.key}?locale=${locale}&surface=${surface}`,
    previewVersion: state.previewVersion * 2 + (surface === "shared_aside" ? 1 : 0), previewPayload, dirty, busy,
    previewDialog: descriptor.key === "guest" ? {
      bindingId: "dual_cta.owner.contact.title", open: contactPreviewOpen && section.id === "dual_cta", onOpenChange: setContactPreviewOpen,
    } : undefined,
    editorialState: `${locale.toUpperCase()} · ${t(dirty ? "admin.editorial.unsaved" : state.model.draft ? "admin.editorial.draft" : "admin.editorial.published")}`,
    status: <span>{t("admin.editorial.livePreview")}</span>, inspector,
    actions: <div className="space-y-2"><div className="flex flex-wrap gap-2">
      <AdminButton disabled={busy || state.conflict || state.uncertain || model.sourceInvalid} onClick={() => void mutate("save")}>
        {operation === "save" ? "Saving…" : `Save draft (${locale.toUpperCase()})`}
      </AdminButton>
      <AdminButton disabled={busy || state.conflict || state.uncertain || model.sourceInvalid || !state.model.draft || dirty} onClick={() => void mutate("publish")}>
        {operation === "publish" ? "Publishing…" : `Publish (${locale.toUpperCase()})`}
      </AdminButton>
    </div><p className="text-xs text-ink-soft">Only the selected language is published.</p>
      {dirty || !state.model.draft ? <p className="text-xs text-ink-soft">Save your changes before publishing.</p> : null}
      <p className="text-xs text-ink-soft">* Required to publish. You can save an incomplete draft.</p>
      {state.conflict || state.uncertain ? <AdminButton onClick={() => { if (window.confirm("Reload the latest version? Your unsaved edits will be lost.")) window.location.reload(); }}>Reload the latest version</AdminButton> : null}
    </div>,
  }} /></div></FeedbackScope>;
}
