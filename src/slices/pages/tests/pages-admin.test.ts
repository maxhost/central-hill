import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";
import { mediaId, tStr } from "@core/validation/primitives";
import { between, faqGroupKey, fixed, iconCard, optionalImage, optionalVideo } from "../schemas/_shared";
import { homeSchema } from "../schemas/home";
import { withMediaAccept } from "../schemas/media-accept";
import { adminHidden } from "../schemas/admin-hidden";
import { ownersSchema } from "../schemas/owners";
import { type FieldNode, applyDefaults, describe, emptyValue, humanizeKey } from "../admin/form-model";
import { HOME_CARD_IDS, OTHER_CARD_ID, OWNERS_CARD_IDS, resolveEditorLayout } from "../admin/layout";

/**
 * Slice `pages` backoffice (S12, ADR 0012) — the schema → form model. Pure (walks a
 * representative page schema, no DB / React). The schema is defined inline so this
 * machinery test stays independent of any single page's evolving content; it exercises
 * every FieldNode kind: media / string / multiline / fixed-count array / range array /
 * boolean. Run: `npx tsx --test src/slices/pages/tests/pages-admin.test.ts`.
 */

const tier = z.object({
  name: tStr({ max: 80 }),
  is_popular: z.boolean(),
  features: between(tStr({ max: 200 }), 1, 20),
});

const sampleSchema = z.object({
  hero: z.object({
    image_media_id: mediaId,
    headline: tStr({ max: 80 }),
    copy: tStr({ max: 600 }),
  }),
  why: z.object({ benefits: fixed(iconCard, 6) }),
  plans: z.object({ tiers: between(tier, 1, 6) }),
  faq_group_key: faqGroupKey,
});

const root = describe(sampleSchema);

function field(node: FieldNode, key: string): FieldNode {
  assert.equal(node.kind, "object");
  if (node.kind !== "object") throw new Error("not object");
  const found = node.fields.find((f) => f.key === key);
  assert.ok(found, `missing field ${key}`);
  return found.node;
}

test("describe maps a page schema to an object of sections", () => {
  assert.equal(root.kind, "object");
  if (root.kind !== "object") return;
  const keys = root.fields.map((f) => f.key);
  assert.ok(keys.includes("hero"));
  assert.ok(keys.includes("plans"));
});

test("media + string leaves are detected", () => {
  const hero = field(root, "hero");
  assert.equal(field(hero, "image_media_id").kind, "media");
  assert.equal(field(hero, "headline").kind, "string");
  const copy = field(hero, "copy");
  assert.equal(copy.kind, "string");
  if (copy.kind === "string") assert.equal(copy.multiline, true); // max 600 → textarea
});

test("media leaves carry their picker accept from .meta (default image) — S1", () => {
  const VIDEO_HINT = "Background loop.";
  const media = describe(
    z.object({
      plain_media_id: mediaId,
      photo_media_id: optionalImage("A photo."),
      clip_media_id: optionalVideo(VIDEO_HINT),
      // Metadata on an outer wrapper is found too.
      wrapped_media_id: withMediaAccept(mediaId.optional(), "video"),
    }),
  );
  assert.deepEqual(field(media, "plain_media_id"), { kind: "media", accept: "image" });
  assert.deepEqual(field(media, "photo_media_id"), { kind: "media", accept: "image", hint: "A photo." });
  assert.deepEqual(field(media, "clip_media_id"), { kind: "media", accept: "video", hint: VIDEO_HINT });
  assert.deepEqual(field(media, "wrapped_media_id"), { kind: "media", accept: "video" });
});

test("homeSchema: hero video picks video, guests pitch picks animated — S1/S6", () => {
  const home = describe(homeSchema);
  const video = field(field(home, "hero"), "video_media_id");
  assert.equal(video.kind, "media");
  if (video.kind === "media") {
    assert.equal(video.accept, "video");
    assert.match(video.hint ?? "", /MP4 \(H\.264\), 1920×1080/);
  }
  const pitch = field(field(home, "guests_pitch"), "image_media_id");
  assert.equal(pitch.kind, "media");
  if (pitch.kind === "media") {
    assert.equal(pitch.accept, "animated");
    assert.match(pitch.hint ?? "", /^Portrait 4:5 — the frame is fixed at 4:5/);
    assert.match(pitch.hint ?? "", /Lottie \(\.lottie or \.json\)/);
  }
});

