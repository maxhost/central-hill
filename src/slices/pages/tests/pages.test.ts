import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { translatablePaths } from "@core/validation/primitives";
import { pageContentSchema } from "../validation";
import {
  aboutSchema,
  guestSchema,
  homeSchema,
  ownersSchema,
  realEstateSchema,
  translatablePathsByPage,
} from "../schemas";
import { defaultAbout } from "../schemas/about";
import { blogSchema, defaultBlog } from "../schemas/blog";
import { defaultGuides, guidesSchema } from "../schemas/guides";
import { buildingsSchema, defaultBuildings } from "../schemas/buildings";
import { collectMediaIds, expand, overlayTranslations } from "../server/overlay";
import { heroPosterSrc } from "../ui/hero-poster";
import { seoMetadataInput } from "../server/metadata-input";
import { orMessage, orNamedMessage } from "../ui/or-message";
import { enquiryContactLines, ownersFinalContactLine, settingsContactLine } from "../ui/contact-line";
import {
  describedStatFigureCells,
  formatStatFigure,
  parseStatValue,
  statBandColumns,
  statFigureCells,
} from "../ui/stat-figure-value";

/**
 * Slice `pages` unit tests — the page schemas' translatable-field contract (ADR 0012 /
 * the translation pipeline) and the pure [T]-block overlay logic that resolves a target
 * locale from `page_content.data` + the `translation` table. Pure, no DB. Run:
 * `npx tsx --test src/slices/pages/tests/pages.test.ts`.
 */

const UUID = "11111111-1111-4111-8111-111111111111";

const assurance = (n: number) => ({
  icon_key: "check-circle",
  label: `Assurance ${n}`,
});

const benefit = (n: number) => ({
  icon_key: "graph-up",
  title: `Benefit ${n}`,
  description: `Why benefit ${n} matters for you and your stay.`,
});

const ctaPanel = (side: string) => ({
  image_media_id: "",
  eyebrow: `For ${side}s`,
  title: `A ${side} panel title`,
  body: `Why this matters to a ${side}.`,
  cta_label: "Learn more",
});

const validHome = () => ({
  key: "home" as const,
  data: {
    hero: {
      video_media_id: UUID,
      headline: "Turning moments into memories",
      subtitle: "Design-led apartments across Portugal.",
      cta_primary: { label: "Book", url: "https://centralhill.pt/buildings" },
      // Label only: the href is a hardcoded, locale-aware `/owners` route (home-page.tsx).
      cta_secondary: { label: "Earnings" },
    },
    guests_pitch: {
      headline: "Why book with us",
      subheadline: "Professionally managed apartments.",
      benefits: [1, 2, 3, 4].map(benefit),
      image_media_id: UUID,
      cta: { label: "Browse", url: "https://centralhill.pt/buildings" },
    },
    services_carousel: {
      eyebrow: "Partners",
      headline: "Central Hill partners and services",
      assurances: [1, 2, 3].map(assurance),
      service_category_slug: "",
    },
    dual_cta: { owner: ctaPanel("owner"), guest: ctaPanel("guest") },
  },
});

// ── schema validation ─────────────────────────────────────────────────────────
test("accepts a complete home page row", () => {
  assert.equal(pageContentSchema.safeParse(validHome()).success, true);
});

test("home hero video is optional: blank or a uuid, never garbage (S1)", () => {
  const parse = (video: string) => {
    const row = validHome();
    row.data.hero.video_media_id = video;
    return homeSchema.safeParse(row.data).success;
  };
  assert.equal(parse(""), true, "blank → the stock hero clip");
  assert.equal(parse(UUID), true);
  assert.equal(parse("not-a-uuid"), false);
});

// ── S4: hero poster ───────────────────────────────────────────────────────────
test("home hero poster is optional: absent, blank or a uuid, never garbage (S4)", () => {
  const parse = (poster: string | undefined) => {
    const row = validHome();
    const hero: Record<string, unknown> = { ...row.data.hero };
    if (poster !== undefined) hero.poster_media_id = poster;
    return homeSchema.safeParse({ ...row.data, hero }).success;
  };
  assert.equal(parse(undefined), true, "legacy rows have no poster key");
  assert.equal(parse(""), true, "blank → the stock poster");
  assert.equal(parse(UUID), true);
  assert.equal(parse("not-a-uuid"), false);
  // The resolver loads it like every other media reference.
  const ids: string[] = [];
  collectMediaIds({ hero: { video_media_id: "", poster_media_id: UUID } }, ids);
  assert.deepEqual(ids, [UUID]);
});

test("hero poster goes through the Next image optimizer at w=1920 (S4)", () => {
  // Outside a Next build there is no remotePatterns config; NODE_ENV=test skips the dev-only
  // host check so we exercise the URL Next builds (production allows the R2 host).
  const prev = process.env.NODE_ENV;
  (process.env as Record<string, string | undefined>).NODE_ENV = "test";
  try {
    const asset = { url: "https://media.example.com/k/poster.jpg", width: 1920, height: 1080, alt: "", blurhash: null };
    const src = heroPosterSrc(asset);
    assert.ok(src?.startsWith("/_next/image?"), src ?? "null");
    const q = new URLSearchParams(src!.split("?")[1]);
    assert.equal(q.get("url"), asset.url);
    assert.equal(q.get("w"), "1920");
    assert.equal(q.get("q"), "75");
    assert.equal(heroPosterSrc(undefined), null, "no asset → caller's stock poster");
    assert.equal(heroPosterSrc(null), null);
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = prev;
  }
});

// ── S4 cierre: Settings value → statFigure (scripts/backfill-home-stats.ts) ───
test("parseStatValue round-trips the company figures (incl. today's live values)", () => {
  const cases: [string, ReturnType<typeof parseStatValue>][] = [
    ["65+", { to: "65", prefix: "", suffix: "+", group: false }],
    ["€55M+", { to: "55", prefix: "€", suffix: "M+", group: false }],
    ["400,000+", { to: "400000", prefix: "", suffix: "+", group: true }],
    ["12", { to: "12", prefix: "", suffix: "", group: false }],
    // Live Settings values on 2026-10-11 (dry run).
    ["60,000+", { to: "60000", prefix: "", suffix: "+", group: true }],
    ["12+", { to: "12", prefix: "", suffix: "+", group: false }],
    ["700,000+", { to: "700000", prefix: "", suffix: "+", group: true }],
    ["1000", { to: "1000", prefix: "", suffix: "", group: false }],
  ];
  for (const [value, expected] of cases) {
    const row = parseStatValue(value);
    assert.deepEqual(row, expected, value);
    assert.equal(formatStatFigure(row!), value, `${value} renders back identically`);
  }
});

test("parseStatValue rejects values a figure row can't reproduce", () => {
  for (const v of ["", "+", "4.8", "400 000", "1,00", "0400", "12-15", "abc"]) {
    assert.equal(parseStatValue(v), null, JSON.stringify(v));
  }
});

// ── S5: editable figures band on the Home ─────────────────────────────────────
/** The 4 rows `scripts/backfill-home-stats.ts` wrote to the production Home row. */
const PROD_FIGURES = [
  { to: "60000", prefix: "", suffix: "+", group: true, label: "Bookings Completed" },
  { to: "12", prefix: "", suffix: "+", group: false, label: "Years of Experience" },
  { to: "700000", prefix: "", suffix: "+", group: true, label: "Guests Hosted" },
  { to: "55", prefix: "€", suffix: "M+", group: false, label: "Revenue Generated" },
];
const homeWithStats = (stats: unknown) => ({ ...validHome().data, stats });

