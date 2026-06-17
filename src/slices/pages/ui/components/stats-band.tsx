import { getTranslations } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import { Container } from "@core/ui";
import { type StatKey, getGlobals } from "@slices/settings/contract";
import { CountUp } from "./count-up";

/**
 * Company stats band (Home/Owners/About). Reads the figures from the settings singleton
 * (`getGlobals`) — NOT from page `data` (data-model.md → stats = company_settings). The
 * eyebrow/title are UI chrome (`pages` namespace). Renders nothing when settings are
 * unset. Subscribes to the `globals` cache tag transitively via `getGlobals`.
 */
export async function StatsBand({
  locale,
  keys,
}: {
  locale: Locale;
  keys: StatKey[];
}) {
  const globals = await getGlobals(locale);
  if (!globals) return null;

  const cells = keys.map((k) => globals.stats[k]).filter((s) => s && s.value);
  if (cells.length === 0) return null;

  const t = await getTranslations("pages");

  return (
    <section className="border-y border-line bg-surface py-[clamp(48px,7vw,96px)]">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl leading-tight text-ink md:text-4xl">
            {t("stats.title")}
          </h2>
        </div>
        <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-10 text-center lg:grid-cols-4">
          {cells.map((s) => (
            <div key={s.label}>
              <dt className="font-serif text-4xl text-ink md:text-5xl">
                <CountUp value={s.value} />
              </dt>
              <dd className="mt-2 text-xs uppercase tracking-[0.14em] text-ink-soft">{s.label}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
