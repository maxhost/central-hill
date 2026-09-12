"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@core/ui";
import { AdminButton } from "./form";
import type { AdminMediaPreview } from "../server/media-actions";
import { finalizeAdminUpload, presignAdminUpload } from "../server/media-actions";

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

export type QueueStatus = "queued" | "uploading" | "done" | "failed";

interface QueueItem {
  id: string;
  name: string;
  file: File;
  contentType: string;
  status: QueueStatus;
  /** 0–100, from real upload progress events. */
  progress: number;
  error?: string;
}

interface MediaQueueApi {
  /** Queue a picked file against a reserved asset id. Replaces any prior entry for it. */
  enqueue: (id: string, file: File) => void;
  /** Drop a queued file (the editor removed or replaced the field's value). */
  dequeue: (id: string) => void;
  /** Upload everything queued. Resolves true when all items succeeded. */
  flush: () => Promise<boolean>;
  /** True while anything is still queued — used to guard navigation. */
  hasPending: boolean;
  /** Is this asset's file still waiting to be uploaded? Drives the field's note. */
  isQueued: (id: string) => boolean;
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
  const [items, setItems] = useState<QueueItem[]>([]);
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  // The upload loop is async and must always see the current queue, but a ref may not
  // be written during render — mirror the state into it from an effect instead. Safe
  // for the loop's purposes: items are enqueued when a file is picked and read when the
  // form is saved, never within the same commit.
  const itemsRef = useRef<QueueItem[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const patch = useCallback((id: string, next: Partial<QueueItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...next } : i)));
  }, []);

  const enqueue = useCallback((id: string, file: File) => {
    setItems((prev) => [
      ...prev.filter((i) => i.id !== id),
      { id, name: file.name, file, contentType: file.type, status: "queued", progress: 0 },
    ]);
  }, []);

  const dequeue = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  /** Upload one item: re-sign (the reservation may have aged out), PUT, finalize. */
  const uploadItem = useCallback(
    async (item: QueueItem): Promise<boolean> => {
      patch(item.id, { status: "uploading", progress: 0, error: undefined });
      try {
        // Re-sign against the reserved id: the URL minted when the file was picked may
        // have expired while the editor kept working.
        const signed = await presignAdminUpload({
          id: item.id,
          filename: item.name,
          contentType: item.contentType,
          size: item.file.size,
        });
        if (!signed.ok) throw new Error(signed.error);

        await putWithProgress(
          signed.data.uploadUrl,
          item.file,
          {
            "Content-Type": signed.data.contentType,
            "Cache-Control": signed.data.cacheControl,
          },
          (percent) => patch(item.id, { progress: percent }),
        );

        const done = await finalizeAdminUpload({ id: item.id, r2Key: signed.data.r2Key });
        if (!done.ok) throw new Error(done.error);
        patch(item.id, { status: "done", progress: 100 });
        return true;
      } catch (e) {
        patch(item.id, {
          status: "failed",
          error: e instanceof Error ? e.message : t("media.uploadError"),
        });
        return false;
      }
    },
    [patch, t],
  );

  /** Upload every unfinished item, one at a time so progress stays legible. */
  const run = useCallback(async (): Promise<boolean> => {
    setRunning(true);
    let allOk = true;
    for (const item of itemsRef.current) {
      if (item.status === "done") continue;
      const ok = await uploadItem(item);
      if (!ok) allOk = false;
    }
    setRunning(false);
    return allOk;
  }, [uploadItem]);

  const flush = useCallback(async (): Promise<boolean> => {
    const outstanding = itemsRef.current.filter((i) => i.status !== "done");
    if (outstanding.length === 0) return true;
    setOpen(true);
    const ok = await run();
    // Nothing left to do on success — drop the modal and let the save continue.
    if (ok) {
      setOpen(false);
      setItems([]);
    }
    return ok;
  }, [run]);

  const hasPending = items.some((i) => i.status !== "done");

  // Leaving mid-upload strands the form: the value points at bytes that never landed.
  useEffect(() => {
    if (!running) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [running]);

  // Read from state, not the ref: this one is called during render.
  const isQueued = useCallback(
    (id: string) => items.some((i) => i.id === id && i.status !== "done"),
    [items],
  );

  const api = useMemo<MediaQueueApi>(
    () => ({ enqueue, dequeue, flush, hasPending, isQueued }),
    [enqueue, dequeue, flush, hasPending, isQueued],
  );

  const settled = !running && items.every((i) => i.status === "done" || i.status === "failed");
  const failed = items.filter((i) => i.status === "failed");

  return (
    <MediaQueueContext.Provider value={api}>
      {children}
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("media.uploadingTitle")}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
        >
          <div className="w-full max-w-md rounded-lg border border-line bg-surface p-5 shadow-lg">
            <h2 className="text-sm font-semibold text-ink">{t("media.uploadingTitle")}</h2>
            <p className="mt-1 text-xs text-ink-soft">{t("media.uploadingHint")}</p>

            <ul className="mt-4 space-y-3">
              {items.map((i) => (
                <li key={i.id} className="space-y-1">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="truncate text-ink" title={i.name}>
                      {i.name}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 font-medium",
                        i.status === "done" && "text-green-600",
                        i.status === "failed" && "text-red-600",
                        i.status !== "done" && i.status !== "failed" && "text-ink-soft",
                      )}
                    >
                      {i.status === "done"
                        ? `✓ ${t("media.statusDone")}`
                        : i.status === "failed"
                          ? `✗ ${t("media.statusFailed")}`
                          : i.status === "uploading"
                            ? `${i.progress}%`
                            : t("media.statusQueued")}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg">
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width] duration-200",
                        i.status === "failed" ? "bg-red-500" : "bg-accent",
                      )}
                      style={{ width: `${i.status === "done" ? 100 : i.progress}%` }}
                    />
                  </div>
                  {i.error ? <p className="text-xs text-red-600">{i.error}</p> : null}
                </li>
              ))}
            </ul>

            <div className="mt-5 flex justify-end gap-2">
              {settled && failed.length > 0 ? (
                <AdminButton variant="primary" onClick={() => void run()}>
                  {t("media.retryFailed")}
                </AdminButton>
              ) : null}
              <AdminButton
                variant={failed.length > 0 ? "ghost" : "primary"}
                disabled={!settled}
                onClick={() => setOpen(false)}
              >
                {t("media.close")}
              </AdminButton>
            </div>
          </div>
        </div>
      ) : null}
    </MediaQueueContext.Provider>
  );
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
    contentType: file.type,
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
      mime: file.type,
    },
  };
}
