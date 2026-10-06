import type { DetailExtraOption, DetailPriceTable } from "../../contract";

/**
 * The "Rates" block body: an optional price table, then optional add-on cards. The table is
 * `mock/service-detail.html`'s `.rates`: 11px uppercase `ink-soft` headers over a hairline, one
 * row per label (15px `ink`) with its figures in serif 19px, **right-aligned** (as the mock's
 * single `td.num` column; with several columns every figure column is right-aligned so headers
 * and figures line up), 16px cell padding and hairline rows. The corner header is empty (the
 * data model has no name for the label column — the mock's "Group size" is per-service copy).
 * An optional footnote (13px `ink-soft`) follows. The table scrolls horizontally on narrow
 * screens when it has 3+ columns (min 420px) instead of squashing.
 *
 * Add-ons keep the previous `.extras-grid`/`.extra-card` design (label · price · description,
 * 2 → 1 columns at 680px) — the approved mock has no extras sample. Every figure is display copy
 * authored in the backoffice ("€65 / person", "On request"), so nothing here formats currency.
 * Bare and presentational; the caller owns the `ContentBlock` and its head.
 */
export function ServiceRates({
  pricing,
  extras,
}: {
  pricing: DetailPriceTable | null;
  extras: DetailExtraOption[];
}) {
  const wide = pricing ? pricing.columns.length > 1 : false;
  return (
    <>
      {pricing ? (
        <div>
          <div className={wide ? "overflow-x-auto" : undefined}>
            <table className={`mt-1 w-full border-collapse ${wide ? "min-w-[420px]" : ""}`}>
              <thead>
                <tr>
                  <th className="border-b border-line pr-4 pb-3">
                    <span className="sr-only">—</span>
                  </th>
                  {pricing.columns.map((c, i) => (
                    <th
                      key={i}
                      scope="col"
                      className="border-b border-line pr-4 pb-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] whitespace-nowrap text-ink-soft last:pr-0"
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
                      className="border-b border-line py-4 pr-4 text-left text-[15px] font-normal text-ink"
                    >
                      {r.label}
                    </th>
                    {r.cells.map((c, ci) => (
                      <td
                        key={ci}
                        className="border-b border-line py-4 pr-4 text-right font-serif text-[19px] whitespace-nowrap text-ink last:pr-0"
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
