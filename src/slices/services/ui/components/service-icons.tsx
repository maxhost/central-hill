import type { ReactNode } from "react";
import type { DetailFactIcon } from "../../contract";

/**
 * Inline SVG glyphs of the service detail page — the `mock/service-detail.html` sprite symbols
 * (`#i-*`), same paths and stroke attributes, as React elements (no icon dependency, no sprite).
 * Every glyph is `aria-hidden`, sized and tinted by its container (`currentColor`).
 */

const STROKE = { fill: "none", stroke: "currentColor", strokeWidth: 1.6 } as const;

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false">
      {children}
    </svg>
  );
}

export const ICONS = {
  star: (
    <Svg>
      <path fill="currentColor" d="M12 2.8l2.7 5.9 6.4.6-4.8 4.3 1.4 6.3L12 16.6l-5.7 3.3 1.4-6.3L2.9 9.3l6.4-.6z" />
    </Svg>
  ),
  check: (
    <Svg>
      <g {...STROKE} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9.5" />
        <path d="M8 12.3l2.6 2.6L16.3 9" />
      </g>
    </Svg>
  ),
  clock: (
    <Svg>
      <g {...STROKE} strokeLinecap="round">
        <circle cx="12" cy="12" r="9.5" />
        <path d="M12 7v5l3 2" />
      </g>
    </Svg>
  ),
  group: (
    <Svg>
      <g {...STROKE} strokeLinecap="round">
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M16.5 13.6c2.6.2 4.5 2.1 4.5 4.9" />
      </g>
    </Svg>
  ),
  lang: (
    <Svg>
      <g {...STROKE} strokeLinecap="round">
        <path d="M4 5h16v11H9l-5 4z" />
        <path d="M8 9h8M8 12h5" />
      </g>
    </Svg>
  ),
  pin: (
    <Svg>
      <g {...STROKE} strokeLinecap="round">
        <path d="M12 21s-7-6.2-7-11.5A7 7 0 0119 9.5C19 14.8 12 21 12 21z" />
        <circle cx="12" cy="9.5" r="2.5" />
      </g>
    </Svg>
  ),
  car: (
    <Svg>
      <g {...STROKE} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 16V11l2-5h10l2 5v5" />
        <path d="M3 16h18v3H3z" />
        <circle cx="7.5" cy="13" r=".8" />
        <circle cx="16.5" cy="13" r=".8" />
      </g>
    </Svg>
  ),
  shield: (
    <Svg>
      <g {...STROKE} strokeLinejoin="round">
        <path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" />
        <path d="M9 12l2 2 4-4" strokeLinecap="round" />
      </g>
    </Svg>
  ),
  cal: (
    <Svg>
      <g {...STROKE} strokeLinecap="round">
        <rect x="3.5" y="5" width="17" height="15" rx="2" />
        <path d="M3.5 10h17M8 3v4M16 3v4" />
      </g>
    </Svg>
  ),
  info: (
    <Svg>
      <g {...STROKE} strokeLinecap="round">
        <circle cx="12" cy="12" r="9.5" />
        <path d="M12 11v6M12 7.5v.01" />
      </g>
    </Svg>
  ),
  grid: (
    <Svg>
      <g {...STROKE}>
        <rect x="4" y="4" width="6.5" height="6.5" rx="1" />
        <rect x="13.5" y="4" width="6.5" height="6.5" rx="1" />
        <rect x="4" y="13.5" width="6.5" height="6.5" rx="1" />
        <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" />
      </g>
    </Svg>
  ),
  home: (
    <Svg>
      <g {...STROKE} strokeLinejoin="round">
        <path d="M4 11l8-6.5 8 6.5" />
        <path d="M6 9.5V20h12V9.5" />
      </g>
    </Svg>
  ),
} as const;

/** `detail.facts[].icon` (the closed `FACT_ICONS` enum) → its sprite glyph. */
export const FACT_ICON: Record<DetailFactIcon, ReactNode> = {
  clock: ICONS.clock,
  group: ICONS.group,
  language: ICONS.lang,
  pin: ICONS.pin,
  car: ICONS.car,
  home: ICONS.home,
  calendar: ICONS.cal,
  star: ICONS.star,
};
