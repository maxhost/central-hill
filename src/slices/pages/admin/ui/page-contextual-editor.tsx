"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AdminButton, Field, MediaField, PageEditorShell, TextArea, useMediaQueue, type EditorLocale, type AdminMediaPreview } from "@slices/backoffice/contract";
import type { EditorialPageKey, PageContentMap, PageEditorialModel, PageLocaleEditorialModel } from "../../editorial-types";
import { prepareTargetEnvelope, sameEditorialSnapshot } from "../../editorial-content";
import { homeNode, pageSections, descriptorMediaIds, isEditableFieldPath } from "../home-contextual";
import { editorialAt, editorialListScope, editorialListIds, editorialTextPaths, editorialTranslationField, normalizeEditorial } from "../../editorial-identities";
import { publishPageDraft, savePageDraft } from "../editorial-actions";
import { NodeField, useFieldLabels } from "./schema-fields";
import type { AboutListOperation } from "../form-model";
import { PageNavigation } from "./page-navigation";

type LocaleState<K extends EditorialPageKey> = {
  model: PageLocaleEditorialModel<K>;
  errors: Record<string, string>;
  notice: string;
  conflict: boolean;
  previewVersion: number;
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

export function PageContextualEditor<K extends EditorialPageKey = "home">({ model }: { model: PageEditorialModel<K> }) {
  const descriptor = model.descriptor;
  const t = useTranslations("pages");
  const tb = useTranslations("backoffice");
  const labels = useFieldLabels();
  // Each tab owns its snapshot and revision. A mutation never reinitializes other tabs.
  const [states, setStates] = useState(() => Object.fromEntries(
    Object.entries(model.locales).map(([key, value]) => [key, {
      model: value, errors: {}, notice: "", conflict: false, previewVersion: 0,
    }]),
  ) as Record<EditorLocale, LocaleState<K>>);
  const [localPreviews, setLocalPreviews] = useState<Record<string, AdminMediaPreview>>({});
  const previews = useMemo(() => ({ ...model.previews, ...localPreviews }), [model.previews, localPreviews]);
  const [locale, setLocale] = useState<EditorLocale>("en");
  const [selected, setSelected] = useState("hero");
  const [operation, setOperation] = useState<"save" | "publish" | null>(null);
  const queue = useMediaQueue();
  const lock = useRef(false);
  const [startedLocales, setStartedLocales] = useState(() => new Set<EditorLocale>(["en"]));
  const state = states[locale];
  const content = state.model.working.content;
  const og = state.model.working.ogImageMediaId;
  const previewPayload = useMemo(() => ({
    envelope: state.model.working,
    localMedia: Object.fromEntries(descriptorMediaIds(state.model.working.content, state.model.working.ogImageMediaId, descriptor)
      .flatMap(id => localPreviews[id]?.url.startsWith("blob:") ? [[id, localPreviews[id]!]] : [])),
  }), [state.model.working, localPreviews, descriptor]);
  const dirty = isDirty(state.model);
  const busy = operation !== null || queue.isPreparing;
  const unsavedPage = Object.entries(states).some(([key, value]) =>
    startedLocales.has(key as EditorLocale) && isDirty(value.model),
  ) || Object.keys(localPreviews).some(queue.isQueued);
  const sections = pageSections(descriptor, labels.field, content);
  const section = sections.find(s => s.id === selected || s.bindings.some(b => b.id === selected)) ?? sections[0]!;

  const surface = descriptor.sectionPreviews?.[section.id] ?? "page";

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
      return { ...previous, [locale]: { ...own, notice: "", model: { ...own.model, working: {
        ...own.model.working, content: setValue(own.model.working.content, path, value) as PageContentMap[K],
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
    if (lock.current || busy || model.sourceInvalid || state.conflict) return;
    if (action === "publish" && (!state.model.draft || dirty)) return;
    lock.current = true;
    setOperation(action);
    patchState(locale, { notice: "", errors: {} });
    try {
      if (action === "save" && locale === "en" && !await queue.flush()) return;
      const input = { key: descriptor.key as K, locale, expectedRevision: state.model.revision };
      const result = action === "save"
        ? await savePageDraft({ ...input, templateRevision: state.model.templateRevision, payload: state.model.working })
        : await publishPageDraft(input);
      if (result.ok) {
        if (action === "publish" && locale !== "en") setStartedLocales(previous => {
          const next = new Set(previous);
          next.delete(locale);
          return next;
        });
        patchState(locale, {
          model: result.model, errors: {}, conflict: false,
          previewVersion: state.previewVersion + 1,
          notice: result.refreshWarning ? t("admin.editorial.refreshWarning") : t(action === "save" ? "admin.editorial.draft" : "admin.editorial.published"),
        });
      } else if (result.error === "validation") {
        patchState(locale, { errors: result.fieldErrors, notice: t("admin.validationError") });
      } else if (result.error === "conflict") {
        patchState(locale, { conflict: true, notice: t("admin.editorial.conflict") });
      } else {
        patchState(locale, { notice: result.error === "no_draft" ? t("admin.editorial.noDraft") : tb("actions.saveError") });
      }
    } catch {
      patchState(locale, { notice: tb("actions.saveError") });
    } finally {
      setOperation(null);
      lock.current = false;
    }
  }

  const visible = selected === section.id ? section.bindings : section.bindings.filter(b => b.id === selected);
  // Include blank and absent optional copy, especially SEO, in every target locale.
  const targetPaths = editorialTextPaths(content, descriptor).filter(path => isEditableFieldPath(descriptor.rootNode, path) && visible.some(b => path === b.id || path.startsWith(`${b.id}.`)));
  const english = (states.en.model.draft ?? states.en.model.published ?? states.en.model.working).content;
  const englishText = Object.fromEntries(editorialTextPaths(english, descriptor).map(path => [editorialTranslationField(english, path, descriptor), editorialAt(english, path)]));
  const inspector = <fieldset disabled={busy} className="min-w-0 space-y-5">
    <h2 className="font-serif text-xl text-ink">{section.label}</h2>
    {["portfolio", "services_carousel", "faq"].includes(section.id) ? <p className="text-xs text-ink-soft">
      {t(`admin.contextual.${section.id === "portfolio" ? "portfolioNote" : section.id === "faq" ? "faqNote" : "servicesNote"}`)}{" "}
      <a className="underline underline-offset-2" href={section.id === "portfolio" ? "/admin/buildings" : section.id === "faq" ? "/admin/faq" : "/admin/services"}>
        {tb(`nav.${section.id === "portfolio" ? "buildings" : section.id === "faq" ? "faq" : "services"}`)}
      </a>
    </p> : null}
    {section.external ? <p className="text-sm text-ink-soft">{t(descriptor.key === "home" ? "admin.contextual.external" : "admin.contextual.externalPage")}</p> : null}
    {state.notice ? <p role={state.conflict || Object.keys(state.errors).length ? "alert" : "status"} className="text-sm text-ink">{state.notice}</p> : null}
    {state.errors._source ? <p role="alert" className="text-sm text-ink">{state.errors._source}</p> : null}
    {model.sourceInvalid ? <p role="alert">{t("admin.contextual.sourceInvalid")}</p> : null}
    {locale === "en" ? visible.map(binding => binding.id === "og_image_media_id"
      ? <Field key={binding.id} label={t("admin.fields.ogImage")} error={state.errors.og_image_media_id}>
          <MediaField value={og} preview={og ? previews[og] ?? null : null} onChange={(id, preview) => { rememberPreview(preview); setStates(previous => {
            const own = previous.en;
            return { ...previous, en: { ...own, notice: "", model: { ...own.model, working: { ...own.model.working, ogImageMediaId: id } } } };
          }); }} />
        </Field>
      : <NodeField key={`${locale}-${binding.id}`} pageKey={descriptor.key} node={homeNode(descriptor.rootNode, binding.id)!}
          value={editorialAt(content, binding.id)} path={binding.id.split(".")} label={binding.label} depth={0}
          onChange={change} onListChange={listChange} listIds={editorialAt(content, "_list_ids") as Record<string, string[]> | undefined} listPolicy={{ paths: descriptor.listPaths, scope: path => editorialListScope(content, path, descriptor) }} errors={state.errors} previews={previews} options={model.options} />)
      : <>
        <p className="text-xs text-ink-soft">{t("admin.contextual.sourceOnly")}</p>
        {targetPaths.map(path => {
          const field = editorialTranslationField(content, path, descriptor);
          const source = String(englishText[field] ?? "");
          return <Field key={`${locale}-${field}`} label={labels.field(path.split(".").at(-1)!)} error={state.errors[path]}>
            <p className="mb-2 text-xs text-ink-soft">EN: {source}</p>
            <TextArea value={String(editorialAt(content, path) ?? "")} onChange={event => change(path.split("."), event.target.value)} />
          </Field>;
        })}
      </>}
  </fieldset>;
  return <PageEditorShell adapter={{
    pageNavigation: <PageNavigation currentKey={descriptor.key} hasUnsavedChanges={unsavedPage} busy={busy} onLeave={() => {
      // These previews/queued files belong to this page, never to the destination.
      // Discard only local bytes; saved media and drafts are untouched.
      for (const preview of Object.values(localPreviews)) {
        if (preview.url.startsWith("blob:")) {
          queue.dequeue(preview.id);
          URL.revokeObjectURL(preview.url);
        }
      }
    }} />,
    title: descriptor.title, sections, seoSectionId: "seo", selectedId: selected, onSelect: setSelected,
    locale, onLocaleChange: selectLocale, previewUrl: `/admin/preview/${descriptor.key}?locale=${locale}&surface=${surface}`,
    previewVersion: state.previewVersion * 2 + (surface === "shared_aside" ? 1 : 0), previewPayload, dirty, busy,
    editorialState: `${locale.toUpperCase()} · ${t(dirty ? "admin.editorial.unsaved" : state.model.draft ? "admin.editorial.draft" : "admin.editorial.published")}`,
    status: <span>{t("admin.editorial.livePreview")}</span>, inspector,
    actions: <div className="flex flex-wrap gap-2">
      <AdminButton disabled={busy || state.conflict || model.sourceInvalid} onClick={() => void mutate("save")}>
        {t(operation === "save" ? "admin.editorial.savingDraft" : "admin.editorial.saveDraft")}
      </AdminButton>
      <AdminButton disabled={busy || state.conflict || model.sourceInvalid || !state.model.draft || dirty} onClick={() => void mutate("publish")}>
        {t(operation === "publish" ? "admin.editorial.publishing" : "admin.editorial.publish")}
      </AdminButton>
    </div>,
  }} />;
}
