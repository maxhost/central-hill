import { Fragment, type ReactNode } from "react";
import { Reveal } from "./motion/reveal";
import { SectionHead } from "./section-head";

export type EnquiryContactLine = {
  /** Pre-translated label shown before the link, e.g. "Email:" (a space is added after it). */
  label: string;
  href: string;
  text: string;
};

/**
 * Closing "enquiry" section: an intro column (serif `<h2>` + lede + an optional hairline-topped
 * "contact us directly" block of label/link lines) beside a form slot (`children` — typically a
 * `FormCard`). Columns are `.85fr 1.15fr` with a 56px gap, top-aligned, stacking to one column
 * (34px gap) ≤980px. First built extracting Real Estate's "Ready to Explore a Partnership?"
 * (`#deal-enquiry`, SECTION 10 — the former `BODY_BOTTOM` raw markup in `real-estate-page.tsx`),
 * ported 1:1 from that page's `.mk`-scoped `.enquiry`/`.enquiry-intro`/`.contact-direct` rules
 * (old `PAGE_STYLE`, identical to `mock/real-estate.html`'s) plus `mock.css`'s inherited `.mk`
 * body rhythm (`line-height:1.6`), `section` (`padding:clamp(72px,10vw,150px) 0;
 * scroll-margin-top:84px`), `.wrap` (1240px/28px), `h2` and `.lede`. The title + lede are now
 * `SectionHead` (`flush`), replacing the original's slightly smaller `clamp(30px,3.6vw,46px)` title
 * and `18px` lede offset, so the closing head matches every other section head (consistency
 * over mock fidelity).
 *
 * Not one of the existing two-column primitives: `EditorialSplit` is a sticky copy + CTA column
 * beside a hairline icon list (no slot), `TwoColumnShowcase` is copy beside an image, and
 * `FeatureCtaBand` is a dark photo band — none takes arbitrary right-column content or has the
 * contact block. The form itself is deliberately NOT part of this component (see `FormCard` and
 * friends in `form-card.tsx`): what fields a form has is the calling slice's business.
 *
 * `reveal` wraps each column in its own `Reveal` (fade/slide-in once on scroll) — the original
 * gave `.enquiry-intro` and the `form` separate `reveal-io pre-reveal` hooks, so the two columns
 * trigger independently (each at 15% of its own height in view). Off by default (static), same
 * convention as the other `core/ui` sections, whose callers opt in at the call site.
 *
 * Purely presentational: no i18n, no fetching — every string arrives pre-translated. `id` lands
 * on the `<section>` (in-page CTAs anchor to it; `scroll-mt-[84px]` clears the fixed nav). Sets
 * `line-height:1.6` on the section, which the lede, contact block (overridden to 1.9) and the
 * form controls inherit. MUST render **outside** any `.mk`-scoped subtree (Lesson 1 in
 * `docs/component-extraction-workflow.md`).
 */
export function EnquirySplit({
  id,
  title,
  lede,
  contact,
  reveal = false,
  children,
}: {
  id?: string;
  title: string;
  lede?: string;
  contact?: { title: string; lines: readonly EnquiryContactLine[] };
  reveal?: boolean;
  /** The right-hand column (the form). */
  children: ReactNode;
}) {
  const Col = reveal ? Reveal : "div";
  return (
    <section id={id} className="scroll-mt-[84px] py-[clamp(72px,10vw,150px)] leading-[1.6] text-ink">
      <div className="mx-auto max-w-[1240px] px-[28px]">
        <div className="grid grid-cols-1 gap-[34px] [align-items:start] min-[981px]:grid-cols-[.85fr_1.15fr] min-[981px]:gap-[56px]">
          <Col>
            <SectionHead flush headline={title} intro={lede || undefined} />
            {contact ? (
              <div className="mt-[34px] border-t border-t-line pt-[26px] text-[14.5px] leading-[1.9] text-ink-soft">
                <b className="mb-[10px] block text-[12px] uppercase tracking-[0.14em] text-ink">{contact.title}</b>
                {contact.lines.map((l, i) => (
                  <Fragment key={l.href + l.text}>
                    {`${l.label} `}
                    <a href={l.href} className="font-semibold text-accent-deep">
                      {l.text}
                    </a>
                    {i < contact.lines.length - 1 ? <br /> : null}
                  </Fragment>
                ))}
              </div>
            ) : null}
          </Col>
          <Col>{children}</Col>
        </div>
      </div>
    </section>
  );
}