test("only guests_pitch.image_media_id is animated; every other Home media field unchanged — S6", () => {
  const accepts: Record<string, string> = {};
  const walk = (node: FieldNode, path: string) => {
    if (node.kind === "media") accepts[path] = node.accept;
    if (node.kind === "object") for (const f of node.fields) walk(f.node, `${path}.${f.key}`);
    if (node.kind === "array") walk(node.element, `${path}[]`);
  };
  walk(describe(homeSchema), "home");
  const animated = Object.entries(accepts).filter(([, a]) => a === "animated").map(([p]) => p);
  assert.deepEqual(animated, ["home.guests_pitch.image_media_id"]);
  assert.equal(accepts["home.hero.video_media_id"], "video");
  assert.equal(accepts["home.hero.poster_media_id"], "image");
});

test("homeSchema: hero poster is an image picker right after the video — S4", () => {
  const hero = field(describe(homeSchema), "hero");
  const poster = field(hero, "poster_media_id");
  assert.equal(poster.kind, "media");
  if (poster.kind === "media") {
    assert.equal(poster.accept, "image");
    assert.match(poster.hint ?? "", /Use a still from the video\. 1920×1080/);
  }
  if (hero.kind !== "object") return;
  const keys = hero.fields.map((f) => f.key);
  assert.equal(keys.indexOf("poster_media_id"), keys.indexOf("video_media_id") + 1);
  // A legacy hero (no poster key) is scaffolded with "" — the stock poster.
  const filled = applyDefaults(hero, { video_media_id: "" }) as Record<string, unknown>;
  assert.equal(filled.poster_media_id, "");
});

test("icon_key leaves become the icon picker", () => {
  const benefits = field(field(root, "why"), "benefits");
  assert.equal(benefits.kind, "array");
  if (benefits.kind !== "array") return;
  const icon = field(benefits.element, "icon_key");
  assert.deepEqual(icon, { kind: "icon", optional: false });
  assert.equal(emptyValue(icon), "");
});

test("home S3: the guests-pitch badge icon is an optional icon picker", () => {
  const home = describe(homeSchema);
  const icon = field(field(field(home, "guests_pitch"), "badge"), "icon_key");
  assert.deepEqual(icon, { kind: "icon", optional: true });
  // A legacy row (no `badge`) is scaffolded with blanks, which the schema accepts.
  assert.deepEqual(applyDefaults(field(field(home, "guests_pitch"), "badge"), undefined), {
    label: "",
    icon_key: "",
  });
});

test("home S5: figures are a 0–8 list that starts empty; rows are text, number, affixes, toggle", () => {
  const stats = field(describe(homeSchema), "stats");
  const figures = field(stats, "figures");
  assert.equal(figures.kind, "array");
  if (figures.kind !== "array") return;
  assert.equal(figures.min, 0);
  assert.equal(figures.max, 8);
  assert.deepEqual(applyDefaults(stats, undefined), { title: "", figures: [] });
  const row = figures.element;
  assert.equal(row.kind, "object");
  if (row.kind !== "object") return;
  assert.deepEqual(row.fields.map((f) => f.key), ["label", "to", "prefix", "suffix", "group"]);
  // The statFigure `.describe()` hints reach the editor (text + checkbox leaves).
  const to = field(row, "to");
  assert.ok(to.kind === "string" && to.hint?.includes("digits only"));
  assert.ok(field(row, "group").kind === "boolean" && "hint" in field(row, "group"));
  assert.ok(field(row, "prefix").kind === "string" && "hint" in field(row, "prefix"));
});

test("fixed-count arrays carry min === max", () => {
  const benefits = field(field(root, "why"), "benefits");
  assert.equal(benefits.kind, "array");
  if (benefits.kind === "array") {
    assert.equal(benefits.min, 6);
    assert.equal(benefits.max, 6);
  }
});

