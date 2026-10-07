import type { ReactNode } from "react";
import { Container } from "./container";
import { cn } from "./cn";
import { UiIcon } from "./ui-icon";

/**
 * Page hero (S9). A full-width media band with an overlaid editorial headline.
 *
 * `background` is caller-built (its own `<video>`, `<MediaImage>`, or `<img>` — whatever
 * precedence/fallback it needs) and rendered absolutely-positioned behind the gradient
 * scrim; this keeps `@core/media` out of `core/ui` (golden rule 3 — the kernel's UI layer
 * stays presentation-only, no slice/media-resolution coupling), the same pattern
 * `TwoColumnShowcase`/`PropertyCard`/`DualCtaPanels` already use for their images.
 *
 * Two layouts: the default single-column editorial hero, or — when `aside` is provided
 * (Owners earnings-estimate card) — a two-column band with the copy on the left and the
 * slotted card bottom-aligned on the right, at the exact proportions/gap the live Owners
 * page's `.mk`-scoped hero override used (`grid-template-columns:1.1fr .9fr;gap:40px`,
 * `34px` under 980px) — not `mock/owners.html`'s original (now-superseded) values.
 * `compact` lowers the minimum height and headline size for these form-bearing heroes so
 * the page below stays close. The headline size (`clamp(40px,5.4vw,68px)`) was the old live
 * cascade's actual winner — the old `mock.css`'s `.hero.compact h1` (3 classes) beat the
 * `.owner-hero h1` override (2 classes) on specificity even though the latter read as
 * the "more specific" one; verified against a real render, not just the stylesheet. The
 * no-wrap/no-max-width (from `.owner-hero h1`, which *did* win there — nothing else set
 * those two properties) is what lets the stacked `;`-joined headline sit one phrase per
 * line. Only Owners uses `aside`/`compact` today.
 *
 * `headline` accepts a `ReactNode` (not just a string) so a caller can join stacked
 * phrases with `<br/>` (Owners' "Your Property. / Our Expertise. / Maximum Returns.").
 * `copyClassName`/`actionsClassName`/`id` are additive escape hatches for a caller whose
 * live design has already drifted from this component's own defaults in one specific
 * spot — used today only by Owners (unconstrained copy width, `28px` actions gap, the
 * `#worth` anchor target) — Home keeps the defaults.
 *
 * `eyebrowPill` renders the eyebrow as the mock's solid accent badge ("★ …").
 *
 * Third consumer, Buildings' listing hero (single-column, no `aside`, portrait-photo-safe
 * text): needed five more additive escape hatches, all opt-in/`undefined`-default so Home/
 * Owners are byte-for-byte unaffected. `align` (`items-end` default vs `items-center`,
 * Buildings' CSS override) and `wrapClassName` (bypasses the shared `Container` entirely —
 * rendered as a plain `<div>` instead — since Buildings' `1600px` wrap is *wider* than
 * `Container`'s own `max-w-7xl`, which can't be overridden by an appended className without
 * two conflicting `max-w-*` utilities fighting on Tailwind's generated-CSS order rather than
 * JSX source order) are genuinely new concepts. `overlayClassName`/`headlineClassName`/
 * `subtitleClassName` *replace* (never append to) their default computed class string — same
 * "swap, don't stack conflicting utilities" reasoning as `copyClassName` already used, and why
 * `headlineClassName` had to be added rather than reusing `compact` as-is: `compact`'s current
 * `whitespace-nowrap`/`max-w-none` is not actually part of the mock's generic `.hero.compact`
 * rule (which only shrinks the font-size clamp) — it's `.owner-hero h1`'s page-specific
 * override baked into this component's only prior `compact` consumer (Owners). Buildings is
 * also `compact` (same min-height/font-size) but keeps the generic *wrapping* behavior at its
 * own width (`26ch`, not the mock's base `15ch`), which the old hard-coded ternary couldn't
 * express — hence `headlineClassName` fully replacing the compact/non-compact default instead.
 *
 * Fourth consumer, Buildings' detail-page hero (`building-detail.tsx`) — a different shape
 * from the other three: a breadcrumb trail sits above the eyebrow line, and the eyebrow
 * line itself can carry an inline "★ New" flag before its text. Two more additive, caller-
 * built slots cover this: `breadcrumb` (any `ReactNode`, rendered first in the copy column —
 * the locale-aware `<Link>` trail is the caller's job, same "kernel owns layout, caller owns
 * content" split as `actions`/`aside`) and `eyebrowBadge` (rendered inline immediately before
 * the `eyebrow` text, only in the plain-text eyebrow branch — ignored when `eyebrowPill` is
 * set, since that's a different, mutually-exclusive look already). The old `.mk .hero .addr`
 * line (the street address under the headline) just reuses `subtitle` + `subtitleClassName`
 * (no new prop needed — same escape hatch Buildings' listing hero already uses for its wider
 * copy). It also has to pass its own `headlineClassName` (`max-w-[15ch]`, normal wrap) rather
 * than take the `compact` default — that default's `whitespace-nowrap`/`max-w-none` is Owners'
 * own page-specific override (see above), not the mock's *generic* `.hero.compact h1` rule
 * (font-size only, keeps the base `max-width:15ch` + normal wrapping), which is what this
 * page's building-name headline actually needs so a long name wraps instead of overflowing.
 * This slice also uses `@core/media`'s `MediaImage` as `background` for the first time (a real
 * R2 cover, not a fixed Unsplash/Pexels literal) — no component change needed for that,
 * `background` was always caller-built.
 */
