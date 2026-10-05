import { cn } from "./cn";

export type ProseSectionSubsection = {
  heading: string;
  paragraphs: string[];
};

/**
 * Eyebrow + serif `<h2>` heading above a free-prose copy block (plain `<p>` paragraphs),
 * with one optional named subsection (its own `<h3>` + paragraphs) — e.g. Buildings' "The
 * Building" intro, optionally followed by "The Neighbourhood". First built extracting
 * `building-detail.tsx`'s "THE BUILDING" block (`buildingSection` in `bodyHtml()`), ported
 * 1:1 from its old `.mk`-scoped `section`/`.wrap`/`.sec-head`/`.eyebrow`/`h2.section-title`/
 * `.prose`/`.prose h3` CSS (`mock/building-detail.html` + the page's old `PAGE_STYLE`).
 *
 * **Checked against every existing `core/ui` component before building this one** (per
 * `docs/component-extraction-workflow.md`'s "check reuse before building" step) — none
 * cover this shape: `Section` is pure vertical-rhythm padding (no head, no prose); `Eyebrow`
 * is a bare label (no heading pairing); `EditorialSplit`/`IconFeatureGrid` both pair an
 * eyebrow+heading with a fixed *structured* body (a sticky CTA column / an icon grid), not
 * free-form DB-authored paragraphs; `NumberedFeatureGrid`/`StepGallery`/`ChipBar`/
 * `CalloutBand`/`StatBand`/`SpecStrip`/`PricingCards`/`FeaturePanel`/`FeatureCtaBand`/
 * `DualCtaPanels`/`TwoColumnShowcase`/`Carousel`/`PropertyCard` are all other fixed shapes.
 * Confirmed genuinely new. Lives in `core/ui` (not `slices/buildings`) because "eyebrow +
 * heading + free DB prose, optionally with one named subsection" is a generic editorial
 * pattern CLAUDE.md's own content types (city guides, blog, services) are likely to need
 * again, not something specific to a building.
 *
 * **Deliberately does NOT use `core/ui`'s own `Section` for vertical rhythm, nor
 * `Container`/`.wrap` for the content column** — checked the *live* computed styles of this
 * exact section at `/en/buildings/bairro-alto-view` (desktop/tablet/mobile) against both
 * `mock/building-detail.html` and `mock/assets/site.css` before writing a single class, per
 * the workflow doc's Lesson 2. Finding: this page's raw `.mk section` rule resolves
 * `padding: var(--section-y) 0` with `--section-y: clamp(72px, 10vw, 150px)` (confirmed —
 * live mobile computed `padding-top` is exactly `72px`), and `.mk .wrap` is
 * `max-width:1240px; padding:0 28px`. Both values **differ** from `core/ui`'s own
 * canonical tokens: `Section`'s rhythm is `clamp(64px,10vw,160px)` (`design-system.md`'s
 * documented value) and `Container`'s column is `max-w-7xl` (1280px) with `px-6 md:px-10`.
 * This is a **pre-existing drift** between `mock/assets/site.css`'s `--section-y`/`--max`
 * and the canonical kernel tokens — not introduced here, not this task's to silently
 * reconcile (CLAUDE.md golden rule 6: escalate, don't decide unilaterally). Porting this
 * component with the *live* literal values (`clamp(72px,10vw,150px)`, `1240px`/`28px`) keeps
 * this extraction pixel-identical to its current render, as the workflow doc requires;
 * flagged in the extraction report for the coordinator to decide whether a future pass
 * should unify `mock/assets/site.css`'s tokens with `design-system.md`'s canonical ones
 * (every other still-raw `.mk` section on every page shares this same drift, so that's a
 * site-wide decision, not a one-component one).
 *
 * No entrance animation wired in (unlike `EditorialSplit`, which bakes in its own `Reveal`):
 * `src/app/mock.css` explicitly neutralises `.mk .reveal { opacity:1; transform:none }`
 * (no scroll-reveal JS is loaded for raw `.mk` markup), so this exact section currently
 * renders static/always-visible. `building-detail.tsx`'s other already-extracted real-JSX
 * sections on this same page (`Hero`, `SpecStrip`) are likewise rendered without `Reveal`.
 * Adding one here would be a behavior change beyond "port the existing section", not just a
 * refactor — left out to match the live page exactly; a future design decision to animate
 * every section can wire `Reveal` at every call site at once.
 *
 * Paragraphs are plain strings rendered as real `<p>` children (React escapes text nodes
 * automatically) — no HTML-escaping helper needed here, unlike the raw-string
 * `dangerouslySetInnerHTML` approach the rest of `building-detail.tsx`'s still-raw sections
 * use. The source mock's `.prose p { margin-bottom:18px }` applies unconditionally (no
 * `:last-child` reset), so the last paragraph of both the intro and the subsection keeps its
 * trailing margin — ported as-is, not "fixed", to stay pixel-identical.
 *
 * MUST be rendered **outside** any `.mk`-scoped subtree (see `SpecStrip`'s docstring for the
 * full cascade-layers explanation: `mock.css`'s un-layered `.mk * { margin:0; padding:0 }`
 * reset always beats a `@layer`-wrapped Tailwind utility regardless of specificity).
 * `building-detail.tsx` renders this component before its `.mk`-wrapped remainder
 * (apartments/amenities/FAQ/book band), which keeps its own small `.mk` wrapper.
 */
export function ProseSection({
  eyebrow,
  headline,
  paragraphs,
  subsection,
  className,
}: {
  eyebrow?: string;
  headline: string;
  /** Intro paragraphs, rendered in order as separate `<p>` elements. */
  paragraphs: string[];
  /** Optional named subsection (e.g. "The Neighbourhood") with its own `<h3>` + paragraphs. */
  subsection?: ProseSectionSubsection;
  className?: string;
}) {
  return (
    <div className={cn("py-[clamp(72px,10vw,150px)]", className)}>
      <div className="mx-auto max-w-[1240px] px-[28px]">
        <div className="mb-[54px] max-w-[720px]">
          {eyebrow ? (
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-deep">
              {eyebrow}
            </span>
          ) : null}
          <h2
            className={cn(
              "font-serif text-[clamp(1.875rem,4vw,3.125rem)] font-medium leading-[1.08] tracking-[-0.015em] text-ink",
              eyebrow ? "mt-[14px]" : undefined,
            )}
          >
            {headline}
          </h2>
        </div>
        <div className="max-w-[68ch]">
          {paragraphs.map((p, i) => (
            <p key={i} className="mb-[18px] text-[17px] leading-[1.6] text-ink-soft">
              {p}
            </p>
          ))}
          {subsection ? (
            <>
              <h3 className="mt-[46px] mb-4 font-serif text-[clamp(1.5rem,3vw,2.125rem)] font-medium leading-[1.08] tracking-[-0.015em] text-ink">
                {subsection.heading}
              </h3>
              {subsection.paragraphs.map((p, i) => (
                <p key={i} className="mb-[18px] text-[17px] leading-[1.6] text-ink-soft">
                  {p}
                </p>
              ))}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
