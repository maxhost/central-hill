/**
 * Line-icon set for the editorial benefit cards (S9). Glyphs are the official **Iconoir**
 * (iconoir.com, MIT) regular paths, inlined — keyed by the `icon_key` stored on each `iconCard`
 * (validation/primitives → `iconKey`, kebab-case). Iconoir ships on a 24×24 / 1.5-stroke frame
 * with round caps, which is exactly the shared frame below, so the raw `d` data drops straight in
 * (per-path `stroke="currentColor"`/caps are inherited from the wrapping `<svg>` and omitted).
 * Unknown/legacy keys (e.g. the seed's decorative `"spark"`) fall back to `SPARKS`.
 */

/** Iconoir `sparks` — generic decorative fallback (also the seed's `"spark"` key). */
const SPARKS =
  '<path d="M8 15C12.8747 15 15 12.949 15 8C15 12.949 17.1104 15 22 15C17.1104 15 15 17.1104 15 22C15 17.1104 12.8747 15 8 15Z"/><path d="M2 6.5C5.13376 6.5 6.5 5.18153 6.5 2C6.5 5.18153 7.85669 6.5 11 6.5C7.85669 6.5 6.5 7.85669 6.5 11C6.5 7.85669 5.13376 6.5 2 6.5Z"/>';

/** Inner Iconoir `<path>` markup per `icon_key` — drawn on the shared 24×24 stroke frame below. */
const PATHS: Record<string, string> = {
  // Owners pitch
  chart: '<path d="M20 20H4V4"/><path d="M4 16.5L12 9L15 12L19.5 7.5"/>', // graph-up
  trophy:
    '<path d="M6.74534 4H17.3132C17.3132 4 16.4326 17.2571 12.0293 17.2571C9.87826 17.2571 8.56786 14.0935 7.79011 10.8571C6.97574 7.46844 6.74534 4 6.74534 4Z"/><path d="M17.3132 4C17.3132 4 18.2344 3.01733 19 2.99999C20.5 2.96603 20.7773 4 20.7773 4C21.0709 4.60953 21.3057 6.19429 19.8967 7.65715C18.4876 9.12 16.9103 10.4 16.2684 10.8571"/><path d="M6.74527 4.00001C6.74527 4.00001 5.78547 3.00614 4.99995 3.00001C3.49995 2.9883 3.22264 4.00001 3.22264 4.00001C2.92908 4.60953 2.69424 6.19429 4.1033 7.65715C5.51235 9.12001 7.14823 10.4 7.79004 10.8572"/><path d="M8.50662 20C8.50662 18.1714 12.0292 17.2571 12.0292 17.2571C12.0292 17.2571 15.5519 18.1714 15.5519 20H8.50662Z"/>',
  tag: '<path d="M11.5 12H6.6C6.26863 12 6 12.2686 6 12.6V19.4C6 19.7314 6.26863 20 6.6 20H17.4C17.7314 20 18 19.7314 18 19.4V18.5"/><path d="M16 12V8C16 6.66667 15.2 4 12 4C11.2532 4 10.6371 4.14525 10.1313 4.38491"/><path d="M16 12H17.4C17.7314 12 18 12.2686 18 12.6V13"/><path d="M8 8V8.5V12"/><path d="M3 3L21 21"/>', // lock-slash → "no lock-in"
  user: '<path d="M5 20V19C5 15.134 8.13401 12 12 12C15.866 12 19 15.134 19 19V20"/><path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z"/>',
  "map-pin":
    '<path d="M20 10C20 14.4183 12 22 12 22C12 22 4 14.4183 4 10C4 5.58172 7.58172 2 12 2C16.4183 2 20 5.58172 20 10Z"/><path d="M12 11C12.5523 11 13 10.5523 13 10C13 9.44772 12.5523 9 12 9C11.4477 9 11 9.44772 11 10C11 10.5523 11.4477 11 12 11Z" fill="currentColor"/>',
  search:
    '<path d="M17 17L21 21"/><path d="M3 11C3 15.4183 6.58172 19 11 19C13.213 19 15.2161 18.1015 16.6644 16.6493C18.1077 15.2022 19 13.2053 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11Z"/>',
  // Guests pitch
  home: '<path d="M17 21H7C4.79086 21 3 19.2091 3 17V10.7076C3 9.30887 3.73061 8.01175 4.92679 7.28679L9.92679 4.25649C11.2011 3.48421 12.7989 3.48421 14.0732 4.25649L19.0732 7.28679C20.2694 8.01175 21 9.30887 21 10.7076V17C21 19.2091 19.2091 21 17 21Z"/><path d="M9 17H15"/>', // home-simple
  coin: '<path d="M16 13C13.2386 13 11 11.8807 11 10.5C11 9.11929 13.2386 8 16 8C18.7614 8 21 9.11929 21 10.5C21 11.8807 18.7614 13 16 13Z"/><path d="M11 14.5C11 15.8807 13.2386 17 16 17C18.7614 17 21 15.8807 21 14.5"/><path d="M3 9.5C3 10.8807 5.23858 12 8 12C9.12583 12 10.1647 11.814 11.0005 11.5"/><path d="M3 13C3 14.3807 5.23858 15.5 8 15.5C9.12561 15.5 10.1643 15.314 11 15.0002"/><path d="M3 5.5V16.5C3 17.8807 5.23858 19 8 19C9.12563 19 10.1643 18.8139 11 18.5"/><path d="M13 8.5V5.5"/><path d="M11 10.5V18.5C11 19.8807 13.2386 21 16 21C18.7614 21 21 19.8807 21 18.5V10.5"/><path d="M8 8C5.23858 8 3 6.88071 3 5.5C3 4.11929 5.23858 3 8 3C10.7614 3 13 4.11929 13 5.5C13 6.88071 10.7614 8 8 8Z"/>', // coins
  key: '<path d="M10 12C10 14.2091 8.20914 16 6 16C3.79086 16 2 14.2091 2 12C2 9.79086 3.79086 8 6 8C8.20914 8 10 9.79086 10 12ZM10 12H22V15"/><path d="M18 12V15"/>',
  bell: '<path d="M18 8.4C18 6.70261 17.3679 5.07475 16.2426 3.87452C15.1174 2.67428 13.5913 2 12 2C10.4087 2 8.88258 2.67428 7.75736 3.87452C6.63214 5.07475 6 6.70261 6 8.4C6 15.8667 3 18 3 18H21C21 18 18 15.8667 18 8.4Z"/><path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"/>',
  check: '<path d="M5 13L9 17L19 7"/>',
  // Generic decorative fallback (the seed's `"spark"` key)
  spark: SPARKS,
};

/** A single decorative line icon. `name` is the card's `icon_key`. */
export function Icon({ name, className }: { name?: string; className?: string }) {
  const inner = (name && PATHS[name]) || SPARKS;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      // Icon shapes are a static, in-repo allowlist (Iconoir, not user input) — safe to inline.
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}