test("home S5: figures validate as production stores them, empty, absent, or no stats", () => {
  assert.equal(homeSchema.safeParse(homeWithStats({ figures: PROD_FIGURES })).success, true);
  assert.equal(homeSchema.safeParse(homeWithStats({ title: "", figures: [] })).success, true);
  assert.equal(homeSchema.safeParse(homeWithStats({ title: "Trusted" })).success, true);
  assert.equal(homeSchema.safeParse(validHome().data).success, true, "legacy row without stats");
});

test("home S5: figures reject more than 8 rows and a non-digit number", () => {
  const nine = Array.from({ length: 9 }, () => PROD_FIGURES[0]);
  assert.equal(homeSchema.safeParse(homeWithStats({ figures: nine })).success, false);
  const eight = Array.from({ length: 8 }, () => PROD_FIGURES[0]);
  assert.equal(homeSchema.safeParse(homeWithStats({ figures: eight })).success, true);
  for (const to of ["60,000", "5.5", "", "12+"]) {
    const bad = [{ ...PROD_FIGURES[0], to }];
    assert.equal(homeSchema.safeParse(homeWithStats({ figures: bad })).success, false, to);
  }
});

test("home S5: desktop columns follow the row count", () => {
  const expected: [number, number][] = [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 3], [7, 4], [8, 4]];
  for (const [n, cols] of expected) assert.equal(statBandColumns(n), cols, `${n} rows`);
});

test("home S5: rows map to StatBand cells (same helper as Owners)", () => {
  assert.deepEqual(statFigureCells(PROD_FIGURES), [
    { value: "60,000+", label: "Bookings Completed" },
    { value: "12+", label: "Years of Experience" },
    { value: "700,000+", label: "Guests Hosted" },
    { value: "€55M+", label: "Revenue Generated" },
  ]);
  // Owners' previous inline derivation, kept here to pin the refactor as output-identical.
  const legacy = (s: (typeof PROD_FIGURES)[number]) =>
    `${s.prefix ?? ""}${s.group ? Number(s.to).toLocaleString("en-US") : s.to}${s.suffix ?? ""}`;
  const noAffix = { to: "400000", group: true, label: "x" };
  for (const r of [...PROD_FIGURES, noAffix]) {
    assert.equal(statFigureCells([r])[0]!.value, legacy(r as (typeof PROD_FIGURES)[number]));
  }
});

test("home S5: a figure's label is translatable, its number and affixes are not", () => {
  const paths = translatablePathsByPage.home;
  assert.ok(paths.includes("stats.figures[].label"));
  for (const k of ["to", "prefix", "suffix", "group"]) {
    assert.ok(!paths.includes(`stats.figures[].${k}`), `${k} is shared across locales`);
  }
});

test("owners S4: 0–8 shared statFigure rows (4 stored rows still valid), label translatable", () => {
  const stats = ownersSchema.shape.stats;
  assert.equal(stats.safeParse(PROD_FIGURES).success, true, "the 4 stored rows");
  assert.equal(stats.safeParse([]).success, true, "0 rows → band hidden");
  assert.equal(stats.safeParse(PROD_FIGURES.slice(0, 3)).success, true);
  assert.equal(stats.safeParse(Array.from({ length: 8 }, () => PROD_FIGURES[0])).success, true);
  assert.equal(stats.safeParse(Array.from({ length: 9 }, () => PROD_FIGURES[0])).success, false);
  assert.ok(translatablePathsByPage.owners.includes("stats[].label"));
  assert.ok(!translatablePathsByPage.owners.includes("stats[].to"));
});

test("owners S4: 4 rows keep the StatBand default of 4 desktop columns (band unchanged)", () => {
  assert.equal(statBandColumns(4), 4);
});

// ── S3: optional copy overrides with i18n fallback ────────────────────────────
/** The S3 keys, filled (the legacy `validHome()` row has none of them). */
const withS3Copy = (fill: (s: string) => string) => {
  const row = validHome();
  const data = {
    ...row.data,
    seo: { meta_title: fill("Central Hill"), meta_description: fill("Furnished apartments.") },
    hero: { ...row.data.hero, eyebrow: fill("Portugal") },
    stats: { title: fill("Trusted") },
    guests_pitch: {
      ...row.data.guests_pitch,
      badge: { label: fill("Fully managed"), icon_key: fill("shield-check") },
    },
    portfolio: {
      title: fill("Our portfolio"),
      cta_label: fill("All properties"),
      card_view_label: fill("Open →"),
    },
    faq: { title: fill("Questions") },
  };
  return data;
};

test("home S3: a legacy row without the new keys still validates", () => {
  const parsed = homeSchema.safeParse(validHome().data);
  assert.equal(parsed.success, true);
  if (!parsed.success) return;
  assert.equal(parsed.data.seo, undefined);
  assert.equal(parsed.data.guests_pitch.badge, undefined);
});

test("home S3: the new copy validates filled and blank (editor scaffolds blanks)", () => {
  assert.equal(homeSchema.safeParse(withS3Copy((s) => s)).success, true);
  assert.equal(homeSchema.safeParse(withS3Copy(() => "")).success, true);
  const bad = withS3Copy((s) => s);
  bad.guests_pitch.badge.icon_key = "not-an-icon";
  assert.equal(homeSchema.safeParse(bad).success, false, "a non-blank icon must be a real icon");
  const long = withS3Copy((s) => s);
  long.seo.meta_title = "x".repeat(71);
  assert.equal(homeSchema.safeParse(long).success, false, "meta title is capped at 70");
});

test("orMessage: blank / whitespace / absent → the i18n fallback, text → the text", () => {
  assert.equal(orMessage(undefined, "Fallback"), "Fallback");
  assert.equal(orMessage(null, "Fallback"), "Fallback");
  assert.equal(orMessage("", "Fallback"), "Fallback");
  assert.equal(orMessage("   ", "Fallback"), "Fallback");
  assert.equal(orMessage("Custom", "Fallback"), "Custom");
});

test("home S3: the new copy is translatable, the badge icon is not", () => {
  const paths = translatablePathsByPage.home;
  for (const p of [
    "seo.meta_title",
    "seo.meta_description",
    "hero.eyebrow",
    "stats.title",
    "guests_pitch.badge.label",
    "portfolio.title",
    "portfolio.cta_label",
    "portfolio.card_view_label",
    "faq.title",
  ]) {
    assert.ok(paths.includes(p), `expected translatable path ${p}`);
  }
  assert.ok(!paths.includes("guests_pitch.badge.icon_key"), "icons are shared, not copy");
});

test("rejects a home page with the wrong benefit arity (fixed-count array)", () => {
  const row = validHome();
  row.data.guests_pitch.benefits = [1, 2, 3].map(benefit); // must be exactly 4
  assert.equal(pageContentSchema.safeParse(row).success, false);
});

test("home drops the sections removed from the page (ADR 0031)", () => {
  // Stale rows still carry these keys; the schema must strip rather than reject them,
  // or an existing page would stop saving. (The dual-CTA band ADR 0031 also removed was
  // later restored by client direction — b8693db — so it is now required, not stripped.)
  const withLegacy = validHome();
  (withLegacy.data as Record<string, unknown>).owners_pitch = { headline: "gone" };
  (withLegacy.data.hero as Record<string, unknown>).cta_secondary = {
    label: "Earnings",
    url: "https://stale-preview.example/es/owners",
  };
  const parsed = pageContentSchema.safeParse(withLegacy);
  assert.equal(parsed.success, true, "legacy keys must not fail validation");
  assert.ok(parsed.success && !("owners_pitch" in parsed.data.data), "owners_pitch is stripped");
  assert.ok(
    parsed.success &&
      parsed.data.key === "home" &&
      !("url" in parsed.data.data.hero.cta_secondary),
    "the legacy cta_secondary url is stripped",
  );
});

