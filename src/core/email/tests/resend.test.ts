import { test } from "node:test";
import assert from "node:assert/strict";
import { createResendProvider } from "../resend";

test("Resend maps server sender, recipients and reply-to; returns acceptance id", async () => {
  let requested = false;
  const transport: typeof fetch = async (input, init) => {
    requested = true;
    assert.equal(input, "https://api.resend.com/emails");
    assert.equal((init?.headers as Record<string, string>).Authorization, "Bearer test-key");
    assert.deepEqual(JSON.parse(String(init?.body)), { from: "Forms <forms@example.test>", to: ["staff@example.test"], subject: "Test", text: "Body", reply_to: "visitor@example.test" });
    return Response.json({ id: "email-123" });
  };
  assert.deepEqual(await createResendProvider("test-key", "Forms <forms@example.test>", transport).send({ to: "staff@example.test", subject: "Test", text: "Body", replyTo: "visitor@example.test" }), { ok: true, id: "email-123" });
  assert.equal(requested, true);
});
test("missing configuration never contacts Resend", async () => {
  const transport: typeof fetch = async () => { assert.fail("transport must not run"); };
  assert.equal((await createResendProvider(undefined, undefined, transport).send({ to: "staff@example.test", subject: "Test", text: "Body" })).ok, false);
});
test("Resend sends attachment bytes as base64 with filenames and content types", async () => {
  const bytes = Buffer.from("%PDF-1.7\nattachment\n%%EOF");
  let requested = false;
  const transport: typeof fetch = async (_input, init) => {
    requested = true;
    const payload = JSON.parse(String(init?.body));
    assert.deepEqual(payload.attachments, [{ filename: "property.pdf", content: bytes.toString("base64"), content_type: "application/pdf" }]);
    assert.deepEqual(Buffer.from(payload.attachments[0].content, "base64"), bytes);
    assert.equal(payload.reply_to, "visitor@example.test");
    return Response.json({ id: "attachment-email" });
  };
  const result = await createResendProvider("test-key", "forms@example.test", transport).send({
    to: "staff@example.test", subject: "Attachment", text: "Body", replyTo: "visitor@example.test",
    attachments: [{ filename: "property.pdf", content: bytes.toString("base64"), contentType: "application/pdf" }],
  });
  assert.deepEqual(result, { ok: true, id: "attachment-email" });
  assert.equal(requested, true);
});
test("empty attachments do not change existing email payloads", async () => {
  const transport: typeof fetch = async (_input, init) => {
    assert.equal(Object.hasOwn(JSON.parse(String(init?.body)), "attachments"), false);
    return Response.json({ id: "plain-email" });
  };
  assert.equal((await createResendProvider("test-key", "forms@example.test", transport).send({ to: "staff@example.test", subject: "Plain", text: "Body", attachments: [] })).ok, true);
});
test("provider errors and invalid responses cannot claim acceptance or leak vendor bodies", async () => {
  const message = { to: "staff@example.test", subject: "Test", text: "Body" };
  for (const response of [new Response('{"secret":"private"}', { status: 429 }), Response.json({}), new Response("invalid")]) {
    const provider = createResendProvider("test-key", "forms@example.test", async () => response);
    const result = await provider.send(message);
    assert.equal(result.ok, false);
    assert.doesNotMatch(result.error ?? "", /private/);
  }
  const failed = createResendProvider("test-key", "forms@example.test", async () => { throw new Error("private"); });
  assert.equal((await failed.send(message)).ok, false);
});
