import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { z } from "zod";
import { mediaId, tStr } from "@core/validation/primitives";
import { between, faqGroupKey, fixed, iconCard, optionalImage, optionalVideo } from "../schemas/_shared";
import { homeSchema } from "../schemas/home";
import { withMediaAccept } from "../schemas/media-accept";
import { adminHidden } from "../schemas/admin-hidden";
import { ownersSchema } from "../schemas/owners";
import { guestSchema } from "../schemas/guest";
import { type FieldNode, applyDefaults, describe, emptyValue, humanizeKey } from "../admin/form-model";
import { buildingsSchema, defaultBuildings } from "../schemas/buildings";
import {
  BUILDINGS_CARD_IDS,
  GUEST_CARD_IDS,
  HOME_CARD_IDS,
  OTHER_CARD_ID,
  OWNERS_CARD_IDS,
  REAL_ESTATE_CARD_IDS,
  resolveEditorLayout,
} from "../admin/layout";
import {
  defaultCapabilities,
  defaultDealStructures,
  defaultProcess,
  defaultTrackRecord,
  realEstateSchema,
} from "../schemas/real-estate";
import { capabilityStatementHref } from "../ui/capability-statement";

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
  assert.equal(resolveEditorLayout("about", []), null);
  assert.equal(resolveEditorLayout("blog", ["hero"]), null);
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

