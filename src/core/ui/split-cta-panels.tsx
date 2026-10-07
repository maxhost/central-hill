import { cn } from "./cn";

export type SplitCtaPanel = {
  /**
   * `light` = warm-white surface panel with an ink (`.btn-solid`) button — the guest side;
   * `dark` = feature-band panel with an accent (`.btn-accent`) button — the owner side.
   */
  tone: "light" | "dark";
  eyebrow?: string;
  title: string;
  body?: string;
  cta: {
    href: string;
    /** Pre-translated button label — the panel appends the trailing " →". */
    label: string;
    /** Opens in a new tab with `rel="noopener noreferrer"`. Off by default (the original is a plain `<a>`). */
    external?: boolean;
  };
  /** Small line under the button (e.g. phone · email · WhatsApp). Omitted when empty. */
  contactLine?: string;
};

const BUTTON =
  "inline-flex cursor-pointer items-center gap-[0.5em] rounded-[3px] border border-transparent px-7 py-[14px] text-[14px] font-medium tracking-[0.01em] no-underline transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]";

const TONE = {
  light: {
    panel: "bg-surface text-ink",
    eyebrow: "text-accent-deep",
    title: "text-ink",
    body: "text-ink-soft",
    button: "bg-ink text-bg hover:bg-feature",
    contact: "",
  },
  dark: {
    panel: "bg-feature text-on-feature",
    eyebrow: "text-feature-accent",
    title: "text-white",
    body: "text-on-feature-soft",
    button: "bg-accent text-white hover:bg-accent-deep",
    contact: "text-on-feature-soft",
  },
} as const;

/**
 * Hairline grid of one or two solid-color CTA panels — the mock's closing `.dual` band: a
 * 1px `line`-colored gap + 1px outer `line` border framing a light `surface` panel and/or a
 * dark `feature` panel, each eyebrow / serif `<h3>` / body / button / small contact line.
 * Two panels sit side by side from 981px up and stack (in the given order) at ≤980px, exactly
 * like the old `mock.css`'s `@media (max-width:980px) { .dual { grid-template-columns:1fr } }`; one
 * panel is always a single full-width column (`mock/buildings.html`'s inline
 * `grid-template-columns:1fr` variant). First built extracting Guests' closing guest/owner
 * dual CTA (`guest-page.tsx`'s old `bodyBottom()`), ported 1:1 from the live `.mk`-scoped
 * `.dual`/`.dcol`/`.dcol.owner …`/`.contact-line` rules + the inherited `.eyebrow`, `h3`,
 * `.btn`/`.btn-solid`/`.btn-accent` and `.mk` body rhythm in the old `src/app/mock.css`
 * (identical to `mock/assets/site.css`). Panel order is the caller's: `mock/home.html` puts the
 * owner panel first, `mock/guest.html` the guest panel — both are just a different `panels`
 * array.
 *
 * Not one of the existing CTA primitives:
 * - **`DualCtaPanels`** is the "Immersive Panels" design — full-bleed *photo* panels with a
 *   gradient scrim and white copy (`image` is required). This is two flat solid-color panels,
 *   one of them light, no imagery — a different look, not a variant of it.
 * - **`FeaturePanel`** is a single, *dark-only*, self-bordered box (`border border-line`). It
 *   has no light variant, and putting two of them (or one) inside this hairline grid would
 *   double the border — the original frame is the grid's own 1px gap over a `line` background
 *   plus one outer border, not a border per panel. Its button is also `ButtonLink` (see below).
 * Bending either to this shape would change their existing consumers' render.
 *
 * The buttons are **not** `ButtonLink` (same finding as `ActionBand`): its variants are
 * `rounded-md`, `py-3`, no hairline border, no letter-spacing, `transition-colors`, a
 * `next/link`, and there is no ink-filled variant at all — while the original `.btn` is
 * `border-radius:3px`, `padding:14px 28px`, a 1px transparent border (part of its 52.39px
 * height), `letter-spacing:.01em`, `transition:.25s` on all properties and a plain `<a>`
 * (`.btn-solid` = ink fill / `bg` text → `feature` on hover; `.btn-accent` = accent fill /
 * white text → `accent-deep` on hover). Those values are ported literally here. The button is
 * an inline-flex box in a block panel, so a long label wraps inside it on narrow panels
 * (Guests' owner CTA at 390px) — same as the original.
 *
 * Purely presentational, per the `core/ui` ground rule: no i18n, no fetching, no domain
 * types, no `<section>`/column of its own (the original's `<section>` padding is a page
 * choice — Guests uses the full `--section-y`, Home/Buildings `padding-top:0` — so the caller
 * owns the shell, and any scroll-reveal wrapper). Sets the inherited `line-height:1.6` +
 * `16px` itself, because the eyebrow is an inline `<span>` whose line box (25.6px) is the
 * panel's strut, and the button's 22.4px / contact line's 20.8px line heights derive from it.
 * Colors are tokens; titles on the dark panel are plain `text-white` (the original's `#fff`,
 * not `on-feature`), and the light panel's contact line inherits `ink` (the original sets no
 * color on it).
 */
export function SplitCtaPanels({
  panels,
  className,
}: {
  /** One or two panels, rendered in order. */
  panels: readonly [SplitCtaPanel] | readonly [SplitCtaPanel, SplitCtaPanel];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-px border border-line bg-line text-[16px] leading-[1.6]",
        panels.length === 2 && "min-[981px]:grid-cols-2",
        className,
      )}
    >
      {panels.map((p, i) => {
        const t = TONE[p.tone];
        return (
          <div key={i} className={cn("px-12 py-[62px]", t.panel)}>
            {p.eyebrow ? (
              <span className={cn("text-[12px] font-semibold uppercase tracking-[0.18em]", t.eyebrow)}>
                {p.eyebrow}
              </span>
            ) : null}
            <h3
              className={cn(
                "mt-[10px] mb-[14px] font-serif text-[30px] font-medium leading-[1.08] tracking-[-0.015em]",
                t.title,
              )}
            >
              {p.title}
            </h3>
            {p.body ? <p className={cn("mb-6", t.body)}>{p.body}</p> : null}
            <a
              href={p.cta.href}
              {...(p.cta.external ? { target: "_blank", rel: "noopener noreferrer" } : null)}
              className={cn(BUTTON, t.button)}
            >
              {`${p.cta.label} →`}
            </a>
            {p.contactLine ? (
              <div className={cn("mt-5 text-[13px] tracking-[0.03em]", t.contact)}>{p.contactLine}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
