import type { ReactNode } from "react";
import { cn } from "./cn";

export type UnitCardSpec = {
  /** Caller-built inline `<svg>` glyph — the card sizes it to 16px and tints it `accent-deep`. */
  icon: ReactNode;
  /** The visible value next to the icon (e.g. `2`, `66`). */
  value: ReactNode;
  /** Pre-translated accessible name, rendered as the chip's `title` (e.g. "2 Beds"). */
  label: string;
};

/**
 * Bookable-unit card — cover photo (zooms 1.04 on hover), optional badge, serif name, a row of
 * icon+value spec chips (bedrooms/beds/guests/size) and an underlined "Check availability →"
 * CTA, the whole card one plain `<a>` that lifts on hover. First built extracting
 * `building-detail.tsx`'s "Apartments in this Building" grid (`apartmentCardHtml()` in
 * `bodyHtml()`), ported 1:1 from the live `.mk`-scoped `.pcard`/`.ph`/`.badge`/`.pbody`/
 * `.pbody h3` CSS (`src/app/mock.css`) plus the page's own `.pspecs`/`.pspec`/`.pbody .check`
 * rules (its old `PAGE_STYLE`, from `mock/building-detail.html`).
 *
 * **Not `PropertyCard`**, though both are "photo + name + meta" cards on the same `.pcard`
 * chrome: `PropertyCard` (Home/Guest featured carousel) pads its body `p-6` (vs. this
 * `22px 24px 26px`), sets a 24px name with no bottom margin (vs. 25px + 6px), has no image
 * zoom on hover, renders a plain uppercase text `meta` line (vs. a row of icon+value chips with
 * per-chip `title`s), a bare `viewLabel` (vs. the underlined/arrowed `.check` CTA that turns
 * `accent` on card hover) and links with `next/link` (these cards link **out**, to the Avantio
 * booking engine, in a new tab — or to an in-page `#book` anchor). Bending `PropertyCard` to
 * cover all of that would change its Home consumers' render; a separate primitive keeps both
 * pixel-exact. Also not the apartments slice's `ApartmentCard` (a different, Tailwind-native
 * look) nor buildings' `BuildingListingCard` (slice-internal, `BuildingSummary`-coupled, text
 * meta line + teaser).
 *
 * Purely presentational, per the `core/ui` ground rule: no `@core/media`, no i18n, no domain
 * types. `image` is the caller's already-resolved `<MediaImage>`/`<img>` — the card styles it
 * through a child selector (full-bleed `object-cover`, the 0.6s hover zoom) so callers only
 * pick the source/`sizes`/loading. `badge`, `ctaLabel` and every spec `label` are pre-translated.
 *
 * Hover values are ported as literal `transform`s (`translateY(-4px)`, `scale(1.04)`), not
 * Tailwind's `-translate-y-1`/`scale-[1.04]` (which drive the separate `translate`/`scale`
 * properties) — visually identical, but keeps the computed `transform` byte-equal to the live
 * page the extraction was verified against.
 *
 * **One deliberate deviation from the source**: the badge gets `z-[1]`. In the old markup the
 * absolutely-positioned badge came *before* the `<img>`; once hover applies the image's
 * `transform`, the image becomes a stacking layer painted later in DOM order and **covered the
 * badge for as long as the card was hovered** (confirmed live before extraction). Every other
 * `.pcard`-style card on the site keeps its badge visible on hover (`PropertyCard` puts it after
 * the image, `BuildingListingCard` gives it `z-10`), so this is treated as a paint-order bug, not
 * design. Non-hover render is unchanged.
 *
 * MUST be rendered **outside** any `.mk`-scoped subtree (see `SpecStrip`'s docstring:
 * `mock.css`'s un-layered `.mk * { margin:0; padding:0 }` reset beats any `@layer`-wrapped
 * Tailwind utility regardless of specificity). Expects an inherited `line-height: 1.6` (the
 * `.mk` body rhythm the spec chips/CTA heights derive from) — `UnitCardGrid` does not set it;
 * the enclosing section should (as `building-detail.tsx`'s apartments section does).
 */
export function UnitCard({
  href,
  external,
  image,
  name,
  badge,
  specs,
  ctaLabel,
}: {
  href: string;
  /** Opens in a new tab with `rel="noopener noreferrer"` (an external booking-engine URL). */
  external?: boolean;
  /** Caller's own `<MediaImage>`/`<img>`; sizing + hover zoom are applied by the card. */
  image: ReactNode;
  name: string;
  /** Pre-translated badge (e.g. "Best View") — omitted entirely when absent. */
  badge?: string | null;
  /** Spec chips in display order; pass only the ones that apply (e.g. omit size when unknown). */
  specs: UnitCardSpec[];
  /** Pre-translated CTA label — the card appends the trailing " →". */
  ctaLabel: string;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : null)}
      className="group block overflow-hidden border border-line bg-surface text-ink transition-all duration-300 ease-in-out hover:[transform:translateY(-4px)] hover:[box-shadow:0_20px_44px_-26px_rgba(0,0,0,0.42)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden [&_img]:block [&_img]:h-full [&_img]:w-full [&_img]:max-w-full [&_img]:object-cover [&_img]:transition-[transform] [&_img]:duration-[600ms] [&_img]:ease-in-out group-hover:[&_img]:[transform:scale(1.04)]">
        {badge ? (
          <span className="absolute left-[14px] top-[14px] z-[1] bg-accent px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.13em] text-white">
            {badge}
          </span>
        ) : null}
        {image}
      </div>
      <div className="px-6 pt-[22px] pb-[26px]">
        <h3 className="mb-[6px] font-serif text-[25px] font-medium leading-[1.08] tracking-[-0.015em] text-ink">
          {name}
        </h3>
        <div className="mt-1 flex flex-wrap gap-[14px]">
          {specs.map((s, i) => (
            <span
              key={i}
              title={s.label}
              className="inline-flex items-center gap-[5px] text-[13px] font-semibold text-ink-soft [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-accent-deep"
            >
              {s.icon}
              {s.value}
            </span>
          ))}
        </div>
        <span className="mt-[18px] inline-flex items-center gap-[0.45em] border-b border-b-[color-mix(in_srgb,var(--color-accent-deep)_35%,transparent)] pb-[2px] text-[13.5px] font-semibold tracking-[0.02em] text-accent-deep transition-all duration-200 ease-[ease] group-hover:text-accent">
          {ctaLabel} →
        </span>
      </div>
    </a>
  );
}

/**
 * The responsive grid `UnitCard`s sit in — 3 columns, 2 at ≤980px, 1 at ≤680px, 26px gap
 * (the live `.pf-grid` rule + its `mock.css` breakpoints, ported 1:1). Bare layout only: no
 * section padding, heading or background — the caller composes those around it.
 */
export function UnitCardGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-[26px] min-[681px]:grid-cols-2 min-[981px]:grid-cols-3", className)}>
      {children}
    </div>
  );
}