test("range arrays carry distinct min/max (plans tiers + tier features, client feedback B8)", () => {
  const tiers = field(field(root, "plans"), "tiers");
  assert.equal(tiers.kind, "array");
  if (tiers.kind !== "array") throw new Error("tiers not array");
  // Plans are freely addable/removable in the back office (1–6 columns).
  assert.equal(tiers.min, 1);
  assert.equal(tiers.max, 6);
  const features = field(tiers.element, "features");
  assert.equal(features.kind, "array");
  if (features.kind === "array") {
    assert.equal(features.min, 1);
    assert.equal(features.max, 20);
  }
});

test("faq_group_key maps to a select leaf sourced from faq_group", () => {
  const node = field(root, "faq_group_key");
  assert.equal(node.kind, "select");
  if (node.kind === "select") {
    assert.equal(node.source, "faq_group");
    assert.ok(node.hint && node.hint.length > 0); // .describe() flows through as the picker hint
  }
});

test("select leaf scaffolds + defaults to an empty string", () => {
  const empty = emptyValue(root) as { faq_group_key: unknown };
  assert.equal(empty.faq_group_key, "");
  const filled = applyDefaults(root, { faq_group_key: "owners" }) as { faq_group_key: unknown };
  assert.equal(filled.faq_group_key, "owners"); // stored selection preserved
  const blank = applyDefaults(root, {}) as { faq_group_key: unknown };
  assert.equal(blank.faq_group_key, ""); // missing → empty (no FAQ)
});

test("booleans are detected (tier.is_popular)", () => {
  const tiers = field(field(root, "plans"), "tiers");
  if (tiers.kind !== "array") throw new Error();
  assert.equal(field(tiers.element, "is_popular").kind, "boolean");
});

test("emptyValue scaffolds arrays to their min length", () => {
  const empty = emptyValue(root) as {
    hero: { image_media_id: string };
    why: { benefits: unknown[] };
    plans: { tiers: { features: unknown[]; is_popular: boolean }[] };
  };
  assert.equal(empty.why.benefits.length, 6); // fixed-count → exactly 6
  assert.equal(empty.plans.tiers.length, 1); // range (1–6) → scaffolds to min
  assert.equal(empty.plans.tiers[0]!.features.length, 1);
  assert.equal(empty.hero.image_media_id, "");
  assert.equal(empty.plans.tiers[0]!.is_popular, false);
});

test("applyDefaults preserves stored values and pads missing slots", () => {
  const partial = {
    hero: { headline: "Earn more" },
    why: { benefits: [] as unknown[] },
    plans: { tiers: [{ name: "Core" }, { name: "Prime" }] },
  };
  const filled = applyDefaults(root, partial) as {
    hero: { headline: string };
    why: { benefits: unknown[] };
    plans: { tiers: { name: string }[] };
  };
  assert.equal(filled.hero.headline, "Earn more");
  assert.equal(filled.why.benefits.length, 6); // fixed array padded to its length
  assert.equal(filled.plans.tiers.length, 2); // kept as stored (range min 1)
  assert.equal(filled.plans.tiers[0]!.name, "Core"); // kept
  assert.equal(filled.plans.tiers[1]!.name, "Prime"); // kept
});

test("humanizeKey makes editor labels", () => {
  assert.equal(humanizeKey("image_media_id"), "Image");
  assert.equal(humanizeKey("cta_label"), "Cta label");
  assert.equal(humanizeKey("headline"), "Headline");
  assert.equal(humanizeKey("icon_key"), "Icon");
});

test("guest hero video picker accepts video (same fix as home, S1)", async () => {
  const { pageSchemas } = await import("../schemas");
  const root = describe(pageSchemas.guest);
  assert.equal(root.kind, "object");
  const hero = root.kind === "object" ? root.fields.find((f) => f.key === "hero")?.node : undefined;
  const video =
    hero?.kind === "object" ? hero.fields.find((f) => f.key === "video_media_id")?.node : undefined;
  assert.equal(video?.kind === "media" ? video.accept : undefined, "video");
});

// ── Editor layout (spec home-admin-editor S2) ────────────────────────────────

const homeRootKeys = Object.keys(homeSchema.shape);
const cardIds = (items: NonNullable<ReturnType<typeof resolveEditorLayout>>) =>
  items.filter((i) => i.kind === "card").map((i) => i.id);

