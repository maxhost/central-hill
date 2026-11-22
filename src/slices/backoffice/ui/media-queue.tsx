"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useId,
} from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import type { EditorLocale } from "../page-editor-types";
import { useToast } from "./toast";
import { uploadFeedback, uploadFailureCause } from "./editor-feedback-copy";
import { useTranslations } from "next-intl";
import { UiIcon, cn } from "@core/ui";
import { AdminButton } from "./form";
import type { AdminMediaPreview } from "../server/media-actions";
import { finalizeAdminUpload, presignAdminUpload } from "../server/media-actions";
import { pickedFileType } from "./media-accept";
import { reservationCount, trackReservation } from "./media-busy";

/**
 * Deferred media uploads (ADR 0030).
 *
 * Picking a file used to upload it immediately, so anything the editor chose and then
 * replaced — or never saved — became a `media_asset` row and an R2 object referenced by
 * nothing, with no screen to find it on. Uploads now happen **on save**: picking a file
 * only *reserves* an id and queues the bytes locally.
 *
 * Reserving is free by construction: `presignUpload` writes no row and no object, so a
 * reservation that is never flushed leaves literally nothing behind. That is what makes
 * "no orphans" a property of the design rather than a cleanup job.
 *
 * The form's save handler awaits `flush()` before calling its server action. `flush()`
 * puts a blocking modal on screen — per-file progress, then a tick — and only enables
 * *Close* once every item has settled, because leaving mid-upload is exactly how a form
 * ends up pointing at bytes that never arrived.
 */

export type QueueStatus = "queued" | "uploading" | "done" | "failed" | "finalizing";

interface QueueItem {
  id: string;
  name: string;
  file: File;
  contentType: string;
  status: QueueStatus;
  /** 0–100, from real upload progress events. */
  progress: number;
  error?: string;
  locale?: EditorLocale;
  entity?: string;
}

export interface MediaQueueApi {
  /** Queue a picked file against a reserved asset id. Replaces any prior entry for it. */
  enqueue: (id: string, file: File, scope?: { locale: EditorLocale; entity: string }) => void;
  /** Drop a queued file (the editor removed or replaced the field's value). */
  dequeue: (id: string) => void;
  /** Upload selected assets, or all queued assets when omitted. */
  flush: (ids?: readonly string[], options?: { locale: EditorLocale; feedback: true; entity?: string }) => Promise<boolean>;
  errorFor?: (id: string) => string | undefined;
  failures?: readonly { id: string; name: string; locale?: EditorLocale; entity?: string; error?: string }[];
  /** True while anything is still queued — used to guard navigation. */
  hasPending: boolean;
  /** Is this asset's file still waiting to be uploaded? Drives the field's note. */
  isQueued: (id: string) => boolean;
  /**
   * Run a pick's reservation (presign → enqueue → field `onChange`) as one in-flight
   * unit, so `isPreparing` covers the window in which the form's value does not hold
   * the new id yet. Settles whether `work` resolves or throws.
   */
  track: <T>(work: () => Promise<T>) => Promise<T>;
  /**
   * True while any picked file is still being reserved. Forms MUST disable Save (and
   * guard their submit handler) while it is true, or a fast save persists the form
   * without the file just picked.
   */
  isPreparing: boolean;
}

const MediaQueueContext = createContext<MediaQueueApi | null>(null);

/**
 * Access the upload queue. Returns a no-op implementation outside a provider so a
 * `MediaField` rendered in isolation (or a form not yet wired to `flush`) keeps working
 * rather than crashing.
 */
export function useMediaQueue(): MediaQueueApi {
  const ctx = useContext(MediaQueueContext);
  return (
    ctx ?? {
      enqueue: () => {},
      dequeue: () => {},
      flush: async () => true,
      hasPending: false,
      isQueued: () => false,
      track: (work) => work(),
      isPreparing: false,
    }
  );
}

/**
 * PUT the bytes with `XMLHttpRequest`, not `fetch`.
 *
 * This is the only reason XHR appears in this codebase: `fetch` exposes no upload
 * progress at all, so a progress bar built on it would be a decoration that lies. XHR's
 * `upload.onprogress` reports real bytes-sent.
 */
