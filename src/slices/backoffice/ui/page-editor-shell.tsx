"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { EditorLocale, PageEditorShellProps } from "../page-editor-types";
import { AdminButton, Select } from "./form";
import { PAGE_EDITOR_CHANNEL, pageEditorPreviewUrl, readPageEditorMessage } from "./page-editor-bridge";

const LOCALES: EditorLocale[] = ["en", "es", "pt", "fr"];
const VIEWPORTS = [{ width: 1440, label: "desktop" }, { width: 768, label: "tablet" }, { width: 390, label: "mobile" }] as const;
const buttonClass = "min-h-9 rounded px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60";

/** Page-independent workspace. The adapter owns fields, translation states and persistence. */
export function PageEditorShell({ adapter }: PageEditorShellProps) {
  const t = useTranslations("backoffice.pageEditor");
  const { onSelect, selectedId } = adapter;
  const editorId = useId();
  const [viewport, setViewport] = useState(1440);
  const [refresh, setRefresh] = useState(0);
  const [liveRefresh, setLiveRefresh] = useState(0);
  const previewRevision = useRef(0);
  const [loadedInstance, setLoadedInstance] = useState("");
  const [failedInstance, setFailedInstance] = useState("");
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 640, height: 660 });
  const canvas = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const inspectorTitle = useRef<HTMLHeadingElement>(null);
  const instance = `${editorId}-${adapter.locale}-${adapter.previewVersion}-${refresh}`;
  // Adapters may recreate sections on each keystroke. Keep an unchanged allowlist
  // stable so the selection effect cannot resend a focus command into the iframe.
  const bindingIdsJson = JSON.stringify(adapter.sections.flatMap((section) => [section.id, ...section.bindings.map((binding) => binding.id)]));
  const bindingIds = useMemo<string[]>(() => JSON.parse(bindingIdsJson), [bindingIdsJson]);
  const url = pageEditorPreviewUrl(adapter.previewUrl, instance, adapter.previewVersion);
  const hasLivePreview = adapter.previewPayload !== undefined;
  // Stable serialized data prevents adapter rerenders from restarting the debounce.
  const payloadJson = hasLivePreview ? JSON.stringify(adapter.previewPayload) : undefined;
  const ready = loadedInstance === instance;
  const failed = failedInstance === instance;
  const selectedSection = adapter.sections.find((section) => section.id === adapter.selectedId || section.bindings.some((binding) => binding.id === adapter.selectedId));
  const selectedBinding = selectedSection?.bindings.find((binding) => binding.id === adapter.selectedId);
  const seoSection = adapter.sections.find((section) => section.id === adapter.seoSectionId);
  const contentSections = adapter.sections.filter((section) => section.id !== seoSection?.id);
  const seoSelected = Boolean(seoSection && selectedSection?.id === seoSection.id);
  const scale = Math.min(1, canvasSize.width / viewport);

  const sendSelection = useCallback((id: string) => {
    if (!bindingIds.includes(id)) return;
    frame.current?.contentWindow?.postMessage({ channel: PAGE_EDITOR_CHANNEL, instance, type: "select", bindingId: id }, window.location.origin);
  }, [bindingIds, instance]);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setCanvasSize({ width: Math.max(1, entry.contentRect.width), height: Math.max(1, entry.contentRect.height) });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      const message = readPageEditorMessage(event, { origin: window.location.origin, source: frame.current?.contentWindow ?? null, instance, bindingIds });
      if (message?.type === "ready") {
        setLoadedInstance(instance);
        sendSelection(selectedId);
      } else if (message?.type === "select" && message.bindingId) {
        onSelect(message.bindingId);
        inspectorTitle.current?.focus({ preventScroll: true });
      }
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [onSelect, selectedId, bindingIds, instance, sendSelection]);

  useEffect(() => { if (ready) sendSelection(selectedId); }, [selectedId, ready, sendSelection]);

  useEffect(() => {
    if (!ready || payloadJson === undefined) return;
    const timeout = window.setTimeout(() => {
      frame.current?.contentWindow?.postMessage({
        channel: PAGE_EDITOR_CHANNEL, instance, type: "preview",
        revision: ++previewRevision.current, payload: JSON.parse(payloadJson),
      }, window.location.origin);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [ready, instance, payloadJson, liveRefresh]);

  useEffect(() => {
    if (ready) return;
    const timeout = window.setTimeout(() => setFailedInstance(instance), 20000);
    return () => window.clearTimeout(timeout);
  }, [instance, ready]);

  const select = (id: string) => {
    adapter.onSelect(id);
    sendSelection(id);
    setOutlineOpen(false);
  };

  return (
    <div className="min-w-0 selection:bg-accent/20 selection:text-ink" data-page-editor="">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <h1 className="font-serif text-3xl text-ink">{adapter.title}</h1>
        <div role="group" aria-label={t("contentLanguage")} className="flex gap-1 rounded-md border border-line bg-surface p-1">
          {LOCALES.map((locale) => (
            <button key={locale} type="button" aria-pressed={adapter.locale === locale} onClick={() => adapter.onLocaleChange(locale)} disabled={adapter.busy}
              className={`${buttonClass} ${adapter.locale === locale ? "bg-accent/10 text-accent-deep" : "text-ink-soft"}`}>
              {locale.toUpperCase()}{locale === "en" ? <span className="ml-1 text-[10px] font-normal">{t("source")}</span> : null}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span role="status" className={`text-xs ${adapter.dirty ? "text-accent-deep" : "text-ink-soft"}`}>{adapter.editorialState ?? (adapter.dirty ? t("pending") : t("saved"))}</span>
          {adapter.actions}
        </div>
      </header>

      <div className="mt-5 grid min-w-0 items-start border border-line bg-surface xl:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-label={t("preview")} className="relative min-w-0 bg-bg">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2">
            <button type="button" aria-expanded={outlineOpen} aria-controls={`${editorId}-outline`} onClick={() => setOutlineOpen(!outlineOpen)} className={`${buttonClass} text-ink`}>
              {t("sections")}
            </button>
            <div role="group" aria-label={t("preview")} className="flex flex-wrap items-center gap-1">
              {VIEWPORTS.map(({ width, label }) => (
                <button key={width} type="button" aria-label={`${t(label)}, ${width} px`} aria-pressed={viewport === width} onClick={() => setViewport(width)}
                  className={`${buttonClass} ${viewport === width ? "bg-accent/10 text-accent-deep" : "text-ink-soft"}`}>{t(label)}</button>
              ))}
              {seoSection ? <button type="button" aria-pressed={seoSelected}
                onClick={() => select(seoSection.id)}
                className={`${buttonClass} ${seoSelected ? "bg-accent/10 text-accent-deep" : "text-ink-soft"}`}>
                {seoSection.label} {adapter.locale.toUpperCase()}
              </button> : null}
            </div>
            <button type="button" onClick={() => hasLivePreview && ready ? setLiveRefresh(value => value + 1) : setRefresh(value => value + 1)} className={`${buttonClass} text-ink-soft`}>{t("refresh")}</button>
          </div>
          {outlineOpen ? (
            <nav id={`${editorId}-outline`} aria-label={t("sections")} className="absolute left-3 top-14 z-10 max-h-[60vh] w-64 max-w-[calc(100%-1.5rem)] overflow-y-auto border border-line bg-surface p-2 shadow-lg">
              {contentSections.map((section) => (
                <button key={section.id} type="button" onClick={() => select(section.id)} aria-current={selectedSection?.id === section.id ? "true" : undefined}
                  className={`${buttonClass} flex w-full items-center justify-between gap-2 text-left ${selectedSection?.id === section.id ? "bg-accent/10 text-accent-deep" : "text-ink"}`}>
                  {section.label}{section.external ? <span className="text-[10px] text-ink-soft">{t("external")}</span> : null}
                </button>
              ))}
            </nav>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-[11px] text-ink-soft">
            <span>{hasLivePreview ? t(adapter.dirty ? "localPreview" : "livePreview") : adapter.dirty ? t("pendingPreview") : t("savedPreview")} · {adapter.locale.toUpperCase()}</span>
            <span className="tabular-nums">{viewport} px · {t("fit")} {Math.round(scale * 100)}%</span>
          </div>
          <div className="relative mx-3 h-[460px] min-w-0 overflow-hidden bg-line/40 sm:mx-4 xl:h-[min(70vh,760px)]" ref={canvas} aria-busy={!ready}>
            <div className="mx-auto" style={{ width: viewport * scale, height: canvasSize.height }}>
              <iframe key={url} ref={frame} title={`${adapter.title} — ${t("preview")}`} src={url}
                className="block max-w-none origin-top-left border-0 bg-bg"
                style={{ width: viewport, height: canvasSize.height / scale, transform: `scale(${scale})` }}
                onError={() => setFailedInstance(instance)} />
            </div>
            {!ready ? <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg/95 px-6 text-center text-sm text-ink-soft" role="status">
              <p>{failed ? t("unavailable") : t("loading")}</p>
              {failed ? <AdminButton onClick={() => setRefresh((value) => value + 1)}>{t("retry")}</AdminButton> : null}
            </div> : null}
          </div>
          <footer className="flex flex-wrap justify-between gap-2 px-4 py-3 text-[11px] text-ink-soft"><span>{t("fixedLayout")}</span><span>{t("selectHint")}</span></footer>
        </section>

        <aside aria-label={t("inspector")} className="min-w-0 border-t border-line xl:border-t-0 xl:border-l">
          <div className="border-b border-line px-5 pt-5 pb-4">
            <p className="mb-2 text-xs text-ink-soft">{adapter.title}{selectedSection ? ` / ${selectedSection.label}` : ""}</p>
            <h2 ref={inspectorTitle} tabIndex={-1} className="font-serif text-xl text-ink focus:outline-none">{selectedBinding?.label ?? selectedSection?.label ?? t("element")}</h2>
            {!seoSelected ? <>
            <label htmlFor={`${editorId}-binding`} className="mt-4 mb-1.5 block text-xs text-ink-soft">{t("element")}</label>
            <Select id={`${editorId}-binding`} value={adapter.selectedId} onChange={(event) => select(event.target.value)}>
              {contentSections.map((section) => <optgroup key={section.id} label={section.label}>
                <option value={section.id}>{section.label}</option>
                {section.bindings.filter((binding) => binding.id !== section.id).map((binding) => <option key={binding.id} value={binding.id}>{binding.label}</option>)}
              </optgroup>)}
            </Select>
            </> : null}
          </div>
          <div className="border-b border-line px-5 py-3 text-xs text-ink-soft" role="status">{adapter.status}</div>
          <div className="min-w-0 p-5 xl:max-h-[70vh] xl:overflow-y-auto">{adapter.inspector}</div>
        </aside>
      </div>
    </div>
  );
}
