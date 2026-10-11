import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { translatablePaths } from "@core/validation/primitives";
import { pageContentSchema } from "../validation";
import { aboutSchema, guestSchema, homeSchema, translatablePathsByPage } from "../schemas";
import { defaultAbout } from "../schemas/about";
import { blogSchema, defaultBlog } from "../schemas/blog";
import { defaultGuides, guidesSchema } from "../schemas/guides";
import { collectMediaIds, expand, overlayTranslations } from "../server/overlay";
import { heroPosterSrc } from "../ui/hero-poster";
import { orMessage } from "../ui/or-message";
import { formatStatFigure, parseStatValue } from "../ui/stat-figure-value";

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
  assert.ok(
    !paths.some((p) => p.startsWith("testimonials")),
    "reviews live in the testimonials slice, not in the page schema",
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
