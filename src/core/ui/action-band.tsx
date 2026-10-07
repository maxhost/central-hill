export type ActionBandCta = {
  href: string;
  /** Pre-translated button label — the band appends the trailing " →". */
  label: string;
  /** Opens in a new tab with `rel="noopener noreferrer"` (e.g. an external booking-engine URL). */
  external?: boolean;
};

/**
 * Full-bleed dark "feature" band (`bg-feature`/`text-on-feature*`) with copy on the left —
 * eyebrow, serif `<h2>`, short supporting line — and an action column on the right: one solid
 * accent button with a small note under it. The two sides wrap onto separate rows (copy above,
 * action below) when they no longer fit side by side. First built extracting
 * `building-detail.tsx`'s closing "Book an apartment in this building" band (`bookband` in
 * `bodyHtml()`), ported 1:1 from the live `.mk`-scoped `.bookband`/`.inner`/`.eyebrow`/`h2`/
 * `.sub`/`.act`/`.note` rules (that page's old `PAGE_STYLE`, identical to
 * `mock/building-detail.html`) plus the old `mock.css`'s inherited `.wrap`, `.eyebrow`, `h2`, `.mk`
 * body rhythm and `.btn.btn-accent`.
 *
 * Not one of the existing dark/CTA primitives:
 * - **`FeaturePanel`** is a single bordered panel with its copy stacked vertically, a 30px
 *   `<h3>` and the CTA *under* the copy — this is a borderless full-bleed band, a fluid
 *   `clamp(28px,3.6vw,46px)` `<h2>` and the CTA in its own column beside the copy.
 * - **`FeatureCtaBand`** is always a two-column photo + copy split (the image isn't optional).
 * - **`CalloutBand`** is a light, accent-tinted, rounded and shadowed callout box, not a dark
 *   full-bleed band, and has no note under its CTA.
 * Bending any of them to this shape would change their existing consumers' render.
 *
 * The button is **not** `ButtonLink`: its `primary` variant is `rounded-md`, `py-3`, no
 * hairline border, no letter-spacing, `text-surface`, `transition-colors` and `next/link` —
 * while the original `.btn.btn-accent` is `border-radius:3px`, `padding:14px 28px`, a 1px
 * transparent border (part of its 52.39px height), `letter-spacing:.01em`, white text,
 * `transition:.25s` on all properties and a plain `<a>` (the href is either an external Avantio
 * URL or an in-page `#book` anchor). Those values are ported literally here instead. Flex-item
 * blockification makes the button (and the note) compute to `display:flex`/`block` with their
 * content width — same as the original, since the action column is `align-items:flex-start`.
 *
 * Static on purpose: the original's `.reveal` was neutralised by `mock.css` and this page
 * mounts no scroll-reveal script, so the band never animated. The colors are tokens; the
 * heading and button text are plain `text-white` (the original's `#fff`, not `on-feature`).
 *
 * Purely presentational, per the `core/ui` ground rule: no i18n, no fetching, no domain types —
 * every string arrives pre-translated. Owns its full-bleed `<section>` + 1240px/28px column (the
 * original `.wrap`, i.e. the old `mock.css` `--max` — see `ProseSection`'s docstring for the
 * flagged drift vs. `Container`'s `max-w-7xl`) and sets the inherited `line-height:1.6` itself (the
 * eyebrow's line box, the button's 22.4px and the note's 20px line heights all derive from it).
 * The original section's padding was `0` (inline `style`), with the vertical rhythm (64px) on
 * the inner flex row — kept as-is.
 */
export function ActionBand({
  eyebrow,
  title,
  body,
  cta,
  note,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  cta: ActionBandCta;
  /** Small line under the button (e.g. "Real-time availability & pricing via Avantio."). */
  note?: string;
}) {
  return (
    <section className="scroll-mt-[84px] bg-feature leading-[1.6] text-on-feature">
      <div className="mx-auto max-w-[1240px] px-[28px]">
        <div className="flex flex-wrap items-center justify-between gap-[30px] py-16">
          <div>
            {eyebrow ? (
              <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-feature-accent">{eyebrow}</span>
            ) : null}
            <h2 className="mt-3 mb-[14px] max-w-[18ch] font-serif text-[clamp(28px,3.6vw,46px)] font-medium leading-[1.08] tracking-[-0.015em] text-white">
              {title}
            </h2>
            {body ? <p className="max-w-[46ch] text-[15px] text-on-feature-soft">{body}</p> : null}
          </div>
          <div className="flex flex-col items-start gap-3">
            <a
              href={cta.href}
              {...(cta.external ? { target: "_blank", rel: "noopener noreferrer" } : null)}
              className="inline-flex cursor-pointer items-center gap-[0.5em] rounded-[3px] border border-transparent bg-accent px-7 py-[14px] text-[14px] font-medium tracking-[0.01em] text-white transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-accent-deep"
            >
              {`${cta.label} →`}
            </a>
            {note ? <span className="text-[12.5px] tracking-[0.02em] text-on-feature-soft">{note}</span> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
