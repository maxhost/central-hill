import "server-only";
import { ICON_SVG } from "./icons/svg";
import { isIconName, type IconName } from "./icons/names";
import { IconSvg, type IconSvgProps } from "./icons/icon-svg";

export { ICON_NAMES, isIconName, type IconName } from "./icons/names";

/** Shown for an unknown/legacy `icon_key` (ADR 0034). */
export const FALLBACK_ICON: IconName = "sparks";

/** Resolves a (possibly DB-sourced) name to a renderable icon, falling back to `sparks`. */
export function resolveIconName(name: string | null | undefined): IconName {
  if (name && isIconName(name)) return name;
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[core/ui/icon] Unknown icon "${name ?? ""}", rendering "${FALLBACK_ICON}".`);
  }
  return FALLBACK_ICON;
}

/**
 * Iconoir line icon, inlined as SVG into the server-rendered HTML (ADR 0034). No CSS, no
 * client JS, no CDN. **Server-only**: import it from `@core/ui/icon`, not the `@core/ui`
 * barrel (client components import the barrel). A client component takes the icon as a
 * `ReactNode` rendered by its server parent, or draws an interface icon with `<UiIcon>`.
 *
 * `name` is usually an `icon_key` from the DB. An unknown name renders `sparks`. Decorative
 * (`aria-hidden`) unless a `title` is given.
 */
export function Icon({ name, ...props }: IconSvgProps & { name: string | null | undefined }) {
  return <IconSvg inner={ICON_SVG[resolveIconName(name)]} {...props} />;
}
