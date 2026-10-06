import { cn } from "@core/ui";
import type { DetailOptionGroup } from "../../contract";

/**
 * A service's choice lists ("Choose your boat", a chef's menu…), one titled block per group.
 * A group renders as **cards** (serif name + description, 2 → 1 columns at 680px) when any of
 * its items carries a `desc`, otherwise as a row of **chips** (name only). Port of the old
 * `.mk .opt-group`/`.opt-cards`/`.opt-chips`; the chips take `core/ui` `ChipBar`'s inactive-chip
 * look (`13px`/`500`, `ink-soft`) but are plain list items, not `ChipBar` itself — that renders
 * `<button>`s for a filter/chooser, and these are display-only menu entries.
 */
export function ServiceOptionGroups({
  groups,
  className,
}: {
  groups: DetailOptionGroup[];
  className?: string;
}) {
  return (
    <div className={cn("max-w-[780px] space-y-[38px]", className)}>
      {groups.map((g, gi) => {
        const asCards = g.items.some((it) => it.desc);
        return (
          <div key={gi}>
            <h3 className="mb-4 font-serif text-[20px] font-medium leading-[1.3] text-ink">{g.title}</h3>
            {asCards ? (
              <ul className="grid grid-cols-1 gap-4 min-[681px]:grid-cols-2">
                {g.items.map((it, i) => (
                  <li key={i} className="rounded-[4px] border border-line bg-surface px-[22px] py-5">
                    <h4 className="mb-1.5 font-serif text-[17px] font-medium leading-[1.3] text-ink">{it.name}</h4>
                    {it.desc ? <p className="text-[13.5px] leading-[1.6] text-ink-soft">{it.desc}</p> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="flex flex-wrap gap-[9px]">
                {g.items.map((it, i) => (
                  <li
                    key={i}
                    className="inline-flex items-center rounded-full border border-line bg-surface px-4 py-[9px] text-[13px] font-medium tracking-[0.01em] text-ink-soft"
                  >
                    {it.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