test("owners layout: 12 stable ids, all present since S6 (final_cta last), every key placed once", () => {
  assert.deepEqual([...OWNERS_CARD_IDS], [
    "seo", "hero", "earnings_form", "stats", "why", "services", "plans", "journey", "dashboard",
    "testimonials", "faq", "final_cta",
  ]);
  const rootKeys = Object.keys(ownersSchema.shape);
  const layout = resolveEditorLayout("owners", rootKeys);
  assert.ok(layout);
  // Since S6 every card has its key; `final_cta` is the last card, with the Settings note.
  assert.deepEqual(cardIds(layout), [...OWNERS_CARD_IDS]);
  const finalCta = layout.find((i) => i.id === "final_cta");
  assert.ok(finalCta && finalCta.kind === "card" && finalCta.paths.join() === "final_cta");
  assert.equal(finalCta.note?.textKey.endsWith(".notes.finalCta"), true);
  assert.equal(finalCta.note?.link?.href, "/admin/settings");
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

// ── Owners media pickers (spec owners-admin-editor S5) ───────────────────────

test("ownersSchema media accepts: services/dashboard animated (4:5 hint), hero/journey image — S5", () => {
  const media: Record<string, { accept: string; hint?: string }> = {};
  const walk = (node: FieldNode, path: string) => {
    if (node.kind === "media") media[path] = { accept: node.accept, hint: node.hint };
    if (node.kind === "hidden") walk(node.node, path);
    if (node.kind === "object") for (const f of node.fields) walk(f.node, `${path}.${f.key}`);
    if (node.kind === "array") walk(node.element, `${path}[]`);
  };
  walk(describe(ownersSchema), "owners");
  assert.deepEqual(
    Object.fromEntries(Object.entries(media).map(([p, m]) => [p, m.accept])),
    {
      "owners.hero.image_media_id": "image",
      "owners.services.image_media_id": "animated",
      "owners.journey.steps[].image_media_id": "image",
      "owners.dashboard.image_media_id": "animated",
      "owners.final_cta.image_media_id": "image",
    },
  );
  for (const p of ["owners.services.image_media_id", "owners.dashboard.image_media_id"]) {
    assert.match(media[p]?.hint ?? "", /^Portrait 4:5 — the frame is fixed at 4:5/);
    assert.match(media[p]?.hint ?? "", /Lottie \(\.lottie or \.json\)/);
  }
  assert.match(media["owners.journey.steps[].image_media_id"]?.hint ?? "", /Portrait 3:4/);
  assert.match(media["owners.final_cta.image_media_id"]?.hint ?? "", /^Closing band photo\. Portrait 4:5/);
});

test("ownersSchema: services/dashboard media still accept \"\" and a uuid (stored values valid) — S5", () => {
  const uuid = "3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c";
  for (const field of [
    ownersSchema.shape.services.shape.image_media_id,
    ownersSchema.shape.dashboard.shape.image_media_id,
  ]) {
    assert.ok(field.safeParse("").success);
    assert.ok(field.safeParse(uuid).success);
    assert.ok(!field.safeParse("not-a-uuid").success);
  }
});

// ── Buildings listing editor (spec buildings-admin-editor S1) ────────────────

test("buildingsSchema: defaultBuildings, a scaffolded blank row and a filled row validate", () => {
  assert.ok(buildingsSchema.safeParse(defaultBuildings).success, "defaultBuildings");
  assert.equal(defaultBuildings.stats?.figures.length, 3);
  // A never-authored row: the editor scaffolds blanks (0 figures), which must save.
  const blank = applyDefaults(describe(buildingsSchema), {});
  assert.ok(buildingsSchema.safeParse(blank).success, "applyDefaults({})");
  assert.ok(buildingsSchema.safeParse({}).success, "absent sections");
  // The default row opens with its 3 figures and still validates once scaffolded.
  assert.ok(buildingsSchema.safeParse(applyDefaults(describe(buildingsSchema), defaultBuildings)).success);
  const uuid = "3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c";
  const filled = {
    seo: { meta_title: "Buildings", meta_description: "Our buildings." },
    hero: {
      image_media_id: uuid,
      eyebrow: "Lisbon",
      headline: "Prime locations",
      copy: "Copy.",
      contact: { label: "Contact", title: "Write to us", intro: "Hi." },
    },
    owner_panel: { eyebrow: "Owners", title: "Join", body: "Body.", cta_label: "Estimate", contact_line: "Call us" },
    stats: { title: "Numbers", figures: [{ label: "Stays", to: "10", group: false, description: "So far" }] },
    calculator: {
      badge: "+25%",
      headline: "Earn more",
      subheadline: "Free.",
      cta_label: "Calculate",
      contact_step: { title: "Contact", lede: "Lede", submit_label: "Send", back_label: "Back" },
      done_step: { title: "Done", body: "Thanks." },
      media_media_id: uuid,
    },
  };
  assert.ok(buildingsSchema.safeParse(filled).success, "filled row");
  const nine = { figures: Array.from({ length: 9 }, () => filled.stats.figures[0]) };
  assert.ok(!buildingsSchema.safeParse({ stats: nine }).success, "max 8 figures");
  assert.ok(!buildingsSchema.safeParse({ calculator: { media_media_id: "not-a-uuid" } }).success);
});

test("buildingsSchema media accepts: hero image (16:9), calculator animated (4:5)", () => {
  const media: Record<string, { accept: string; hint?: string }> = {};
  const walk = (node: FieldNode, path: string) => {
    if (node.kind === "media") media[path] = { accept: node.accept, hint: node.hint };
    if (node.kind === "hidden") walk(node.node, path);
    if (node.kind === "object") for (const f of node.fields) walk(f.node, `${path}.${f.key}`);
    if (node.kind === "array") walk(node.element, `${path}[]`);
  };
  walk(describe(buildingsSchema), "buildings");
  assert.deepEqual(
    Object.fromEntries(Object.entries(media).map(([p, m]) => [p, m.accept])),
    { "buildings.hero.image_media_id": "image", "buildings.calculator.media_media_id": "animated" },
  );
  assert.match(media["buildings.hero.image_media_id"]?.hint ?? "", /16:9/);
  assert.match(media["buildings.calculator.media_media_id"]?.hint ?? "", /^Portrait 4:5 — the frame is fixed at 4:5/);
});

test("buildings layout: 5 stable ids, grid info after hero, every key placed once", () => {
  assert.deepEqual([...BUILDINGS_CARD_IDS], ["seo", "hero", "owner_panel", "stats", "calculator"]);
  const rootKeys = Object.keys(buildingsSchema.shape);
  const layout = resolveEditorLayout("buildings", rootKeys);
  assert.ok(layout);
  assert.deepEqual(cardIds(layout), [...BUILDINGS_CARD_IDS]);
  const ids = layout.map((i) => i.id);
  assert.equal(ids.indexOf("buildings_grid"), ids.indexOf("hero") + 1);
  const grid = layout.find((i) => i.id === "buildings_grid");
  assert.equal(grid?.note?.link?.href, "/admin/buildings");
  const panel = layout.find((i) => i.id === "owner_panel");
  assert.equal(panel?.note?.link?.href, "/admin/settings");
  const seo = layout.find((i) => i.id === "seo");
  assert.ok(seo && seo.kind === "card" && seo.hostsOgImage);
  const rendered = layout.flatMap((i) => (i.kind === "card" ? i.paths : []));
  assert.deepEqual([...rendered].sort(), [...rootKeys].sort());
  assert.ok(!cardIds(layout).includes(OTHER_CARD_ID));
});

// ── Real Estate: hidden fields + layout (spec real-estate-admin-editor S1) ───

const RE_CTA = { label: "Go", url: "https://example.com/re", note: "Partner note" };
const RE_SAMPLE = {
  hero: {
    image_media_id: "",
    headline: "H",
    subheadline: "S",
    positioning: "P",
    cta_primary: { label: "Enquire", url: "https://example.com/a" },
    cta_secondary: { label: "Download", url: "https://example.com/b" },
  },
  partners: {
    headline: "Partners",
    benefits: Array(4).fill(ICON),
    cta_primary: RE_CTA,
    cta_secondary: { label: "Structures", url: "https://example.com/c", note: "never shown" },
  },
  capabilities: defaultCapabilities,
  asset_management: { headline: "A", benefits: Array(6).fill(ICON), image_media_id: "", cta: RE_CTA },
  deal_structures: defaultDealStructures,
  market: {
    headline: "M",
    stats: Array.from({ length: 3 }, (_, i) => ({ value: `${i}`, label: `L${i}` })),
    fundamentals: { title: "F", body: ["a", "b"] },
    regulatory: { title: "R", body: "r" },
    thesis: { title: "T", points: ["1", "2", "3"] },
  },
  track_record: defaultTrackRecord,
  process: defaultProcess,
  faq_group_key: "",
};

const RE_HIDDEN = [
  ["hero", "cta_primary", "url"],
  ["hero", "cta_secondary", "url"],
  ["partners", "cta_primary", "url"],
  ["partners", "cta_secondary", "url"],
  ["partners", "cta_secondary", "note"],
  ["capabilities", "cta", "url"],
  ["asset_management", "cta", "url"],
];

test("realEstateSchema: URLs and partners' secondary note are hidden; labels stay visible", () => {
  const root = describe(realEstateSchema);
  for (const p of RE_HIDDEN) assert.equal(nodeAt(root, p).kind, "hidden", p.join("."));
  for (const p of [
    ["hero", "cta_primary", "label"],
    ["hero", "cta_secondary", "label"],
    ["partners", "cta_primary", "label"],
    ["partners", "cta_primary", "note"],
    ["partners", "cta_secondary", "label"],
    ["capabilities", "cta", "label"],
    ["capabilities", "cta", "note"],
    ["asset_management", "cta", "label"],
    ["asset_management", "cta", "note"],
  ]) {
    assert.equal(nodeAt(root, p).kind, "string", p.join("."));
  }
});

test("realEstateSchema: hidden values round-trip through applyDefaults and still validate on save", () => {
  const root = describe(realEstateSchema);
  const formData = applyDefaults(root, RE_SAMPLE) as typeof RE_SAMPLE;
  const parsed = realEstateSchema.safeParse(formData);
  assert.ok(parsed.success, JSON.stringify(parsed.error?.issues));
  const get = (obj: unknown, p: string[]) =>
    p.reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], obj);
  for (const p of RE_HIDDEN) {
    const original = get(RE_SAMPLE, p);
    assert.ok(original, p.join("."));
    assert.equal(get(formData, p), original, `applyDefaults ${p.join(".")}`);
    assert.equal(get(parsed.data, p), original, `parsed ${p.join(".")}`);
  }
});

