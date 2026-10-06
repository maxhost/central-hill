import type { ReactNode } from "react";
import { cn } from "./cn";

export interface ChipBarItem {
  /** Stable React key — not rendered. */
  key: string;
  label: ReactNode;
  /** Iconoir glyph class (e.g. `"iconoir-pin"`), rendered before `label`. The icon font is
   *  loaded globally by `mock.css` (`@import … iconoir.css`), so it resolves outside `.mk` too. */
  icon?: string;
  /** Selected/current chip — solid ink pill, no hover state (matches the mock: an already-
   *  active chip doesn't visually react to hover). */
  active?: boolean;
  /** Disabled/placeholder chip (a city or filter not live yet) — soft, `cursor-default`,
   *  no label-color hover change (only the border still darkens on hover, ported verbatim
   *  from the mock's `.chip:hover` / `.is-soon` cascade order). */
  soon?: boolean;
  /** Small uppercase badge shown at the end of a `soon` chip (e.g. "Soon"). Ignored when
   *  `soon` is false. */
  soonLabel?: ReactNode;
  /** Optional colour dot (9px circle) rendered before `icon`/`label` — the blog's category
   *  `.cat-tab .swatch`. Any CSS colour value, applied as an inline `background`: a design
   *  token (`"var(--color-accent)"`) or admin-entered data such as a category's `#hex`. The
   *  **caller** validates data-sourced values before passing them (see the blog's
   *  `CategoryTabs`); React's style object keeps the value inside the one property, so an
   *  invalid colour is ignored by the browser, never injected. */
  swatch?: string;
}

/**
 * A bordered, pill-shaped chip row inside a full-bleed hairline bar — eyebrow-style label,
 * flex-wrap chip group, optional trailing note. Ported from `guides-listing.tsx`'s old
 * `.mk`-scoped `.city-bar`/`.city-chips`/`.city-chip`/`.city-note` CSS (the "Choose your
 * city" bar on `/guides`).
 *
 * Not a new variant of an existing primitive: nothing in `core/ui` renders a bordered pill
 * row (`CalloutBand`/`FeatureCtaBand`/`FeaturePanel` are single highlighted bands;
 * `PricingCards`/`StepGallery` are card grids; `StatBand`/`SpecStrip` are value/label
 * strips, not clickable chips). The closest *visual* cousin is `buildings-listing.tsx`'s
 * raw `.filterbar` (same hairline-bar-with-color-mix-background shell), but that bar pairs
 * a `<select>` with plain `.chip`s (no icon, no "soon" sub-state) — a different enough
 * shape that forcing both into one generic component now would be speculative; that slice's
 * raw markup is untouched here (golden rule 1 — not this task's directory).
 *
 * **Second consumer — the blog's category tabs** (`src/slices/blog/ui/components/
 * category-tabs.tsx`, mock `blog.html` `.cat-tabs`/`.cat-tab`). Same role (a row of pill
 * filters with one solid-ink active pill) and the same chip look, so it reuses this component
 * instead of a near-duplicate. The mock's micro-differences (`.cat-tab` has 18px side padding,
 * an 8px icon gap and a 10px row gap vs. this chip's 16px/7px/9px) are deliberately **not**
 * reproduced: cross-page consistency wins over per-mock fidelity. Everything it needed was
 * added **additively**, with defaults that render the Guides city bar byte-for-byte as before:
 * `label` is optional; `variant="plain"` drops the full-bleed hairline bar (no border, no tinted
 * background, no `py-6`) for a bare chip row; `align="center"` centres the chips;
 * `ChipBarItem.swatch` adds a colour dot; and `onSelect` (passable only from a client
 * component, since functions can't cross the RSC boundary) wires each chip's `onClick` and
 * exposes its state as `aria-pressed`. Without `onSelect` the chips stay inert, as on Guides.
 * The file stays directive-free (no hooks), so Guides renders it as a server component and it
 * is bundled into the client only where a client component imports it.
 *
 * Deliberately **presentational only** — no internal state, no routing. The guides index
 * doesn't currently filter by city (`listGuideCityGroups` renders every published city's
 * section unconditionally; see `guides-listing.tsx`'s docstring), so this component has no
 * click handler to wire: it only renders `active`/`soon` as styling. A future real
 * city-filter/city-switch would decide server-component vs. client-component boundaries at
 * that point (likely a thin client wrapper choosing `active`/`href` per item, or routing
 * through `next/link` here) — out of scope for this pass.
 *
 * MUST be rendered **outside** any `.mk`-scoped subtree: `mock.css`'s `.mk * { margin:0;
 * padding:0 }` reset is an un-layered rule, and `@import "tailwindcss"` wraps every Tailwind
 * utility in a cascade layer — an un-layered rule always wins over a layered one regardless
 * of specificity, so nesting this inside `.mk` would silently zero its own `py-6`/`gap-4`/
 * chip padding (see `SpecStrip`'s docstring for the same trap, first hit on
 * `building-detail.tsx`). `guides-listing.tsx` renders this between two separate `.mk`
 * blocks (hero, then the DB-driven city sections) instead of one continuous one — CSS
 * selectors don't care about DOM proximity, so the shared `<style>` tag in the first block
 * still reaches `.mk` elements in the second.
 *
 * The inner column is a bespoke `max-w-[1240px] px-7` wrap, matching the mock's raw `.wrap`
 * (`max-width:1240px; padding:0 28px`) exactly, **not** `core/ui`'s `<Container>`
 * (`max-w-7xl`/1280px + `px-6 md:px-10`/24–40px — the choice `building-detail.tsx` made for
 * `SpecStrip`). Tried `Container` first; live-measured against both the mock and the
 * pre-port render (this component's extraction task's Lesson 2 check) it was off by
 * 8–12px horizontally depending on breakpoint, **and**, at tablet width (834px), its
 * narrower content box pushed the three-chip row (+ label + note) past the point where it
 * still fits on one line, wrapping to two lines where the mock doesn't. That's a visible
 * layout regression, not just a position nudge, so this component doesn't inherit the
 * `Container` approximation `SpecStrip` accepted — it reproduces the mock's own wrap width
 * precisely instead.
 *
 * `label`/`note` use arbitrary `text-[12px]` rather than the `text-xs` preset deliberately:
 * Tailwind's `text-xs` bundles its own `line-height` (`calc(1/0.75)` → 16px at 12px font),
 * ~3px shorter than the browser's default "normal" line-height the raw CSS relied on (no
 * `line-height` was ever declared on `.cb-label`/`.city-note`). Measured live pre/post-port:
 * `text-xs` measurably shrank the label/note line box; the arbitrary value does not.
 *
 * Active/soon/hover states are expressed as three disjoint className branches rather than
 * composed utility layers, because the mock's hover behaviour isn't reproducible by just
 * adding `hover:*` utilities on top of the base chip: in the raw CSS, `.city-chip:hover`
 * and `.city-chip.is-active`/`.is-soon` share the same specificity (one class + the base),
 * so source order decides the winner per state (`is-active` sits after `:hover` in the
 * stylesheet, so an active chip's hover is a no-op; `is-soon` likewise wins its own color).
 * Tailwind utilities don't carry that source-order guarantee (`hover:` variants are a higher-
 * specificity pseudo-class, so a global `hover:text-ink` would leak onto the active chip).
 * Branching per state reproduces the mock's actual hover behaviour instead of relying on
 * output order.
 */
