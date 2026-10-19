"use client";

import { useEffect, useRef } from "react";
import { PAGE_EDITOR_CHANNEL, readPageEditorMessage } from "./page-editor-bridge";

/** Imported only by the authenticated preview route; public pages never mount this bridge. */
export function PageEditorPreviewBridge({ instance, bindingIds }: { instance: string; bindingIds: string[] }) {
  const readyInstance = useRef("");
  const bindingsJson = JSON.stringify(bindingIds);
  useEffect(() => {
    if (!instance) return;
    const embedded = window.parent !== window;
    const currentBindings: string[] = JSON.parse(bindingsJson);
    const allowed = new Set(currentBindings);
    let elements: HTMLElement[] = [];
    const previous = new Map<HTMLElement, string | null>();
    const previousFrames = new Map<HTMLIFrameElement, { pointerEvents: string; tabIndex: string | null }>();
    const style = document.createElement("style");
    style.textContent = `[data-editor-binding]{cursor:pointer!important}[data-editor-selected="true"],[data-editor-binding]:focus-visible{outline:3px solid var(--color-accent);outline-offset:4px}html{scroll-behavior:auto}input,textarea,select,button,a{cursor:pointer!important}`;
    document.head.append(style);
    let selected: HTMLElement | undefined;
    let selectedId = "";
    const highlight = (id: string, focus: boolean) => {
      selectedId = id;
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
    const bindElements = () => {
      // Do not retain detached RSC trees across an editing session.
      for (const element of previous.keys()) if (!element.isConnected) previous.delete(element);
      for (const frame of previousFrames.keys()) if (!frame.isConnected) previousFrames.delete(frame);
      elements = Array.from(document.querySelectorAll<HTMLElement>("[data-editor-binding]"))
        .filter(element => allowed.has(element.dataset.editorBinding ?? ""));
      for (const element of elements) {
        if (!previous.has(element)) previous.set(element, element.getAttribute("tabindex"));
        element.tabIndex = 0;
      }
      for (const frame of document.querySelectorAll<HTMLIFrameElement>("iframe")) {
        if (!previousFrames.has(frame)) previousFrames.set(frame, { pointerEvents: frame.style.pointerEvents, tabIndex: frame.getAttribute("tabindex") });
        frame.style.pointerEvents = "none";
        frame.tabIndex = -1;
      }
      // Replacement RSC content inherits selection without moving focus or scroll.
      if (selectedId) highlight(selectedId, false);
    };
    bindElements();
    const observer = new MutationObserver(bindElements);
    observer.observe(document.body, { childList: true, subtree: true });
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
      const data = readPageEditorMessage(event, { origin: window.location.origin, source: window.parent, instance, bindingIds: currentBindings });
      if (data?.type === "select" && data.bindingId) highlight(data.bindingId, true);
    };
    if (embedded) window.addEventListener("message", message);
    document.addEventListener("click", click, true);
    document.addEventListener("auxclick", block, true);
    document.addEventListener("submit", block, true);
    document.addEventListener("keydown", keyboard, true);
    document.addEventListener("dragstart", block, true);
    if (embedded && readyInstance.current !== instance) {
      readyInstance.current = instance;
      window.parent.postMessage({ channel: PAGE_EDITOR_CHANNEL, instance, type: "ready" }, window.location.origin);
    }
    return () => {
      observer.disconnect();
      if (embedded) window.removeEventListener("message", message);
      document.removeEventListener("click", click, true);
      document.removeEventListener("auxclick", block, true);
      document.removeEventListener("submit", block, true);
      document.removeEventListener("keydown", keyboard, true);
      document.removeEventListener("dragstart", block, true);
      selected?.removeAttribute("data-editor-selected");
      style.remove();
      for (const [element, tabIndex] of previous) { if (tabIndex === null) element.removeAttribute("tabindex"); else element.setAttribute("tabindex", tabIndex); }
      for (const [element, { pointerEvents, tabIndex }] of previousFrames) {
        element.style.pointerEvents = pointerEvents;
        if (tabIndex === null) element.removeAttribute("tabindex"); else element.setAttribute("tabindex", tabIndex);
      }
    };
  }, [instance, bindingsJson]);
  return null;
}