test("home layout lists the 8 stable card ids in page order", () => {
  const layout = resolveEditorLayout("home", homeRootKeys);
  assert.ok(layout);
  assert.deepEqual(cardIds(layout), [...HOME_CARD_IDS]);
  assert.deepEqual([...HOME_CARD_IDS], [
    "seo", "hero", "stats", "guests_pitch", "portfolio", "services_carousel", "faq", "dual_cta",
  ]);
  // The search-bar info row sits between hero and stats.
  const ids = layout.map((i) => i.id);
  assert.equal(ids.indexOf("search_bar"), ids.indexOf("hero") + 1);
});

test("every home root key is rendered exactly once (a card or Other)", () => {
  const layout = resolveEditorLayout("home", homeRootKeys);
  assert.ok(layout);
  const rendered = layout.flatMap((i) => (i.kind === "card" ? i.paths : []));
  assert.deepEqual([...rendered].sort(), [...homeRootKeys].sort());
  // Today every key is placed, so there is no Other card.
  assert.ok(!cardIds(layout).includes(OTHER_CARD_ID));
  // S3: the new section objects land in their own cards.
  const pathsOf = (id: string) => {
    const card = layout.find((i) => i.id === id);
    return card && card.kind === "card" ? card.paths : [];
  };
  assert.deepEqual(pathsOf("seo"), ["seo"]);
  assert.deepEqual(pathsOf("stats"), ["stats"]);
  assert.deepEqual(pathsOf("portfolio"), ["portfolio"]);
  assert.deepEqual(pathsOf("faq"), ["faq_group_key", "faq"]);
});

test("an unknown root key lands in a trailing Other card", () => {
  const layout = resolveEditorLayout("home", [...homeRootKeys, "brand_new"]);
  assert.ok(layout);
  const last = layout.at(-1);
  assert.ok(last && last.kind === "card");
  assert.equal(last.id, OTHER_CARD_ID);
  assert.deepEqual(last.paths, ["brand_new"]);
});

test("pages without a layout return null (default rendering)", () => {
  assert.equal(resolveEditorLayout("guest", ["hero"]), null);
  assert.equal(resolveEditorLayout("about", []), null);
});

// ── Hidden fields + Owners layout (spec owners-admin-editor S1) ──────────────

/** Walk a FieldNode by object keys / `[]` (array element). */
function nodeAt(node: FieldNode, path: string[]): FieldNode {
  let n = node;
  for (const k of path) {
    if (k === "[]") {
      assert.equal(n.kind, "array");
      if (n.kind !== "array") throw new Error("not array");
      n = n.element;
    } else n = field(n, k);
  }
  return n;
}

test("admin_hidden fields become hidden nodes wrapping the normal node", () => {
  const node = describe(
    z.object({
      shown: tStr({ max: 80 }),
      secret: adminHidden(tStr({ max: 80 })),
      // The flag is found on an outer wrapper too.
      wrapped: adminHidden(z.string().max(20).optional()),
    }),
  );
  assert.equal(field(node, "shown").kind, "string");
  assert.deepEqual(field(node, "secret"), {
    kind: "hidden",
    node: { kind: "string", multiline: false, optional: false },
  });
  assert.equal(field(node, "wrapped").kind, "hidden");
});

const ICON = { icon_key: "check-circle", title: "T", description: "D" };
const CTA = { label: "Go", url: "https://example.com/x", note: "n" };
const OWNERS_SAMPLE = {
  hero: { image_media_id: "", headline: "A; B", copy: "Copy" },
  earnings_form: { headline: "H", cta_label: "Estimate" },
  stats: Array.from({ length: 4 }, (_, i) => ({ label: `L${i}`, to: "10", group: false })),
  why: { headline: "W", benefits: Array(6).fill(ICON), cta_primary: CTA, cta_secondary: CTA },
  services: { headline: "S", benefits: Array(4).fill(ICON), image_media_id: "", cta: CTA },
  plans: {
    headline: "P",
    tiers: [
      { name: "Basic", commission: "15%", is_popular: false, features: ["a"] },
      { name: "Pro", commission: "20%", corner_badge: "+5%", is_popular: true, features: ["b", "c"] },
    ],
    helpers: [{ title: "Not sure?", copy: "Talk to us", cta: { label: "Talk", url: "https://example.com/h" } }],
  },
  journey: {
    headline: "J",
    steps: Array.from({ length: 5 }, (_, i) => ({ title: `S${i}`, description: "d", image_media_id: "" })),
  },
  dashboard: { headline: "D", benefits: Array(4).fill(ICON), image_media_id: "", cta: CTA },
  faq_group_key: "",
};

