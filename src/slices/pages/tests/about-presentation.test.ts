import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeAbout } from "../about-content";
import { defaultAbout } from "../schemas/about";
import { aboutAudienceImage, aboutContactHref, aboutMediaKind, aboutStatColumns } from "../ui/about-presentation";

test("contact destinations follow normalized legacy cards through reorder in all locales", () => {
  const content = normalizeAbout(defaultAbout);
  content.contact.cards.reverse();
  content._list_ids!["contact.cards"]!.reverse();
  for (const locale of ["en", "pt", "es", "fr"] as const) {
    assert.deepEqual(content.contact.cards.map(card => aboutContactHref(card, locale)), [
      `/${locale}/real-estate`, `/${locale}/owners`, `/${locale}/buildings`,
    ]);
  }
  const card = { ...content.contact.cards[0]!, destination: undefined };
  // Missing identity never silently becomes the first card's destination.
  assert.equal(aboutContactHref(card, "es"), undefined);
});

test("authored semantic destinations override original legacy positions", () => {
  const content = normalizeAbout(defaultAbout);
  content.contact.cards[0]!.destination = "owners";
  assert.equal(aboutContactHref(content.contact.cards[0]!, "fr"), "/fr/owners");
  assert.equal(defaultAbout.contact.cards[0]!.destination, undefined);
});

test("stats count maps to supported desktop columns without exceeding five", () => {
  assert.deepEqual(Array.from({ length: 9 }, (_, count) => aboutStatColumns(count)), [1, 1, 2, 3, 4, 5, 5, 5, 5]);
});

test("all twelve audiences have a fallback and uploaded photos keep priority", () => {
  const fallbacks = ["guest.jpg", "owners.jpg", "partners.jpg"] as const;
  assert.deepEqual(Array.from({ length: 12 }, (_, index) => aboutAudienceImage(undefined, index, fallbacks)), [
    ...fallbacks, ...fallbacks, ...fallbacks, ...fallbacks,
  ]);
  assert.equal(aboutAudienceImage("uploaded.webp", 7, fallbacks), "uploaded.webp");
  assert.equal(aboutAudienceImage("", 4, fallbacks), "owners.jpg");
});

test("mixed slots dispatch supported media and retain legacy image compatibility", () => {
  for (const mime of [undefined, "image/jpeg", "image/png", "image/webp", "image/avif"]) assert.equal(aboutMediaKind(mime), "image");
  for (const mime of ["video/mp4", "video/webm"]) assert.equal(aboutMediaKind(mime), "video");
  for (const mime of ["application/json", "application/zip+dotlottie"]) assert.equal(aboutMediaKind(mime), "lottie");
  for (const mime of ["application/pdf", "video/quicktime", "image/svg+xml", "text/html"]) assert.equal(aboutMediaKind(mime), null);
});