test("realEstateSchema: hero image is optional (\"\" validates) with the hero hint", () => {
  assert.ok(realEstateSchema.shape.hero.shape.image_media_id.safeParse("").success);
  const hero = nodeAt(describe(realEstateSchema), ["hero", "image_media_id"]);
  assert.equal(hero.kind, "media");
  if (hero.kind === "media") {
    assert.equal(hero.accept, "image");
    assert.match(hero.hint ?? "", /^Full-bleed hero background .*16:9 — 1920×1080 px/);
  }
});

test("real estate layout: 11 stable ids, all 11 cards shown (S5); every key placed once", () => {
  assert.deepEqual([...REAL_ESTATE_CARD_IDS], [
    "seo", "hero", "partners", "capabilities", "asset_management", "deal_structures", "market",
    "track_record", "process", "faq", "deal_enquiry",
  ]);
  const rootKeys = Object.keys(realEstateSchema.shape);
  const layout = resolveEditorLayout("real_estate", rootKeys);
  assert.ok(layout);
  // `seo` and `faq` (title) exist since S2, `deal_enquiry` since S5 → every card is shown.
  assert.deepEqual(cardIds(layout), [...REAL_ESTATE_CARD_IDS]);
  assert.equal(layout.length, 11);
  const seo = layout.find((i) => i.id === "seo");
  assert.ok(seo && seo.kind === "card" && seo.hostsOgImage);
  assert.deepEqual(seo.paths, ["seo"]);
  const faq = layout.find((i) => i.id === "faq");
  assert.ok(faq && faq.kind === "card");
  assert.deepEqual(faq.paths, ["faq_group_key", "faq"]);
  const deals = layout.find((i) => i.id === "deal_structures");
  assert.equal(deals?.note?.textKey, "admin.layout.notes.dealStructuresFeatured");
  assert.equal(faq.note?.link?.href, "/admin/faq");
  const rendered = layout.flatMap((i) => (i.kind === "card" ? i.paths : []));
  assert.deepEqual([...rendered].sort(), [...rootKeys].sort());
  assert.equal(new Set(rendered).size, rendered.length);
  assert.ok(!cardIds(layout).includes(OTHER_CARD_ID));
  const enquiry = layout.find((i) => i.id === "deal_enquiry");
  assert.ok(enquiry && enquiry.kind === "card");
  assert.deepEqual(enquiry.paths, ["deal_enquiry"]);
  assert.equal(enquiry.note?.textKey, "admin.layout.notes.dealEnquiry");
  assert.equal(enquiry.note?.link?.href, "/admin/settings");
});