export function ChipBar({
  label,
  items,
  note,
  variant = "bar",
  align = "start",
  onSelect,
  className,
}: {
  /** Eyebrow-style label before the chips (e.g. "Choose your city"); omit for a bare row. */
  label?: ReactNode;
  items: ChipBarItem[];
  note?: ReactNode;
  /** `"bar"` (default): full-bleed hairline bar, tinted background, `py-6`. `"plain"`: only the
   *  1240px/28px column with the chips; the caller owns vertical spacing. */
  variant?: "bar" | "plain";
  /** Horizontal placement of the chips inside their group (default `"start"`). */
  align?: "start" | "center";
  /** Click handler (receives the item `key`). When set, chips become toggle buttons with
   *  `aria-pressed`. Client components only; omitted → inert chips (styling only). */
  onSelect?: (key: string) => void;
  className?: string;
}) {
  const bar = variant === "bar";
  return (
    <div
      className={cn(
        bar && "border-b border-line bg-[color-mix(in_srgb,var(--color-line)_26%,var(--color-bg))]",
        className,
      ) || undefined}
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-[1240px] flex-wrap items-center gap-4 px-7",
          bar && "py-6",
        )}
      >
        {label ? (
          <span className="text-[12px] font-semibold tracking-[0.14em] text-ink-soft uppercase">{label}</span>
        ) : null}
        <div
          className={cn(
            "flex min-w-[240px] flex-1 flex-wrap gap-[9px]",
            align === "center" && "justify-center",
          )}
        >
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-disabled={item.soon || undefined}
              aria-pressed={onSelect ? Boolean(item.active) : undefined}
              onClick={onSelect ? () => onSelect(item.key) : undefined}
              className={cn(
                "inline-flex items-center gap-[7px] rounded-full border px-4 py-[9px] text-[13px] font-medium tracking-[0.01em] transition-colors duration-200 ease-in-out",
                item.active
                  ? "cursor-pointer border-ink bg-ink text-bg"
                  : item.soon
                    ? "cursor-default border-line bg-surface text-ink-soft opacity-70 hover:border-ink-soft"
                    : "cursor-pointer border-line bg-surface text-ink-soft hover:border-ink-soft hover:text-ink",
              )}
            >
              {item.swatch ? (
                <span
                  className="inline-block size-[9px] rounded-full"
                  style={{ background: item.swatch }}
                  aria-hidden="true"
                />
              ) : null}
              {item.icon ? <i className={item.icon} aria-hidden="true" /> : null}
              {item.label}
              {item.soon && item.soonLabel ? (
                <span className="text-[10px] font-semibold tracking-[0.12em] text-accent-deep uppercase">
                  {item.soonLabel}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        {note ? (
          <span className="text-[12px] tracking-[0.04em] whitespace-nowrap text-ink-soft">{note}</span>
        ) : null}
      </div>
    </div>
  );
}