test("home requires the restored dual-CTA band", () => {
  const row = validHome();
  delete (row.data as Record<string, unknown>).dual_cta;
  assert.equal(pageContentSchema.safeParse(row).success, false);
});

test("rejects an unknown page key", () => {
  const row = { ...validHome(), key: "contact" };
  assert.equal(pageContentSchema.safeParse(row).success, false);
});

// ── translatable-field contract ─────────────────────────────────────────────────
test("home exposes prose leaves as translatable but not media ids or urls", () => {
  const paths = translatablePathsByPage.home;
  for (const p of [
    "hero.headline",
    "hero.cta_primary.label",
    "hero.cta_secondary.label",
    "guests_pitch.headline",
    "guests_pitch.benefits[].title",
    "guests_pitch.benefits[].description",
    "guests_pitch.cta.label",
    "guests_pitch.cta.note",
    "services_carousel.headline",
    "services_carousel.eyebrow",
    "services_carousel.assurances[].label",
    "dual_cta.owner.eyebrow",
    "dual_cta.owner.title",
    "dual_cta.owner.body",
    "dual_cta.owner.cta_label",
    "dual_cta.guest.title",
  ]) {
    assert.ok(paths.includes(p), `expected translatable path ${p}`);
  }
  assert.ok(!paths.includes("hero.video_media_id"), "media ids are not translatable");
  assert.ok(!paths.includes("guests_pitch.image_media_id"), "media ids are not translatable");
  assert.ok(!paths.includes("dual_cta.owner.image_media_id"), "media ids are not translatable");
  assert.ok(!paths.includes("dual_cta.guest.image_media_id"), "media ids are not translatable");
  assert.ok(!paths.includes("hero.cta_primary.url"), "urls are not translatable");
  assert.ok(!paths.includes("hero.cta_secondary.url"), "the owners CTA has no stored url");
  // The removed section must not leak back into the translation pipeline, which would
  // queue work for copy that no page renders (ADR 0031).
  assert.ok(
    !paths.some((p) => p.startsWith("owners_pitch")),
    "the removed Home sections are not translatable",
  );
  assert.ok(!paths.includes("faq_group_key"), "the faq group key is language-neutral, not translatable");
  assert.ok(
    !paths.includes("services_carousel.service_category_slug"),
    "the service-category slug is language-neutral, not translatable",
  );
  assert.ok(
    !paths.some((p) => p.startsWith("services_carousel.assurances[].icon_key")),
    "icon keys are a code-side allowlist, not copy",
  );
});

test("services_carousel takes exactly three assurances and an optional category filter", () => {
  // The section's cards come from the `services` slice; only this copy lives on the page
  // (ADR 0032). The category filter is optional — blank means "every published service".
  const data = validHome().data;
  assert.equal(homeSchema.safeParse(data).success, true);

  const noFilter = { ...data, services_carousel: { ...data.services_carousel } } as Record<string, unknown>;
  delete (noFilter.services_carousel as Record<string, unknown>).service_category_slug;
  assert.equal(homeSchema.safeParse(noFilter).success, true);

  const twoMarks = {
    ...data,
    services_carousel: { ...data.services_carousel, assurances: [1, 2].map(assurance) },
  };
  assert.equal(homeSchema.safeParse(twoMarks).success, false, "must be exactly three");

  const fourMarks = {
    ...data,
    services_carousel: { ...data.services_carousel, assurances: [1, 2, 3, 4].map(assurance) },
  };
  assert.equal(homeSchema.safeParse(fourMarks).success, false, "must be exactly three");
});

test("faq_group_key is optional and accepts blank or a group key", () => {
  // absent (legacy rows), blank (= no FAQ), and a real key all validate.
  const data = validHome().data;
  assert.equal(homeSchema.safeParse(data).success, true);
  assert.equal(homeSchema.safeParse({ ...data, faq_group_key: "" }).success, true);
  assert.equal(homeSchema.safeParse({ ...data, faq_group_key: "owners" }).success, true);
});

test("translatablePathsByPage is derived directly from each page schema", () => {
  assert.deepEqual(translatablePathsByPage.home, translatablePaths(homeSchema));
  assert.deepEqual(translatablePathsByPage.guest, translatablePaths(guestSchema));
});

// ── guest page (docs/specs/guest-page-db-wiring.md) ──────────────────────────────
/**
 * The 0012 migration is what actually fills the live `guest` row, so its payload must
 * satisfy the schema the admin form and the renderer share. Parsing the real SQL keeps the
 * two from drifting: change one without the other and this test fails. Run from the repo root.
 */
function migration0012Payload(): unknown {
  const sql = readFileSync(
    path.resolve(process.cwd(), "drizzle/0012_guest_page_db_wiring.sql"),
    "utf8",
  );
  const match = /\$guest\$([\s\S]*?)\$guest\$/.exec(sql);
  assert.ok(match, "migration 0012 must carry a $guest$-quoted JSON payload");
  return JSON.parse(match[1]!);
}

test("the 0012 migration payload validates against guestSchema", () => {
  const parsed = guestSchema.safeParse(migration0012Payload());
  assert.ok(
    parsed.success,
    `migration payload rejected: ${JSON.stringify(parsed.error?.issues, null, 2)}`,
  );
});

test("guest exposes prose leaves as translatable but not media ids, urls or the faq key", () => {
  const paths = translatablePathsByPage.guest;
  for (const p of [
    "hero.headline",
    "hero.eyebrow",
    "hero.cta.label",
    "welcome.copy",
    "welcome.guarantee_label",
    "why.benefits[].title",
    "why.benefits[].description",
    "why.cta.note",
    "portfolio.headline",
    "portfolio.cta.label",
    "services_teaser.items[].description",
    "activities_teaser.eyebrow",
    "dual_cta.guest.title",
    "dual_cta.owner.cta.label",
  ]) {
    assert.ok(paths.includes(p), `expected translatable path ${p}`);
  }
  assert.ok(!paths.includes("hero.video_media_id"), "media ids are not translatable");
  assert.ok(!paths.includes("welcome.image_media_id"), "media ids are not translatable");
  assert.ok(!paths.includes("hero.cta.url"), "urls are not translatable");
  assert.ok(!paths.includes("portfolio.cta.url"), "urls are not translatable");
  assert.ok(!paths.includes("faq_group_key"), "the faq group key is language-neutral");
  // Reviews live in the testimonials slice; the page only authors their heading (S2).
  assert.deepEqual(
    paths.filter((p) => p.startsWith("testimonials")).sort(),
    ["testimonials.eyebrow", "testimonials.intro", "testimonials.title"],
  );
});

test("guest media references accept a blank value (fall back to the approved asset)", () => {
  const data = migration0012Payload() as {
    hero: { video_media_id: string };
    welcome: { image_media_id: string };
  };
  assert.equal(data.hero.video_media_id, "");
  assert.equal(data.welcome.image_media_id, "");
  assert.equal(guestSchema.safeParse(data).success, true);
  assert.equal(
    guestSchema.safeParse({
      ...data,
      hero: { ...data.hero, video_media_id: UUID },
      welcome: { ...data.welcome, image_media_id: UUID },
    }).success,
    true,
  );
});

test("guest rejects a blank CTA url (the migration must backfill real links)", () => {
  const data = migration0012Payload() as { hero: { cta: { label: string; url: string } } };
  const broken = { ...data, hero: { ...data.hero, cta: { ...data.hero.cta, url: "" } } };
  assert.equal(guestSchema.safeParse(broken).success, false);
});

