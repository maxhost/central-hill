import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Locale } from "@core/db/columns";
import type { GuidePageSummary } from "@slices/guides/contract";
import type { SiteIcons } from "@slices/settings/contract";
import { GuestGuideCards } from "../ui/components/guest-guide-cards";
import { guestAdapter } from "../adapters/guest";
import { guestDescriptor } from "../guest-content";
import { isEditableFieldPath } from "../admin/home-contextual";

const guide = (slug: string): GuidePageSummary => ({
  id: slug, slug, title: `Guide ${slug}`, intro: `Intro ${slug}`, template: "custom", hero: null,
  city: { id: "lisbon", slug: "lisbon", name: "Lisbon" },
});
// Only custom guide fixtures are rendered; other site icon roles are not consumed here.
const ICONS = { guide_custom: "compass" } as SiteIcons;
const render = (guides: GuidePageSummary[], locale: Locale = "en") => renderToStaticMarkup(createElement(GuestGuideCards, {
  guides, locale, icons: ICONS, prevLabel: "Previous guides", nextLabel: "More guides",
  cta: { href: `/${locale}/guides`, label: "Discover More →" },
}));

test("Guides share the services carousel layout, with six-card pages and same-tab city/guide links", () => {
  const guides = Array.from({ length: 8 }, (_, i) => guide(`guide-${i}`));
  const html = render(guides);
  const groups = [...html.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)];
  assert.deepEqual(groups.map((group) => (group[1]!.match(/<a\s/g) ?? []).length), [6, 2]);
  for (const item of guides) {
    assert.ok(html.includes(`href="/en/guides/lisbon/${item.slug}"`));
    assert.ok(html.includes(item.title));
    assert.ok(html.includes(item.intro!));
  }
  assert.match(html, /aria-label="Previous guides"/);
  assert.match(html, /aria-label="More guides"/);
  assert.match(html, /href="\/en\/guides"[^>]*>Discover More →<\/a>/);
  assert.doesNotMatch(html, /target=/);
});

test("Guide additions/removals, city/guide slug translations, covers and catalogue order flow into cards", () => {
  const retained = guide("retained");
  retained.id = "same-guide-id";
  retained.title = "Guía traducida";
  retained.city = { id: "lisbon", slug: "lisboa", name: "Lisboa" };
  retained.hero = { url: "https://example.test/lisboa.jpg", width: 1200, height: 800, alt: "Lisboa", blurhash: null };
  const added = guide("new-guide");
  added.city = { id: "porto", slug: "porto", name: "Porto" };
  const html = render([added, retained], "es");
  assert.match(html, /href="\/es\/guides\/porto\/new-guide"/);
  assert.match(html, /href="\/es\/guides\/lisboa\/retained"/);
  assert.ok(html.includes("Guía traducida"));
  assert.ok(html.includes("lisboa.jpg"));
  assert.ok(html.indexOf("new-guide") < html.indexOf("/lisboa/retained"));
  assert.doesNotMatch(html, /old-guide|href="\/en\//);
  for (const locale of ["en", "pt", "es", "fr"] as const)
    assert.ok(render([retained], locale).includes(`href="/${locale}/guides/lisboa/retained"`));
});

test("Incomplete guide routes are skipped, optional intros are blank and one page needs no controls", () => {
  const valid = { ...guide("valid"), intro: null };
  const missingCity = { ...guide("missing-city"), city: { id: "unresolved", slug: "", name: "Unknown" } };
  const html = render([valid, guide(""), missingCity]);
  assert.equal((html.match(/<h3\b/g) ?? []).length, 1);
  assert.doesNotMatch(html, /missing-city|aria-label="Previous guides"|>null</);
  assert.doesNotMatch(render([]), /<h3\b/);
});

test("Manual activities cards are hidden/preserved, while Guests keeps section copy editable", () => {
  for (const field of ["title", "description", "image_media_id", "icon_key"])
    assert.equal(isEditableFieldPath(guestDescriptor.rootNode, `activities_teaser.items.0.${field}`), false);
  for (const field of ["headline", "intro", "cta.label", "cta.note"])
    assert.equal(isEditableFieldPath(guestDescriptor.rootNode, `activities_teaser.${field}`), true);
  const content = guestAdapter.defaultContent();
  content.activities_teaser.items[0]!.title = "Preserved manual card";
  assert.equal(guestAdapter.draftSchema.parse(content).activities_teaser.items[0]!.title, "Preserved manual card");
});
