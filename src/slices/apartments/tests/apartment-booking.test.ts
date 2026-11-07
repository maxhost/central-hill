import test from "node:test";
import assert from "node:assert/strict";
import {
  checkApartmentEnvelope,
  emptyApartmentEnvelope,
  resolveApartmentBooking,
  apartmentSharedContent,
} from "../server/editorial-validation";
import { apartmentLocaleModel } from "../server/editorial-model";
import {
  applyPropertyLocaleResult,
  changePropertyField,
  type PropertyWorkspace,
} from "../admin/ui/property-editor-state";

test("Legacy URL projection does not modify or materialize the localized link on read/validation", () => {
  const document = emptyApartmentEnvelope();
  delete document.content.booking_link;
  document.content.default_booking_url = "https://example.test/legacy-default";
  document.content.booking_url = " https://example.test/legacy-pt ";
  const before = structuredClone(document);
  assert.equal(
    resolveApartmentBooking(document),
    "https://example.test/legacy-pt",
  );
  assert.deepEqual(document, before);
  const validated = checkApartmentEnvelope(document).envelope;
  assert.ok(validated);
  assert.equal(Object.hasOwn(validated.content, "booking_link"), false);
  document.content.booking_url = null;
  assert.equal(
    resolveApartmentBooking(document),
    "https://example.test/legacy-default",
  );
});

test("An explicit localized URL wins; null/blank clears it without reviving hidden legacy values", () => {
  const document = emptyApartmentEnvelope();
  assert.equal(document.content.booking_link, null);
  Object.assign(document.content, {
    booking_url: "https://example.test/old-override",
    default_booking_url: "https://example.test/old-default",
  });
  assert.equal(resolveApartmentBooking(document), null);
  document.content.booking_link =
    " https://example.test/pt?guests=4&language=pt ";
  assert.equal(
    resolveApartmentBooking(document),
    "https://example.test/pt?guests=4&language=pt",
  );
  for (const link of [null, "", "  "]) {
    document.content.booking_link = link;
    assert.equal(resolveApartmentBooking(document), null);
  }
  assert.equal(
    document.content.default_booking_url,
    "https://example.test/old-default",
  );
});

test("Localized links accept complete HTTP(S) URLs and reject relative, executable and oversized values", () => {
  const document = emptyApartmentEnvelope();
  document.content.name = "Synthetic unit";
  document.content.max_guests = 2;
  for (const link of [
    null,
    "",
    "https://example.test/reservation?language=fr",
    "http://example.test/reservation",
  ]) {
    document.content.booking_link = link;
    assert.deepEqual(checkApartmentEnvelope(document, true).errors, {});
  }
  for (const link of [
    "/relative",
    "javascript:alert(1)",
    "data:text/html,x",
    "https://example.test/" + "x".repeat(2048),
  ]) {
    document.content.booking_link = link;
    assert.equal(checkApartmentEnvelope(document).envelope, undefined);
  }
  assert.equal(
    checkApartmentEnvelope({
      ...document,
      content: { ...document.content, booking_link: 1 },
    }).envelope,
    undefined,
  );
});

test("A link edit owns only that language; later English saves refresh inherited work while preserving custom PT and hidden SEO", () => {
  const en = { ...emptyApartmentEnvelope(), localeMode: "custom" as const };
  en.content.booking_link = "https://example.test/en";
  en.content.meta_title = "Retained English SEO";
  const rows = [
    { locale: "en" as const, revision: 1, published: en, draft: null },
  ];
  let states = Object.fromEntries(
    (["en", "es", "pt", "fr"] as const).map((locale) => {
      const model = apartmentLocaleModel(rows, locale);
      return [
        locale,
        {
          model,
          baseline: structuredClone(model.working),
          errors: {},
          notice: "",
          conflict: false,
        },
      ];
    }),
  ) as PropertyWorkspace;
  assert.equal(
    changePropertyField(states, "pt", "booking_link", en.content.booking_link),
    states,
  );
  states = changePropertyField(
    states,
    "pt",
    "booking_link",
    "https://example.test/pt",
  );
  assert.equal(states.pt.model.working.localeMode, "custom");
  const nextEnglish = structuredClone(states.en.model);
  nextEnglish.revision = 2;
  nextEnglish.draft = structuredClone(nextEnglish.working);
  nextEnglish.draft.content.booking_link = "https://example.test/new-en";
  nextEnglish.working = nextEnglish.draft;
  const updated = applyPropertyLocaleResult(
    states,
    "en",
    nextEnglish,
    "Saved",
    { max_guests: 6 },
  );
  assert.equal(
    updated.es.model.working.content.booking_link,
    "https://example.test/new-en",
  );
  assert.equal(updated.es.model.published, null);
  assert.equal(
    updated.pt.model.working.content.booking_link,
    "https://example.test/pt",
  );
  assert.equal(
    updated.pt.model.working.content.meta_title,
    "Retained English SEO",
  );
  assert.equal(updated.pt.model.working.content.max_guests, 6);
  assert.equal(
    Object.hasOwn(
      apartmentSharedContent(updated.pt.model.working),
      "booking_link",
    ),
    false,
  );
});
