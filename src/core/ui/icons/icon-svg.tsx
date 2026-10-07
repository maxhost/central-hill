/** Props shared by `<Icon>` (server, full map) and `<UiIcon>` (client-safe subset). */
export type IconSvgProps = {
  size?: number | string;
  strokeWidth?: number;
  className?: string;
  /** Accessible name; without it the icon is decorative (`aria-hidden`). */
  title?: string;
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * The outer `<svg>` both icon components render around a generated Iconoir body (ADR 0034).
 * Client-safe: no map is imported here, the caller passes the inner markup.
 */
export function IconSvg({
  inner,
  size = 24,
  strokeWidth = 1.5,
  className,
  title,
}: IconSvgProps & { inner: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={strokeWidth}
      className={className}
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true, focusable: "false" })}
      // Static allowlist from the pinned `iconoir` package (generated), not user input.
      dangerouslySetInnerHTML={{ __html: title ? `<title>${escapeHtml(title)}</title>${inner}` : inner }}
    />
  );
}