test("ownersSchema: URLs and tier commission are hidden; labels stay visible", () => {
  const root = describe(ownersSchema);
  for (const path of [
    ["why", "cta_primary", "url"],
    ["why", "cta_secondary", "url"],
    ["services", "cta", "url"],
    ["dashboard", "cta", "url"],
    ["plans", "helpers", "[]", "cta", "url"],
    ["plans", "tiers", "[]", "commission"],
  ]) {
    assert.equal(nodeAt(root, path).kind, "hidden", path.join("."));
  }
  assert.equal(nodeAt(root, ["why", "cta_primary", "label"]).kind, "string");
  assert.equal(nodeAt(root, ["plans", "tiers", "[]", "corner_badge"]).kind, "string");
  assert.equal(nodeAt(root, ["plans", "helpers", "[]", "cta", "label"]).kind, "string");
});

test("ownersSchema: hidden values round-trip through applyDefaults and still validate on save", () => {
  const root = describe(ownersSchema);
  // What the editor loads (`getPageEditModel`) and, untouched, what `savePage` receives.
  const formData = applyDefaults(root, OWNERS_SAMPLE) as typeof OWNERS_SAMPLE;
  assert.equal(formData.why.cta_primary.url, CTA.url);
  assert.equal(formData.dashboard.cta.url, CTA.url);
  assert.equal(formData.plans.tiers[1]!.commission, "20%");
  assert.equal(formData.plans.helpers[0]!.cta.url, "https://example.com/h");
  const parsed = ownersSchema.safeParse(formData);
  assert.ok(parsed.success, JSON.stringify(parsed.error?.issues));
  assert.equal(parsed.data.plans.tiers[0]!.commission, "15%");
  assert.equal(parsed.data.services.cta.url, CTA.url);
  assert.equal(parsed.data.plans.helpers[0]!.cta?.url, "https://example.com/h");
});

test("ownersSchema: hero image is optional (\"\" validates) with the hero hint", () => {
  assert.ok(ownersSchema.shape.hero.shape.image_media_id.safeParse("").success);
  const hero = nodeAt(describe(ownersSchema), ["hero", "image_media_id"]);
  assert.equal(hero.kind, "media");
  if (hero.kind === "media") {
    assert.equal(hero.accept, "image");
    assert.match(hero.hint ?? "", /16:9/);
  }
});

test("owners layout: 12 stable ids; cards without keys yet are dropped, every key placed once", () => {
  assert.deepEqual([...OWNERS_CARD_IDS], [
    "seo", "hero", "earnings_form", "stats", "why", "services", "plans", "journey", "dashboard",
    "testimonials", "faq", "final_cta",
  ]);
  const rootKeys = Object.keys(ownersSchema.shape);
  const layout = resolveEditorLayout("owners", rootKeys);
  assert.ok(layout);
  // Since S2 `seo`, `testimonials` and `faq.title` exist; `final_cta` arrives in S6.
  assert.deepEqual(cardIds(layout), [
    "seo", "hero", "earnings_form", "stats", "why", "services", "plans", "journey", "dashboard",
    "testimonials", "faq",
  ]);
  const seo = layout.find((i) => i.id === "seo");
  assert.ok(seo && seo.kind === "card" && seo.hostsOgImage && seo.paths.join() === "seo");
  // Every root key is rendered exactly once, and nothing falls into Other.
  const rendered = layout.flatMap((i) => (i.kind === "card" ? i.paths : []));
  assert.deepEqual([...rendered].sort(), [...rootKeys].sort());
  assert.ok(!cardIds(layout).includes(OTHER_CARD_ID));
  // Once a later session adds the keys, their cards appear in place.
  const later = resolveEditorLayout("owners", [...rootKeys, "seo", "testimonials", "faq", "final_cta"]);
  assert.ok(later);
  assert.deepEqual(cardIds(later), [...OWNERS_CARD_IDS]);
});
