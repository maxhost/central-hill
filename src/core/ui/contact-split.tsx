import type { ReactNode } from "react";
import { cn } from "./cn";

export type ContactSplitRow = {
  /** Pre-translated label, rendered as a small uppercase `feature-accent` caption. */
  label: string;
  /** The value — plain text or caller-built inline content (e.g. a `tel:`/`mailto:` `<a>`,
   * or `<br />`-separated address lines). Links inside it take `on-feature`. */
  value: ReactNode;
};

/**
 * A hairline two-panel "office + message" split: a dark `feature` info panel (serif title +
 * stacked label/value rows — address, phones, email, hours…) beside a light `surface` panel
 * (serif title + optional intro + a form slot). Columns are `.9fr 1.1fr` from 981px, stacking
 * to one column (office first) at ≤980px; the frame is the hairline technique used across
 * `core/ui` (1px `line` gap over a `line` background + 1px outer `line` border). Panel padding
 * is 48/44px, 36/28px at ≤680px. First built for About's closing "Let's Start a Conversation"
 * (`mock/about.html`'s `.contact-split`/`.office`/`.ofield`/`.olbl`/`.oval`/`.cform`/
 * `.cform-sub`), ported 1:1 from those `.mk`-scoped rules (`about-page.tsx`'s old `PAGE_STYLE`)
 * plus the old `mock.css`'s inherited `.mk` rhythm (`line-height:1.6`) and serif `h3` (500 / 1.08 /
 * -0.015em). The office title is plain `text-white` (the original's `#fff`, not `on-feature` —
 * same call as `ActionBand`).
 *
 * Reuse check — why nothing existing fit:
 * - `EnquirySplit` (Real Estate's `#deal-enquiry`) is the nearest — intro + contact lines beside
 *   a form slot — but it's a whole `<section>` with its own shell and `SectionHead`, its columns
 *   are `.85fr/1.15fr` with a 56px open gap (no hairline frame, no panels), and its contact
 *   block is light inline "Label: link" lines, not a dark panel of stacked rows. Bending it
 *   would change Real Estate's render.
 * - `SplitCtaPanels` has the same hairline light/dark panel frame, but its panels are fixed CTA
 *   content (eyebrow/title/body/button/contact line) with no slot and no label/value rows.
 * - `FeaturePanel` is a single self-bordered dark CTA panel (eyebrow/title/body/button) — no
 *   rows, and its own border would double the hairline frame.
 * - `FormCard` is the form itself (the slot's content); this is the layout around it.
 * The form is deliberately NOT part of this component (same rule as `EnquirySplit`): pass any
 * form as `children` — About passes the leads slice's `ContactForm` (`FormCard bare`), which
 * brings its own fields, consent, submit and status states.
 *
 * Purely presentational: no i18n, no fetching — every string arrives pre-translated. Bare (no
 * `Section`/`Container`/heading/reveal of its own; `className` is for the caller's spacing).
 */
export function ContactSplit({
  infoTitle,
  rows,
  formTitle,
  formIntro,
  children,
  className,
}: {
  /** Dark panel title, e.g. "Our Office". */
  infoTitle: string;
  rows: readonly ContactSplitRow[];
  /** Light panel title, e.g. "Send Us a Message". */
  formTitle: string;
  formIntro?: string;
  /** The form (light panel body). */
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-px border border-line bg-line leading-[1.6] min-[981px]:grid-cols-[.9fr_1.1fr]",
        className,
      )}
    >
      <div className="bg-feature px-[28px] py-[36px] text-on-feature min-[681px]:px-[44px] min-[681px]:py-[48px]">
        <h3 className="mb-[22px] font-serif text-[26px] font-medium leading-[1.08] tracking-[-0.015em] text-white">
          {infoTitle}
        </h3>
        {rows.map((row) => (
          <div key={row.label} className="mb-[20px]">
            <div className="mb-[6px] text-[11px] font-semibold uppercase tracking-[0.14em] text-feature-accent">
              {row.label}
            </div>
            <div className="text-[15px] leading-[1.7] text-on-feature-soft [&_a]:text-on-feature">{row.value}</div>
          </div>
        ))}
      </div>
      <div className="bg-surface px-[28px] py-[36px] text-ink min-[681px]:px-[44px] min-[681px]:py-[48px]">
        <h3 className="mb-[8px] font-serif text-[26px] font-medium leading-[1.08] tracking-[-0.015em] text-ink">
          {formTitle}
        </h3>
        {formIntro ? <div className="mb-[24px] text-[14px] text-ink-soft">{formIntro}</div> : null}
        {children}
      </div>
    </div>
  );
}
