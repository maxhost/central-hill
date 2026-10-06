/**
 * Category-colour validation shared by the blog's chips (`category-tabs.tsx`, a client module)
 * and its category tags (`category-tag.tsx`, server-rendered). It lives in its own plain module
 * — not in the `"use client"` tabs file — because a function exported from a client module is a
 * client reference on the server and can't be called from a server component.
 */

/** `#rgb`, `#rgba`, `#rrggbb` or `#rrggbbaa`. `blog_category.color` is free text up to 32
 *  chars in the admin validator (`hex` *or* any string), so anything else is dropped rather
 *  than handed to the browser as a style value. */
const HEX_COLOR = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** The admin-entered category colour if it is a plain `#hex`, else `undefined`. */
export function safeSwatch(color: string): string | undefined {
  return HEX_COLOR.test(color) ? color : undefined;
}
