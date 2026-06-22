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
 *
 * Layout: a single full-bleed **dark feature (cacao) band** holding a centred title in
 * cream, then the figures in warm cream (`feature-accent`) below it.
 */
export async function StatsBand({
  locale,
  keys,
  showTitle = true,
}: {
  locale: Locale;
  keys: StatKey[];
  /** Hide the centred heading for a bare proof band (Owners, mirroring the mock). */
  showTitle?: boolean;
}) {
  const globals = await getGlobals(locale);
  if (!globals) return null;

  const cells = keys.map((k) => globals.stats[k]).filter((s) => s && s.value);
  if (cells.length === 0) return null;

  const t = await getTranslations("pages");

  return (
    <section className="bg-feature py-[clamp(56px,8vw,104px)]">
      <Container>
        {showTitle ? (
          <h2 className="mx-auto max-w-2xl text-center font-serif text-3xl leading-tight text-on-feature md:text-4xl">
            {t("stats.title")}
          </h2>
        ) : null}
        <dl
          className={`grid grid-cols-2 gap-x-8 gap-y-10 text-center lg:grid-cols-4 ${
            showTitle ? "mt-[clamp(40px,6vw,72px)]" : ""
          }`}
        >
          {cells.map((s) => (
            <div key={s.label}>
              <dt className="font-serif text-4xl text-feature-accent md:text-5xl">
                <CountUp value={s.value} />
              </dt>
              <dd className="mt-3 text-xs uppercase tracking-[0.14em] text-on-feature-soft">
                {s.label}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
