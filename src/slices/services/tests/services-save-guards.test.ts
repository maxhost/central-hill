import assert from "node:assert/strict";
import { test } from "node:test";
import { EMPTY_DETAIL } from "../detail";
import {
  servicePresentationErrors,
  serviceStoredContentValid,
  serviceSaveInput,
} from "../admin/validation";
const input = {
  detail: EMPTY_DETAIL,
  price_from: null,
  booking_type: "enquiry",
  cta_url: null,
  cta_label: null,
};
test("effective stored flags cannot be bypassed by an older payload omitting presentation", () => {
  const errors = servicePresentationErrors(input, {
    version: 1,
    sections: { included: true },
    price_display: "from",
  });
  assert.ok(errors["detail.highlights"]);
  assert.ok(errors.price_from);
  assert.deepEqual(servicePresentationErrors(input, null), {});
});
test("external booking needs safe URL and label; enquiry does not", () => {
  assert.ok(
    servicePresentationErrors({ ...input, booking_type: "external" }, null)
      .cta_url,
  );
  assert.ok(
    servicePresentationErrors(
      {
        ...input,
        booking_type: "external",
        cta_url: "javascript:alert(1)",
        cta_label: "Book",
      },
      null,
    ).cta_url,
  );
  assert.deepEqual(
    servicePresentationErrors(
      {
        ...input,
        booking_type: "external",
        cta_url: "https://example.test",
        cta_label: "Book",
      },
      null,
    ),
    {},
  );
});
test("stored-content integrity rejects corrupt originals", () => {
  assert.equal(serviceStoredContentValid(undefined, null), true);
  assert.equal(serviceStoredContentValid("broken", null), false);
  assert.equal(serviceStoredContentValid("{}", { version: 99 }), false);
});
test("money cannot overflow PostgreSQL before any write", () => {
  const shape = serviceSaveInput.shape.price_from;
  assert.equal(shape.safeParse(2147483647).success, true);
  for (const price of [2147483648, -1, 1.1])
    assert.equal(shape.safeParse(price).success, false);
});
