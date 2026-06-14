/** Minimal class-name joiner (kernel — `core/ui`). Falsy parts are dropped. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
