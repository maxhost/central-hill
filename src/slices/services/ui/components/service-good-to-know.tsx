import type { DetailGoodToKnow } from "../../contract";
import { Icon } from "@core/ui/icon";

/**
 * "Good to know" — up to three fixed columns (Included ✓ · Cancellation 📅 · Practical ⓘ), each a
 * 14px/600 sans heading with an 18px `accent-deep` glyph over a list of 14px `ink-soft` lines.
 * Only non-empty columns render; the grid keeps three equal tracks (30px gap) so a lone column
 * keeps the mock's width rather than stretching; one column ≤760px. Ported 1:1 from
 * `mock/service-detail.html`'s `.know`. Returns null when every column is empty (the page then
 * omits the block).
 */
export function ServiceGoodToKnow({
  data,
  labels,
}: {
  data: DetailGoodToKnow;
  labels: { included: string; cancellation: string; practical: string };
}) {
  const cols: Array<{ key: string; icon: string; title: string; items: string[] }> = [
    { key: "included", icon: "check-circle", title: labels.included, items: data.included },
    { key: "cancellation", icon: "calendar", title: labels.cancellation, items: data.cancellation },
    { key: "practical", icon: "info-circle", title: labels.practical, items: data.practical },
  ].filter((c) => c.items.length);
  if (!cols.length) return null;
  return (
    <div className="grid grid-cols-1 gap-[30px] min-[761px]:grid-cols-3">
      {cols.map((c) => (
        <div key={c.key}>
          <h3 className="mb-3 flex items-center gap-2.5 font-sans text-sm font-semibold leading-[1.08] text-ink">
            <Icon name={c.icon} size={18} className="block text-accent-deep" />
            {c.title}
          </h3>
          <ul>
            {c.items.map((it, i) => (
              <li key={i} className="mb-2 text-sm leading-[1.6] text-ink-soft">
                {it}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** "What's included" — 2 → 1 columns (≤560px) of ✓ lines, 15px `ink` (mock `.incl`). */
export function ServiceIncluded({ items }: { items: string[] }) {
  return (
    <ul className="grid grid-cols-1 gap-x-[30px] gap-y-[14px] min-[561px]:grid-cols-2">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-3 text-[15px] leading-[1.5] text-ink">
          <Icon name="check-circle" size={19} className="mt-px block flex-none text-accent-deep" />
          {it}
        </li>
      ))}
    </ul>
  );
}
