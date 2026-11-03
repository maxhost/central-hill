import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { BREVO_NEWSLETTER_ACTION, subscribeBrevoNewsletter } from "../ui/components/brevo-newsletter";

const input = { email: "  reader+news@example.test  ", consent: true, locale: "en", honeypot: "" };

test("HTML export action and multipart fields are used for all four visitor languages", async () => {
  const html = readFileSync("docs/newsletter/HTML.txt", "utf8");
  assert.equal(BREVO_NEWSLETTER_ACTION, html.match(/<form[^>]+action="([^"]+)"/)?.[1]);
  for (const locale of ["en", "es", "pt", "fr"]) {
    let requests = 0;
    const controller = new AbortController();
    const transport: typeof fetch = async (url, options) => {
      requests++;
      assert.equal(String(url), `${BREVO_NEWSLETTER_ACTION}?isAjax=1`);
      assert.equal(options?.method, "POST");
      assert.equal(options?.credentials, "omit");
      assert.equal(options?.signal, controller.signal);
      assert.ok(options.body instanceof FormData);
      assert.deepEqual(Object.fromEntries(options.body), {
        EMAIL: "reader+news@example.test", OPT_IN: "1", email_address_check: "", locale,
      });
      return Response.json({ success: true });
    };
    assert.equal(await subscribeBrevoNewsletter({ ...input, locale }, controller.signal, transport), true);
    assert.equal(requests, 1);
  }
});

test("unchecked consent, empty email and unsupported locale never contact Brevo", async () => {
  const transport: typeof fetch = async () => { assert.fail("Unexpected subscription request"); };
  for (const invalid of [{ ...input, consent: false }, { ...input, email: "  " }, { ...input, locale: "xx" }]) {
    assert.equal(await subscribeBrevoNewsletter(invalid, new AbortController().signal, transport), false);
  }
});

test("only explicit provider acceptance is successful, regardless of a 200 HTTP response", async () => {
  for (const body of [{ success: false }, { success: "true" }, { success: 1 }, {}, null, "success", { message: "Thank you", redirect: "https://example.test" }]) {
    const transport: typeof fetch = async () => Response.json(body);
    assert.equal(await subscribeBrevoNewsletter(input, new AbortController().signal, transport), false);
  }
  for (const body of [{ success: true, message: "Accepted" }, { success: true, successPage: "<p>Check your email</p>" }]) {
    assert.equal(await subscribeBrevoNewsletter(input, new AbortController().signal, async () => Response.json(body)), true);
  }
});

test("HTTP failure, non-JSON, network and aborted responses never become a false confirmation", async () => {
  for (const transport of [
    async () => Response.json({ success: true }, { status: 503 }),
    async () => new Response("<html>Confirmation</html>"),
    async () => { throw new TypeError("Network failure"); },
    async () => { throw new DOMException("Aborted", "AbortError"); },
  ] satisfies (typeof fetch)[]) {
    assert.equal(await subscribeBrevoNewsletter(input, new AbortController().signal, transport), false);
  }
});

test("Brevo honeypot is forwarded and new UI copy exists in each locale", async () => {
  assert.equal(await subscribeBrevoNewsletter({ ...input, honeypot: "bot" }, new AbortController().signal, async (_url, options) => {
    assert.equal((options?.body as FormData).get("email_address_check"), "bot");
    return Response.json({ success: false });
  }), false);
  for (const locale of ["en", "es", "pt", "fr"]) {
    const labels = JSON.parse(readFileSync(`messages/${locale}.json`, "utf8")).settings.footer.newsletter;
    for (const key of ["consentLabel", "pending", "error", "success"]) assert.ok(labels[key]?.trim(), `${locale}.${key}`);
  }
});