test("blog/guides defaults validate and the 0016 migration inserts exactly them", () => {
  assert.equal(blogSchema.safeParse(defaultBlog).success, true);
  assert.equal(guidesSchema.safeParse(defaultGuides).success, true);
  const sql = readFileSync(path.resolve(process.cwd(), "drizzle/0016_pages_blog_guides_rows.sql"), "utf8");
  const rows = Object.fromEntries(
    [...sql.matchAll(/\('(\w+)', '(\{.*\})'::jsonb\)/g)].map((m) => [m[1], JSON.parse(m[2]!.replace(/''/g, "'"))]),
  );
  assert.deepEqual(rows, { blog: defaultBlog, guides: defaultGuides });
});

test("blog/guides aside CTAs translate their copy but not the photo", () => {
  assert.deepEqual(translatablePathsByPage.blog.sort(), [
    "post_aside.body",
    "post_aside.cta_label",
    "post_aside.eyebrow",
    "post_aside.title",
  ]);
  assert.ok(!translatablePathsByPage.guides.some((p) => p.includes("_media_id")));
  assert.ok(translatablePathsByPage.guides.includes("guide_aside.title"));
});

// ── pure overlay logic ──────────────────────────────────────────────────────────
test("about's default copy validates and is what the page renders without a row", () => {
  assert.equal(aboutSchema.safeParse(defaultAbout).success, true);
  // The old seed shape (contact CTAs, no stats) is rejected — the backfill replaces it.
  const old = { ...defaultAbout, contact: { headline: "Get in touch", cta_guests: { label: "x", url: "https://x.pt" } } };
  assert.equal(aboutSchema.safeParse(old).success, false);
});

test("about exposes prose leaves as translatable but not icons, media ids or the issuer", () => {
  const paths = translatablePathsByPage.about;
  for (const p of ["hero.mission", "stats[].label", "serve.audiences[].title", "organisation.departments[].name", "contact.cards[].link_label"]) {
    assert.ok(paths.includes(p), `${p} should be translatable`);
  }
  for (const p of paths) {
    assert.ok(!/icon_key|_media_id|issuer|faq_group_key/.test(p), `${p} should not be translatable`);
  }
});

test("expand walks fixed-count arrays into concrete numeric paths", () => {
  const data = { guests_pitch: { benefits: [benefit(1), benefit(2)] } };
  const concrete = expand(["guests_pitch", "benefits[]", "title"], data, []);
  assert.deepEqual(concrete, [
    ["guests_pitch", "benefits", "0", "title"],
    ["guests_pitch", "benefits", "1", "title"],
  ]);
});

test("overlayTranslations replaces approved leaves and falls back to source", () => {
  const data = validHome().data;
  const translated: Record<string, string> = {
    "hero.headline": "Des moments en souvenirs",
    "guests_pitch.benefits.0.title": "Avantage 1",
  };
  const out = overlayTranslations(data, translatablePathsByPage.home, (p) => translated[p]);

  // overlaid where a translation exists…
  assert.equal((out.hero as { headline: string }).headline, "Des moments en souvenirs");
  assert.equal(
    (out.guests_pitch as { benefits: { title: string }[] }).benefits[0]!.title,
    "Avantage 1",
  );
  // …source-locale fallback where it does not.
  assert.equal(
    (out.guests_pitch as { benefits: { title: string }[] }).benefits[1]!.title,
    "Benefit 2",
  );
  // and the original is not mutated.
  assert.equal((data.hero as { headline: string }).headline, "Turning moments into memories");
});

test("collectMediaIds gathers every *_media_id across nesting", () => {
  const ids: string[] = [];
  collectMediaIds(validHome().data, ids);
  // hero.video + guests_pitch.image (the dual-CTA panels went with ADR 0031)
  assert.equal(ids.length, 2);
  assert.ok(ids.every((id) => id === UUID));
});

// ── Owners S2: optional copy overrides with i18n fallback ────────────────────
test("owners S2: the new copy keys are optional, blank-tolerant and capped", () => {
  const { hero, services, plans, seo, testimonials, faq } = ownersSchema.shape;
  const heroBase = { image_media_id: "", headline: "Your Property", copy: "Managed." };
  assert.ok(hero.safeParse(heroBase).success, "a legacy hero without `contact` validates");
  assert.ok(hero.safeParse({ ...heroBase, contact: { label: "", title: "", intro: "" } }).success);
  assert.ok(!hero.safeParse({ ...heroBase, contact: { label: "x".repeat(41) } }).success, "label ≤ 40");
  const badge = services.shape.badge;
  assert.ok(badge.safeParse(undefined).success);
  assert.ok(badge.safeParse({ label: "", icon_key: "" }).success);
  assert.ok(badge.safeParse({ label: "Handled", icon_key: "shield-check" }).success);
  assert.ok(!badge.safeParse({ label: "Handled", icon_key: "not-an-icon" }).success);
  assert.ok(plans.shape.choose_label.safeParse("Pick {name}").success);
  assert.ok(!plans.shape.popular_label.safeParse("x".repeat(31)).success, "pill ≤ 30");
  assert.ok(seo.safeParse(undefined).success && testimonials.safeParse(undefined).success);
  assert.ok(faq.safeParse({ title: "Questions" }).success);
});

test("owners S2: the new copy is translatable, the badge icons are not", () => {
  const paths = translatablePathsByPage.owners;
  for (const p of [
    "seo.meta_title",
    "seo.meta_description",
    "hero.contact.label",
    "hero.contact.title",
    "hero.contact.intro",
    "services.badge.label",
    "dashboard.badge.label",
    "plans.popular_label",
    "plans.choose_label",
    "testimonials.title",
    "faq.title",
  ]) {
    assert.ok(paths.includes(p), `expected translatable path ${p}`);
  }
  assert.ok(!paths.includes("services.badge.icon_key") && !paths.includes("dashboard.badge.icon_key"));
});

test("owners S2: a blank field renders the i18n message, a filled one its own text", () => {
  assert.equal(orMessage(undefined, "Contact Us"), "Contact Us");
  assert.equal(orMessage("  ", "Most Popular"), "Most Popular");
  assert.equal(orMessage("Talk to us", "Contact Us"), "Talk to us");
});

test("orNamedMessage: `{name}` is replaced in a field; blank → the ICU fallback gets the name", () => {
  const icu = (name: string) => `Choose ${name}`; // stands in for t("owners.choosePlan", { name })
  assert.equal(orNamedMessage(undefined, "Prime", icu), "Choose Prime");
  assert.equal(orNamedMessage("", "Prime", icu), "Choose Prime");
  assert.equal(orNamedMessage("Go {name}", "Prime", icu), "Go Prime");
  assert.equal(orNamedMessage("{name} — {name}", "Core", icu), "Core — Core");
  assert.equal(orNamedMessage("Start now", "Core", icu), "Start now", "no placeholder → as written");
});

test("seoMetadataInput: falls back to i18n, uses seo fields + OG, keeps canonical/hreflang", () => {
  const base = {
    locale: "pt" as const,
    path: "/owners",
    fallbackTitle: "Para Proprietários — Central Hill",
    fallbackDescription: "Descrição.",
  };
  const blank = seoMetadataInput({ ...base, seo: { meta_title: "", meta_description: " " }, ogImage: null });
  assert.equal(blank.title, base.fallbackTitle);
  assert.equal(blank.description, base.fallbackDescription);
  assert.equal(blank.images, undefined);
  assert.equal(blank.canonicalPath, "/pt/owners");
  assert.deepEqual(blank.languages, {
    "x-default": "/owners",
    en: "/en/owners",
    pt: "/pt/owners",
    es: "/es/owners",
    fr: "/fr/owners",
  });
  assert.equal(seoMetadataInput({ ...base, seo: undefined, ogImage: undefined }).title, base.fallbackTitle);
  const og = { url: "https://cdn.example/og.jpg", width: 1200, height: 630, alt: "Owners", blurhash: null };
  const filled = seoMetadataInput({
    ...base,
    seo: { meta_title: "Owners", meta_description: "Managed rentals." },
    ogImage: og,
  });
  assert.equal(filled.title, "Owners");
  assert.equal(filled.description, "Managed rentals.");
  assert.deepEqual(filled.images, [{ url: og.url, width: 1200, height: 630, alt: "Owners" }]);
});

