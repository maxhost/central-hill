"use client";

import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { PageLivePreviewRenderer } from "../page-editor-types";
import { readPageEditorMessage } from "./page-editor-bridge";
import { PageEditorPreviewBridge } from "./page-editor-preview-bridge";

type PreviewState = "idle" | "updating" | "validation" | "server";

/** Read-only rendering surface, mounted only by an authenticated preview route. */
export function PageEditorLivePreview({ children, renderPreviewAction, instance, bindingIds }: {
  children: ReactNode;
  renderPreviewAction: PageLivePreviewRenderer;
  instance: string;
  bindingIds: string[];
}) {
  const t = useTranslations("backoffice.pageEditor");
  const [rendered, setRendered] = useState({ content: children, revision: -1, scrollX: 0, scrollY: 0 });
  const [state, setState] = useState<PreviewState>("idle");
  const bindingsJson = JSON.stringify(bindingIds);

  useEffect(() => {
    if (!instance || window.parent === window) return;
    let active = true;
    let inFlight = false;
    let latestRevision = -1;
    let pending: { revision: number; payload: unknown } | null = null;
    const allowedBindings: string[] = JSON.parse(bindingsJson);
    async function drain() {
      if (inFlight) return;
      inFlight = true;
      while (active && pending) {
        const request = pending;
        pending = null;
        try {
          const result = await renderPreviewAction(request.payload);
          // A newer message owns the display, even while its request is queued.
          if (!active || request.revision !== latestRevision) continue;
          if (result.ok) {
            setRendered({ content: result.content, revision: request.revision, scrollX: window.scrollX, scrollY: window.scrollY });
            setState("idle");
          } else setState(result.error);
        } catch {
          if (active && request.revision === latestRevision) setState("server");
        }
      }
      inFlight = false;
    }
    function message(event: MessageEvent) {
      const value = readPageEditorMessage(event, {
        origin: window.location.origin, source: window.parent, instance, bindingIds: allowedBindings,
      });
      if (value?.type !== "preview" || value.revision <= latestRevision) return;
      latestRevision = value.revision;
      pending = { revision: value.revision, payload: value.payload };
      setState("updating");
      void drain();
    }
    window.addEventListener("message", message);
    return () => {
      active = false;
      pending = null;
      window.removeEventListener("message", message);
    };
  }, [instance, bindingsJson, renderPreviewAction]);

  useLayoutEffect(() => {
    if (rendered.revision >= 0) window.scrollTo(rendered.scrollX, rendered.scrollY);
  }, [rendered]);

  return <div data-live-preview="" data-live-preview-revision={rendered.revision} data-live-preview-state={state} aria-busy={state === "updating"}>
    {/* Editor updates must remain visible while existing public reveal clients reconcile. */}
    <style>{`[data-live-preview] [data-reveal]{opacity:1!important;transform:none!important;transition:none!important}`}</style>
    {rendered.content}
    <PageEditorPreviewBridge instance={instance} bindingIds={bindingIds} />
    {state !== "idle" ? <p role="status" className="pointer-events-none fixed right-3 bottom-3 z-50 max-w-xs rounded border border-line bg-surface px-3 py-2 text-xs text-ink shadow-sm">
      {t(state === "updating" ? "updatingPreview" : state === "validation" ? "invalidPreview" : "previewError")}
    </p> : null}
  </div>;
}
