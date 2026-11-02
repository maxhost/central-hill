import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PhotoFeatureGrid } from "@core/ui/photo-feature-grid";
import type { ServiceSummary } from "@slices/services/contract";
import { GuestServiceCards } from "../ui/components/guest-service-cards";
import { guestAdapter } from "../adapters/guest";
import { guestDescriptor } from "../guest-content";
import { isEditableFieldPath } from "../admin/home-contextual";

const service = (slug: string): ServiceSummary => ({
  id: slug, slug, name: `Service ${slug}`, excerpt: `Description ${slug}`,
  category: { id: "category", slug: "experiences", name: "Experiences", icon: "check" },
  cover: null, priceFrom: null, priceDisplay: "hidden", rating: null,
  priceSuffix: null, durationLabel: null, bookingType: "external",
});

test("Guests keeps every catalogue service in carousel groups of at most six same-tab links", () => {
  const services = Array.from({ length: 10 }, (_, i) => service(`experience-${i}`));
  const html = renderToStaticMarkup(createElement(GuestServiceCards, { services, locale: "en" }));
  assert.equal((html.match(/<a\s/g) ?? []).length, 10);
  for (const item of services) {
    assert.ok(html.includes(`href="/en/services/${item.slug}"`));
    assert.ok(html.includes(item.name));
    assert.ok(html.includes(item.excerpt));
  }
  assert.doesNotMatch(html, /target=/);
  const groups = [...html.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)];
  assert.deepEqual(groups.map((group) => (group[1]!.match(/<a\s/g) ?? []).length), [6, 4]);
  assert.match(html, /aria-label="Previous services"/);
  assert.match(html, /aria-label="Next services"/);
});

test("Explore All Services opens the full catalogue and its helper text follows beneath the button", () => {
  const html = renderToStaticMarkup(createElement(GuestServiceCards, {
    services: [service("chef-at-home")], locale: "en",
    cta: { href: "/en/services", label: "Explore All Services →", note: "See details, pricing, and availability." },
  }));
  assert.match(html, /href="\/en\/services"/);
  assert.match(html, /Explore All Services →<\/a><p[^>]*>See details, pricing, and availability\.<\/p>/);
  assert.doesNotMatch(html, /target=|aria-label="Previous services"/);
});

test("Catalogue additions, removals, reordering and localized slug changes are reflected in cards", () => {
  const original = [service("old-service"), service("retained")];
  const updated = [service("nouvelle-experience"), { ...original[1]!, slug: "service-traduit", name: "Service traduit" }];
  const html = renderToStaticMarkup(createElement(GuestServiceCards, { services: updated, locale: "fr" }));
  assert.ok(html.includes('href="/fr/services/nouvelle-experience"'));
  assert.ok(html.includes('href="/fr/services/service-traduit"'));
  assert.ok(html.includes("Service traduit"));
  assert.ok(html.indexOf("nouvelle-experience") < html.indexOf("service-traduit"));
  assert.doesNotMatch(html, /old-service|href="\/en\//);
  const empty = renderToStaticMarkup(createElement(GuestServiceCards, { services: [], locale: "en" }));
  assert.doesNotMatch(empty, /<a\s|<h3/);
});

test("Catalogue cover and published slug are used; missing slugs cannot create broken detail links", () => {
  const item = { ...service("surf-lesson"), cover: {
    url: "https://example.test/surf.jpg", width: 1200, height: 800, alt: "Surf", blurhash: null,
  } };
  const html = renderToStaticMarkup(createElement(GuestServiceCards, { services: [item, service("")], locale: "es" }));
  assert.equal((html.match(/<a\s/g) ?? []).length, 1);
  assert.match(html, /href="\/es\/services\/surf-lesson"/);
  assert.match(html, /surf(?:\.jpg|%2Ejpg)/);
});

test("Unlinked photo cards remain unlinked and obsolete manual catalogue fields stay hidden/preserved in BO", () => {
  const html = renderToStaticMarkup(createElement(PhotoFeatureGrid, { items: [{ title: "Explore", description: "Local guide" }] }));
  assert.doesNotMatch(html, /<a\s/);
  assert.equal(isEditableFieldPath(guestDescriptor.rootNode, "services_teaser.items.0.title"), false);
  assert.equal(isEditableFieldPath(guestDescriptor.rootNode, "services_teaser.headline"), true);
  assert.equal(isEditableFieldPath(guestDescriptor.rootNode, "activities_teaser.items.0.title"), false);
  const content = guestAdapter.defaultContent();
  content.services_teaser.items[0]!.title = "Legacy preserved";
  const parsed = guestAdapter.draftSchema.parse(content);
  assert.equal(parsed.services_teaser.items[0]!.title, "Legacy preserved");
});