// ── Owners S3: estimate form — fixed i18n strings + editable steps 2/3 ──────
const ESTIMATE_LOCALES = ["en", "pt", "es", "fr"] as const;
function estimateFormMessages(locale: string): Record<string, string> {
  const all = JSON.parse(readFileSync(path.resolve(process.cwd(), `messages/${locale}.json`), "utf8"));
  return all.pages.estimateForm;
}
/** The ICU arguments and rich-text tags a message uses (what must match across locales). */
function icuShape(message: string | undefined = ""): string {
  const args = [...message.matchAll(/\{\s*(\w+)/g)].map((m) => `{${m[1]}}`);
  const tags = [...message.matchAll(/<\/?(\w+)>/g)].map((m) => m[0]);
  return [...args, ...tags].sort().join(" ");
}

test("owners S3: every pages.estimateForm key exists in all 4 locales with the same args/tags", () => {
  const en = estimateFormMessages("en");
  const keys = Object.keys(en).sort();
  assert.ok(keys.length >= 22, "the form's fixed strings + step 2/3 defaults");
  for (const locale of ESTIMATE_LOCALES) {
    const msgs = estimateFormMessages(locale);
    assert.deepEqual(Object.keys(msgs).sort(), keys, `${locale}: same keys as en`);
    for (const k of keys) {
      assert.ok(typeof msgs[k] === "string" && msgs[k].trim() !== "", `${locale}.${k} is non-empty`);
      assert.equal(icuShape(msgs[k]), icuShape(en[k]), `${locale}.${k}: same ICU args/tags as en`);
    }
  }
  assert.equal(icuShape(en.agreeTerms), "</terms> <terms>");
  assert.equal(icuShape(en.agreePrivacy), "</privacy> <privacy>");
});

test("owners S3: the step 2/3 copy is optional, blank-tolerant, capped and translatable", () => {
  const form = ownersSchema.shape.earnings_form;
  const base = { headline: "Get your study", cta_label: "Request my study" };
  assert.ok(form.safeParse(base).success, "a legacy earnings_form without the new keys validates");
  const blank = {
    ...base,
    contact_step: { title: "", lede: "", submit_label: "", back_label: "" },
    done_step: { title: "", body: "" },
  };
  assert.ok(form.safeParse(blank).success, "blank fields (editor scaffold) validate");
  assert.ok(form.safeParse({ ...base, contact_step: {}, done_step: {} }).success);
  assert.ok(!form.safeParse({ ...base, contact_step: { back_label: "x".repeat(31) } }).success, "back ≤ 30");
  assert.ok(!form.safeParse({ ...base, done_step: { body: "x".repeat(401) } }).success, "body ≤ 400");
  const paths = translatablePathsByPage.owners;
  for (const p of [
    "earnings_form.contact_step.title",
    "earnings_form.contact_step.lede",
    "earnings_form.contact_step.submit_label",
    "earnings_form.contact_step.back_label",
    "earnings_form.done_step.title",
    "earnings_form.done_step.body",
  ]) {
    assert.ok(paths.includes(p), `expected translatable path ${p}`);
  }
});

test("owners S3: each step 2/3 field's admin hint names its current EN default", () => {
  const en = estimateFormMessages("en");
  const { contact_step, done_step } = ownersSchema.shape.earnings_form.shape;
  const contact = contact_step.unwrap().shape;
  const done = done_step.unwrap().shape;
  const pairs: [string | undefined, string | undefined][] = [
    [contact.title.description, en.contactTitle],
    [contact.lede.description, en.contactLede],
    [contact.submit_label.description, en.submit],
    [contact.back_label.description, en.back],
    [done.title.description, en.doneTitle],
    [done.body.description, en.doneBody],
  ];
  for (const [hint, message] of pairs) {
    assert.ok(hint?.includes(`Leave blank for “${message}`), `hint "${hint}" names "${message}"`);
  }
  // Blank → that default (same rule as every other optional field).
  assert.equal(orMessage("", en.back ?? ""), "Back");
  assert.equal(orMessage("Return", en.back ?? ""), "Return");
});

// ── Owners S6: editable closing CTA ──────────────────────────────────────────
test("owners S6: final_cta validates absent, blank and filled; is translatable but not its image", () => {
  const finalCta = ownersSchema.shape.final_cta;
  assert.ok(finalCta.safeParse(undefined).success, "a row saved before S6 validates");
  const blank = { eyebrow: "", headline: "", body: "", cta_label: "", contact_line: "", image_media_id: "" };
  assert.ok(finalCta.safeParse(blank).success);
  assert.ok(
    finalCta.safeParse({
      eyebrow: "Start now",
      headline: "Ready?",
      body: "Join us.",
      cta_label: "Get an estimate",
      contact_line: "Call us",
      image_media_id: UUID,
    }).success,
  );
  assert.ok(!finalCta.safeParse({ ...blank, eyebrow: "x".repeat(61) }).success, "eyebrow ≤ 60");
  assert.ok(!finalCta.safeParse({ ...blank, contact_line: "x".repeat(201) }).success, "line ≤ 200");
  const paths = translatablePathsByPage.owners;
  for (const k of ["eyebrow", "headline", "body", "cta_label", "contact_line"]) {
    assert.ok(paths.includes(`final_cta.${k}`), `final_cta.${k} is translatable`);
  }
  assert.ok(!paths.includes("final_cta.image_media_id"));
});

test("owners S6: blank fields name today's EN text, which equals the EN messages", () => {
  const en = JSON.parse(readFileSync(path.join(process.cwd(), "messages/en.json"), "utf8")).pages.owners;
  assert.equal(en.finalEyebrow, "Start Earning More Today");
  assert.equal(en.finalTitle, "Ready to Make Your Property Work for You?");
  assert.equal(
    en.finalCopy,
    "Join the growing number of property owners across Portugal who trust Central Hill Apartments to deliver exceptional results. Start with a free, no-obligation profitability analysis.",
  );
  assert.equal(en.finalCta, "Get Your Free Earnings Estimate");
  const f = ownersSchema.shape.final_cta.unwrap().shape;
  assert.ok(f.eyebrow.description?.includes(`“${en.finalEyebrow}”`));
  assert.ok(f.headline.description?.includes(`“${en.finalTitle}”`));
  assert.ok(f.body.description?.includes(`“${en.finalCopy}”`));
  assert.ok(f.cta_label.description?.includes(`“${en.finalCta}”`));
  for (const loc of ["en", "pt", "es", "fr"]) {
    const m = JSON.parse(readFileSync(path.join(process.cwd(), `messages/${loc}.json`), "utf8")).pages.owners;
    assert.match(m.finalCall, /\{phone\}/, `${loc} finalCall`);
    assert.ok(m.finalCopy.includes("Central Hill Apartments"), `${loc} finalCopy`);
  }
});

test("owners S6: contact line — field wins, blank → Settings with 'Call', Home unchanged", () => {
  const settings = { phone: "+351 910 075 725", email: "info@centralhill.pt", whatsapp: "+351 910 075 725" };
  const call = (phone: string) => `Call ${phone}`;
  // Today's hardcoded EN line, reproduced from today's Settings values.
  assert.equal(
    ownersFinalContactLine("", settings, call),
    "Call +351 910 075 725 · info@centralhill.pt · WhatsApp +351 910 075 725",
  );
  assert.equal(ownersFinalContactLine(undefined, settings, call)?.startsWith("Call "), true);
  assert.equal(ownersFinalContactLine("Ring us anytime", settings, call), "Ring us anytime");
  assert.equal(ownersFinalContactLine("  ", null, call), undefined, "no field, no settings → no line");
  assert.equal(
    ownersFinalContactLine("", { ...settings, whatsapp: null }, call),
    "Call +351 910 075 725 · info@centralhill.pt",
  );
  // Home's owner panel (no phone wrapper) keeps its exact output.
  assert.equal(
    settingsContactLine(settings),
    "+351 910 075 725 · info@centralhill.pt · WhatsApp +351 910 075 725",
  );
  assert.equal(settingsContactLine(null), null);
});

// ── Buildings listing (spec buildings-admin-editor S1) ───────────────────────

test("buildings S1: texts are translatable; media, numbers and affixes are not", () => {
  const paths = translatablePathsByPage.buildings;
  for (const p of [
    "seo.meta_title",
    "seo.meta_description",
    "hero.eyebrow",
    "hero.headline",
    "hero.copy",
    "hero.contact.label",
    "owner_panel.title",
    "owner_panel.contact_line",
    "stats.title",
    "stats.figures[].label",
    "stats.figures[].description",
    "calculator.badge",
    "calculator.cta_label",
    "calculator.contact_step.lede",
    "calculator.done_step.body",
  ]) {
    assert.ok(paths.includes(p), `${p} is translatable`);
  }
  for (const p of [
    "hero.image_media_id",
    "calculator.media_media_id",
    "stats.figures[].to",
    "stats.figures[].prefix",
    "stats.figures[].suffix",
    "stats.figures[].group",
  ]) {
    assert.ok(!paths.includes(p), `${p} is shared across locales`);
  }
});

test("buildings S1: migration 0017 inserts exactly defaultBuildings", () => {
  const sql = readFileSync(path.resolve(process.cwd(), "drizzle/0017_pages_buildings_row.sql"), "utf8");
  const json = /\('buildings', '(.*)'::jsonb\)/.exec(sql)?.[1];
  assert.ok(json, "the buildings row literal");
  assert.deepEqual(JSON.parse(json), defaultBuildings);
  assert.match(sql, /ON CONFLICT \("key"\) DO NOTHING/);
});

// ── Buildings listing S2: public render + SEO ────────────────────────────────

const BUILDINGS_KEYS = [
  "metaTitle",
  "metaDescription",
  "heroEyebrow",
  "heroTitle",
  "heroCopy",
  "ownerEyebrow",
  "ownerTitle",
  "ownerBody",
  "ownerCta",
  "statsTitle",
  "calcBadge",
  "calcTitle",
  "calcSubtitle",
  "calcCta",
] as const;
function buildingsMessages(locale: string): Record<string, string> {
  return JSON.parse(readFileSync(path.resolve(process.cwd(), `messages/${locale}.json`), "utf8")).pages
    .buildings;
}

test("buildings S2: every pages.buildings key exists in all 4 locales, EN = today's literals", () => {
  for (const locale of ESTIMATE_LOCALES) {
    const m = buildingsMessages(locale);
    assert.deepEqual(Object.keys(m).sort(), [...BUILDINGS_KEYS].sort(), `${locale}: same keys`);
    for (const k of BUILDINGS_KEYS) assert.ok(m[k]?.trim(), `${locale}.${k} is non-empty`);
    assert.ok(m.ownerCta?.endsWith(" →"), `${locale}.ownerCta keeps the arrow`);
  }
  const en = buildingsMessages("en");
  assert.equal(en.metaTitle, "Buildings — Central Hill");
  assert.equal(en.heroTitle, "Strategic Properties in Prime Locations");
  assert.equal(en.ownerCta, "Get Your Free Earnings Estimate →");
  assert.equal(en.statsTitle, "Numbers That Speak for Themselves");
  assert.equal(en.calcBadge, "Earn +25%");
  assert.equal(en.calcCta, "Calculate My Earnings");
  // The schema hints name the same EN defaults.
  const hero = buildingsSchema.shape.hero.unwrap().shape;
  assert.ok(hero.headline.description?.includes(`“${en.heroTitle}”`));
  assert.ok(hero.copy.description?.includes(`“${en.heroCopy}”`));
  const panel = buildingsSchema.shape.owner_panel.unwrap().shape;
  assert.ok(panel.body.description?.includes(`“${en.ownerBody}”`));
  assert.ok(panel.cta_label.description?.includes(`“${en.ownerCta}”`));
  const calc = buildingsSchema.shape.calculator.unwrap().shape;
  assert.ok(calc.headline.description?.includes(`“${en.calcTitle}”`));
  assert.ok(calc.subheadline.description?.includes(`“${en.calcSubtitle}”`));
});

test("buildings S2: blank fields render the i18n text, filled ones their own", () => {
  const en = buildingsMessages("en");
  const blank = defaultBuildings; // no row in the DB → the render uses this
  assert.equal(orMessage(blank.hero?.headline, en.heroTitle!), en.heroTitle);
  assert.equal(orMessage(blank.owner_panel?.cta_label, en.ownerCta!), en.ownerCta);
  assert.equal(orMessage(blank.calculator?.badge, en.calcBadge!), en.calcBadge);
  assert.equal(orMessage(" ", en.statsTitle!), en.statsTitle);
  const filled = buildingsSchema.parse({
    hero: { image_media_id: "", headline: "Our buildings" },
    calculator: { badge: "Earn more", media_media_id: "" },
  });
  assert.equal(orMessage(filled.hero?.headline, en.heroTitle!), "Our buildings");
  assert.equal(orMessage(filled.calculator?.badge, en.calcBadge!), "Earn more");
});

test("buildings S2: owner panel contact line — field wins, blank → Settings with 'Call'", () => {
  const settings = { phone: "+351 910 075 725", email: "info@centralhill.pt", whatsapp: "+351 910 075 725" };
  const call = (phone: string) => `Call ${phone}`; // EN `pages.owners.finalCall`
  assert.equal(
    ownersFinalContactLine(defaultBuildings.owner_panel?.contact_line, settings, call),
    "Call +351 910 075 725 · info@centralhill.pt · WhatsApp +351 910 075 725",
    "today's literal, rebuilt from today's Settings",
  );
  assert.equal(ownersFinalContactLine("Call us 24/7", settings, call), "Call us 24/7");
});

test("buildings S2: seoMetadataInput falls back to i18n and keeps canonical/hreflang", () => {
  const en = buildingsMessages("en");
  const input = seoMetadataInput({
    locale: "en",
    path: "/buildings",
    seo: defaultBuildings.seo,
    ogImage: null,
    fallbackTitle: en.metaTitle!,
    fallbackDescription: en.metaDescription!,
  });
  assert.equal(input.title, "Buildings — Central Hill");
  assert.equal(
    input.description,
    "Explore Central Hill's curated portfolio of exceptional buildings in Lisbon's most vibrant and iconic neighbourhoods — each handpicked for location, character, and guest experience.",
  );
  assert.equal(input.canonicalPath, "/en/buildings");
  assert.deepEqual(input.languages, {
    "x-default": "/buildings",
    en: "/en/buildings",
    pt: "/pt/buildings",
    es: "/es/buildings",
    fr: "/fr/buildings",
  });
  assert.equal(input.images, undefined);
  const filled = seoMetadataInput({
    locale: "fr",
    path: "/buildings",
    seo: { meta_title: "Nos immeubles", meta_description: "" },
    ogImage: null,
    fallbackTitle: "x",
    fallbackDescription: "fallback",
  });
  assert.equal(filled.title, "Nos immeubles");
  assert.equal(filled.description, "fallback");
  assert.equal(filled.canonicalPath, "/fr/buildings");
});

test("buildings S2: figures → cells keep descriptions; 3 figures → 3 columns, as today", () => {
  const cells = describedStatFigureCells(defaultBuildings.stats?.figures ?? []);
  assert.deepEqual(cells, [
    { value: "400,000+", label: "Bookings Completed", description: "Across all managed properties" },
    { value: "12+", label: "Years of Experience", description: "Optimizing owner returns in Portugal" },
    { value: "€55M+", label: "Revenue Generated", description: "For our property owners" },
  ]);
  assert.equal(statBandColumns(cells.length), 3);
  assert.deepEqual(
    describedStatFigureCells([{ label: "Guests", to: "5", group: false, description: " " }]),
    [{ value: "5", label: "Guests" }],
    "a blank description adds no second line",
  );
  assert.deepEqual(describedStatFigureCells([]), [], "no figures → no band");
});

// ── Real Estate S2: SEO, FAQ title, featured badge and fallback alts ─────────
test("real estate S2: `seo` and `faq` are optional, blank-tolerant, capped and translatable", () => {
  const { seo, faq } = realEstateSchema.shape;
  assert.ok(seo.safeParse(undefined).success, "a legacy row without `seo` validates");
  assert.ok(seo.safeParse({ meta_title: "", meta_description: "" }).success);
  assert.ok(seo.safeParse({ meta_title: "Real Estate", meta_description: "Partnerships." }).success);
  assert.ok(faq.safeParse(undefined).success, "a legacy row without `faq` validates");
  assert.ok(faq.safeParse({ title: "" }).success && faq.safeParse({}).success);
  assert.ok(faq.safeParse({ title: "Investor FAQ" }).success);
  assert.ok(!faq.safeParse({ title: "x".repeat(161) }).success, "title ≤ 160");
  const paths = translatablePathsByPage.real_estate;
  for (const p of ["seo.meta_title", "seo.meta_description", "faq.title"]) {
    assert.ok(paths.includes(p), `expected translatable path ${p}`);
  }
});

test("real estate S2: a blank FAQ title / badge renders the i18n message", () => {
  assert.equal(orMessage(undefined, "Investor Questions, Answered"), "Investor Questions, Answered");
  assert.equal(orMessage(" ", "Investor Questions, Answered"), "Investor Questions, Answered");
  assert.equal(orMessage("Your questions", "Investor Questions, Answered"), "Your questions");
});

test("seoMetadataInput: /real-estate falls back to i18n and builds canonical + hreflang", () => {
  const input = seoMetadataInput({
    locale: "es",
    path: "/real-estate",
    seo: undefined,
    ogImage: null,
    fallbackTitle: "Alianzas Inmobiliarias — Central Hill",
    fallbackDescription: "Descripción.",
  });
  assert.equal(input.title, "Alianzas Inmobiliarias — Central Hill");
  assert.equal(input.description, "Descripción.");
  assert.equal(input.canonicalPath, "/es/real-estate");
  assert.deepEqual(input.languages, {
    "x-default": "/real-estate",
    en: "/en/real-estate",
    pt: "/pt/real-estate",
    es: "/es/real-estate",
    fr: "/fr/real-estate",
  });
  assert.equal(input.images, undefined);
  const blank = seoMetadataInput({
    locale: "en",
    path: "/real-estate",
    seo: { meta_title: " ", meta_description: "" },
    ogImage: undefined,
    fallbackTitle: "Real Estate Partnerships — Central Hill",
    fallbackDescription: "d",
  });
  assert.equal(blank.title, "Real Estate Partnerships — Central Hill");
  assert.equal(blank.canonicalPath, "/en/real-estate");
});

test("real estate S2: EN meta matches the route's former hardcoded metadata; new keys in 4 locales", () => {
  const read = (l: string) =>
    JSON.parse(readFileSync(path.join(process.cwd(), `messages/${l}.json`), "utf8")).pages;
  const en = read("en").realEstate;
  assert.equal(en.metaTitle, "Real Estate Partnerships — Central Hill");
  assert.equal(
    en.metaDescription,
    "Central Hill Apartments is the hospitality management partner for investment funds, real estate developers, large-scale operators, and corporate clients seeking institutional-grade returns on their assets in Portugal.",
  );
  assert.equal(en.heroAlt, "Aerial view of Lisbon's historic skyline and tiled rooftops at dusk");
  assert.equal(en.capabilitiesAlt, "Central Hill's management team reviewing portfolio performance dashboards");
  assert.equal(en.assetsAlt, "Designer-furnished managed apartment in a Lisbon building");
  for (const l of ["en", "pt", "es", "fr"]) {
    const pages = read(l);
    for (const k of ["metaTitle", "metaDescription", "featuredModel", "faqTitle", "heroAlt", "capabilitiesAlt", "assetsAlt"]) {
      const v = pages.realEstate[k];
      assert.ok(typeof v === "string" && v.trim() !== "", `${l}: pages.realEstate.${k}`);
    }
    const note = pages.admin.layout.notes.dealStructuresFeatured;
    assert.ok(typeof note === "string" && note.trim() !== "", `${l}: notes.dealStructuresFeatured`);
  }
});

// ── Real Estate S5: enquiry copy, fixed form i18n, Settings contact lines ────
const readPages = (l: string) =>
  JSON.parse(readFileSync(path.join(process.cwd(), `messages/${l}.json`), "utf8")).pages;

test("real estate S5: deal_enquiry is optional, blank-tolerant, capped and translatable", () => {
  const field = realEstateSchema.shape.deal_enquiry;
  assert.ok(field.safeParse(undefined).success, "a row saved before S5 validates");
  assert.ok(field.safeParse({}).success);
  const blank = { headline: "", lede: "", contact_title: "", submit_label: "", note: "" };
  assert.ok(field.safeParse(blank).success, "blank fields (editor scaffold) validate");
  assert.ok(!field.safeParse({ headline: "x".repeat(161) }).success, "headline ≤ 160");
  assert.ok(!field.safeParse({ lede: "x".repeat(601) }).success, "lede ≤ 600");
  assert.ok(!field.safeParse({ contact_title: "x".repeat(121) }).success, "contact title ≤ 120");
  assert.ok(!field.safeParse({ submit_label: "x".repeat(81) }).success, "submit ≤ 80");
  assert.ok(!field.safeParse({ note: "x".repeat(201) }).success, "note ≤ 200");
  const paths = translatablePathsByPage.real_estate;
  for (const k of ["headline", "lede", "contact_title", "submit_label", "note"]) {
    assert.ok(paths.includes(`deal_enquiry.${k}`), `expected translatable path deal_enquiry.${k}`);
  }
});

test("real estate S5: each deal_enquiry hint names its EN default; EN defaults = the former copy", () => {
  const en = readPages("en");
  assert.equal(en.realEstate.enquiryTitle, "Ready to Explore a Partnership?");
  assert.equal(en.realEstate.enquiryContactTitle, "Contact Our Institutional Team Directly");
  assert.equal(en.dealEnquiryForm.submit, "Submit Partnership Enquiry");
  assert.equal(en.dealEnquiryForm.note, "A senior member of our institutional team will respond within 24 hours.");
  const s = realEstateSchema.shape.deal_enquiry.unwrap().shape;
  const pairs: [string | undefined, string][] = [
    [s.headline.description, en.realEstate.enquiryTitle],
    [s.lede.description, en.realEstate.enquiryLede],
    [s.contact_title.description, en.realEstate.enquiryContactTitle],
    [s.submit_label.description, en.dealEnquiryForm.submit],
    [s.note.description, en.dealEnquiryForm.note],
  ];
  for (const [hint, message] of pairs) {
    assert.ok(hint?.includes(`Leave blank for “${message}”`), `hint "${hint}" names "${message}"`);
  }
});

test("real estate S5: every pages.dealEnquiryForm / new realEstate key exists in all 4 locales", () => {
  const en = readPages("en");
  const formKeys = Object.keys(en.dealEnquiryForm).sort();
  assert.ok(formKeys.length >= 40, "group titles, tags, labels, placeholders, options, submit, note");
  const reKeys = [
    "enquiryTitle", "enquiryLede", "enquiryContactTitle",
    "contactEmail", "contactPhone", "contactLinkedin", "contactLinkedinText",
  ];
  for (const l of ["en", "pt", "es", "fr"]) {
    const pages = readPages(l);
    assert.deepEqual(Object.keys(pages.dealEnquiryForm).sort(), formKeys, `${l}: same dealEnquiryForm keys as en`);
    for (const k of formKeys) {
      const v = pages.dealEnquiryForm[k];
      assert.ok(typeof v === "string" && v.trim() !== "", `${l}: pages.dealEnquiryForm.${k}`);
      assert.equal(icuShape(v), icuShape(en.dealEnquiryForm[k]), `${l}.${k}: same ICU args as en`);
    }
    for (const k of reKeys) {
      const v = pages.realEstate[k];
      assert.ok(typeof v === "string" && v.trim() !== "", `${l}: pages.realEstate.${k}`);
    }
    const note = pages.admin.layout.notes.dealEnquiry;
    assert.ok(typeof note === "string" && note.trim() !== "", `${l}: notes.dealEnquiry`);
  }
});

test("real estate S5: enquiry contact lines come from Settings; missing data → line omitted", () => {
  const labels = { email: "Email:", phone: "Tel:", linkedin: "LinkedIn:", linkedinText: "Central Hill Apartments" };
  const full = {
    email: "info@centralhill.pt",
    phone: "+351 910 075 725",
    social: { linkedin: "https://linkedin.com/company/centralhill" },
  };
  assert.deepEqual(enquiryContactLines(full, labels), [
    { label: "Email:", href: "mailto:info@centralhill.pt", text: "info@centralhill.pt" },
    { label: "Tel:", href: "tel:+351910075725", text: "+351 910 075 725" },
    { label: "LinkedIn:", href: "https://linkedin.com/company/centralhill", text: "Central Hill Apartments" },
  ]);
  assert.deepEqual(
    enquiryContactLines({ email: "", phone: "+351 910 075 725", social: {} }, labels).map((l) => l.label),
    ["Tel:"],
    "no email and no LinkedIn → only the phone line",
  );
  assert.deepEqual(
    enquiryContactLines({ email: "a@b.pt", phone: " ", social: { linkedin: "" } }, labels).map((l) => l.href),
    ["mailto:a@b.pt"],
  );
  assert.deepEqual(enquiryContactLines(null, labels), [], "no settings → no lines");
});

// ── Guests S2: SEO, testimonials heading and FAQ title with i18n fallback ────
test("guests S2: `seo`, `testimonials`, `faq` are optional, blank-tolerant, capped and translatable", () => {
  // The live 0012 row (no S2 keys) still validates, and so does one with every key filled / blank.
  const legacy = migration0012Payload() as Record<string, unknown>;
  assert.ok(!("seo" in legacy) && !("testimonials" in legacy) && !("faq" in legacy));
  assert.ok(guestSchema.safeParse(legacy).success, "a row without the S2 keys validates");
  const blank = {
    ...legacy,
    seo: { meta_title: "", meta_description: "" },
    testimonials: { eyebrow: "", title: "", intro: "" },
    faq: { title: "" },
  };
  assert.ok(guestSchema.safeParse(blank).success, "blank S2 fields validate");
  const filled = {
    ...legacy,
    seo: { meta_title: "Stay in Lisbon", meta_description: "Furnished apartments." },
    testimonials: { eyebrow: "Guest love", title: "What guests say", intro: "Real stays." },
    faq: { title: "Guest questions" },
  };
  assert.ok(guestSchema.safeParse(filled).success, "filled S2 fields validate");
  const { seo, testimonials, faq } = guestSchema.shape;
  assert.ok(!seo.safeParse({ meta_title: "x".repeat(71) }).success, "meta_title ≤ 70");
  assert.ok(!testimonials.safeParse({ eyebrow: "x".repeat(61) }).success, "eyebrow ≤ 60");
  assert.ok(!testimonials.safeParse({ title: "x".repeat(161) }).success, "title ≤ 160");
  assert.ok(!testimonials.safeParse({ intro: "x".repeat(401) }).success, "intro ≤ 400");
  assert.ok(!faq.safeParse({ title: "x".repeat(161) }).success, "faq title ≤ 160");
  const paths = translatablePathsByPage.guest;
  for (const p of ["seo.meta_title", "seo.meta_description", "testimonials.eyebrow", "testimonials.title", "testimonials.intro", "faq.title"]) {
    assert.ok(paths.includes(p), `expected translatable path ${p}`);
  }
});

test("guests S2: blank hints name today's EN text, which equals the EN messages", () => {
  const en = JSON.parse(readFileSync(path.join(process.cwd(), "messages/en.json"), "utf8")).pages;
  const { testimonials, faq } = guestSchema.shape;
  const hint = (schema: { description?: string }) => schema.description ?? "";
  const t = testimonials.unwrap().shape;
  assert.ok(hint(t.eyebrow).includes(`“${en.reviews.eyebrow}”`));
  assert.ok(hint(t.title).includes(`“${en.reviews.titleGuests}”`));
  assert.ok(hint(faq.unwrap().shape.title).includes(`“${en.faqTitle}”`));
});

test("guests S2: a blank heading / FAQ title renders the i18n message, a filled one its text", () => {
  assert.equal(orMessage(undefined, "We Care About Our Guests"), "We Care About Our Guests");
  assert.equal(orMessage("  ", "Reviews"), "Reviews");
  assert.equal(orMessage("What guests say", "We Care About Our Guests"), "What guests say");
  assert.equal(orMessage("", "Frequently Asked Questions"), "Frequently Asked Questions");
});

test("seoMetadataInput: /guests falls back to i18n, uses seo + OG, keeps canonical/hreflang", () => {
  const input = seoMetadataInput({
    locale: "pt",
    path: "/guests",
    seo: undefined,
    ogImage: null,
    fallbackTitle: "Para Hóspedes — Central Hill",
    fallbackDescription: "Descrição.",
  });
  assert.equal(input.title, "Para Hóspedes — Central Hill");
  assert.equal(input.description, "Descrição.");
  assert.equal(input.canonicalPath, "/pt/guests");
  assert.deepEqual(input.languages, {
    "x-default": "/guests",
    en: "/en/guests",
    pt: "/pt/guests",
    es: "/es/guests",
    fr: "/fr/guests",
  });
  assert.equal(input.images, undefined);
  const custom = seoMetadataInput({
    locale: "en",
    path: "/guests",
    seo: { meta_title: "Stay in Lisbon", meta_description: " " },
    ogImage: { url: "https://cdn.example/og.jpg", width: 1200, height: 630, alt: "OG", blurhash: null },
    fallbackTitle: "For Guests — Central Hill",
    fallbackDescription: "Default.",
  });
  assert.equal(custom.title, "Stay in Lisbon");
  assert.equal(custom.description, "Default.");
  assert.equal(custom.images?.[0]?.url, "https://cdn.example/og.jpg");
});
