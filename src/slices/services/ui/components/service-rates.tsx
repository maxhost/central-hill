import type { DetailExtraOption, DetailPriceTable } from "../../contract";

/**
 * The "Rates" section body: an optional price table (an empty corner cell, one header per
 * column, a label + one serif figure per column per row, optional footnote) and an optional
 * grid of add-on cards (label · price · description, 2 → 1 columns at 680px). Port of the old
 * `.mk .price-table`/`.extras-grid`/`.extra-card`. Every figure is display copy authored in
 * the backoffice ("€65 / person", "On request"), so nothing here formats currency. The table
 * scrolls horizontally inside its wrapper on narrow screens (min 420px) instead of squashing.
 * Bare and presentational; the caller owns the section shell and its `SectionHead`.
 */
export function ServiceRates({
  pricing,
  extras,
}: {
  pricing: DetailPriceTable | null;
  extras: DetailExtraOption[];
}) {
  return (
    <>
      {pricing ? (
        <div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-line pr-[18px] pb-[14px]">
                    <span className="sr-only">—</span>
                  </th>
                  {pricing.columns.map((c, i) => (
                    <th
                      key={i}
                      scope="col"
                      className="border-b border-line pr-[18px] pb-[14px] text-left text-[11px] font-semibold uppercase tracking-[0.12em] whitespace-nowrap text-ink-soft"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pricing.rows.map((r, ri) => (
                  <tr key={ri}>
                    <th
                      scope="row"
                      className="border-b border-line py-[18px] pr-[18px] text-left text-[15px] font-medium text-ink"
                    >
                      {r.label}
                    </th>
                    {r.cells.map((c, ci) => (
                      <td
                        key={ci}
                        className="border-b border-line py-[18px] pr-[18px] font-serif text-[18px] whitespace-nowrap text-ink"
                      >
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pricing.footnote ? <p className="mt-[14px] text-[13px] text-ink-soft">{pricing.footnote}</p> : null}
        </div>
      ) : null}
      {extras.length ? (
        <ul className={`grid grid-cols-1 gap-4 min-[681px]:grid-cols-2 ${pricing ? "mt-[34px]" : ""}`}>
          {extras.map((e, i) => (
            <li key={i} className="rounded-[4px] border border-line bg-surface px-[22px] py-5">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-serif text-[17px] font-medium leading-[1.3] text-ink">{e.label}</h3>
                <span className="text-[13.5px] font-semibold whitespace-nowrap text-accent-deep">{e.price}</span>
              </div>
              <p className="mt-1.5 text-[13.5px] leading-[1.6] text-ink-soft">{e.desc}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
