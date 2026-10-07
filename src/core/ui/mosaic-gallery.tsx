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
 * deleted; identical to `mock/building-detail.html`) plus the old `mock.css`'s `.mk img`
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
 * **`adaptive` (opt-in, additive — service detail, `mock/service-detail.html` `.svc-gallery`).**
 * Without it the component is byte-identical to the Buildings mosaic above, for any photo count.
 * With it the layout is **count-aware**, with fixed row heights (not intrinsic), a 6px radius,
 * `relative` positioning for the `overlay` slot, and a 780px breakpoint (mobile-first
 * `min-[781px]:`):
 * - 1 photo (`.n1`): one wide tile, `clamp(300px,38vw,480px)` tall, cropped at `50% 62%`.
 * - 2 photos: two equal tiles in one `clamp(240px,32vw,420px)` row (240px on mobile).
 * - 3 photos: `2fr 1fr`, lead spanning two 260px rows beside two stacked tiles; ≤780px the lead
 *   goes full-width (240px) above the other two side by side (140px).
 * - 4 photos (`.n4`): `2fr 1fr 1fr` × two 260px rows — lead spanning both rows, the 2nd photo wide
 *   across the two right columns, the 3rd/4th below it; ≤780px `1fr 1fr` × `240px 140px 140px`,
 *   lead full-width, the rest in the 2-column cells.
 * - 5+ photos: the 4-photo grid's frame with the 2nd tile narrow (lead + four 1fr cells, the
 *   Buildings arrangement at fixed heights); only the **first 5** are shown
 *   (`MOSAIC_ADAPTIVE_MAX`), so the caller should offer the rest (e.g. a "Show all photos"
 *   pill in `overlay`).
 * `overlay` (adaptive only) renders after the photos, absolutely positioned bottom-right
 * (18px insets) — the caller decides when to pass it (typically `images.length >
 * MOSAIC_ADAPTIVE_MAX`). In adaptive mode the photo styles target **direct** `<img>` children
 * only (`[&>img]`), so an overlay's own images are not restyled.
 */
/** Photos an `adaptive` `MosaicGallery` shows; more than this and the caller should offer the rest. */
export const MOSAIC_ADAPTIVE_MAX = 5;

const ADAPTIVE_BASE =
  "relative grid gap-[10px] overflow-hidden rounded-[6px] [&>img]:block [&>img]:h-full [&>img]:w-full [&>img]:max-w-full [&>img]:object-cover";

const ADAPTIVE_LAYOUT: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "grid-cols-1 grid-rows-[clamp(300px,38vw,480px)] [&>img]:object-[50%_62%]",
  2: "grid-cols-2 grid-rows-[240px] min-[781px]:grid-rows-[clamp(240px,32vw,420px)]",
  3: cn(
    "grid-cols-2 grid-rows-[240px_140px] [&>:nth-child(1)]:col-[1/3]",
    "min-[781px]:grid-cols-[2fr_1fr] min-[781px]:grid-rows-[260px_260px] min-[781px]:[&>:nth-child(1)]:col-auto min-[781px]:[&>:nth-child(1)]:row-[1/3]",
  ),
  4: cn(
    "grid-cols-2 grid-rows-[240px_140px_140px] [&>:nth-child(1)]:col-[1/3]",
    "min-[781px]:grid-cols-[2fr_1fr_1fr] min-[781px]:grid-rows-[260px_260px] min-[781px]:[&>:nth-child(1)]:col-auto min-[781px]:[&>:nth-child(1)]:row-[1/3] min-[781px]:[&>:nth-child(2)]:col-[2/4]",
  ),
  5: cn(
    "grid-cols-2 grid-rows-[240px_140px_140px] [&>:nth-child(1)]:col-[1/3]",
    "min-[781px]:grid-cols-[2fr_1fr_1fr] min-[781px]:grid-rows-[260px_260px] min-[781px]:[&>:nth-child(1)]:col-auto min-[781px]:[&>:nth-child(1)]:row-[1/3]",
  ),
};

export function MosaicGallery({
  images,
  className,
  adaptive = false,
  overlay,
}: {
  images: ReactNode[];
  className?: string;
  /** Count-aware 1/2/3/4/5+ layouts at fixed heights (see above). Off = the Buildings mosaic. */
  adaptive?: boolean;
  /** Adaptive only: absolutely-positioned bottom-right slot (e.g. a "Show all photos" pill). */
  overlay?: ReactNode;
}) {
  if (!images.length) return null;
  if (adaptive) {
    const shown = images.slice(0, MOSAIC_ADAPTIVE_MAX);
    const layout = ADAPTIVE_LAYOUT[shown.length as 1 | 2 | 3 | 4 | 5];
    return (
      <div className={cn(ADAPTIVE_BASE, layout, className)}>
        {shown.map((image, i) => (
          <Fragment key={i}>{image}</Fragment>
        ))}
        {overlay ? <div className="absolute right-[18px] bottom-[18px]">{overlay}</div> : null}
      </div>
    );
  }
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