test("real estate layout + labels: every i18n key exists in the 4 locales", () => {
  const layout = resolveEditorLayout("real_estate", Object.keys(realEstateSchema.shape));
  assert.ok(layout);
  const keys = layout.flatMap((i) => [
    i.titleKey,
    ...(i.note ? [i.note.textKey] : []),
    ...(i.note?.link ? [i.note.link.labelKey] : []),
  ]);
  for (const k of [
    "partners", "capabilities", "asset_management", "deal_structures", "models", "tagline",
    "featured", "feature_label", "points", "market", "fundamentals", "regulatory", "thesis",
    "track_record", "tiles", "caption", "process", "positioning", "capability_statement_media_id",
    "deal_enquiry", "contact_title", "value", "headline", "lede", "submit_label", "note",
  ]) keys.push(`admin.labels.${k}`);
  for (const k of ["models", "points", "tiles", "steps", "benefits"]) keys.push(`admin.itemLabels.${k}`);
  for (const k of ["points", "tiles", "steps"]) keys.push(`admin.addLabels.${k}`);
  for (const locale of ["en", "pt", "es", "fr"]) {
    const pages = JSON.parse(readFileSync(path.join(process.cwd(), `messages/${locale}.json`), "utf8")).pages;
    for (const k of keys) {
      const v = k.split(".").reduce<unknown>((o, part) => (o as Record<string, unknown> | undefined)?.[part], pages);
      assert.equal(typeof v, "string", `${locale}: pages.${k}`);
    }
  }
});

// ── Real Estate showcase media (spec real-estate-admin-editor S3) ────────────

test("realEstateSchema media accepts: capabilities/asset_management animated (4:5 hint), hero image — S3", () => {
  const root = describe(realEstateSchema);
  const hero = nodeAt(root, ["hero", "image_media_id"]);
  assert.ok(hero.kind === "media" && hero.accept === "image");
  for (const section of ["capabilities", "asset_management"]) {
    const node = nodeAt(root, [section, "image_media_id"]);
    assert.equal(node.kind, "media", section);
    if (node.kind !== "media") continue;
    assert.equal(node.accept, "animated", section);
    assert.match(node.hint ?? "", /^Portrait 4:5 — the frame is fixed at 4:5/, section);
    assert.match(node.hint ?? "", /Lottie \(\.lottie or \.json\)/, section);
  }
  const caps = nodeAt(root, ["capabilities", "image_media_id"]);
  assert.match(caps.kind === "media" ? caps.hint ?? "" : "", /LEFT/);
});

