"use client";

import { useEffect } from "react";
import { PAGE_EDITOR_CHANNEL, readPageEditorMessage } from "./page-editor-bridge";

/** Imported only by the authenticated preview route; public pages never mount this bridge. */
export function PageEditorPreviewBridge({ instance, bindingIds }: { instance: string; bindingIds: string[] }) {
  useEffect(() => {
    if (!instance) return;
    const embedded = window.parent !== window;
    const allowed = new Set(bindingIds);
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-editor-binding]"))
      .filter((element) => allowed.has(element.dataset.editorBinding ?? ""));
    const previous = elements.map((element) => ({ element, tabIndex: element.getAttribute("tabindex") }));
    for (const element of elements) element.tabIndex = 0;
    const frames = Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe"));
    const previousFrames = frames.map((element) => ({ element, pointerEvents: element.style.pointerEvents, tabIndex: element.getAttribute("tabindex") }));
    for (const frame of frames) { frame.style.pointerEvents = "none"; frame.tabIndex = -1; }
    const style = document.createElement("style");
    style.textContent = `[data-editor-binding]{cursor:pointer!important}[data-editor-selected="true"],[data-editor-binding]:focus-visible{outline:3px solid var(--color-accent);outline-offset:4px}html{scroll-behavior:auto}input,textarea,select,button,a{cursor:pointer!important}`;
    document.head.append(style);
    let selected: HTMLElement | undefined;
    const highlight = (id: string, focus: boolean) => {
      const element = elements.find((candidate) => candidate.dataset.editorBinding === id);
      selected?.removeAttribute("data-editor-selected");
      selected = element;
      if (!element) return; // Empty and hidden sections remain editable through the outline.
      element.dataset.editorSelected = "true";
      if (focus) {
        element.scrollIntoView({ block: "center", behavior: "instant" });
        element.focus({ preventScroll: true });
      }
    };
    const sendSelection = (target: EventTarget | null) => {
      const element = target instanceof Element ? target.closest<HTMLElement>("[data-editor-binding]") : null;
      const bindingId = element?.dataset.editorBinding;
      if (!bindingId || !allowed.has(bindingId)) return;
      highlight(bindingId, false);
      if (embedded) window.parent.postMessage({ channel: PAGE_EDITOR_CHANNEL, instance, type: "select", bindingId }, window.location.origin);
    };
    const block = (event: Event) => { event.preventDefault(); event.stopImmediatePropagation(); };
    const click = (event: MouseEvent) => { block(event); sendSelection(event.target); };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") { block(event); sendSelection(event.target); return; }
      if (event.target instanceof Element && event.target.closest("input,textarea,select,[contenteditable]")) {
        if (event.key !== "Tab") block(event);
      }
    };
    const message = (event: MessageEvent) => {
      const data = readPageEditorMessage(event, { origin: window.location.origin, source: window.parent, instance, bindingIds });
      if (data?.type === "select" && data.bindingId) highlight(data.bindingId, true);
    };
    if (embedded) window.addEventListener("message", message);
    document.addEventListener("click", click, true);
    document.addEventListener("auxclick", block, true);
    document.addEventListener("submit", block, true);
    document.addEventListener("keydown", keyboard, true);
    document.addEventListener("dragstart", block, true);
    if (embedded) window.parent.postMessage({ channel: PAGE_EDITOR_CHANNEL, instance, type: "ready" }, window.location.origin);
    return () => {
      if (embedded) window.removeEventListener("message", message);
      document.removeEventListener("click", click, true);
      document.removeEventListener("auxclick", block, true);
      document.removeEventListener("submit", block, true);
      document.removeEventListener("keydown", keyboard, true);
      document.removeEventListener("dragstart", block, true);
      selected?.removeAttribute("data-editor-selected");
      style.remove();
      for (const { element, tabIndex } of previous) { if (tabIndex === null) element.removeAttribute("tabindex"); else element.setAttribute("tabindex", tabIndex); }
      for (const { element, pointerEvents, tabIndex } of previousFrames) {
        element.style.pointerEvents = pointerEvents;
        if (tabIndex === null) element.removeAttribute("tabindex"); else element.setAttribute("tabindex", tabIndex);
      }
    };
  }, [instance, bindingIds]);
  return null;
}
