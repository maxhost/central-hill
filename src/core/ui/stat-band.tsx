import { CountUp } from "./motion/count-up";
import { Container } from "./container";

/**
 * Presentational stats band (ADR 0033, `docs/specs/home-component-library/03-stat-band.md`):
 * a full-bleed dark feature (cacao) band holding an optional centred title in cream, then a
 * grid of count-up figures in warm cream (`feature-accent`) below it. No data fetching, no
 * i18n, no `Locale` — every cell arrives already resolved. The data-fetching half (reading
 * the settings singleton, filtering by `StatKey[]`, resolving the title string) stays in the
 * slice composer (`src/slices/pages/ui/components/stats-band.tsx`), which renders this.
 *
 * No `durationMs` prop: `CountUp` (`./motion/count-up.tsx`) still hardcodes its 4000ms
 * duration as a module constant, not a prop (per `01-motion-primitives.md`) — out of scope
 * for this component's migration. Forwarding one here would be dead plumbing.
 *
 * `columns` (default 4, Home/Owners' cell count) and each cell's optional `description` are
 * additive — Buildings' listing (`#` stats band, 3 cells, each with a second descriptive line
 * under the label, e.g. "Bookings Completed" / "Across all managed properties") needed both,
 * ported 1:1 from its old `.mk`-scoped `.stats`/`.stats-grid`/`.stat .lbl` CSS (two stacked
 * `.lbl`s per cell — the original reused one class for both lines via an inline style
 * override; `description` is a real second field here instead).
 */
export function StatBand({
  title,
  cells,
  columns = 4,
}: {
  /** Centred heading in the band; omitted entirely renders a bare proof band (Owners-style). */
  title?: string;
  cells: { value: string; label: string; description?: string }[];
  /** Desktop column count (`lg:grid-cols-N`); mobile stays a fixed 2-up either way. */
  columns?: 3 | 4;
}) {
  return (
    <section className="bg-feature py-[clamp(56px,8vw,104px)]">
      <Container>
        {title ? (
          <h2 className="mx-auto max-w-2xl text-center font-serif text-3xl leading-tight text-on-feature md:text-4xl">
            {title}
          </h2>
        ) : null}
        <dl
          className={`grid grid-cols-2 gap-x-8 gap-y-10 text-center ${
            columns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"
          } ${title ? "mt-[clamp(40px,6vw,72px)]" : ""}`}
        >
          {cells.map((s) => (
            <div key={s.label}>
              <dt className="font-serif text-4xl text-feature-accent md:text-5xl">
                <CountUp value={s.value} />
              </dt>
              <dd className="mt-3 text-xs uppercase tracking-[0.14em] text-on-feature-soft">
                {s.label}
              </dd>
              {s.description ? (
                <dd className="mt-1.5 text-xs tracking-[0.02em] text-on-feature-soft">
                  {s.description}
                </dd>
              ) : null}
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
