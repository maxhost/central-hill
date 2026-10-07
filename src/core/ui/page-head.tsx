import type { ReactNode } from "react";

/**
 * Light, centred page header band: an uppercase eyebrow, the page's serif `<h1>`, a lede and
 * an optional slot below them (`children`, e.g. `PageHeadSearch`), on a full-bleed band tinted
 * `line` 30% into `bg` with a hairline bottom border. It is the photo-less counterpart of `Hero`
 * for listing pages whose top is text-led. First consumer: the Blog listing
 * (`slices/blog/ui/blog-listing.tsx`), a 1:1 port of its old `.mk`-scoped `section.blog-head`
 * (`mock/blog.html`): band `color-mix(in srgb,var(--line) 30%,var(--bg))` +
 * `border-bottom:1px solid var(--line)`; `.wrap` (`1240px`, `28px` gutters) with `128px` top /
 * `64px` bottom padding, centred text; `.eyebrow`; `h1` `clamp(34px,4.6vw,58px)`, `max-width:18ch`,
 * `margin:14px auto 18px`; `.lede` `18px` `ink-soft`, `max-width:60ch`, centred.
 *
 * **Header offset.** The `128px` top padding is kept as-is. The page has no `[data-hero]`, so
 * `globals.css` keeps `#main`'s `4rem` top padding (the fixed nav's height) and the band starts
 * just under the nav, exactly as the raw section did. Do not add `data-hero` here: the nav
 * would then overlay a light band with white (transparent-state) content.
 *
 * **Look.** The eyebrow uses `SectionHead`'s eyebrow classes (`12px/600/.18em` uppercase,
 * `accent-deep`). The `<h1>` uses the shared serif heading treatment (`500`, `1.08` leading,
 * `-0.015em` tracking, `ink`) at the blog-head size. The band sets `leading-[1.6]` to keep the
 * `.mk` wrapper's inherited `line-height:1.6` for the search input (the lede sets it again, as
 * `SectionHead` does, because `text-lg` carries its own leading),
 * because outside `.mk` the page would fall back to Tailwind's `1.5`.
 *
 * **Reuse check**: not `Hero` (a full-bleed photo/video band with a scrim, white copy and the
 * nav overlaying it via `data-hero`; making its media optional and its palette light would
 * change every Hero consumer), not `SectionHead` (an `<h2>` section head with a smaller title
 * and no band or shell; a page needs exactly one `<h1>`), not `CenteredCtaBand` (dark feature
 * band, `<h2>`, a button rather than a free slot), not `ChipBar` (a bordered chip row with no
 * heading).
 *
 * Includes its own full-bleed `<section>` shell (`84px` scroll margin, like the `.mk section`
 * it replaces). Purely presentational: no data, no i18n, no entrance animation (the raw `.reveal`
 * was neutralised by the old `mock.css`, so it renders statically).
 */
export function PageHead({
  id,
  eyebrow,
  headline,
  intro,
  children,
}: {
  /** Optional scroll anchor on the `<section>`. */
  id?: string;
  /** Small uppercase label above the title. */
  eyebrow?: ReactNode;
  /** The page's `<h1>` (capped at `18ch`, centred). */
  headline: ReactNode;
  /** Lede paragraph under the title (capped at `60ch`, centred). */
  intro?: ReactNode;
  /** Optional content under the lede (`34px` below it when it is a `PageHeadSearch`). */
  children?: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-[84px] border-b border-line bg-[color-mix(in_srgb,var(--color-line)_30%,var(--color-bg))] leading-[1.6]"
    >
      <div className="mx-auto max-w-[1240px] px-[28px] pb-16 pt-32 text-center">
        {eyebrow ? (
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-deep">{eyebrow}</span>
        ) : null}
        <h1 className="mx-auto mb-[18px] mt-[14px] max-w-[18ch] font-serif text-[clamp(34px,4.6vw,58px)] font-medium leading-[1.08] tracking-[-0.015em] text-ink">
          {headline}
        </h1>
        {intro ? <p className="mx-auto max-w-[60ch] text-lg leading-[1.6] text-ink-soft">{intro}</p> : null}
        {children}
      </div>
    </section>
  );
}

/**
 * Pill-shaped search field for `PageHead`'s slot: a real `<form role="search">` holding an
 * `<input type="search" name="q">` with the Iconoir search glyph inset on the left. 1:1 port of
 * the Blog listing's old `.mk .blog-search` rules: `560px` max width, `34px` above, glyph `20px`
 * `ink-soft` at `left:20px` vertically centred; input `15px` sans `ink` on `surface`, `line` border,
 * fully rounded, `16px 22px 16px 52px` padding, `.2s` transition, `ink-soft` placeholder, and on
 * focus an `accent` border plus a `3px` `accent` 18% ring (no outline).
 *
 * **Search is not implemented yet (inert).** Blog search is a follow-up. `action` defaults to
 * `undefined`, so the form submits a plain GET to the current URL (`?q=…`), which just reloads
 * the same static page: harmless, and no JS is involved. The consumer must not read
 * `searchParams` to "handle" it, because that would make the ISR page dynamic. When search lands,
 * pass `action` (a results route), or swap in a client island; the markup stays the same.
 *
 * The glyph comes from the caller as `icon` (a server parent's `<Icon name="search" size={20} />`
 * from `@core/ui/icon`, ADR 0034: this module is in the client-importable barrel, so it can't
 * render `<Icon>` itself). Same outside-`.mk` rule as `PageHead`.
 */
export function PageHeadSearch({
  placeholder,
  label,
  action,
  icon,
}: {
  /** Input placeholder (e.g. "Search articles…"). */
  placeholder: string;
  /** Accessible name for the search landmark and the input. */
  label: string;
  /** Form `action` (GET). Omit while search is inert: the form then submits to the current URL. */
  action?: string;
  /** Search glyph (20px, `ink-soft`, decorative), inset on the left of the field. */
  icon: ReactNode;
}) {
  return (
    <form role="search" aria-label={label} action={action} className="relative mx-auto mt-[34px] max-w-[560px]">
      <span className="absolute left-5 top-1/2 flex -translate-y-1/2 text-ink-soft">{icon}</span>
      <input
        type="search"
        name="q"
        placeholder={placeholder}
        aria-label={label}
        className="w-full rounded-full border border-line bg-surface py-4 pl-[52px] pr-[22px] font-sans text-[15px] text-ink transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] placeholder:text-ink-soft focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_18%,transparent)] focus:outline-none"
      />
    </form>
  );
}
