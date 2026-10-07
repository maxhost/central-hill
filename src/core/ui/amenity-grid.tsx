import type { ReactNode } from "react";
import { cn } from "./cn";

export type AmenityGridItem = {
  /** Caller-built icon element (e.g. an inline `<svg aria-hidden>` with `stroke="currentColor"`).
   * Any `<svg>` inside is sized to 22px, kept from shrinking and tinted `accent-deep`. */
  icon?: ReactNode;
  label: string;
};

/**
 * A hairline grid of compact amenity cells — each = a small icon beside a one-line label, on a
 * `surface` cell, 4 → 2 → 1 columns. First built for Buildings detail's "Amenities" section
 * (`src/slices/buildings/ui/building-detail.tsx`), ported 1:1 from that page's old page-scoped
 * `PAGE_STYLE` rules (`.mk .am-grid` / `.mk .am` / `.mk .am svg` / `.mk .am span`): `1px` gap on
 * a `line` background inside a `1px` `line` border (the hairline technique), cells
 * `flex`/`items-center` with a `14px` gap and `24px 26px` padding, the glyph `22×22` in
 * `accent-deep` (`flex:none`), the label `15px` in `ink`. The old `.mk` wrapper's inherited
 * `line-height:1.6` is re-applied as `leading-[1.6]` on each cell (Tailwind's preflight would
 * otherwise give 1.5), so the label's line box — and therefore the cell height — is unchanged.
 *
 * Columns: 4 from 981px, 2 at 681–980px, 1 at ≤680px — the old `max-width:980px`/`680px` media
 * queries expressed mobile-first as `min-[681px]:`/`min-[981px]:` (same convention as
 * `EnquirySplit`/`BenefitCards`). Tracks are `repeat(N,1fr)` (not `minmax(0,1fr)`), as in the
 * original.
 *
 * **Reuse check** — nothing existing fits:
 * - `BenefitCards` is the nearest (same hairline 4 → 2 → 1 grid on `surface` cells), but each card
 *   is a *stacked* icon (30px) above a serif `<h3>` title and a description paragraph, with
 *   34/40px padding, a hover lift/shadow and an optional CTA row. Amenities have no description
 *   and lay the icon *beside* a single label in a short, static row; making `title`/`description`
 *   optional and adding a horizontal variant would change that component's defining layout.
 * - `IconFeatureGrid` bakes in its own tinted/bordered band, `Container` and centred heading, and
 *   lays items out as a 48px icon *circle* beside a title + description, fixed at 1 → 3 columns
 *   with a 30px gap — no hairline cells, no 4-up grid, and it can't be used bare.
 * - `ChipBar` is a single wrapping row of rounded pill `<button>`s (with active/soon states)
 *   inside a filter bar with an eyebrow label — an interactive filter control, not a static grid.
 * - `SpecStrip` is a flex strip of big serif *values* over uppercase labels (no icons, no cells).
 * - `PhotoFeatureGrid` is full-bleed photo cards with white text over a scrim.
 * Hence a new primitive (those are left untouched).
 *
 * Bare (no own `Section`/`Container`/heading — the caller owns the section shell and its
 * `SectionHead`, same as `BenefitCards`/`StatTiles`). No entrance animation (Buildings detail is
 * static: its raw `.reveal` was neutralised by the old `mock.css`); wrap it in `Reveal` where a
 * page animates. Purely presentational: no i18n, no data fetching,
 * no icon registry, no `@core/media`.
 */
export function AmenityGrid({
  items,
  className,
}: {
  items: AmenityGridItem[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[1fr] gap-px border border-line bg-line",
        "min-[681px]:grid-cols-[repeat(2,1fr)] min-[981px]:grid-cols-[repeat(4,1fr)]",
        className,
      )}
    >
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-[14px] bg-surface px-[26px] py-6 leading-[1.6]">
          {item.icon ? (
            <span className="flex flex-none text-accent-deep [&_svg]:h-[22px] [&_svg]:w-[22px] [&_svg]:shrink-0">
              {item.icon}
            </span>
          ) : null}
          <span className="text-[15px] text-ink">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
