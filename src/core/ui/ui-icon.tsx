import { IconSvg, type IconSvgProps } from "./icons/icon-svg";
import { UI_ICON_SVG, type UiIconName } from "./icons/ui-svg";

export type { UiIconName } from "./icons/ui-svg";

/**
 * Interface icon from the small client-safe Iconoir subset (ADR 0034 amendment): chevrons,
 * close, menu, stepper +/−, check, star, toast notices… Unlike `<Icon>` it may be used in
 * client components (and anything reachable from the `@core/ui` barrel); the subset ships
 * as ~1 KB gzip of JS. `name` is typed, so there is no fallback.
 *
 * Content icons (an `icon_key` from the DB) stay on the server-only `<Icon>`; a client
 * component that wants one takes it as a `ReactNode` prop. Same props and output as `<Icon>`.
 */
export function UiIcon({ name, ...props }: IconSvgProps & { name: UiIconName }) {
  return <IconSvg inner={UI_ICON_SVG[name]} {...props} />;
}