test("realEstateSchema: capabilities/asset_management media still accept \"\" and a uuid — S3", () => {
  const uuid = "3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c";
  for (const field of [
    realEstateSchema.shape.capabilities.shape.image_media_id,
    realEstateSchema.shape.asset_management.shape.image_media_id,
  ]) {
    assert.ok(field.safeParse("").success);
    assert.ok(field.safeParse(uuid).success);
    assert.ok(!field.safeParse("not-a-uuid").success);
  }
});

// ── Real Estate capability statement (spec real-estate-admin-editor S4) ──────

test("realEstateSchema: capability statement picker is `document` (PDF) with the hint — S4", () => {
  const node = nodeAt(describe(realEstateSchema), ["hero", "capability_statement_media_id"]);
  assert.equal(node.kind, "media");
  if (node.kind !== "media") return;
  assert.equal(node.accept, "document");
  assert.equal(
    node.hint,
    "Capability statement downloaded by hero button 2. PDF, under 20 MB. Leave blank and the button scrolls to the enquiry form.",
  );
});

test("realEstateSchema: capability statement stays optional and \"\"-tolerant — S4", () => {
  const field = realEstateSchema.shape.hero.shape.capability_statement_media_id;
  assert.ok(field.safeParse(undefined).success);
  assert.ok(field.safeParse("").success);
  assert.ok(field.safeParse("3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c").success);
  assert.ok(!field.safeParse("not-a-uuid").success);
});

test("capabilityStatementHref: only a PDF with a url becomes the link — S4", () => {
  const url = "https://media.example/3f2b/capability.pdf";
  assert.equal(capabilityStatementHref({ url, mime: "application/pdf" }), url);
  assert.equal(capabilityStatementHref(undefined), null);
  assert.equal(capabilityStatementHref({ url: "", mime: "application/pdf" }), null);
  assert.equal(capabilityStatementHref({ url: "https://media.example/x.jpg", mime: "image/jpeg" }), null);
  assert.equal(capabilityStatementHref({ url: "https://media.example/x.mp4", mime: "video/mp4" }), null);
  assert.equal(capabilityStatementHref({ url }), null);
});

// ── Guests landing: hidden URLs + layout (spec guests-admin-editor S1) ───────

const GUEST_CTA = { label: "Go", url: "https://centralhill.pt/en/buildings" };
const GUEST_CTA_NOTE = { ...GUEST_CTA, note: "No fees" };
const guestTeaser = (url: string) => ({
  headline: "T",
  items: Array(6).fill(ICON),
  cta: { label: "More", url, note: "" },
});
const GUEST_SAMPLE = {
  hero: { video_media_id: "", headline: "H", cta: { label: "Browse", url: "https://centralhill.pt/en/hero" } },
  welcome: { headline: "W", lede: "L", copy: "C", image_media_id: "" },
  why: { headline: "Y", benefits: Array(4).fill(ICON), cta: { ...GUEST_CTA_NOTE, url: "https://centralhill.pt/en/why" } },
  portfolio: { headline: "P", cta: { ...GUEST_CTA_NOTE, url: "https://centralhill.pt/en/portfolio" } },
  services_teaser: guestTeaser("https://centralhill.pt/en/services"),
  activities_teaser: guestTeaser("https://centralhill.pt/en/guides"),
  dual_cta: {
    guest: { title: "G", body: "B", cta: { ...GUEST_CTA, url: "https://centralhill.pt/en/guest" } },
    owner: { title: "O", body: "B", cta: { ...GUEST_CTA, url: "https://centralhill.pt/en/owners" } },
  },
  faq_group_key: "",
};

const GUEST_HIDDEN = [
  ["hero", "cta", "url"],
  ["why", "cta", "url"],
  ["portfolio", "cta", "url"],
  ["services_teaser", "cta", "url"],
  ["activities_teaser", "cta", "url"],
  ["dual_cta", "guest", "cta", "url"],
  ["dual_cta", "owner", "cta", "url"],
];

test("guestSchema: the 7 CTA URLs are hidden; labels and notes stay visible — S1", () => {
  const root = describe(guestSchema);
  for (const p of GUEST_HIDDEN) assert.equal(nodeAt(root, p).kind, "hidden", p.join("."));
  for (const p of GUEST_HIDDEN) {
    const label = [...p.slice(0, -1), "label"];
    assert.equal(nodeAt(root, label).kind, "string", label.join("."));
  }
  for (const s of ["why", "portfolio", "services_teaser", "activities_teaser"]) {
    assert.equal(nodeAt(root, [s, "cta", "note"]).kind, "string", `${s}.cta.note`);
  }
});