function putWithProgress(
  url: string,
  file: File,
  headers: Record<string, string>,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (${xhr.status}).`));
    xhr.onerror = () => reject(new Error("Upload failed: network error."));
    xhr.onabort = () => reject(new Error("Upload cancelled."));
    xhr.send(file);
  });
}

export function MediaQueueProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("backoffice");
  const toast = useToast();
  const lastUploadToast = useRef<string | null>(null);
  const dialogTitle = useId();
  const [items, setItems] = useState<QueueItem[]>([]);
  const itemsRef = useRef<QueueItem[]>([]);
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const runningRef = useRef(false);
  const [activeIds, setActiveIds] = useState<readonly string[] | null>(null);
  const activeIdsRef = useRef<readonly string[] | null>(null);
  const [feedbackLocale, setFeedbackLocale] = useState<EditorLocale | null>(null);
  const feedbackLocaleRef = useRef<EditorLocale | null>(null);
  const [retried, setRetried] = useState(false);
  const [preparing, dispatchPreparing] = useReducer(reservationCount, 0);
  const background = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const update = useCallback((work: (items: QueueItem[]) => QueueItem[]) => {
    itemsRef.current = work(itemsRef.current);
    setItems(itemsRef.current);
  }, []);
  const patch = useCallback((id: string, next: Partial<QueueItem>) => {
    update(current => current.map(item => item.id === id ? { ...item, ...next } : item));
  }, [update]);
  const enqueue = useCallback((id: string, file: File, scope?: { locale: EditorLocale; entity: string }) => {
    update(current => [...current.filter(item => item.id !== id), {
      id, name: file.name, file, contentType: pickedFileType(file), status: "queued", progress: 0, ...scope,
    }]);
  }, [update]);
  const dequeue = useCallback((id: string) => update(current => current.filter(item => item.id !== id)), [update]);
  const uploadItem = useCallback(async (item: QueueItem): Promise<boolean> => {
    let stage: "presign" | "put" | "finalize" = "presign";
    patch(item.id, { status: "uploading", progress: 0, error: undefined });
    try {
      const signed = await presignAdminUpload({ id: item.id, filename: item.name, contentType: item.contentType, size: item.file.size });
      if (!signed.ok) throw new Error(signed.error);
      stage = "put";
      await putWithProgress(signed.data.uploadUrl, item.file, { "Content-Type": signed.data.contentType, "Cache-Control": signed.data.cacheControl }, percent => patch(item.id, { progress: percent }));
      stage = "finalize";
      patch(item.id, { status: "finalizing" });
      const done = await finalizeAdminUpload({ id: item.id, r2Key: signed.data.r2Key });
      if (!done.ok) throw new Error(done.error);
      patch(item.id, { status: "done", progress: 100 });
      return true;
    } catch (error) {
      patch(item.id, { status: "failed", error: feedbackLocaleRef.current ? uploadFailureCause(stage) : error instanceof Error ? error.message : "Upload failed." });
      return false;
    }
  }, [patch]);
  const run = useCallback(async (): Promise<boolean> => {
    if (runningRef.current) return false;
    runningRef.current = true;
    setRunning(true);
    try {
      const selected = activeIdsRef.current;
      const outstanding = itemsRef.current.filter(item => item.status !== "done" && (!selected || selected.includes(item.id)));
      let ok = true;
      for (const item of outstanding) if (!await uploadItem(item)) ok = false;
      if (!ok && feedbackLocaleRef.current) {
        const failed = itemsRef.current.filter(item => item.status === "failed" && (!selected || selected.includes(item.id)));
        if (lastUploadToast.current) toast.dismiss(lastUploadToast.current);
        lastUploadToast.current = toast.error(uploadFeedback(feedbackLocaleRef.current, failed.map(item => item.name), failed.map(item => item.locale)), { duration: 0 });
      }
      return ok;
    } finally { runningRef.current = false; setRunning(false); }
  }, [uploadItem, toast]);
  const close = useCallback(() => {
    if (runningRef.current) return;
    setOpen(false);
    requestAnimationFrame(() => returnFocus.current?.focus());
  }, []);
  const flush = useCallback(async (ids?: readonly string[], options?: { locale: EditorLocale; feedback: true; entity?: string }): Promise<boolean> => {
    if (runningRef.current) return false;
    const selected = ids ? [...new Set(ids)] : options ? itemsRef.current.filter(item => (!item.locale || item.locale === options.locale) && (!options.entity || item.entity === options.entity)).map(item => item.id) : null;
    activeIdsRef.current = selected;
    setActiveIds(selected);
    feedbackLocaleRef.current = options?.locale ?? null;
    setFeedbackLocale(options?.locale ?? null);
    setRetried(false);
    const outstanding = itemsRef.current.filter(item => item.status !== "done" && (!selected || selected.includes(item.id)));
    if (!outstanding.length) return true;
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpen(true);
    const ok = await run();
    if (ok) {
      setOpen(false);
      update(current => selected ? current.filter(item => !selected.includes(item.id)) : []);
    }
    return ok;
  }, [run, update]);
  const hasPending = items.some(item => item.status !== "done");
  useEffect(() => {
    if (!running) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [running]);
  // Inert lasts for the full open cycle, including settled errors and successful Retry.
  useEffect(() => {
    if (!open) return;
    const element = background.current;
    element?.setAttribute("inert", "");
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); if (!runningRef.current) close(); return; }
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]),[href],input:not([disabled]),[tabindex="0"]') ?? []);
      const first = focusable[0], last = focusable.at(-1);
      if (!first) { event.preventDefault(); dialog.current?.focus(); }
      else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) { event.preventDefault(); first.focus(); }
    };
    const contain = (event: FocusEvent) => { if (!dialog.current?.contains(event.target as Node)) dialog.current?.focus(); };
    document.addEventListener("keydown", trap, true);
    document.addEventListener("focusin", contain);
    return () => { element?.removeAttribute("inert"); document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", trap, true); document.removeEventListener("focusin", contain); };
  }, [open, close]);
  const isQueued = useCallback((id: string) => items.some(item => item.id === id && item.status !== "done"), [items]);
  const errorFor = useCallback((id: string) => items.find(item => item.id === id)?.error, [items]);
  const track = useCallback(<T,>(work: () => Promise<T>): Promise<T> => trackReservation(work, dispatchPreparing), []);
  const isPreparing = preparing > 0;
  const failures = useMemo(() => items.filter(item => item.status === "failed"), [items]);
  const api = useMemo<MediaQueueApi>(() => ({ enqueue, dequeue, flush, hasPending, isQueued, errorFor, failures, track, isPreparing }), [enqueue, dequeue, flush, hasPending, isQueued, errorFor, failures, track, isPreparing]);
  const visibleItems = activeIds ? items.filter(item => activeIds.includes(item.id)) : items;
  const settled = !running && visibleItems.every(item => item.status === "done" || item.status === "failed");
  const failed = visibleItems.filter(item => item.status === "failed");
  const english = feedbackLocale !== null;
  const hasOtherSelectionLocale = feedbackLocale !== null && visibleItems.some(item => item.locale !== undefined && item.locale !== feedbackLocale);
  return <MediaQueueContext.Provider value={api}>
    <div ref={background} className="contents">{children}</div>
    {open && typeof document !== "undefined" ? createPortal(<div className="fixed inset-0 z-[110] flex items-center justify-center bg-ink/40 p-4">
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={dialogTitle} tabIndex={-1} className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-lg border border-line bg-surface p-5 shadow-lg focus:outline-none">
        <h2 id={dialogTitle} className="text-sm font-semibold text-ink">{english ? hasOtherSelectionLocale ? `Files required for ${feedbackLocale.toUpperCase()} draft` : `Upload files (${feedbackLocale.toUpperCase()})` : t("media.uploadingTitle")}</h2>
        <p className="mt-1 text-xs text-ink-soft" role="status">{english ? failed.length ? `Your ${feedbackLocale.toUpperCase()} draft has not been saved. Retry the failed files, then close this dialog and Save draft.` : retried && settled ? "Uploads completed. Close this dialog, then Save draft. Publish remains a separate action." : "Please wait while the selected files are transferred and finalized." : t("media.uploadingHint")}</p>
        <ul className="mt-4 space-y-3">{visibleItems.map(item => <li key={item.id} data-upload-status={item.status} className={cn("space-y-1 rounded-md border p-2", item.status === "failed" ? "border-red-600 bg-red-50" : "border-transparent")}>
          <div className="flex items-center justify-between gap-3 text-xs"><span className="min-w-0 break-words text-ink">{item.name}</span>
            <span className={cn("shrink-0 font-medium", item.status === "done" ? "text-green-700" : item.status === "failed" ? "text-red-700" : "text-ink-soft")}>
              {item.status === "done" ? <><UiIcon name="check" size={14} className="inline-block" /> {english ? "Ready" : t("media.statusDone")}</> : item.status === "failed" ? english ? "Failed" : t("media.statusFailed") : item.status === "finalizing" ? english ? "Finalizing…" : `${item.progress}%` : item.status === "uploading" ? `${item.progress}%` : english ? "Queued" : t("media.statusQueued")}
            </span></div>
          {english && hasOtherSelectionLocale && item.locale ? <p className="text-xs text-ink-soft">Selected in {item.locale.toUpperCase()}; required for this {feedbackLocale.toUpperCase()} draft.</p> : null}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg" role="progressbar" aria-label={item.name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={item.progress}><div className={cn("h-full rounded-full transition-[width] duration-200", item.status === "failed" ? "bg-red-600" : "bg-accent")} style={{ width: `${item.progress}%` }} /></div>
          {item.error ? <p className="text-xs text-red-700" role="alert">{item.error}</p> : null}
        </li>)}</ul>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          {settled && failed.length ? <AdminButton variant="primary" onClick={() => { setRetried(true); void run(); }}>{english ? "Retry failed uploads" : t("media.retryFailed")}</AdminButton> : null}
          <AdminButton variant={failed.length ? "ghost" : "primary"} disabled={!settled} onClick={close}>{english ? "Close" : t("media.close")}</AdminButton>
        </div>
      </div>
    </div>, document.body) : null}
  </MediaQueueContext.Provider>;
}

/**
 * Reserve an asset id for a picked file without uploading anything, and hand back a
 * local preview built from the file itself (there is nothing on R2 to point at yet).
 */
export async function reserveUpload(
  file: File,
): Promise<{ id: string; preview: AdminMediaPreview }> {
  const signed = await presignAdminUpload({
    filename: file.name,
    contentType: pickedFileType(file),
    size: file.size,
  });
  if (!signed.ok) throw new Error(signed.error);
  return {
    id: signed.data.id,
    preview: {
      id: signed.data.id,
      url: URL.createObjectURL(file),
      width: null,
      height: null,
      mime: pickedFileType(file),
      name: file.name,
    },
  };
}
