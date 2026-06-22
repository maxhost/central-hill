import assert from "node:assert/strict";
import { test } from "node:test";
import { translatablePaths } from "@core/validation/primitives";
import { pageContentSchema } from "../validation";
import { homeSchema, translatablePathsByPage } from "../schemas";
import { collectMediaIds, expand, overlayTranslations } from "../server/overlay";

/**
 * Slice `pages` unit tests — the page schemas' translatable-field contract (ADR 0012 /
 * the translation pipeline) and the pure [T]-block overlay logic that resolves a target
 * locale from `page_content.data` + the `translation` table. Pure, no DB. Run:
 * `npx tsx --test src/slices/pages/tests/pages.test.ts`.
 */

const UUID = "11111111-1111-4111-8111-111111111111";

const benefit = (n: number) => ({
  icon_key: "chart",
  title: `Benefit ${n}`,
  description: `Why benefit ${n} matters for you and your stay.`,
});

const panel = (side: string) => ({
  image_media_id: UUID,
  eyebrow: side,
  title: `${side} title`,
  body: `Why ${side.toLowerCase()}s should act now.`,
  cta_label: `${side} CTA`,
});

const validHome = () => ({
  key: "home" as const,
  data: {
    hero: {
      video_media_id: UUID,
      headline: "Turning moments into memories",
      subtitle: "Design-led apartments across Portugal.",
      cta_primary: { label: "Book", url: "https://centralhill.pt/buildings" },
      cta_secondary: { label: "Earnings", url: "https://centralhill.pt/owners" },
    },
    owners_pitch: {
      headline: "Own a property in Portugal?",
      subheadline: "We turn it into a high-performing asset.",
      benefits: [1, 2, 3, 4, 5, 6].map(benefit),
      cta_primary: { label: "Estimate", url: "https://centralhill.pt/owners", note: "Free." },
      cta_secondary: { label: "Owner page", url: "https://centralhill.pt/owners" },
    },
    guests_pitch: {
      headline: "Why book with us",
      subheadline: "Professionally managed apartments.",
      benefits: [1, 2, 3, 4].map(benefit),
      image_media_id: UUID,
      cta: { label: "Browse", url: "https://centralhill.pt/buildings" },
    },
    dual_cta: {
      owner: panel("Owner"),
      guest: panel("Guest"),
    },
  },
});

// ── schema validation ─────────────────────────────────────────────────────────
test("accepts a complete home page row", () => {
  assert.equal(pageContentSchema.safeParse(validHome()).success, true);
});

test("rejects a home page with the wrong benefit arity (fixed-count array)", () => {
  const row = validHome();
  row.data.owners_pitch.benefits = [1, 2, 3, 4, 5].map(benefit); // must be exactly 6
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
    "owners_pitch.benefits[].title",
    "owners_pitch.benefits[].description",
    "owners_pitch.cta_primary.note",
    "guests_pitch.cta.label",
    "dual_cta.owner.title",
    "dual_cta.guest.cta_label",
  ]) {
    assert.ok(paths.includes(p), `expected translatable path ${p}`);
  }
  assert.ok(!paths.includes("hero.video_media_id"), "media ids are not translatable");
  assert.ok(!paths.includes("guests_pitch.image_media_id"), "media ids are not translatable");
  assert.ok(!paths.includes("dual_cta.owner.image_media_id"), "media ids are not translatable");
  assert.ok(!paths.includes("hero.cta_primary.url"), "urls are not translatable");
});

test("translatablePathsByPage is derived directly from each page schema", () => {
  assert.deepEqual(translatablePathsByPage.home, translatablePaths(homeSchema));
});

// ── pure overlay logic ──────────────────────────────────────────────────────────
test("expand walks fixed-count arrays into concrete numeric paths", () => {
  const data = { owners_pitch: { benefits: [benefit(1), benefit(2)] } };
  const concrete = expand(["owners_pitch", "benefits[]", "title"], data, []);
  assert.deepEqual(concrete, [
    ["owners_pitch", "benefits", "0", "title"],
    ["owners_pitch", "benefits", "1", "title"],
  ]);
});

test("overlayTranslations replaces approved leaves and falls back to source", () => {
  const data = validHome().data;
  const translated: Record<string, string> = {
    "hero.headline": "Des moments en souvenirs",
    "owners_pitch.benefits.0.title": "Avantage 1",
  };
  const out = overlayTranslations(data, translatablePathsByPage.home, (p) => translated[p]);

  // overlaid where a translation exists…
  assert.equal((out.hero as { headline: string }).headline, "Des moments en souvenirs");
  assert.equal(
    (out.owners_pitch as { benefits: { title: string }[] }).benefits[0]!.title,
    "Avantage 1",
  );
  // …source-locale fallback where it does not.
  assert.equal(
    (out.owners_pitch as { benefits: { title: string }[] }).benefits[1]!.title,
    "Benefit 2",
  );
  // and the original is not mutated.
  assert.equal((data.hero as { headline: string }).headline, "Turning moments into memories");
});

test("collectMediaIds gathers every *_media_id across nesting", () => {
  const ids: string[] = [];
  collectMediaIds(validHome().data, ids);
  // hero.video + guests_pitch.image + dual_cta.owner.image + dual_cta.guest.image
  assert.equal(ids.length, 4);
  assert.ok(ids.every((id) => id === UUID));
});
