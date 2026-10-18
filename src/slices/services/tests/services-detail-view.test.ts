import assert from "node:assert/strict";
import { test } from "node:test";
import { SERVICE_COPY_KEYS, type ServiceCopy } from "../copy";
import { EMPTY_DETAIL } from "../detail";
import {
  actionLabel,
  createServiceCopyResolver,
  serviceBookingView,
  servicePriceView,
} from "../ui/detail-view-model";

const fallback = (key: string) => `Fallback ${key}`;
const labels = createServiceCopyResolver({}, fallback, "Chef");
const booking = {
  bookingType: "enquiry" as const,
  cta: null,
  ctaLabel: null,
  copy: {},
  detail: EMPTY_DETAIL,
};
const partner = { name: "Store", desc: "Local", cta_label: "Book", url: "https://example.test" };

test("all service copy overrides resolve independently, with plain-text name interpolation", () => {
  const copy = Object.fromEntries(SERVICE_COPY_KEYS.map((key) => [
    key,
    key === "enquiryTitle" ? "Ask about {name}" : `Custom ${key}`,
  ])) as ServiceCopy;
  const resolve = createServiceCopyResolver(copy, fallback, "Chef $& <Lisboa>");
  for (const key of SERVICE_COPY_KEYS)
    assert.equal(resolve(key), key === "enquiryTitle" ? "Ask about Chef $& <Lisboa>" : `Custom ${key}`);
  assert.equal(createServiceCopyResolver({}, fallback, "Chef")("optionsTitle"), "Fallback optionsTitle");
});

test("malformed or empty copy falls back per field without interpreting ICU or HTML", () => {
  const resolve = createServiceCopyResolver({
    enquiryTitle: "Broken {name} {name}",
    optionsTitle: "<strong>Plain text</strong>",
    from: "   ",
    onRequest: "{amount}",
    ratesTitle: "x".repeat(201),
  }, fallback, "Chef");
  assert.equal(resolve("enquiryTitle"), "Fallback enquiryTitle");
  assert.equal(resolve("optionsTitle"), "<strong>Plain text</strong>");
  assert.equal(resolve("from"), "Fallback from");
  assert.equal(resolve("onRequest"), "Fallback onRequest");
  assert.equal(resolve("ratesTitle"), "Fallback ratesTitle");
});

test("enquiry labels use CTA override and mobile-only short override in priority order", () => {
  const standard = serviceBookingView(booking, labels, "Request service", "+351 123 456");
  assert.deepEqual(standard.primary, { href: "#enquire", label: "Request service →" });
  assert.equal(standard.mobileLabel, "Fallback requestShort");
  assert.deepEqual(standard.secondary, { href: "https://wa.me/351123456", label: "Fallback whatsappCta" });
  const custom = { ...booking, ctaLabel: "Plan dinner →" };
  assert.equal(serviceBookingView(custom, labels, "Request service", null).primary?.label, "Plan dinner →");
  assert.equal(serviceBookingView(custom, labels, "Request service", null).mobileLabel, "Plan dinner →");
  assert.equal(serviceBookingView({ ...custom, copy: { requestShort: "Plan" } }, labels, "Request service", null).mobileLabel, "Plan");
  assert.equal(serviceBookingView({ ...custom, copy: { requestShort: "{invalid}" } }, labels, "Request service", null).mobileLabel, "Plan dinner →");
  assert.equal(serviceBookingView(booking, labels, "Request service", null).secondary, undefined);
});

test("external and partners ignore enquiry-only requestShort; absent partners never produce broken anchor", () => {
  const external = serviceBookingView({
    ...booking,
    bookingType: "external",
    cta: { url: "https://partner.test/book", label: "Book ticket" },
    ctaLabel: "Book externally",
    copy: { requestShort: "WRONG" },
  }, labels, "Request service", null);
  assert.deepEqual(external.primary, { href: "https://partner.test/book", label: "Book externally →" });
  assert.equal(external.mobileLabel, "Book externally");
  assert.equal(external.enquiry, false);
  assert.equal(external.secondary, undefined);
  const partners = serviceBookingView({
    ...booking,
    bookingType: "none",
    detail: { partners: [partner] },
    copy: { requestShort: "WRONG" },
  }, labels, "Request service", null);
  assert.deepEqual(partners.primary, { href: "#partners", label: "Fallback seePartners →" });
  assert.equal(partners.mobileLabel, "Fallback seePartners");
  const hidden = serviceBookingView({ ...booking, bookingType: "none" }, labels, "Request service", null);
  assert.equal(hidden.primary, undefined);
  assert.equal(hidden.mobileLabel, undefined);
});

test("CTA arrow suffix is rendered exactly once", () => {
  for (const label of ["Request", "Request →", " Request → → "])
    assert.equal(actionLabel(label), "Request →");
});

const priced = {
  priceDisplay: "from" as const,
  priceFrom: 3550,
  priceSuffix: "/ person",
  presentation: null,
  detail: { price_note: "Minimum 2 people" },
};
test("from preserves cents, zero and suffix across the four locales", () => {
  for (const locale of ["en", "pt", "es", "fr"] as const) {
    const view = servicePriceView(priced, locale, "On request");
    assert.equal(view.price, new Intl.NumberFormat(locale, {
      style: "currency", currency: "EUR", maximumFractionDigits: 2,
    }).format(35.5));
    assert.equal(view.mobilePrice, view.price);
    assert.equal(view.suffix, "/ person");
    assert.equal(view.priceNote, "Minimum 2 people");
    const zero = servicePriceView({ ...priced, priceFrom: 0 }, locale, "On request");
    assert.notEqual(zero.price, null);
    assert.equal(zero.hidden, false);
  }
});

test("hidden removes all monetary presentation without deleting source data", () => {
  const source = { ...priced, priceDisplay: "hidden" as const };
  assert.deepEqual(servicePriceView(source, "es", "On request"), {
    hidden: true, price: null, suffix: null, priceNote: undefined, mobilePrice: null,
  });
  assert.equal(source.priceFrom, 3550);
  assert.equal(source.detail.price_note, "Minimum 2 people");
});

test("on-request explicitly suppresses monetary notes while legacy auto keeps them", () => {
  const legacy = { ...priced, priceDisplay: "on_request" as const, priceFrom: null };
  const oldView = servicePriceView(legacy, "en", "Ask us");
  assert.equal(oldView.mobilePrice, "Ask us");
  assert.equal(oldView.priceNote, "Minimum 2 people");
  const explicit = servicePriceView({
    ...legacy, priceFrom: 3550, presentation: { version: 1, price_display: "on_request" },
  }, "en", "Ask us");
  assert.equal(explicit.price, null);
  assert.equal(explicit.suffix, null);
  assert.equal(explicit.priceNote, undefined);
  assert.equal(explicit.mobilePrice, "Ask us");
});