export function Hero({
  background,
  breadcrumb,
  eyebrow,
  eyebrowPill,
  eyebrowBadge,
  headline,
  subtitle,
  actions,
  actionsClassName,
  aside,
  compact,
  copyClassName,
  id,
  align = "end",
  overlayClassName,
  headlineClassName,
  subtitleClassName,
  wrapClassName,
}: {
  background?: ReactNode;
  /** Rendered above the eyebrow line (Buildings detail's breadcrumb trail). Caller-built. */
  breadcrumb?: ReactNode;
  eyebrow?: string;
  eyebrowPill?: boolean;
  /** Rendered inline before the eyebrow text (e.g. a small "★ New" flag) — ignored when `eyebrowPill` is set, a different standalone look. */
  eyebrowBadge?: ReactNode;
  headline: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
  /** Overrides the actions row's default `mt-8` (Owners' live CSS uses `28px` → `mt-7`). */
  actionsClassName?: string;
  aside?: ReactNode;
  compact?: boolean;
  /** Overrides the copy column's default max-width (Owners' live CSS uses `none`). */
  copyClassName?: string;
  id?: string;
  /** Vertical anchor of the copy within the band (Buildings centers it; everyone else is bottom-anchored). */
  align?: "end" | "center";
  /** Replaces the default dark gradient scrim entirely (Buildings' photo needed a stronger one). */
  overlayClassName?: string;
  /** Replaces the whole compact/non-compact headline size+width+wrap default (see docstring). */
  headlineClassName?: string;
  /** Replaces the subtitle's default `mt-5 max-w-xl text-lg` (color/line-height always stay). */
  subtitleClassName?: string;
  /** Renders a plain `<div>` with this className instead of the shared `Container` (needs a wider-than-kernel max-width). */
  wrapClassName?: string;
}) {
  const copy = (
    <div className="text-surface">
      {breadcrumb}
      {eyebrow ? (
        eyebrowPill ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-surface">
            <UiIcon name="star" size="1em" className="[&_path]:fill-current" />
            {eyebrow}
          </span>
        ) : (
          <span className="text-xs font-medium uppercase tracking-[0.16em] text-feature-accent">
            {eyebrowBadge}
            {eyebrow}
          </span>
        )
      ) : null}
      <h1
        className={cn(
          "mt-4 font-serif font-medium leading-[1.05]",
          headlineClassName ??
            (compact
              ? "max-w-none whitespace-nowrap text-[clamp(2.5rem,5.4vw,4.25rem)]"
              : "max-w-[15ch] text-[clamp(2.75rem,7vw,5.5rem)]"),
        )}
      >
        {headline}
      </h1>
      {subtitle ? (
        <p
          className={cn(
            "leading-relaxed text-surface/85",
            subtitleClassName ?? "mt-5 max-w-xl text-lg",
          )}
        >
          {subtitle}
        </p>
      ) : null}
      {actions ? (
        <div className={cn("flex flex-wrap items-center gap-4", actionsClassName ?? "mt-8")}>
          {actions}
        </div>
      ) : null}
    </div>
  );

  const body = aside ? (
    <div className="grid items-end gap-[34px] min-[981px]:grid-cols-[1.1fr_0.9fr] min-[981px]:gap-10">
      <div className={copyClassName ?? "max-w-xl"}>{copy}</div>
      {aside}
    </div>
  ) : (
    <div className={copyClassName ?? "max-w-3xl"}>{copy}</div>
  );

  return (
    <section
      id={id}
      data-hero
      className={cn(
        "relative isolate flex overflow-hidden bg-feature",
        align === "center" ? "items-center" : "items-end",
        // `compact` keeps the headline smaller for form-bearing heroes (the aside card
        // shares the row) but still fills the viewport like the mock. The hero is
        // bottom-anchored (`items-end`) — this min-height is what sets the empty band above
        // the copy under the fixed navbar, so it's the one value that tunes that gap. It's a
        // floor, not a cap — Owners' card is tall enough that actual rendered height is
        // content-driven well past this minimum either way, confirmed against a live render.
        compact ? "min-h-[64vh]" : "min-h-[73.6vh]",
      )}
    >
      {background}

      <div
        className={cn(
          "absolute inset-0 -z-10",
          overlayClassName ?? "bg-gradient-to-t from-black/70 via-black/30 to-black/20",
        )}
        aria-hidden
      />

      {wrapClassName ? (
        <div className={wrapClassName}>{body}</div>
      ) : (
        <Container className="pb-[clamp(56px,9vh,104px)] pt-32">{body}</Container>
      )}
    </section>
  );
}
