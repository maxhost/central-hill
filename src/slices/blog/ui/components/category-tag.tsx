import { cn } from "@core/ui";
import type { CategoryRef } from "../../contract";
import { safeSwatch } from "./category-color";

/**
 * Blog category tag — the mock's `.ctag` (`mock/blog.html`): a small solid label, `11px/600`
 * uppercase with `.13em` tracking, white text, `5px 11px` padding, `3px` radius, ported 1:1
 * into Tailwind. Used by the listing's `FeaturedPost`, and meant for the "From the Journal"
 * cards once they are JSX (the grid adds its own `mb-[14px]` via `className`).
 *
 * **Colour from the DB.** The mock hardcodes one background per category (`.ctag.pt-regs` …);
 * here it is the admin-entered `category.color`, passed through `safeSwatch` (the same `#hex`
 * check as the chips' swatches) and applied inline. Anything that isn't a plain hex falls back
 * to the `accent-deep` token (white on it is ~7:1). White text on admin colours is the mock's
 * choice; the seeded colour `#1F7A6B` gives ≈ 5.4:1 (AA), but contrast is the editor's
 * responsibility for very light picks.
 *
 * Presentational and server-safe (no hooks, no i18n): the name is already localised in
 * `CategoryRef`. Not used by `PostCard` (the article detail's related posts), which has a
 * different, older look (dot + muted label) that this change leaves untouched.
 */
export function CategoryTag({
  category,
  className,
}: {
  category: Pick<CategoryRef, "name" | "color">;
  className?: string;
}) {
  const bg = safeSwatch(category.color);
  return (
    <span
      className={cn(
        "inline-block rounded-[3px] px-[11px] py-[5px] text-[11px] font-semibold uppercase tracking-[0.13em] text-white",
        !bg && "bg-accent-deep",
        className,
      )}
      style={bg ? { backgroundColor: bg } : undefined}
    >
      {category.name}
    </span>
  );
}
