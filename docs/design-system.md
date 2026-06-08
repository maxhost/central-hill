# Design System — premium/boutique direction (2025–2026)

> Grounded in current luxury-hospitality web research (sources in `mock/` research notes). Reference
> vibe: ukio.com (warm, clean, modern-premium) + boutique hotels; IA: lovelystay.com. The live mock
> at `mock/home.html` lets the client preview all palettes. Governing principle: **luxury = restraint**
> (controlled color, controlled motion, generous whitespace, ≤2 typefaces).

## Typography
- **Display/headings:** `Fraunces` (variable, optical-size — warm editorial serif). *Avoid Playfair
  Display — too generic now.* Premium-licensed alternatives if budget allows: Canela, GT Sectra.
- **Body/UI:** `Inter` (safe, screen-optimized). For more boutique warmth: Satoshi / General Sans.
- **Scale:** body **16px floor**, line-height **1.5–1.65**; H1 **48–72px** desktop / 32–40 mobile;
  modular scale ~1.25; measure **50–75ch** (cap text ~620–680px).
- **Letter-spacing:** large serif headings **−0.015em**; body 0; **eyebrow/labels uppercase +0.1–0.18em**
  (the single highest-leverage "editorial luxury" tell).
- **Perf:** variable fonts, `font-display:swap`, self-host + preload the LCP display weight, Latin subset.

## Color — 6 palette directions (WCAG AA verified)
Token set per palette: `ink, ink-soft, bg, surface, line, accent, accent-deep, feature, feature-accent`.
**Rules:** ≤5 colors; 60-30-10 (neutral/neutral/accent); **accent = actions only** (CTAs, links, active);
**never pure #000/#fff** — warm-tint both; one metallic max (only Deep Green uses gold, on the dark band
with dark text).

| # | Name | bg | ink | accent | feature | Best for |
|---|---|---|---|---|---|---|
| 1 | **Warm Editorial** ⭐ | `#FBF8F3` | `#2B2622` | `#B5562D` | `#2E2A26` | Default — closest to ukio; all audiences |
| 2 | **Deep Luxe Green** | `#F5F3EC` | `#14201B` | `#1F5C45` | `#0E3326` (+gold `#C49A4A`) | Heritage/trust; owners & partners |
| 3 | **Coastal Portugal** | `#F7F9FA` | `#16242E` | `#2C6E8F` | `#14323F` | Place/Lisbon identity; travellers |
| 4 | **Monochrome Boutique** | `#FAFAF8` | `#111111` | `#111111` | `#0A0A0A` | Photo-led, gallery; best a11y |
| 5 | **Terracotta Mediterranean** | `#FAF4EC` | `#3A2A22` | `#9E4A26`¹ | `#3D2B22` | Warmest, lifestyle storytelling |
| 6 | **Sand & Navy** | `#F6F4EF` | `#1B2433` | `#1C3A5E` | `#131C2B` | Institutional/owner, banking-grade trust |

¹ Terracotta accent tuned to the AA-safe deep tone for white button text (bright `#C0653A` fails AA at
small sizes — use it only for large text/UI). Full token sets live in `mock/home.html` `:root` blocks.
**Recommendation:** Warm Editorial as primary, Deep Luxe Green as the heritage alternative.

## Layout & whitespace
- 12-col grid; content max-width **~1200–1280px**; full-bleed only for hero/imagery.
- Section vertical rhythm **`clamp(64px,10vw,160px)`** (tight sections are the #1 "cheap" tell).
- 8px spacing base. Editorial asymmetry on *marketing/story* pages; **strictly regular grids** for the
  *catalog* (users compare units side-by-side).

## Imagery (the product, for hospitality)
- One coherent editorial/cinematic register (warm natural light, lived-in interiors). Never mix stock
  with real shoots. Hero full-bleed (or short muted video).
- Aspect ratios: **property cards 4:3 or 3:2**, hero 16:9/21:9, gallery native.
- Overlays: subtle bottom gradient scrim; verify 4.5:1 on the actual image.
- Perf (critical at ~200ms): AVIF/WebP, responsive `srcset`, explicit dimensions (CLS<0.1), lazy below
  fold, **preload only the LCP hero**.

## Motion
- Gentle scroll fade/translate-in (opacity + 12–20px Y), **300–500ms**, soft ease
  `cubic-bezier(.4,0,.2,1)`; hover image zoom **1.02–1.04** + soft shadow lift.
- **Transforms/opacity only** (GPU); honor **`prefers-reduced-motion`**; one reveal per section.
- Avoid heavy parallax, bouncy easings, animation-on-everything (cheapens + hurts CWV/INP<200ms).

## Components
- **Buttons/CTAs:** one clear primary per page; solid accent fill, ~14–16×28–32px, small radius;
  specific copy ("View apartment", "Check availability"), never "Submit/Learn more".
- **Nav:** sticky; **transparent over hero → frosted (`backdrop-filter:blur`) on scroll**; descriptive
  labels; property reachable in 1–2 clicks.
- **Property cards:** image (4:3, fixed dims) + optional tag · title=type+spec · location · 2–4 feature
  icons · prominent price ("from … /month") · whole card clickable · one subtle hover.
- **Testimonials:** restrained pull-quotes distributed through the page + discreet aggregate rating;
  not a noisy carousel.
- **Trust/stats:** large serif number + small tracked label, set quietly near CTAs.

## "Cheap" failure modes to avoid
Cramped layout · >2–3 fonts · low-res/mixed imagery · too many/clashing colors · heavy gradients &
shadows · pure black-on-white · slow loads/clunky embeds · vague CTAs · overdone animation · tiny
light-gray text failing WCAG.

## Accessibility (WCAG 2.2 AA — non-negotiable)
Body ≥4.5:1, large text ≥3:1; secondary text must still pass (no light-gray-on-white); don't rely on
color alone for state; test text-over-image overlays on the real image.
