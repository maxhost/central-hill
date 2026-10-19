"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AdminButton, Field, MediaField, PageEditorShell, TextArea, useMediaQueue, type EditorLocale } from "@slices/backoffice/contract";
import type { HomeEditorialModel, PageLocaleEditorialModel } from "../../editorial-types";
import { homeNode, homeSections } from "../home-contextual";
import { HOME_LIST_PATHS, homeAt, homeTextPaths, homeTranslationField } from "../../home-content";
import type { HomeContent } from "../../schemas/home";
import { publishPageDraft, savePageDraft } from "../editorial-actions";
import { NodeField, useFieldLabels } from "./schema-fields";
import type { AboutListOperation } from "../form-model";

type LocaleState = {
  model: PageLocaleEditorialModel;
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

function isDirty(model: PageLocaleEditorialModel): boolean {
  return JSON.stringify(model.working) !== JSON.stringify(model.draft ?? model.published);
}

export function HomeContextualEditor({ model }: { model: HomeEditorialModel }) {
  const t = useTranslations("pages");
  const tb = useTranslations("backoffice");
  const labels = useFieldLabels();
  // Each tab owns its snapshot and revision. A mutation never reinitializes other tabs.
  const [states, setStates] = useState(() => Object.fromEntries(
    Object.entries(model.locales).map(([key, value]) => [key, {
      model: value, errors: {}, notice: "", conflict: false, previewVersion: 0,
    }]),
  ) as Record<EditorLocale, LocaleState>);
  const [locale, setLocale] = useState<EditorLocale>("en");
  const [selected, setSelected] = useState("hero");
  const [operation, setOperation] = useState<"save" | "publish" | null>(null);
  const queue = useMediaQueue();
  const lock = useRef(false);
  const state = states[locale];
  const content = state.model.working.content;
  const og = state.model.working.ogImageMediaId;
  const dirty = isDirty(state.model);
  const busy = operation !== null || queue.isPreparing;
  const sections = homeSections(model.rootNode, labels.field);
  const section = sections.find(s => s.id === selected || s.bindings.some(b => b.id === selected)) ?? sections[0]!;

  function patchState(selectedLocale: EditorLocale, patch: Partial<LocaleState>) {
    setStates(previous => ({ ...previous, [selectedLocale]: { ...previous[selectedLocale], ...patch } }));
  }
  function change(path: (string | number)[], value: unknown) {
    setStates(previous => {
      const own = previous[locale];
      return { ...previous, [locale]: { ...own, notice: "", model: { ...own.model, working: {
        ...own.model.working, content: setValue(own.model.working.content, path, value) as HomeContent,
      } } } };
    });
  }
  function listChange(path: string, operation: AboutListOperation) {
    if (locale !== "en" || !(HOME_LIST_PATHS as readonly string[]).includes(path)) return;
    setStates(previous => {
      const own = previous.en;
      const c = own.model.working.content;
      const items = [...(homeAt(c, path) as unknown[] ?? [])];
      const ids = [...(c._list_ids?.[path] ?? [])];
      if (operation.action === "add") { items.push(operation.value); ids.push(operation.id); }
      else if (operation.action === "remove") { items.splice(operation.index, 1); ids.splice(operation.index, 1); }
      else {
        [items[operation.index], items[operation.to]] = [items[operation.to], items[operation.index]];
        [ids[operation.index], ids[operation.to]] = [ids[operation.to]!, ids[operation.index]!];
      }
      const content = { ...(setValue(c, path.split("."), items) as HomeContent), _list_ids: { ...c._list_ids, [path]: ids } };
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
      const input = { key: "home" as const, locale, expectedRevision: state.model.revision };
      const result = action === "save"
        ? await savePageDraft({ ...input, templateRevision: state.model.templateRevision, payload: state.model.working })
        : await publishPageDraft(input);
      if (result.ok) {
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
  const targetPaths = homeTextPaths(content).filter(path => visible.some(b => path === b.id || path.startsWith(`${b.id}.`)));
  const english = (states.en.model.draft ?? states.en.model.published ?? states.en.model.working).content;
  const englishText = Object.fromEntries(homeTextPaths(english).map(path => [homeTranslationField(english, path), homeAt(english, path)]));
  const inspector = <fieldset disabled={busy} className="min-w-0 space-y-5">
    <h2 className="font-serif text-xl text-ink">{section.label}</h2>
    {["portfolio", "services_carousel", "faq"].includes(section.id) ? <p className="text-xs text-ink-soft">
      {t(`admin.contextual.${section.id === "portfolio" ? "portfolioNote" : section.id === "faq" ? "faqNote" : "servicesNote"}`)}{" "}
      <a className="underline underline-offset-2" href={section.id === "portfolio" ? "/admin/buildings" : section.id === "faq" ? "/admin/faq" : "/admin/services"}>
        {tb(`nav.${section.id === "portfolio" ? "buildings" : section.id === "faq" ? "faq" : "services"}`)}
      </a>
    </p> : null}
    {section.external ? <p className="text-sm text-ink-soft">{t("admin.contextual.external")}</p> : null}
    {state.notice ? <p role={state.conflict || Object.keys(state.errors).length ? "alert" : "status"} className="text-sm text-ink">{state.notice}</p> : null}
    {state.errors._source ? <p role="alert" className="text-sm text-ink">{state.errors._source}</p> : null}
    {model.sourceInvalid ? <p role="alert">{t("admin.contextual.sourceInvalid")}</p> : null}
    {locale === "en" ? visible.map(binding => binding.id === "og_image_media_id"
      ? <Field key={binding.id} label={t("admin.fields.ogImage")} error={state.errors.og_image_media_id}>
          <MediaField value={og} preview={og ? model.previews[og] ?? null : null} onChange={id => setStates(previous => {
            const own = previous.en;
            return { ...previous, en: { ...own, notice: "", model: { ...own.model, working: { ...own.model.working, ogImageMediaId: id } } } };
          })} />
        </Field>
      : <NodeField key={`${locale}-${binding.id}`} pageKey="home" node={homeNode(model.rootNode, binding.id)!}
          value={homeAt(content, binding.id)} path={binding.id.split(".")} label={binding.label} depth={0}
          onChange={change} onListChange={listChange} listIds={content._list_ids} errors={state.errors} previews={model.previews} options={model.options} />)
      : <>
        <p className="text-xs text-ink-soft">{t("admin.contextual.sourceOnly")}</p>
        {targetPaths.map(path => {
          const field = homeTranslationField(content, path);
          const source = String(englishText[field] ?? "");
          return <Field key={`${locale}-${field}`} label={labels.field(path.split(".").at(-1)!)} error={state.errors[path]}>
            <p className="mb-2 text-xs text-ink-soft">EN: {source}</p>
            <TextArea value={String(homeAt(content, path) ?? "")} onChange={event => change(path.split("."), event.target.value)} />
          </Field>;
        })}
      </>}
  </fieldset>;
  return <PageEditorShell adapter={{
    title: "Home", sections, seoSectionId: "seo", selectedId: selected, onSelect: setSelected,
    locale, onLocaleChange: setLocale, previewUrl: `/admin/preview/home?locale=${locale}`,
    previewVersion: state.previewVersion, dirty, busy,
    editorialState: `${locale.toUpperCase()} · ${t(dirty ? "admin.editorial.unsaved" : state.model.draft ? "admin.editorial.draft" : "admin.editorial.published")}`,
    status: <span>{t("admin.editorial.savedPreview")}</span>, inspector,
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
