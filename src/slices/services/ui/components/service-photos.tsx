"use client";

import { useRef, type ReactNode } from "react";

/**
 * "Show all photos" for a gallery with more photos than the `MosaicGallery adaptive` mosaic shows
 * (`MOSAIC_ADAPTIVE_MAX`): the mock's `.svc-gallery .all` pill (surface, hairline, 13px/500, grid
 * glyph) opening a native modal `<dialog>` with every photo stacked in one scrollable column
 * and a close button. Native `showModal()` gives focus trapping, Esc-to-close and the backdrop
 * for free; clicking the backdrop also closes it. The photos arrive as server-rendered nodes
 * (`MediaImage`s), so this island ships no image logic. Rendered into the mosaic's `overlay`.
 */
export function ServicePhotos({
  label,
  title,
  closeLabel,
  icon,
  children,
}: {
  label: string;
  title: string;
  closeLabel: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-4 py-[9px] text-[13px] font-medium text-ink [&_svg]:block [&_svg]:size-[15px]"
      >
        {icon}
        {label}
      </button>
      <dialog
        ref={ref}
        aria-label={title}
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="m-auto max-h-[90vh] w-[min(960px,92vw)] rounded-[8px] border border-line bg-bg p-0 text-ink backdrop:bg-ink/70"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-bg px-6 py-4">
          <span className="font-serif text-[22px]">{title}</span>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            className="cursor-pointer rounded-full border border-line px-4 py-1.5 text-[13px] font-medium"
          >
            {closeLabel}
          </button>
        </div>
        <div className="grid gap-[10px] p-6 [&_img]:block [&_img]:h-auto [&_img]:w-full [&_img]:rounded-[6px]">{children}</div>
      </dialog>
    </>
  );
}