test("guestSchema: hidden URLs round-trip through applyDefaults and still validate on save — S1", () => {
  const root = describe(guestSchema);
  const formData = applyDefaults(root, GUEST_SAMPLE) as typeof GUEST_SAMPLE;
  const parsed = guestSchema.safeParse(formData);
  assert.ok(parsed.success, JSON.stringify(parsed.error?.issues));
  const get = (obj: unknown, p: string[]) =>
    p.reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], obj);
  for (const p of GUEST_HIDDEN) {
    const original = get(GUEST_SAMPLE, p);
    assert.ok(original, p.join("."));
    assert.equal(get(formData, p), original, `applyDefaults ${p.join(".")}`);
    assert.equal(get(parsed.data, p), original, `parsed ${p.join(".")}`);
  }
});

test("guest layout: 10 stable ids in page order, all present since S2; no key lost", () => {
  assert.deepEqual([...GUEST_CARD_IDS], [
    "seo", "hero", "welcome", "why", "portfolio", "services_teaser", "activities_teaser",
    "testimonials", "faq", "dual_cta",
  ]);
  const rootKeys = Object.keys(guestSchema.shape);
  for (const k of ["seo", "testimonials", "faq"]) assert.ok(rootKeys.includes(k), `S2 key ${k}`);
  const layout = resolveEditorLayout("guest", rootKeys);
  assert.ok(layout);
  assert.deepEqual(cardIds(layout), [...GUEST_CARD_IDS]);
  const rendered = layout.flatMap((i) => (i.kind === "card" ? i.paths : []));
  assert.deepEqual([...rendered].sort(), [...rootKeys].sort());
  assert.equal(new Set(rendered).size, rendered.length);
  assert.ok(!cardIds(layout).includes(OTHER_CARD_ID));
  const byId = (id: string) => layout.find((i) => i.id === id);
  const seo = byId("seo");
  assert.ok(seo && seo.kind === "card" && seo.hostsOgImage);
  assert.equal(byId("hero")?.note?.textKey, "admin.layout.notes.ctaBuildings");
  assert.equal(byId("portfolio")?.note?.link?.href, "/admin/buildings");
  assert.equal(byId("services_teaser")?.note?.textKey, "admin.layout.notes.ctaServices");
  assert.equal(byId("activities_teaser")?.note?.textKey, "admin.layout.notes.ctaGuides");
  assert.equal(byId("testimonials")?.note?.link?.href, "/admin/testimonials");
  assert.equal(byId("dual_cta")?.note?.link?.href, "/admin/settings");
  const faq = byId("faq");
  assert.ok(faq && faq.kind === "card");
  assert.deepEqual(faq.paths, ["faq_group_key", "faq"]);
});

test("guest layout + labels: every i18n key exists in the 4 locales — S1", () => {
  const layout = resolveEditorLayout("guest", Object.keys(guestSchema.shape));
  assert.ok(layout);
  const keys = layout.flatMap((i) => [
    i.titleKey,
    ...(i.note ? [i.note.textKey] : []),
    ...(i.note?.link ? [i.note.link.labelKey] : []),
  ]);
  for (const k of [
    "welcome", "guarantee_label", "services_teaser", "activities_teaser", "items", "lede", "copy",
    "why", "portfolio", "dual_cta", "guest", "owner", "cta", "label", "note", "intro",
    "seo", "meta_title", "meta_description", "testimonials", "eyebrow", "title", "faq",
  ]) keys.push(`admin.labels.${k}`);
  for (const k of ["items", "benefits"]) keys.push(`admin.itemLabels.${k}`);
  for (const locale of ["en", "pt", "es", "fr"]) {
    const pages = JSON.parse(readFileSync(path.join(process.cwd(), `messages/${locale}.json`), "utf8")).pages;
    for (const k of keys) {
      const v = k.split(".").reduce<unknown>((o, part) => (o as Record<string, unknown> | undefined)?.[part], pages);
      assert.equal(typeof v, "string", `${locale}: pages.${k}`);
    }
  }
});
