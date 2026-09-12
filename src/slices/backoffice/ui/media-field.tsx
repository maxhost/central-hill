"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@core/ui";
import type { AdminMediaPreview } from "../server/media-actions";
import { reserveUpload, useMediaQueue } from "./media-queue";

/**
 * Media picker client islands (S12 + ADR 0018). The single `MediaField` (cover /
 * og image) and the ordered `MediaGalleryField` both run the two-phase upload:
 * presign (gated action) → direct browser PUT to R2 → finalize (gated action) →
 * preview. Both are **controlled** — the parent owns the value (`media_id` /
 * `media_id[]`) and persists it through its own save action; the field only
 * manages upload + preview state. Labels come from the `backoffice` namespace.
 */

const ACCEPT: Record<"image" | "media", string> = {
  image: "image/jpeg,image/png,image/webp,image/avif",
  media: "image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm",
};

/**
 * Picking a file **reserves an id and queues the bytes** — it does not upload (ADR
 * 0030). The bytes go up when the form is saved, via the queue's `flush()`. The
 * preview is a local object URL, because there is nothing on R2 to point at yet.
 */

/** Small visual: image thumbnail, or a labelled tile for video / unknown. */
function Thumb({
  preview,
  className,
}: {
  preview: AdminMediaPreview | null;
  className?: string;
}) {
  const t = useTranslations("backoffice");
  if (preview && preview.mime.startsWith("image/")) {
    // eslint-disable-next-line @next/next/no-img-element -- admin preview, not public render path
    return <img src={preview.url} alt="" className={cn("h-full w-full object-cover", className)} />;
  }
  return (
    <div className={cn("flex h-full w-full items-center justify-center text-xs text-ink-soft", className)}>
      {preview ? t("media.video") : t("media.empty")}
    </div>
  );
}

// ── Single asset ─────────────────────────────────────────────────────────────

export function MediaField({
  value,
  preview: initialPreview,
  onChange,
  accept = "image",
}: {
  value: string | null;
  /** Resolved preview for an already-persisted `value` (edit screens). */
  preview?: AdminMediaPreview | null;
  onChange: (id: string | null, preview: AdminMediaPreview | null) => void;
  accept?: "image" | "media";
}) {
  const t = useTranslations("backoffice");
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<AdminMediaPreview | null>(initialPreview ?? null);
  const queue = useMediaQueue();

  const shown = preview && preview.id === value ? preview : null;

  function pick() {
    setError(null);
    inputRef.current?.click();
  }

  function onFile(file: File | undefined) {
    if (!file) return;
    start(async () => {
      try {
        const { id, preview: local } = await reserveUpload(file);
        // Replacing a pick must not leave the previous file queued for upload.
        if (value) queue.dequeue(value);
        queue.enqueue(id, file);
        setPreview(local);
        onChange(id, local);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("media.uploadError"));
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="size-20 shrink-0 overflow-hidden rounded-md border border-line bg-bg">
          <Thumb preview={shown} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={pick}
            disabled={pending}
            className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-ink disabled:opacity-60"
          >
            {pending ? t("media.preparing") : value ? t("media.replace") : t("media.upload")}
          </button>
          {value ? (
            <button
              type="button"
              onClick={() => {
                if (value) queue.dequeue(value);
                setPreview(null);
                onChange(null, null);
              }}
              disabled={pending}
              className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:border-ink disabled:opacity-60"
            >
              {t("media.remove")}
            </button>
          ) : null}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT[accept]}
        className="hidden"
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {!error && value && queue.isQueued(value) ? (
        <p className="text-xs text-ink-soft">{t("media.queuedNote")}</p>
      ) : null}
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}

// ── Ordered gallery ──────────────────────────────────────────────────────────

export function MediaGalleryField({
  value,
  previews: initialPreviews,
  onChange,
  accept = "image",
}: {
  value: string[];
  /** Resolved previews for already-persisted ids (edit screens). */
  previews?: Record<string, AdminMediaPreview>;
  onChange: (ids: string[]) => void;
  accept?: "image" | "media";
}) {
  const t = useTranslations("backoffice");
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, AdminMediaPreview>>(initialPreviews ?? {});
  const queue = useMediaQueue();

  function move(index: number, delta: number) {
    const next = [...value];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    const tmp = next[index]!;
    next[index] = next[target]!;
    next[target] = tmp;
    onChange(next);
  }

  function remove(id: string) {
    queue.dequeue(id); // a removed image must not still be uploaded on save
    onChange(value.filter((v) => v !== id));
  }

  function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    start(async () => {
      try {
        const added: AdminMediaPreview[] = [];
        for (const file of list) {
          const { id, preview } = await reserveUpload(file);
          queue.enqueue(id, file);
          added.push(preview);
        }
        setPreviews((prev) => {
          const next = { ...prev };
          for (const p of added) next[p.id] = p;
          return next;
        });
        onChange([...value, ...added.map((p) => p.id)]);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("media.uploadError"));
      }
    });
  }

  return (
    <div className="space-y-3">
      {value.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {value.map((id, index) => (
            <li key={id} className="overflow-hidden rounded-md border border-line bg-bg">
              <div className="aspect-[4/3] w-full">
                <Thumb preview={previews[id] ?? null} />
              </div>
              <div className="flex items-center justify-between gap-1 border-t border-line px-2 py-1.5">
                <span className="text-xs text-ink-soft">{index + 1}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0 || pending}
                    aria-label={t("media.moveUp")}
                    className="rounded px-1.5 py-0.5 text-xs text-ink-soft hover:text-ink disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === value.length - 1 || pending}
                    aria-label={t("media.moveDown")}
                    className="rounded px-1.5 py-0.5 text-xs text-ink-soft hover:text-ink disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(id)}
                    disabled={pending}
                    aria-label={t("media.remove")}
                    className="rounded px-1.5 py-0.5 text-xs text-red-600 hover:text-red-700 disabled:opacity-30"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-md border border-dashed border-line px-4 py-6 text-center text-sm text-ink-soft">
          {t("media.galleryEmpty")}
        </p>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-ink disabled:opacity-60"
      >
        {pending ? t("media.uploading") : t("media.addImages")}
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT[accept]}
        className="hidden"
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}
