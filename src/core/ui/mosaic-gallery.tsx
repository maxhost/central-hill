import { Fragment, type ReactNode } from "react";
import { cn } from "./cn";

/**
 * Photo mosaic: a borderless, rounded-corner grid of cover-cropped photos where the **first**
 * photo is the large lead tile — `2fr 1fr 1fr` columns, the lead spanning both explicit rows on
 * the left, every other photo filling the 1fr cells to its right; at ≤680px it becomes 2 columns
 * with the lead full-width on top. 10px gutters, 4px outer radius (`overflow: hidden` clips the
 * corner photos). First built extracting the building-detail photo gallery
 * (`galleryGridHtml()` in `slices/buildings/ui/building-detail.tsx`), ported 1:1 from its old
 * `.mk`-scoped `.gallery`/`.gallery img`/`.gallery .g0` rules (that page's `PAGE_STYLE`, now
 * deleted; identical to `mock/building-detail.html`) plus `mock.css`'s `.mk img`
 * (`display:block; max-width:100%`) — no new design.
 *
 * **Not `StepGallery`**: that is a full section (heading + body) with a hairline grid of
 * equal-size numbered photo *cards* carrying an overlaid scrim/index/title/description; this is
 * a bare, caption-less photo grid with an asymmetric lead tile and no chrome of its own.
 *
 * **Row sizing is ported as-is, not fixed.** Only two rows are explicit (`1fr 1fr`); the grid
 * has no height, so rows size from the photos' intrinsic aspect ratios (the `<img>`'s
 * `width`/`height`). The lead + 4 photos fill the 2 explicit rows exactly (the mock's 5-photo
 * case). A 6th+ photo creates **implicit `auto` rows** below, auto-placed into all three
 * columns — so photo 6 lands in the wide 2fr column and the extra rows are as tall as that
 * wide photo's aspect ratio makes them (e.g. at 1440px with 8 photos: a 403px lead block, then a
 * 393px third row of 590+295+295px-wide tiles). That is the pre-extraction render, reproduced
 * exactly; whether >5 photos should be capped/re-laid-out is a design decision, not made here.
 *
 * Purely presentational, per the `core/ui` ground rule: no `@core/media`, no i18n. `images` are
 * the caller's already-resolved `<MediaImage>`/`<img>` elements (source, `sizes`, loading,
 * `alt`, blur placeholder are the caller's call — same split as `UnitCard`'s `image`); each must
 * render as a **direct `<img>` child** (as `MediaImage` does) — the grid places the first child
 * and styles every `<img>` (`block`, full-cell `object-cover`, `max-w-full`). Renders nothing
 * for an empty list (callers omit the section anyway). Order is display order (keyed by index —
 * callers needn't key the elements).
 *
 * The 680px breakpoint is mobile-first `min-[681px]:` (≥681px), not `max-[680px]:` — Tailwind
 * v4's `max-*` compiles to `width < 680px`, which would drop exactly 680px from the original
 * `max-width:680px` (≤680px) rule. Same approach as `UnitCardGrid`.
 *
 * MUST be rendered **outside** any `.mk`-scoped subtree (see `SpecStrip`'s docstring: `mock.css`'s
 * un-layered `.mk * { margin:0; padding:0 }` reset beats any `@layer`-wrapped Tailwind utility).
 */
export function MosaicGallery({ images, className }: { images: ReactNode[]; className?: string }) {
  if (!images.length) return null;
  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_1fr] grid-rows-[1fr_1fr] gap-[10px] overflow-hidden rounded-[4px] min-[681px]:grid-cols-[2fr_1fr_1fr]",
        "[&_img]:block [&_img]:h-full [&_img]:w-full [&_img]:max-w-full [&_img]:object-cover",
        "[&>:first-child]:col-[1/3] min-[681px]:[&>:first-child]:col-auto min-[681px]:[&>:first-child]:row-[1/3]",
        className,
      )}
    >
      {images.map((image, i) => (
        <Fragment key={i}>{image}</Fragment>
      ))}
    </div>
  );
}
